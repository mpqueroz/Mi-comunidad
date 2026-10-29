'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const make=require('../functions/profesional');
class Timestamp {constructor(n){this.n=n;}toMillis(){return this.n;}toDate(){return new Date(this.n);}static fromMillis(n){return new Timestamp(n);}}
class HttpsError extends Error {constructor(code,message){super(message);this.code=code;}}
function harness(){
 const rows=new Map();let count=0,queue=Promise.resolve();
 const stamp={__stamp:true},del={__delete:true};
 const clone=v=>v instanceof Timestamp?new Timestamp(v.n):Array.isArray(v)?v.map(clone):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,val])=>[k,clone(val)])):v;
 const materialize=v=>v?.__stamp?new Timestamp(Date.now()):v instanceof Timestamp?v:Array.isArray(v)?v.map(materialize):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,val])=>[k,materialize(val)])):v;
 const snapshot=ref=>({id:ref.id,ref,exists:rows.has(ref.path),data:()=>clone(rows.get(ref.path))});
 class Ref {constructor(path){this.path=path;this.id=path.split('/').at(-1);}collection(n){return new Query(this.path+'/'+n);}async get(){return snapshot(this);}async set(data){write('set',this,data);}async update(data){write('update',this,data);}}
 class Query {constructor(path,filters=[],cap=Infinity){this.path=path;this.filters=filters;this.cap=cap;}doc(id){return new Ref(this.path+'/'+(id||'auto'+(++count)));}async add(data){const r=this.doc();await r.set(data);return r;}where(k,op,v){assert.equal(op,'==');return new Query(this.path,[...this.filters,[k,v]],this.cap);}limit(cap){return new Query(this.path,this.filters,cap);}async get(){const docs=[...rows.keys()].filter(p=>p.startsWith(this.path+'/')&&p.slice(this.path.length+1).indexOf('/')===-1).map(p=>snapshot(new Ref(p))).filter(d=>this.filters.every(([k,v])=>d.data()[k]===v)).slice(0,this.cap);return {docs,size:docs.length,empty:!docs.length};}}
 function write(kind,ref,data){if(kind==='delete'){rows.delete(ref.path);return;}if(kind==='create'&&rows.has(ref.path))throw Error('already exists');if(kind==='update'&&!rows.has(ref.path))throw Error('missing update');const target=kind==='update'?clone(rows.get(ref.path)):{};for(const [k,v]of Object.entries(data)){if(v?.__delete)delete target[k];else target[k]=materialize(clone(v));}rows.set(ref.path,target);}
 function transaction(){let wrote=false;const ops=[];return {get:async ref=>{assert.equal(wrote,false,'All transaction reads must precede writes');return ref.get();},set:(r,d)=>{wrote=true;ops.push(['set',r,d]);},create:(r,d)=>{wrote=true;ops.push(['create',r,d]);},update:(r,d)=>{wrote=true;ops.push(['update',r,d]);},delete:r=>{wrote=true;ops.push(['delete',r,{}]);},commit:()=>{const old=new Map(rows);try{for(const op of ops)write(...op);}catch(e){rows.clear();for(const kv of old)rows.set(...kv);throw e;}}};}
 const db={collection:p=>new Query(p),batch:()=>transaction(),runTransaction:fn=>{const p=queue.then(async()=>{const tx=transaction();const result=await fn(tx);tx.commit();return result;});queue=p.catch(()=>{});return p;}};
 // Batches use commit asynchronously in Firebase. The mock commit is synchronous and await-compatible.
 const firestore=()=>db;firestore.FieldValue={serverTimestamp:()=>stamp,delete:()=>del};firestore.Timestamp=Timestamp;
 const api=make({firestore},(a,b)=>b||a,HttpsError);
 const base='mi_comunidad_comunidades/edificio';
 rows.set(base,{estado:'Activa',adminNombre:'Administradora'});
 rows.set(base+'/residentes/residente',{nombre:'Residente',depto:'101',estado:'Activo'});
 rows.set(base+'/conserjes/uno',{nombre:'Conserje Uno',estado:'Activo'});rows.set(base+'/conserjes/dos',{nombre:'Conserje Dos',estado:'Activo'});
 const req=(uid='uno',data={},role='conserje')=>({auth:{uid,token:{app:'mi_comunidad',role,comunidadId:'edificio',depto:'101'}},data:{comunidadId:'edificio',...data}});
 const call=(name,data={},uid='uno',role='conserje')=>api[name](req(uid,data,role));
 return {rows,api,req,call,base,Timestamp};
}
function invitacion(h,id='inv',overrides={}){
 const fecha=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 h.rows.set(h.base+'/visitasProgramadas/'+id,{nombre:'Visita de prueba',depto:'101',fecha,hora:'00:00',estado:'Pendiente',...overrides});
 return h.call('gestionarVisitaMiComunidad',{accion:'emitirPase',id,hasta:'23:59'},'residente','residente');
}
test('pase QR: token aleatorio solo en respuesta; lectura no consume; ingreso requiere identidad',async()=>{
 const h=harness(),p=await invitacion(h),stored=h.rows.get(h.base+'/visitasProgramadas/inv');
 assert.match(p.token,/^[a-f0-9]{64}$/);assert.notEqual(stored.qrHash,p.token);assert.equal(JSON.stringify([...h.rows.values()]).includes(p.token),false);
 const data={id:p.id,token:p.token};await h.call('gestionarVisitaMiComunidad',{accion:'revisarPase',...data});
 assert.equal(stored.estado,'Pendiente');
 await assert.rejects(h.call('gestionarVisitaMiComunidad',{accion:'ingresar',programadaId:p.id,token:p.token}),{code:'failed-precondition'});
 const v=await h.call('gestionarVisitaMiComunidad',{accion:'ingresar',programadaId:p.id,token:p.token,identidadConfirmada:true});
 assert.equal(h.rows.get(h.base+'/visitas/'+v.id).identidadConfirmada,true);
 await assert.rejects(h.call('gestionarVisitaMiComunidad',{accion:'revisarPase',...data}),{code:'failed-precondition'});
});
test('pase QR: renovar invalida anterior y cancelar preserva registro',async()=>{
 const h=harness(),p=await invitacion(h),n=await h.call('gestionarVisitaMiComunidad',{accion:'emitirPase',id:p.id},'residente','residente');
 await assert.rejects(h.call('gestionarVisitaMiComunidad',{accion:'revisarPase',id:p.id,token:p.token}),{code:'permission-denied'});
 await h.call('gestionarVisitaMiComunidad',{accion:'revocarPase',id:p.id},'residente','residente');
 assert.equal(h.rows.get(h.base+'/visitasProgramadas/inv').estado,'Cancelada');
 await assert.rejects(h.call('gestionarVisitaMiComunidad',{accion:'revisarPase',id:p.id,token:n.token}),{code:'permission-denied'});
});
test('pase QR: solo residente del departamento puede emitir o revocar; no se acepta otra comunidad',async()=>{
 const h=harness(),p=await invitacion(h);
 for(const accion of ['emitirPase','revocarPase']){
  await assert.rejects(h.call('gestionarVisitaMiComunidad',{accion,id:p.id}),{code:'permission-denied'});
  h.rows.get(h.base+'/visitasProgramadas/inv').depto='999';
  await assert.rejects(h.call('gestionarVisitaMiComunidad',{accion,id:p.id},'residente','residente'),{code:'permission-denied'});
 }
 await assert.rejects(h.api.gestionarVisitaMiComunidad(h.req('uno',{comunidadId:'otra',accion:'revisarPase',id:p.id,token:p.token})),{code:'permission-denied'});
});
test('pase QR: verifica horario en servidor y no se elude mediante ingreso por ID',async()=>{
 const h=harness(),p=await invitacion(h),v=h.rows.get(h.base+'/visitasProgramadas/inv');
 v.qrFin='2000-01-01T23:59';
 await assert.rejects(h.call('gestionarVisitaMiComunidad',{accion:'revisarPase',id:p.id,token:p.token}),{code:'failed-precondition'});
 await assert.rejects(h.call('gestionarVisitaMiComunidad',{accion:'ingresar',programadaId:p.id,identidadConfirmada:true}),{code:'permission-denied'});
 v.qrInicio='2099-01-01T00:00';v.qrFin='2099-01-01T23:59';
 await assert.rejects(h.call('gestionarVisitaMiComunidad',{accion:'ingresar',programadaId:p.id,token:p.token,identidadConfirmada:true}),{code:'failed-precondition'});
 assert.equal([...h.rows.keys()].filter(k=>k.includes('/visitas/')).length,0);
});
test('pase QR: dos conserjes no duplican ingreso y se revalidan restricciones',async()=>{
 const h=harness(),p=await invitacion(h),data={accion:'ingresar',programadaId:p.id,token:p.token,identidadConfirmada:true};
 const result=await Promise.allSettled([h.call('gestionarVisitaMiComunidad',data),h.call('gestionarVisitaMiComunidad',data,'dos')]);
 assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
 assert.equal([...h.rows.keys()].filter(k=>k.includes('/visitas/')).length,1);
 const p2=await invitacion(h,'otra');
 h.rows.get(h.base+'/residentes/residente').restringidos=[{nombre:'Visita de prueba'}];
 const v=await h.call('gestionarVisitaMiComunidad',{...data,programadaId:p2.id,token:p2.token});assert.equal(v.denegado,true);
});
test('pase QR: autor desactivado impide ingreso; fechas y horas inválidas no emiten',async()=>{
 const h=harness(),p=await invitacion(h);
 h.rows.get(h.base+'/residentes/residente').estado='Inactivo';
 await assert.rejects(h.call('gestionarVisitaMiComunidad',{accion:'ingresar',programadaId:p.id,token:p.token,identidadConfirmada:true}),{code:'failed-precondition'});
 h.rows.get(h.base+'/residentes/residente').estado='Activo';
 await assert.rejects(invitacion(h,'invalida',{fecha:'2099-02-30'}),{code:'invalid-argument'});
 await assert.rejects(invitacion(h,'horainvalida',{hora:'25:00'}),{code:'invalid-argument'});
 await assert.rejects(invitacion(h,'pasada',{fecha:'2000-01-01'}),{code:'invalid-argument'});
});
test('turno: resumen reúne operación y permanece inmutable tras cambios',async()=>{
 const h=harness();
 h.rows.set(h.base+'/visitas/v',{nombre:'Ana',depto:'101',estado:'Dentro',rut:'dato que no debe copiarse'});
 h.rows.set(h.base+'/incidencias/i',{categoria:'Filtración',depto:'101',estado:'En proceso',responsable:'Mantención'});
 h.rows.set(h.base+'/encomiendas/e',{codigo:'PAQ-1',depto:'101',estado:'Recibido'});
 h.rows.set(h.base+'/planesMantencion/m',{titulo:'Portón',activo:true,proximaFecha:'2000-01-01'});
 const t=await h.call('gestionarTurnoMiComunidad',{accion:'iniciar'});
 await h.call('gestionarTurnoMiComunidad',{accion:'entregar',turnoId:t.id,resumen:'Revisar pendientes.'});
 const snapshot=h.rows.get(h.base+'/turnos/'+t.id).operacionSnapshot;
 for(const k of ['visitasDentro','solicitudes','encomiendas','mantenciones'])assert.equal(snapshot[k].items.length,1);
 assert.equal(JSON.stringify(snapshot).includes('dato que no debe copiarse'),false);
 h.rows.get(h.base+'/visitas/v').estado='Salió';assert.equal(snapshot.visitasDentro.items.length,1);
 await h.call('gestionarTurnoMiComunidad',{accion:'recibir',turnoId:t.id},'dos');
 assert.deepEqual(h.rows.get(h.base+'/turnos/'+t.id).operacionSnapshot,snapshot);
});
test('turno: selección de operación se limita y declara registros adicionales',async()=>{
 const h=harness();for(let i=0;i<55;i++)h.rows.set(h.base+'/visitas/'+i,{estado:'Dentro',nombre:'Visita '+i,depto:'101'});
 const t=await h.call('gestionarTurnoMiComunidad',{accion:'iniciar'});await h.call('gestionarTurnoMiComunidad',{accion:'entregar',turnoId:t.id,resumen:'Continuar.'});
 const g=h.rows.get(h.base+'/turnos/'+t.id).operacionSnapshot.visitasDentro;assert.equal(g.items.length,50);assert.equal(g.limitado,true);
});
test('rechaza cuentas sin autorización y comunidades ajenas',async()=>{const h=harness();await assert.rejects(h.api.gestionarTurnoMiComunidad({data:{}}),{code:'permission-denied'});await assert.rejects(h.api.gestionarTurnoMiComunidad(h.req('uno',{comunidadId:'otra',accion:'iniciar'})),{code:'permission-denied'});await assert.rejects(h.call('gestionarTurnoMiComunidad',{accion:'iniciar'},'residente','residente'),{code:'permission-denied'});});
test('la suspensión se comprueba también en Cloud Functions',async()=>{const h=harness();h.rows.get(h.base).estado='Suspendida';await assert.rejects(h.call('gestionarTurnoMiComunidad',{accion:'iniciar'}),{code:'failed-precondition'});});
test('recibir paquete crea código, aviso y bitácora de forma conjunta',async()=>{const h=harness();const r=await h.call('registrarEncomiendaMiComunidad',{titulo:'Tienda',depto:'101',ubicacion:'B2'});const p=h.rows.get(h.base+'/encomiendas/'+r.id);assert.match(p.codigo,/^PAQ-\d{4}-000001$/);assert.match(p.qrToken,/^[a-f0-9]{32}$/);assert.equal(p.ubicacion,'B2');assert.equal(p.recibidoPorUid,'uno');assert.ok(Number(p.ts)>0);assert.equal([...h.rows.keys()].filter(p=>p.includes('/notificaciones/')).length,1);assert.equal([...h.rows.keys()].filter(p=>p.includes('/novedades/')).length,1);});
test('no admite encomienda para departamento inexistente o foto inválida',async()=>{const h=harness();await assert.rejects(h.call('registrarEncomiendaMiComunidad',{titulo:'Caja',depto:'999'}),{code:'not-found'});await assert.rejects(h.call('registrarEncomiendaMiComunidad',{titulo:'Caja',depto:'101',foto:'javascript:alert(1)'}),{code:'invalid-argument'});});
test('dos registros simultáneos obtienen correlativos distintos',async()=>{const h=harness();const r=await Promise.all([h.call('registrarEncomiendaMiComunidad',{titulo:'A',depto:'101'}),h.call('registrarEncomiendaMiComunidad',{titulo:'B',depto:'101'},'dos')]);assert.notEqual(r[0].codigo,r[1].codigo);});
test('dos conserjes no pueden tomar la misma entrega',async()=>{const h=harness();h.rows.set(h.base+'/encomiendas/paq',{estado:'Recibido',depto:'101'});const results=await Promise.allSettled([h.call('gestionarEncomiendaMiComunidad',{accion:'iniciar',id:'paq'}),h.call('gestionarEncomiendaMiComunidad',{accion:'iniciar',id:'paq'},'dos')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'already-exists');});
test('entrega solo por el actor y token correctos; cierre inmutable e idempotente',async()=>{const h=harness();h.rows.set(h.base+'/encomiendas/paq',{estado:'Recibido',depto:'101'});const {token}=await h.call('gestionarEncomiendaMiComunidad',{accion:'iniciar',id:'paq'});await assert.rejects(h.call('gestionarEncomiendaMiComunidad',{accion:'confirmar',id:'paq',token,retiradoPor:{nombre:'Ana',relacion:'Titular'}},'dos'),{code:'permission-denied'});const data={accion:'confirmar',id:'paq',token,retiradoPor:{nombre:'Ana',relacion:'Titular'}};await h.call('gestionarEncomiendaMiComunidad',data);await h.call('gestionarEncomiendaMiComunidad',data);assert.equal(h.rows.get(h.base+'/encomiendas/paq').estado,'Entregado');assert.equal([...h.rows.keys()].filter(k=>k.includes('/notificaciones/')).length,1);await assert.rejects(h.call('gestionarEncomiendaMiComunidad',{accion:'iniciar',id:'paq'},'dos'),{code:'failed-precondition'});});
test('entrega interrumpida se recupera al vencer; el actor anterior pierde el control',async()=>{const h=harness();h.rows.set(h.base+'/encomiendas/paq',{estado:'En proceso de entrega',depto:'101',entregaUid:'uno',entregaToken:'old',entregaHasta:new Timestamp(Date.now()-1000)});const r=await h.call('gestionarEncomiendaMiComunidad',{accion:'iniciar',id:'paq'},'dos');assert.notEqual(r.token,'old');await assert.rejects(h.call('gestionarEncomiendaMiComunidad',{accion:'cancelar',id:'paq',token:'old'}),{code:'permission-denied'});await h.call('gestionarEncomiendaMiComunidad',{accion:'cancelar',id:'paq',token:r.token},'dos');assert.equal(h.rows.get(h.base+'/encomiendas/paq').estado,'Recibido');});
test('inicio simultáneo produce solo un turno activo',async()=>{const h=harness();const r=await Promise.allSettled([h.call('gestionarTurnoMiComunidad',{accion:'iniciar'}),h.call('gestionarTurnoMiComunidad',{accion:'iniciar'},'dos')]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);});
test('entrega captura pendientes; recepción por otra persona cierra y abre atómicamente',async()=>{const h=harness();h.rows.set(h.base+'/tareasTurno/t1',{estado:'Pendiente',titulo:'Revisar portón',prioridad:'Urgente',responsable:'Mantención'});const t=await h.call('gestionarTurnoMiComunidad',{accion:'iniciar'});await assert.rejects(h.call('gestionarTurnoMiComunidad',{accion:'entregar',turnoId:t.id}),{code:'invalid-argument'});await h.call('gestionarTurnoMiComunidad',{accion:'entregar',turnoId:t.id,resumen:'Portón pendiente de revisión.'});await assert.rejects(h.call('gestionarTurnoMiComunidad',{accion:'recibir',turnoId:t.id}),{code:'failed-precondition'});const n=await h.call('gestionarTurnoMiComunidad',{accion:'recibir',turnoId:t.id,resumen:'Recibo con observaciones.'},'dos');assert.notEqual(n.id,t.id);const old=h.rows.get(h.base+'/turnos/'+t.id);assert.equal(old.estado,'Cerrado');assert.equal(old.pendientesSnapshot.length,1);assert.equal(old.recibidoPor,'dos');assert.equal(h.rows.get(h.base+'/operacion/turnoActual').id,n.id);assert.equal(h.rows.get(h.base+'/tareasTurno/t1').estado,'Pendiente');});


test('ingreso y salida conservan responsables y salida idempotente',async()=>{const h=harness();const v=await h.call('gestionarVisitaMiComunidad',{accion:'ingresar',nombre:'Ana',depto:'101'});const ref=h.base+'/visitas/'+v.id;assert.equal(h.rows.get(ref).estado,'Dentro');await h.call('gestionarVisitaMiComunidad',{accion:'salir',id:v.id},'dos');assert.equal(h.rows.get(ref).estado,'Salió');assert.equal(h.rows.get(ref).salidaPor,'dos');const count=[...h.rows.keys()].filter(k=>k.includes('/novedades/')).length;await h.call('gestionarVisitaMiComunidad',{accion:'salir',id:v.id});assert.equal([...h.rows.keys()].filter(k=>k.includes('/novedades/')).length,count);});
test('persona restringida se registra como intento denegado y no puede marcar salida',async()=>{const h=harness();h.rows.get(h.base+'/residentes/residente').restringidos=[{nombre:'Ana'}];const v=await h.call('gestionarVisitaMiComunidad',{accion:'ingresar',nombre:'Ana',depto:'101'});assert.equal(v.denegado,true);assert.equal(h.rows.get(h.base+'/visitas/'+v.id).estado,'Denegado');await assert.rejects(h.call('gestionarVisitaMiComunidad',{accion:'salir',id:v.id}),{code:'failed-precondition'});});
test('dos conserjes no duplican el ingreso de una visita anunciada',async()=>{const h=harness();const fecha=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());h.rows.set(h.base+'/visitasProgramadas/invitacion',{nombre:'Ana',depto:'101',fecha,estado:'Pendiente'});const data={accion:'ingresar',programadaId:'invitacion'};const r=await Promise.allSettled([h.call('gestionarVisitaMiComunidad',data),h.call('gestionarVisitaMiComunidad',data,'dos')]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.equal(h.rows.get(h.base+'/visitasProgramadas/invitacion').estado,'Ingresó');assert.equal([...h.rows.keys()].filter(k=>k.includes('/visitas/')).length,1);});
test('reserva cancelada libera el horario y conserva el historial',async()=>{const h=harness();h.rows.set(h.base+'/reservas/r1',{estado:'Confirmada',depto:'101',lugar:'Quincho',fecha:'2099-01-01',bloqueId:'b1'});h.rows.set(h.base+'/bloquesOcupados/2099-01-01_b1',{reservaId:'r1'});await h.call('cancelarReservaMiComunidad',{id:'r1',motivo:'Cambio de planes'},'residente','residente');assert.equal(h.rows.get(h.base+'/reservas/r1').estado,'Cancelada');assert.ok(!h.rows.has(h.base+'/bloquesOcupados/2099-01-01_b1'));assert.ok(h.rows.get(h.base+'/reservas/r1').canceladaEn);});
test('no cancela reservas ajenas ni elimina un bloqueo de otra reserva',async()=>{const h=harness();const ref=h.base+'/reservas/r1';h.rows.set(ref,{estado:'Confirmada',depto:'999',lugar:'Quincho',fecha:'2099-01-01',bloqueId:'b1'});await assert.rejects(h.call('cancelarReservaMiComunidad',{id:'r1',motivo:'No corresponde'},'residente','residente'),{code:'permission-denied'});h.rows.get(ref).depto='101';h.rows.set(h.base+'/bloquesOcupados/2099-01-01_b1',{reservaId:'r2'});await assert.rejects(h.call('cancelarReservaMiComunidad',{id:'r1',motivo:'Cambio'},'residente','residente'),{code:'failed-precondition'});assert.equal(h.rows.get(ref).estado,'Confirmada');});

function planData(extra={}){return {titulo:'Revisión portón',equipo:'Portón',responsable:'Mantención',proveedor:'Servicio',detalle:'Prueba de sensores',periodicidad:'Mensual',proximaFecha:'2099-01-31',activo:true,solicitud:'a'.repeat(32),...extra};}
test('plan mensual conserva día 31 tras febrero y no genera movimientos financieros',async()=>{const h=harness();const p=await h.call('guardarPlanMantencionMiComunidad',planData(),'admin','admin');const ref=h.base+'/planesMantencion/'+p.id;assert.equal(h.rows.get(ref).version,1);await h.call('registrarRevisionMantencionMiComunidad',{id:p.id,version:1,solicitud:'b'.repeat(32),observacion:'Sensores revisados',foto:''});assert.equal(h.rows.get(ref).proximaFecha,'2099-02-28');await h.call('registrarRevisionMantencionMiComunidad',{id:p.id,version:2,solicitud:'c'.repeat(32),observacion:'Revisión mensual',foto:''});assert.equal(h.rows.get(ref).proximaFecha,'2099-03-31');assert.ok(![...h.rows.keys()].some(k=>k.includes('/movimientosContables/')));});
test('la revisión única finaliza el plan y reintentos no duplican el historial',async()=>{const h=harness();const p=await h.call('guardarPlanMantencionMiComunidad',planData({periodicidad:'Única'}),'admin','admin');const data={id:p.id,version:1,solicitud:'b'.repeat(32),observacion:'Trabajo finalizado',foto:''};await h.call('registrarRevisionMantencionMiComunidad',data);await h.call('registrarRevisionMantencionMiComunidad',data);assert.equal(h.rows.get(h.base+'/planesMantencion/'+p.id).activo,false);assert.equal(h.rows.get(h.base+'/planesMantencion/'+p.id).finalizado,true);assert.equal([...h.rows.keys()].filter(k=>k.includes('/revisiones/')).length,1);});
test('dos revisiones simultáneas del mismo plan no avanzan dos veces el calendario',async()=>{const h=harness();const p=await h.call('guardarPlanMantencionMiComunidad',planData(),'admin','admin');const a={id:p.id,version:1,solicitud:'b'.repeat(32),observacion:'Revisado',foto:''};const b={...a,solicitud:'c'.repeat(32)};const r=await Promise.allSettled([h.call('registrarRevisionMantencionMiComunidad',a),h.call('registrarRevisionMantencionMiComunidad',b,'dos')]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.equal(h.rows.get(h.base+'/planesMantencion/'+p.id).version,2);});
test('solo administración edita planes y se rechazan versiones desactualizadas',async()=>{const h=harness();await assert.rejects(h.call('guardarPlanMantencionMiComunidad',planData()),{code:'permission-denied'});const p=await h.call('guardarPlanMantencionMiComunidad',planData(),'admin','admin');await assert.rejects(h.call('guardarPlanMantencionMiComunidad',planData({id:p.id,version:0}),'admin','admin'),{code:'failed-precondition'});});
test('publicación reintentada crea un solo aviso y una notificación',async()=>{const h=harness();const data={accion:'publicar',solicitud:'a'.repeat(32),titulo:'Corte de agua',texto:'Mañana entre 10 y 12.',categoria:'Importante',fijado:true,confirmacion:true,vence:'2099-12-31'};const r=await h.call('gestionarAvisoMiComunidad',data,'admin','admin');await h.call('gestionarAvisoMiComunidad',data,'admin','admin');assert.equal([...h.rows.keys()].filter(k=>k.includes('/avisos/')).length,1);assert.equal([...h.rows.keys()].filter(k=>k.includes('/notificaciones/')).length,1);await h.call('confirmarAvisoMiComunidad',{id:r.id},'residente','residente');await h.call('confirmarAvisoMiComunidad',{id:r.id},'residente','residente');assert.equal([...h.rows.keys()].filter(k=>k.includes('/lecturasAvisos/')).length,1);assert.equal(h.rows.get(h.base+'/lecturasAvisos/'+r.id+'_residente').depto,'101');});
test('un aviso archivado o vencido no admite nuevas confirmaciones',async()=>{const h=harness();h.rows.set(h.base+'/avisos/a',{title:'Antiguo',confirmacion:true,vence:'2000-01-01'});await assert.rejects(h.call('confirmarAvisoMiComunidad',{id:'a'},'residente','residente'),{code:'failed-precondition'});h.rows.set(h.base+'/avisos/b',{title:'Archivado',confirmacion:true,estado:'Archivado'});await assert.rejects(h.call('confirmarAvisoMiComunidad',{id:'b'},'residente','residente'),{code:'failed-precondition'});});


test('licencia vencida o suspendida bloquea todas las funciones operativas antes de escribir',async()=>{
 for(const license of [{estado:'trial',trialEndsAt:Timestamp.fromMillis(1)},{estado:'active',paidUntil:Timestamp.fromMillis(1)},{estado:'suspended',paidUntil:Timestamp.fromMillis(4102444800000)}]){
  const h=harness();h.rows.set('mi_comunidad_licencias/edificio',license);
  for(const name of Object.keys(h.api)){
   const before=JSON.stringify([...h.rows]);
   await assert.rejects(h.call(name,{},'admin','admin'),{code:'failed-precondition'},name);
   assert.equal(JSON.stringify([...h.rows]),before,name);
  }
 }
});
test('licencia pagada vigente permite operación y no reinicia prueba',async()=>{
 const h=harness();h.rows.set('mi_comunidad_licencias/edificio',{estado:'active',paidUntil:Timestamp.fromMillis(4102444800000)});
 await h.call('gestionarTurnoMiComunidad',{accion:'iniciar'});
 assert.equal(h.rows.get('mi_comunidad_licencias/edificio').estado,'active');
});
