'use strict';
const {test,before,after,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const {serverTimestamp}=require('firebase/firestore');
let env;
const orderId='orden000000000000001',community='prueba-pagos';
const orderPath='mi_comunidad_ordenes_pago/'+orderId,licensePath='mi_comunidad_licencias/'+community;
function helpers(){
 const context={module:{exports:{}},Buffer,Date,AbortSignal,console,require:name=>{
  if(name==='crypto')return require('node:crypto');
  if(name==='./licencias')return require('../functions/licencias');
  if(name==='firebase-admin/firestore')return {FieldValue:{serverTimestamp}};
  if(name==='firebase-functions/params')return {defineSecret:()=>({})};
  if(name==='firebase-functions/v2/https')return {};
  if(name==='firebase-functions/v2/scheduler')return {};
  throw Error(name);
 }};
 // Execute with injected dependencies in this realm: Firebase rejects cross-realm objects.
 new Function('require','module',fs.readFileSync(path.join(__dirname,'../functions/mercadopago.js'),'utf8'))(context.require,context.module);
 return context.module.exports;
}
const api=helpers();
const payment={id:99,status:'approved',external_reference:orderId,preference_id:'pref',transaction_amount:1000,currency_id:'CLP',live_mode:false,collector_id:123,order:{id:55}};
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-pagos-licencias',firestore:{rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});});
after(async()=>env&&env.cleanup());
beforeEach(async()=>{
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();
  await db.doc('mi_comunidad_comunidades/'+community).set({estado:'Activa'});
  await db.doc(licensePath).set({estado:'trial',paidUntil:null});
  await db.doc(orderPath).set({id:orderId,comunidadId:community,status:'checkout_ready',preferenceId:'pref',amount:1000,months:12,liveMode:false,collectorId:'123'});
 });
});
test('Firestore: diez confirmaciones iniciales simultáneas aplican un solo año',async()=>{
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore(),before=Date.now();
  await Promise.all(Array.from({length:10},()=>api.settleVerifiedPayment(db,orderId,payment,'99')));
  const license=(await db.doc(licensePath).get()).data();
  const expected=new Date(before);expected.setUTCFullYear(expected.getUTCFullYear()+1);
  assert.ok(Math.abs(license.paidUntil.toMillis()-expected.getTime())<60000);
  assert.equal(license.lastPaymentId,'99');
  assert.equal((await db.doc(orderPath).get()).data().status,'paid');
 });
});
test('Firestore: webhook y conciliación simultáneos no duplican licencia; detecta reverso perdido',async()=>{
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();let reversed=false;
  const request=async resource=>resource.startsWith('/v1/payments/search')?{results:[payment]}:
   resource.startsWith('/v1/payments/')?{...payment,...(reversed?{transaction_amount_refunded:100}:{})}:
   {id:55,external_reference:orderId,preference_id:'pref',payments:[{id:99}]};
  await Promise.all([api.settleVerifiedPayment(db,orderId,payment,'99'),api.reconcilePayments(db,'ficticio',request)]);
  const end=(await db.doc(licensePath).get()).data().paidUntil.toMillis();
  await api.reconcilePayments(db,'ficticio',request);
  assert.equal((await db.doc(licensePath).get()).data().paidUntil.toMillis(),end);
  reversed=true;await api.reconcilePayments(db,'ficticio',request);
  assert.equal((await db.doc(orderPath).get()).data().status,'payment_review');
  assert.equal((await db.doc(licensePath).get()).data().estado,'suspended');
 });
});
