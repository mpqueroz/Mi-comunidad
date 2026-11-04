'use strict';
const {test,before,after}=require('node:test');
const fs=require('node:fs'),path=require('node:path');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
let env;
const base='mi_comunidad_comunidades/integridad';
const account=role=>env.authenticatedContext(role,{app:'mi_comunidad',role,comunidadId:'integridad',depto:'101'}).firestore();
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-mi-comunidad-integridad-reglas',firestore:{rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();await db.doc(base).set({estado:'Activa'});
  await db.doc(base+'/residentes/residente').set({estado:'Activo',depto:'101',familiares:[{nombre:'Existente'}],restringidos:[{nombre:'Restricción existente'}]});
  for(const [col,estado]of [['remuneraciones','Pendiente'],['mantenciones','Programada'],['gastosComunes','Pendiente'],['multas','Pendiente']])await db.doc(`${base}/${col}/uno`).set({estado,monto:40000,depto:'101',periodo:'2026-11'});
 });
});
after(async()=>{if(env)await env.cleanup();});
test('reglas integridad: ningún rol cliente reemplaza listas aunque los elementos sean válidos',async()=>{
 for(const role of ['admin','residente'])for(const tipo of ['familiares','restringidos'])for(const values of [[null],[{nombre:'Ana'}],[]])await assertFails(account(role).doc(base+'/residentes/residente').update({[tipo]:values}));
 await assertSucceeds(account('admin').doc(base+'/residentes/residente').update({telefono:'123'}));
});
test('reglas integridad: cierre financiero solo servidor, altas y edición pendiente legítimas',async()=>{
 const db=account('admin');
 for(const [col,final]of [['remuneraciones','Pagado'],['mantenciones','Realizada'],['gastosComunes','Pagado'],['multas','Pagada']]){
  await assertFails(db.doc(`${base}/${col}/uno`).update({estado:final}));
  await assertSucceeds(db.doc(`${base}/${col}/uno`).update({monto:50000}));
  await assertFails(db.doc(`${base}/${col}/fraude`).set({estado:final,monto:50000}));
 }
 await assertSucceeds(db.doc(base+'/remuneraciones/nueva').set({estado:'Pendiente',monto:10000,fechaPago:null}));
 await assertSucceeds(db.doc(base+'/mantenciones/nueva').set({estado:'Programada',monto:10000,fechaRealizada:null}));
 await assertSucceeds(db.doc(base+'/multas/nueva').set({estado:'Pendiente',monto:10000,depto:'101'}));
});
test('reglas integridad: no falsifica asientos vinculados y permite Manual/Conciliación legítimos',async()=>{
 const db=account('admin'),data={fecha:'2026-11-04',tipo:'Egreso',monto:50000,origen:'Automático',categoria:'Remuneraciones'};
 for(const categoria of ['Remuneraciones','Proveedores','Gasto común','Multa'])await assertFails(db.doc(base+'/movimientosContables/falso-'+categoria).set({...data,categoria}));
 for(const reserved of ['egreso_mantencion_falso','egreso_remuneracion_falso','ingreso_gasto_falso','ingreso_multa_falso'])await assertFails(db.doc(base+'/movimientosContables/'+reserved).set({...data,origen:'Manual'}));
 await assertSucceeds(db.doc(base+'/movimientosContables/manual').set({...data,origen:'Manual',categoria:'Otro'}));
 await assertSucceeds(db.doc(base+'/movimientosContables/conciliacion').set({...data,origen:'Conciliación',categoria:'Proveedores'}));
});
test('reglas integridad: residente todavía informa pagos, nunca confirma ingreso',async()=>{
 const db=account('residente');
 for(const col of ['gastosComunes','multas']){
  await assertSucceeds(db.doc(`${base}/${col}/uno`).update({estado:'Por confirmar',pagoInformado:{metodo:'Transferencia',fecha:'2026-11-04',referencia:'Prueba ficticia',informadoEn:Date.now()}}));
  await assertFails(db.doc(`${base}/${col}/uno`).update({estado:col==='multas'?'Pagada':'Pagado'}));
 }
});
