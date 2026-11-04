'use strict';
const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const enabled=!!process.env.FIRESTORE_EMULATOR_HOST;
let api,db,seq=0;
before(()=>{
 if(!enabled)return;
 const projectId='demo-mi-comunidad-integridad';process.env.GCLOUD_PROJECT=projectId;process.env.FIREBASE_CONFIG=JSON.stringify({projectId});
 api=require('../functions/index');const sdk=require('node:module').createRequire(require.resolve('../functions/index'));db=sdk('firebase-admin/firestore').getFirestore();
});
async function fixture(){
 const id='integridad-'+Date.now()+'-'+(++seq),base=db.collection('mi_comunidad_comunidades').doc(id);
 await base.set({estado:'Activa'});await base.collection('residentes').doc('res').set({estado:'Activo',depto:'101',familiares:[],restringidos:[]});
 const call=(name,data,uid='adm',role='admin')=>api[name].run({auth:{uid,token:{app:'mi_comunidad',role,comunidadId:id,depto:'101'}},data:{comunidadId:id,...data}});
 return {base,call};
}
test('Firestore emulado: diez egresos concurrentes producen un asiento por entidad',{skip:!enabled},async()=>{
 for(const tipo of ['remuneracion','mantencion']){
  const h=await fixture(),col=tipo==='remuneracion'?'remuneraciones':'mantenciones';
  await h.base.collection(col).doc('uno').set({estado:tipo==='remuneracion'?'Pendiente':'Programada',nombre:'Prueba',monto:45000});
  const results=await Promise.all(Array.from({length:10},()=>h.call('registrarPagoOperativoMiComunidad',{tipo,id:'uno'})));
  assert.equal(results.filter(x=>!x.repetido).length,1);
  const rows=await h.base.collection('movimientosContables').get();assert.equal(rows.size,1);assert.equal(rows.docs[0].get('monto'),45000);
  assert.equal((await h.base.collection(col).doc('uno').get()).get('movimientoId'),rows.docs[0].id);
 }
});
test('Firestore emulado: diez ingresos concurrentes producen asiento y notificación únicos',{skip:!enabled},async()=>{
 for(const tipo of ['gasto','multa']){
  const h=await fixture(),col=tipo==='gasto'?'gastosComunes':'multas';
  await h.base.collection(col).doc('uno').set({estado:'Por confirmar',depto:'101',monto:45000});
  const results=await Promise.all(Array.from({length:10},()=>h.call('confirmarIngresoComunidad',{tipo,id:'uno',fechaPago:'2026-11-04',metodoPago:'Transferencia'})));
  assert.equal(results.filter(x=>!x.repetido).length,1);assert.equal((await h.base.collection('movimientosContables').get()).size,1);
  assert.equal((await h.base.collection('notificaciones').get()).size,1);assert.equal(new Set(results.map(x=>x.movimientoId)).size,1);
 }
});
test('Firestore emulado: altas simultáneas de personas no se pierden y borrar reintentado conserva terceros',{skip:!enabled},async()=>{
 const h=await fixture(),people=['Ana','Luis','Paula'].map(nombre=>({nombre,rut:'',parentesco:'Familiar'}));
 const req=persona=>({uid:'res',tipo:'familiares',accion:'agregar',persona});
 await Promise.all(people.map(p=>h.call('gestionarIntegrantesFichaMiComunidad',req(p),'res','residente')));
 assert.equal((await h.base.collection('residentes').doc('res').get()).get('familiares').length,3);
 const d={...req(people[0]),accion:'eliminar'};await h.call('gestionarIntegrantesFichaMiComunidad',d,'res','residente');await h.call('gestionarIntegrantesFichaMiComunidad',d,'res','residente');
 assert.deepEqual((await h.base.collection('residentes').doc('res').get()).get('familiares').map(p=>p.nombre).sort(),['Luis','Paula']);
});

test('Firestore emulado: conciliación concurrente crea un saldo y un asiento por concepto',{skip:!enabled},async()=>{
 const h=await fixture();
 await h.base.collection('gastosComunes').doc('g').set({estado:'Pendiente',depto:'101',monto:45000});
 await h.base.collection('movimientosBancarios').doc('b').set({estado:'Pendiente',fecha:'2026-11-04',monto:60000,descripcion:'Abono ficticio'});
 const args={movimientoId:'b',tipo:'gasto',id:'g',destino:'saldo'};
 const r=await Promise.all(Array.from({length:10},()=>h.call('conciliarMovimientoComunidad',args)));
 assert.equal(r.filter(x=>!x.repetido).length,1);
 const ledger=await h.base.collection('movimientosContables').get();assert.equal(ledger.size,2);
 assert.equal(ledger.docs.reduce((n,d)=>n+d.get('monto'),0),60000);
 assert.equal((await h.base.collection('saldosAFavor').get()).size,1);
 assert.equal((await h.base.collection('historialConciliacion').get()).size,1);
 assert.equal((await h.base.collection('notificaciones').get()).size,1);
 await assert.rejects(h.call('desvincularConciliacionComunidad',{movimientoId:'b',motivo:'Asociación ficticia requiere revisión'}),{code:'failed-precondition'});
});
test('Firestore emulado: desvincular conserva pago y asiento, sin asignar una deuda a dos bancos',{skip:!enabled},async()=>{
 const h=await fixture();await h.base.collection('multas').doc('m').set({estado:'Pendiente',depto:'101',monto:5000});
 for(const id of ['b1','b2'])await h.base.collection('movimientosBancarios').doc(id).set({estado:'Pendiente',fecha:'2026-11-04',monto:5000});
 await h.call('conciliarMovimientoComunidad',{movimientoId:'b1',tipo:'multa',id:'m'});
 await assert.rejects(h.call('conciliarMovimientoComunidad',{movimientoId:'b2',tipo:'multa',id:'m'}),{code:'already-exists'});
 await h.call('desvincularConciliacionComunidad',{movimientoId:'b1',motivo:'Corregir asociación ficticia de cartola'});
 assert.equal((await h.base.collection('multas').doc('m').get()).get('estado'),'Pagada');
 assert.equal((await h.base.collection('movimientosContables').get()).size,1);
 await h.call('conciliarMovimientoComunidad',{movimientoId:'b2',tipo:'multa',id:'m'});
 assert.equal((await h.base.collection('movimientosContables').get()).size,1);
});
