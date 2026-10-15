'use strict';
const {test,before}=require('node:test');const assert=require('node:assert/strict');
const enabled=!!process.env.FIRESTORE_EMULATOR_HOST;
let api,db;
before(()=>{
 if(!enabled)return;
 const projectId='demo-mi-comunidad-operacion';
 process.env.GCLOUD_PROJECT=projectId;process.env.FIREBASE_CONFIG=JSON.stringify({projectId});
 api=require('../functions/index');const sdkRequire=require('node:module').createRequire(require.resolve('../functions/index'));const {getApp}=sdkRequire('firebase-admin/app');const {getFirestore}=sdkRequire('firebase-admin/firestore');
 assert.equal(getApp().options.projectId,projectId);db=getFirestore();
});
let seq=0;
async function fixture(){const id='prueba-'+Date.now()+'-'+(++seq);const base=db.collection('mi_comunidad_comunidades').doc(id);await base.set({estado:'Activa',adminNombre:'Administración'});await Promise.all([base.collection('residentes').doc('r1').set({nombre:'Ana',depto:'101',estado:'Activo',restringidos:[]}),base.collection('conserjes').doc('c1').set({nombre:'Conserje Uno',estado:'Activo'}),base.collection('conserjes').doc('c2').set({nombre:'Conserje Dos',estado:'Activo'})]);const call=(name,data,uid='c1',role='conserje')=>api[name].run({auth:{uid,token:{app:'mi_comunidad',role,comunidadId:id,depto:'101'}},data:{comunidadId:id,...data}});return {id,base,call};}
test('Firestore real: dos operadores no toman la misma encomienda',{skip:!enabled},async()=>{const h=await fixture();const p=await h.call('registrarEncomiendaMiComunidad',{titulo:'Caja',depto:'101',ubicacion:'B2'});const r=await Promise.allSettled([h.call('gestionarEncomiendaMiComunidad',{accion:'iniciar',id:p.id}),h.call('gestionarEncomiendaMiComunidad',{accion:'iniciar',id:p.id},'c2')]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);const ganador=r[0].status==='fulfilled'?'c1':'c2';const token=r.find(x=>x.status==='fulfilled').value.token;await h.call('gestionarEncomiendaMiComunidad',{accion:'confirmar',id:p.id,token,retiradoPor:{nombre:'Ana',relacion:'Titular'}},ganador);assert.equal((await h.base.collection('encomiendas').doc(p.id).get()).data().estado,'Entregado');});
test('Firestore real: recepción cierra turno anterior y abre otro',{skip:!enabled},async()=>{const h=await fixture();const t=await h.call('gestionarTurnoMiComunidad',{accion:'iniciar'});await h.call('gestionarTurnoMiComunidad',{accion:'entregar',turnoId:t.id,resumen:'Se entrega edificio sin pendientes.'});const n=await h.call('gestionarTurnoMiComunidad',{accion:'recibir',turnoId:t.id},'c2');assert.equal((await h.base.collection('turnos').doc(t.id).get()).data().estado,'Cerrado');assert.equal((await h.base.collection('operacion').doc('turnoActual').get()).data().id,n.id);});
test('Firestore real: cancelar conserva reserva y elimina su marcador',{skip:!enabled},async()=>{const h=await fixture();await h.base.collection('reservas').doc('r').set({depto:'101',fecha:'2099-01-01',lugar:'Quincho',bloqueId:'b',estado:'Confirmada'});await h.base.collection('bloquesOcupados').doc('2099-01-01_b').set({reservaId:'r'});await h.call('cancelarReservaMiComunidad',{id:'r',motivo:'Cambio de planes'},'r1','residente');assert.equal((await h.base.collection('reservas').doc('r').get()).data().estado,'Cancelada');assert.equal((await h.base.collection('bloquesOcupados').doc('2099-01-01_b').get()).exists,false);});
test('Firestore real: publicar y confirmar aviso conserva una lectura por cuenta',{skip:!enabled},async()=>{const h=await fixture();const a=await h.call('gestionarAvisoMiComunidad',{accion:'publicar',solicitud:'a'.repeat(32),titulo:'Corte de agua',texto:'Revisión programada.',categoria:'Importante',confirmacion:true},'adm','admin');await h.call('confirmarAvisoMiComunidad',{id:a.id},'r1','residente');await h.call('confirmarAvisoMiComunidad',{id:a.id},'r1','residente');assert.equal((await h.base.collection('lecturasAvisos').get()).size,1);});
test('Firestore real: registrar revisión recalcula calendario sin generar un cobro',{skip:!enabled},async()=>{const h=await fixture();const p=await h.call('guardarPlanMantencionMiComunidad',{titulo:'Portón',proximaFecha:'2099-01-31',periodicidad:'Mensual',activo:true,solicitud:'b'.repeat(32)},'adm','admin');await h.call('registrarRevisionMantencionMiComunidad',{id:p.id,version:1,solicitud:'c'.repeat(32),observacion:'Revisado',foto:''});assert.equal((await h.base.collection('planesMantencion').doc(p.id).get()).data().proximaFecha,'2099-02-28');assert.equal((await h.base.collection('movimientosContables').get()).size,0);});
test('Firestore real: cada comunidad conserva su propia configuración de pagos',{skip:!enabled},async()=>{const a=await fixture(),b=await fixture();await a.call('configurarPagosMiComunidad',{version:0,metodos:['Transferencia'],banco:'Banco de prueba',numeroCuenta:'123'},'adm','admin');assert.equal((await a.base.get()).data().configuracionPago.banco,'Banco de prueba');assert.equal((await b.base.get()).data().configuracionPago,undefined);await assert.rejects(a.call('configurarPagosMiComunidad',{version:1,metodos:['Transferencia']},'r1','residente'),{code:'permission-denied'});});

for(const [uid,role,collection] of [['r1','residente','residentes'],['c1','conserje','conserjes']]) {
 test(`Firestore real: ${role} inactivo o eliminado no usa funciones de identidad`,{skip:!enabled},async()=>{
  const h=await fixture();const profile=h.base.collection(collection).doc(uid);
  await profile.update({estado:'Inactivo'});
  const name=role==='residente'?'definirPreguntaSecretaMiComunidad':'verificarPreguntaSecretaMiComunidad';
  const data={uid:'r1',pregunta:'Pregunta de prueba',respuesta:'Respuesta de prueba'};
  await assert.rejects(h.call(name,data,uid,role),{code:'permission-denied'});
  await profile.delete();
  await assert.rejects(h.call(name,data,uid,role),{code:'permission-denied'});
 });
 test(`Firestore real: ${role} inactivo no usa operaciones profesionales`,{skip:!enabled},async()=>{
  const h=await fixture();await h.base.collection(collection).doc(uid).update({estado:'Inactivo'});
  const name=role==='residente'?'confirmarAvisoMiComunidad':'gestionarTurnoMiComunidad';
  await assert.rejects(h.call(name,{id:'a',accion:'iniciar'},uid,role),{code:'permission-denied'});
 });
}
test('Firestore real: residente inactivo no crea reservas con token anterior',{skip:!enabled},async()=>{
 const h=await fixture();await h.base.collection('residentes').doc('r1').update({estado:'Inactivo'});
 await assert.rejects(h.call('crearReservaMiComunidad',{lugar:'Quincho',fecha:'2099-01-01',bloqueId:'b'},'r1','residente'),{code:'permission-denied'});
 assert.equal((await h.base.collection('reservas').get()).size,0);
});
test('Firestore real: cambio de departamento invalida permisos del token anterior',{skip:!enabled},async()=>{
 const h=await fixture();await h.base.collection('residentes').doc('r1').update({depto:'202'});
 await assert.rejects(h.call('crearReservaMiComunidad',{lugar:'Quincho',fecha:'2099-01-01',bloqueId:'b'},'r1','residente'),{code:'permission-denied'});
 await assert.rejects(h.call('confirmarAvisoMiComunidad',{id:'a'},'r1','residente'),{code:'permission-denied'});
});
test('Firestore real: identidad y restablecimiento respetan suspensión de comunidad',{skip:!enabled},async()=>{
 const h=await fixture();await h.base.update({estado:'Suspendida'});
 await assert.rejects(h.call('definirPreguntaSecretaMiComunidad',{uid:'r1',pregunta:'Prueba',respuesta:'Prueba'},'r1','residente'),{code:'failed-precondition'});
 await assert.rejects(h.call('restablecerClaveMiComunidad',{uid:'r1',nuevaClave:'Prueba-local-123'},'adm','admin'),{code:'failed-precondition'});
});
test('Firestore real: identidad de residente activo sigue funcionando con SDK modular',{skip:!enabled},async()=>{
 const h=await fixture();await h.call('definirPreguntaSecretaMiComunidad',{uid:'r1',pregunta:'Color de prueba',respuesta:'Azul'},'r1','residente');
 const secreto=await h.base.collection('secretos').doc('r1').get();assert.equal(secreto.exists,true);assert.ok(secreto.get('hash'));
 assert.equal((await h.base.collection('residentes').doc('r1').get()).get('respuestaSecreta'),undefined);
 await h.call('verificarPreguntaSecretaMiComunidad',{uid:'r1',respuesta:'Azul'});
});
