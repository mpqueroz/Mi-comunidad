'use strict';
const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const enabled=!!process.env.FIRESTORE_EMULATOR_HOST;
let db,Timestamp,FieldValue;
const {depurar}=require('../functions/depuracion');
const {marcarVencidos,actualizarVencimientos}=require('../functions/vencimientos');
before(()=>{
  if(!enabled)return;
  const sdk=require('node:module').createRequire(require.resolve('../functions/index'));
  const projectId='demo-mi-comunidad-mantenimiento';
  const app=sdk('firebase-admin/app').initializeApp({projectId});
  ({Timestamp,FieldValue}=sdk('firebase-admin/firestore'));
  db=sdk('firebase-admin/firestore').getFirestore(app);
});
const ahora=Date.UTC(2027,5,1),dia=86400000;
async function putMany(ref,rows){
  for(let i=0;i<rows.length;i+=400){const batch=db.batch();for(const [id,value]of rows.slice(i,i+400))batch.set(ref.doc(id),value);await batch.commit();}
}
test('depuración pagina ambos tipos ts y no se atasca en páginas conservadas',{skip:!enabled},async()=>{
  const base=db.collection('mi_comunidad_comunidades').doc('dep-paginas');await base.set({estado:'Activa'});
  const rows=[];
  for(let i=0;i<405;i++){rows.push(['n'+i,{ts:ahora-400*dia}]);rows.push(['t'+i,{ts:Timestamp.fromMillis(ahora-400*dia)}]);}
  await putMany(base.collection('visitas'),rows);
  await putMany(base.collection('encomiendas'),Array.from({length:405},(_,i)=>['p'+i,{ts:ahora-500*dia,estado:'Recibido'}]));
  await base.collection('encomiendas').doc('z-entregada').set({ts:ahora-400*dia,estado:'Entregado'});
  await base.collection('reservas').doc('futura-inyectada').set({ts:ahora-500*dia,fecha:'2027-06-02'});
  await base.collection('reservas').doc('pasada-inyectada').set({ts:ahora-500*dia,fecha:'2027-05-31'});
  const simulation=(await depurar(db,{ahora,borrar:false,Timestamp,FieldValue})).find(x=>x.comunidadId===base.id);
  assert.equal(simulation.conteo.visitas,810);assert.equal(simulation.conteo.encomiendas,1);assert.equal(simulation.conteo.reservas,1);
  await depurar(db,{ahora,borrar:true,Timestamp,FieldValue});
  assert.equal((await base.collection('visitas').get()).size,0);
  assert.equal((await base.collection('encomiendas').get()).size,405);
  assert.equal((await base.collection('reservas').get()).size,1);
});
test('depuración recorre más de cien comunidades',{skip:!enabled},async()=>{
  const batch=db.batch();for(let i=0;i<102;i++)batch.set(db.collection('mi_comunidad_comunidades').doc('torre-'+String(i).padStart(3,'0')),{estado:'Activa'});await batch.commit();
  const resumen=await depurar(db,{ahora,borrar:false,Timestamp,FieldValue});
  assert.equal(resumen.filter(x=>x.comunidadId.startsWith('torre-')).length,102);
});
test('depuración no borra un registro actualizado entre consulta y commit',{skip:!enabled},async()=>{
  const base=db.collection('mi_comunidad_comunidades').doc('dep-carrera');await base.set({estado:'Activa'});
  const ref=base.collection('visitas').doc('modificada');await ref.set({ts:ahora-400*dia});
  const original=db.batch;let injected=false;
  db.batch=function(){const batch=original.call(this),commit=batch.commit.bind(batch);batch.commit=async()=>{if(!injected){injected=true;await ref.update({ts:ahora});}return commit();};return batch;};
  try{await assert.rejects(depurar(db,{ahora,borrar:true,Timestamp,FieldValue}),/incompleta/);}finally{db.batch=original;}
  assert.equal((await ref.get()).exists,true);assert.equal((await ref.get()).get('ts'),ahora);
});
test('vencimientos pagina sin saltarse registros y respeta pagos concurrentes',{skip:!enabled},async()=>{
  const base=db.collection('mi_comunidad_comunidades').doc('ven-paginas');await base.set({estado:'Activa'});
  const ref=base.collection('gastosComunes');
  await putMany(ref,Array.from({length:405},(_,i)=>[String(i).padStart(4,'0'),{estado:'Pendiente',vencimiento:'2020-01-01'}]));
  const original=db.runTransaction;let injected=false;
  db.runTransaction=async function(...args){if(!injected){injected=true;await ref.doc('0000').update({estado:'Pagado'});}return original.apply(this,args);};
  try{assert.equal(await marcarVencidos(db,ref.where('estado','==','Pendiente'),'vencimiento','2027-06-01','Atrasado','Pendiente'),404);}finally{db.runTransaction=original;}
  assert.equal((await ref.doc('0000').get()).get('estado'),'Pagado');
  assert.equal((await ref.where('estado','==','Atrasado').get()).size,404);
  const suspended=db.collection('mi_comunidad_comunidades').doc('ven-suspendida');await suspended.set({estado:'Suspendida'});
  await suspended.collection('gastosComunes').doc('no-tocar').set({estado:'Pendiente',vencimiento:'2020-01-01'});
  await actualizarVencimientos(db,'2027-06-01',{log(){},error(){}});
  assert.equal((await suspended.collection('gastosComunes').doc('no-tocar').get()).get('estado'),'Pendiente');
});
