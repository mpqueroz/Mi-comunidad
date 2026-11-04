'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const factory=require('../integridad');

function harness(){
  const docs=new Map([
    ['mi_comunidad_comunidades/a',{estado:'Activa'}],
    ['mi_comunidad_comunidades/a/residentes/res',{estado:'Activo',depto:'101',familiares:[],restringidos:[]}],
    ['mi_comunidad_comunidades/a/administradores/adm',{estado:'Activo'}],
  ]);
  let seq=0,lock=Promise.resolve(),failCommit=false;
  const ref=path=>({path,id:path.split('/').at(-1),collection:name=>collection(path+'/'+name)});
  const collection=path=>({doc:key=>ref(path+'/'+(key||'auto-'+(++seq)))});
  const snap=r=>({exists:docs.has(r.path),get:k=>structuredClone(docs.get(r.path)?.[k]),data:()=>structuredClone(docs.get(r.path))});
  const db={collection,runTransaction:async callback=>{
    const prior=lock;let release;lock=new Promise(r=>{release=r;});await prior;
    try{
      const writes=[];const tx={get:async r=>snap(r),create:(r,data)=>writes.push(['create',r,data]),update:(r,data)=>writes.push(['update',r,data])};
      const result=await callback(tx);
      if(failCommit)throw Error('Fallo de commit');
      for(const [mode,r]of writes)if(mode==='create'&&docs.has(r.path)||mode==='update'&&!docs.has(r.path))throw Error('Precondición');
      for(const [mode,r,data]of writes)docs.set(r.path,mode==='create'?structuredClone(data):{...docs.get(r.path),...structuredClone(data)});
      return result;
    }finally{release();}
  }};
  class HttpsError extends Error{constructor(code,message){super(message);this.code=code;}}
  const api=factory({firestore:Object.assign(()=>db,{FieldValue:{serverTimestamp:()=>new Date()}})},fn=>fn,HttpsError);
  const call=(name,data,role='admin',uid=role==='residente'?'res':'adm',comunidadId='a')=>api[name]({auth:{uid,token:{app:'mi_comunidad',role,comunidadId,depto:'101'}},data:{comunidadId,...data}});
  return {docs,call,api,setFail:value=>{failCommit=value;},rows:col=>[...docs].filter(([key])=>key.startsWith('mi_comunidad_comunidades/a/'+col+'/'))};
}

for(const [tipo,col,estado]of [['remuneracion','remuneraciones','Pendiente'],['mantencion','mantenciones','Programada']]){
 test(`egreso ${tipo}: diez confirmaciones generan un solo asiento y cierre`,async()=>{
  const h=harness();h.docs.set(`mi_comunidad_comunidades/a/${col}/uno`,{estado,monto:45000,nombre:'Prueba'});
  const rows=await Promise.all(Array.from({length:10},()=>h.call('registrarPagoOperativoMiComunidad',{tipo,id:'uno'})));
  assert.equal(rows.filter(r=>!r.repetido).length,1);assert.equal(h.rows('movimientosContables').length,1);assert.equal(h.rows('auditoria').length,1);
  assert.equal(h.docs.get(`mi_comunidad_comunidades/a/${col}/uno`).movimientoId,rows[0].movimientoId);
 });
}
for(const [tipo,col,estado]of [['gasto','gastosComunes','Atrasado'],['multa','multas','Por confirmar']]){
 test(`ingreso ${tipo}: confirmado atómico con aviso único y retorno reutilizable`,async()=>{
  const h=harness();h.docs.set(`mi_comunidad_comunidades/a/${col}/uno`,{estado,monto:15000,depto:'101'});
  const rows=await Promise.all(Array.from({length:5},()=>h.call('confirmarIngresoComunidad',{tipo,id:'uno',fechaPago:'2026-11-01',metodoPago:'Transferencia (cartola bancaria)'})));
  assert.equal(rows.filter(r=>!r.repetido).length,1);assert.equal(h.rows('movimientosContables').length,1);assert.equal(h.rows('notificaciones').length,1);
  assert.equal(h.rows('movimientosContables')[0][1].fecha,'2026-11-01');assert.equal(new Set(rows.map(r=>r.movimientoId)).size,1);
 });
}
test('fallo transaccional no guarda estado ni asiento ni aviso; reintento es seguro',async()=>{
 const h=harness(),path='mi_comunidad_comunidades/a/gastosComunes/uno';h.docs.set(path,{estado:'Pendiente',monto:1000,depto:'101'});h.setFail(true);
 await assert.rejects(h.call('confirmarIngresoComunidad',{tipo:'gasto',id:'uno'}),/Fallo de commit/);
 assert.equal(h.docs.get(path).estado,'Pendiente');assert.equal(h.rows('movimientosContables').length,0);assert.equal(h.rows('notificaciones').length,0);
 h.setFail(false);assert.equal((await h.call('confirmarIngresoComunidad',{tipo:'gasto',id:'uno'})).repetido,false);
});
test('histórico ya pagado sin asiento determinista exige revisión y no duplica',async()=>{
 const h=harness();h.docs.set('mi_comunidad_comunidades/a/remuneraciones/uno',{estado:'Pagado',monto:1000});
 await assert.rejects(h.call('registrarPagoOperativoMiComunidad',{tipo:'remuneracion',id:'uno'}),{code:'failed-precondition'});
 h.docs.set('mi_comunidad_comunidades/a/gastosComunes/uno',{estado:'Pagado',monto:1000});
 await assert.rejects(h.call('confirmarIngresoComunidad',{tipo:'gasto',id:'uno'}),{code:'failed-precondition'});assert.equal(h.rows('movimientosContables').length,0);
});
test('cuenta desactivada, rol ajeno, licencia vencida y depto cambiado rechazan sin escribir',async()=>{
 const h=harness();const args={tipo:'remuneracion',id:'uno'};h.docs.set('mi_comunidad_comunidades/a/remuneraciones/uno',{estado:'Pendiente',monto:1000});
 await assert.rejects(h.call('registrarPagoOperativoMiComunidad',args,'residente'),{code:'permission-denied'});
 h.docs.get('mi_comunidad_comunidades/a/administradores/adm').estado='Inactivo';await assert.rejects(h.call('registrarPagoOperativoMiComunidad',args),{code:'permission-denied'});
 h.docs.get('mi_comunidad_comunidades/a/administradores/adm').estado='Activo';h.docs.set('mi_comunidad_licencias/a',{estado:'expired'});
 await assert.rejects(h.call('registrarPagoOperativoMiComunidad',args),{code:'failed-precondition'});h.docs.delete('mi_comunidad_licencias/a');
 h.docs.get('mi_comunidad_comunidades/a/residentes/res').depto='202';await assert.rejects(h.call('gestionarIntegrantesFichaMiComunidad',{uid:'res',tipo:'familiares',accion:'agregar',persona:{nombre:'Ana'}},'residente'),{code:'permission-denied'});
 assert.equal(h.rows('movimientosContables').length,0);
});
test('altas concurrentes conservan todas las personas; bajas por identidad son idempotentes',async()=>{
 const h=harness(),people=['Ana','Luis','Paula'].map(nombre=>({nombre,rut:'',parentesco:'Familiar'}));
 const request=persona=>({uid:'res',tipo:'familiares',accion:'agregar',persona});
 await Promise.all(people.map(p=>h.call('gestionarIntegrantesFichaMiComunidad',request(p),'residente')));
 const remove={...request(people[0]),accion:'eliminar'};
 await h.call('gestionarIntegrantesFichaMiComunidad',remove,'residente');assert.equal((await h.call('gestionarIntegrantesFichaMiComunidad',remove,'residente')).repetido,true);
 assert.deepEqual(h.docs.get('mi_comunidad_comunidades/a/residentes/res').familiares.map(p=>p.nombre),['Luis','Paula']);
});
test('listas inválidas, payload desconocido, mal RUT y ficha ajena fallan sin descartar históricos',async()=>{
 const h=harness(),request={uid:'res',tipo:'restringidos',accion:'agregar',persona:{nombre:'Ana'}};
 for(const persona of [null,7,[],{nombre:'Ana',extra:'fraude'},{nombre:'Ana',rut:'11111111-2'}])await assert.rejects(h.call('gestionarIntegrantesFichaMiComunidad',{...request,persona},'residente'),{code:'invalid-argument'});
 h.docs.get('mi_comunidad_comunidades/a/residentes/res').restringidos=[null];
 await assert.rejects(h.call('gestionarIntegrantesFichaMiComunidad',request,'residente'),{code:'failed-precondition'});assert.deepEqual(h.docs.get('mi_comunidad_comunidades/a/residentes/res').restringidos,[null]);
 await assert.rejects(h.call('gestionarIntegrantesFichaMiComunidad',{...request,uid:'otro'},'residente'),{code:'permission-denied'});
});
test('ingreso rechaza fecha inexistente y monto no entero',async()=>{
 const h=harness();h.docs.set('mi_comunidad_comunidades/a/gastosComunes/uno',{estado:'Pendiente',monto:1.5});
 await assert.rejects(h.call('confirmarIngresoComunidad',{tipo:'gasto',id:'uno',fechaPago:'2026-02-30'}),{code:'invalid-argument'});
 await assert.rejects(h.call('confirmarIngresoComunidad',{tipo:'gasto',id:'uno'}),{code:'failed-precondition'});
});
