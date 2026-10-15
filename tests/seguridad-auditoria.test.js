'use strict';
// Auditoría adicional: solo datos ficticios y un proyecto demo aislado.
const {test,before,after,beforeEach}=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
let env;
const base='mi_comunidad_comunidades/auditoria';
const cuenta=(uid,role,extra={})=>env.authenticatedContext(uid,{app:'mi_comunidad',role,comunidadId:'auditoria',depto:'101',...extra}).firestore();
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-mi-comunidad-auditoria',firestore:{rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});});
after(async()=>{if(env)await env.cleanup();});
beforeEach(async()=>{
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.firestore();
    await db.doc(base).set({estado:'Activa',nombre:'Datos ficticios'});
    await db.doc(`${base}/residentes/r1`).set({estado:'Activo',depto:'101',nombre:'Prueba'});
    await db.doc(`${base}/conserjes/c1`).set({estado:'Activo',nombre:'Prueba'});
    await db.doc(`${base}/avisos/a1`).set({titulo:'Prueba'});
    await db.doc(`${base}/gastosComunes/g1`).set({estado:'Pendiente',depto:'101',monto:1000});
    await db.doc(`${base}/secretos/r1`).set({hash:'dato-ficticio'});
    await db.doc(`${base}/auditoria/a1`).set({tipo:'Prueba'});
  });
});
test('seguridad: visitante sin sesión no lee datos de comunidad',async()=>{
  const db=env.unauthenticatedContext().firestore();
  await assertFails(db.doc(base).get());
  await assertFails(db.doc(`${base}/avisos/a1`).get());
});
test('seguridad: cuenta de otra aplicación queda bloqueada',async()=>{
  await assertFails(cuenta('r1','residente',{app:'otra_app'}).doc(`${base}/avisos/a1`).get());
});
for(const role of ['admin','conserje','residente'])test(`seguridad: ${role} de otra comunidad no puede leer ni escribir`,async()=>{
  const db=cuenta('ajeno',role,{comunidadId:'otro_edificio'});
  await assertFails(db.doc(`${base}/avisos/a1`).get());
  await assertFails(db.doc(base).update({nombre:'Intrusión'}));
});
test('seguridad: residente no puede darse permisos de administración',async()=>{
  await assertFails(cuenta('r1','residente').doc(`${base}/residentes/r1`).update({role:'admin'}));
});
test('seguridad: residente no puede alterar monto ni confirmar su pago',async()=>{
  const ref=cuenta('r1','residente').doc(`${base}/gastosComunes/g1`);
  await assertFails(ref.update({monto:1}));
  await assertFails(ref.update({estado:'Pagado'}));
});
test('seguridad: residente no puede consultar finanzas de otro departamento',async()=>{
  await assertFails(cuenta('otro','residente',{depto:'202'}).doc(`${base}/gastosComunes/g1`).get());
});
test('seguridad: secretos inaccesibles incluso para administración',async()=>{
  for(const role of ['admin','conserje','residente'])await assertFails(cuenta('r1',role).doc(`${base}/secretos/r1`).get());
});
test('seguridad: nadie puede editar ni borrar auditoría desde cliente',async()=>{
  const ref=cuenta('adm','admin').doc(`${base}/auditoria/a1`);
  await assertFails(ref.update({tipo:'Alterado'}));await assertFails(ref.delete());
});
test('seguridad: suspensión corta acceso operativo a todos los roles',async()=>{
  await env.withSecurityRulesDisabled(ctx=>ctx.firestore().doc(base).update({estado:'Suspendida'}));
  for(const role of ['admin','conserje','residente'])await assertFails(cuenta('r1',role).doc(`${base}/avisos/a1`).get());
});
test('seguridad: cuenta activa mantiene acceso permitido',async()=>{
  await assertSucceeds(cuenta('r1','residente').doc(`${base}/avisos/a1`).get());
});
test('seguridad: residente inactivo con sesión previa debe perder acceso',async()=>{
  await env.withSecurityRulesDisabled(ctx=>ctx.firestore().doc(`${base}/residentes/r1`).update({estado:'Inactivo'}));
  await assertFails(cuenta('r1','residente').doc(`${base}/avisos/a1`).get());
});
test('seguridad: conserje inactivo con sesión previa debe perder acceso',async()=>{
  await env.withSecurityRulesDisabled(ctx=>ctx.firestore().doc(`${base}/conserjes/c1`).update({estado:'Inactivo'}));
  await assertFails(cuenta('c1','conserje').doc(`${base}/residentes/r1`).get());
});

for(const [uid,role,collection] of [['r1','residente','residentes'],['c1','conserje','conserjes']]) {
 test(`seguridad: ${role} inactivo tampoco lee comunidad ni escribe con sesión anterior`,async()=>{
  const db=cuenta(uid,role);
  await assertSucceeds(db.doc(`${base}/avisos/a1`).get());
  await env.withSecurityRulesDisabled(ctx=>ctx.firestore().doc(`${base}/${collection}/${uid}`).update({estado:'Inactivo'}));
  await assertFails(db.doc(base).get());
  await assertFails(db.doc(base).update({ultimoAcceso:Date.now()}));
 });
 test(`seguridad: ${role} eliminado no conserva permisos del token`,async()=>{
  await env.withSecurityRulesDisabled(ctx=>ctx.firestore().doc(`${base}/${collection}/${uid}`).delete());
  await assertFails(cuenta(uid,role).doc(`${base}/avisos/a1`).get());
 });
}
test('seguridad: cambio de departamento bloquea token anterior y permite el actualizado',async()=>{
 await env.withSecurityRulesDisabled(ctx=>ctx.firestore().doc(`${base}/residentes/r1`).update({depto:'202'}));
 await assertFails(cuenta('r1','residente').doc(`${base}/avisos/a1`).get());
 await assertSucceeds(cuenta('r1','residente',{depto:'202'}).doc(`${base}/avisos/a1`).get());
});
test('seguridad: superadmin mantiene acceso al panel de comunidades',async()=>{
 await assertSucceeds(cuenta('super','superadmin',{comunidadId:''}).doc(base).get());
});
