'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
let env;
const base=c=>`mi_comunidad_comunidades/${c}`;
const modules=['visitas','visitasProgramadas','vehiculos','encomiendas','reservas','gastosComunes','multas','avisos','incidencias','documentos','movimientosContables','remuneraciones','novedades','turnos','planesMantencion'];
const db=(c,role)=>env.authenticatedContext(`${c}-${role}`,{app:'mi_comunidad',role,comunidadId:c,depto:'101'}).firestore();
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-mi-comunidad-dos-edificios',firestore:{rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});
 await env.withSecurityRulesDisabled(async ctx=>{
  for(const c of ['torre-a','torre-b']){
   const store=ctx.firestore();
   await store.doc(base(c)).set({estado:'Activa',name:c});
   await store.doc(`${base(c)}/residentes/${c}-residente`).set({estado:'Activo',depto:'101'});
   await store.doc(`${base(c)}/conserjes/${c}-conserje`).set({estado:'Activo',sueldo:700000});
   for(const m of modules)await store.doc(`${base(c)}/${m}/igual-id`).set({depto:'101',periodo:'2026-10',estado:'Pendiente',edificio:c,monto:1000});
  }
 });
});
after(async()=>{if(env)await env.cleanup();});
for(const role of ['admin','conserje','residente'])test(`aislamiento bilateral: ${role} no lee documentos de otra torre aunque coincidan depto e id`,async()=>{
 for(const [own,other]of [['torre-a','torre-b'],['torre-b','torre-a']]){
  const store=db(own,role);
  await assertSucceeds(store.doc(`${base(own)}/avisos/igual-id`).get());
  for(const m of modules)await assertFails(store.doc(`${base(other)}/${m}/igual-id`).get());
  await assertFails(store.doc(`${base(other)}/residentes/${other}-residente`).get());
 }
});
for(const role of ['admin','conserje','residente'])test(`aislamiento bilateral: ${role} no cambia ni crea datos de otra torre`,async()=>{
 for(const [own,other]of [['torre-a','torre-b'],['torre-b','torre-a']]){
  const store=db(own,role);
  await assertFails(store.doc(base(other)).update({name:'Modificado'}));
  await assertFails(store.doc(`${base(other)}/gastosComunes/igual-id`).update({monto:1}));
  await assertFails(store.collection(`${base(other)}/visitasProgramadas`).add({depto:'101'}));
 }
});
test('privacidad laboral: conserje no puede consultar fichas ni sueldos de otros conserjes',async()=>{
 await env.withSecurityRulesDisabled(ctx=>ctx.firestore().doc(`${base('torre-a')}/conserjes/otro`).set({estado:'Activo',sueldo:990000}));
 const store=db('torre-a','conserje');
 await assertFails(store.doc(`${base('torre-a')}/conserjes/otro`).get());
 await assertFails(store.collection(`${base('torre-a')}/conserjes`).get());
 const snap=await assertSucceeds(store.doc(`${base('torre-a')}/conserjes/torre-a-conserje`).get());
 assert.equal(snap.data().sueldo,700000);
 await assertSucceeds(db('torre-a','admin').collection(`${base('torre-a')}/conserjes`).get());
});
test('cobros: incluso administración debe generar en servidor y no reasignar deudas existentes',async()=>{
 const store=db('torre-a','admin');
 await assertFails(store.collection(`${base('torre-a')}/gastosComunes`).add({depto:'101',periodo:'2026-10',monto:10}));
 const ref=store.doc(`${base('torre-a')}/gastosComunes/igual-id`);
 await assertFails(ref.update({depto:'202'}));
 await assertFails(ref.update({periodo:'2026-11'}));
 await assertSucceeds(ref.update({estado:'Por confirmar'}));
});
