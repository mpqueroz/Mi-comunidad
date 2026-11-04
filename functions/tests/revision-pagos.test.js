"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const {evaluateLicense,applyVerifiedRenewal}=require("../licencias");
function harness(){
 const id="order00000000001",until=new Date("2031-01-01T00:00:00Z");
 const state={apiCalls:0,audits:[],incidents:{"100":{estado:"pendiente"}},order:{id,comunidadId:"edificio-test",status:"payment_review",paymentId:"99",preferenceId:"pref",collectorId:"123",liveMode:false,amount:800000,months:12,paymentStatus:"refunded",paidUntilApplied:until,licenseBeforeRenewal:{estado:"active",paidUntil:new Date("2030-01-01T00:00:00Z"),lastPaymentId:"88"}},license:{estado:"suspended",suspensionReason:"payment_reversed",paidUntil:until,lastPaymentId:"99",checkoutRevision:4},community:{estado:"Activa"},payment:{id:99,external_reference:id,preference_id:"pref",collector_id:123,live_mode:false,currency_id:"CLP",transaction_amount:800000,transaction_amount_refunded:800000,status:"refunded"}};
 const snap=(data,id)=>({id,exists:!!data,data:()=>data,get:k=>data?.[k]});
 const ref=(kind,id)=>({kind,id,collection:()=>({kind:"incidentsQuery",doc:id=>ref("incident",id)})});
 const refs={mi_comunidad_ordenes_pago:"order",mi_comunidad_licencias:"license",mi_comunidad_comunidades:"community"};
 const db={collection:name=>({doc:id=>ref(refs[name]||"audit",id)}),runTransaction:async fn=>{
  const writes=[];const result=await fn({get:async r=>r.kind==="incidentsQuery"?{docs:Object.entries(state.incidents).map(([id,data])=>snap(data,id))}:snap(r.kind==="incident"?state.incidents[r.id]:state[r.kind],r.id),update:(r,data)=>writes.push(()=>Object.assign(r.kind==="incident"?state.incidents[r.id]:state[r.kind],data)),create:(_,data)=>writes.push(()=>state.audits.push(data))});writes.forEach(w=>w());return result;
 }};
 const context={exports:{},Date,require:name=>{
 if(name==="firebase-functions/v2/https")return {onCall:(a,b)=>b||a,HttpsError:class extends Error{constructor(code,message){super(message);this.code=code;}}};
 if(name==="firebase-admin/firestore")return {getFirestore:()=>db,FieldValue:{serverTimestamp:()=>new Date(),delete:()=>null}};
 if(name==="./licencias")return {evaluateLicense,applyVerifiedRenewal};
 if(name==="./mercadopago")return {ACCESS_TOKEN:{},assertCheckoutCanRestart:async()=>{if(!state.restartVerified)throw Error("No es seguro");return {...state.order};},obtenerPagoRevision:async()=>{state.apiCalls++;return {...state.payment};},verifyPayment:(p,o)=>p.status==="approved"&&!(p.transaction_amount_refunded>0)&&p.transaction_amount===o.amount};
 throw Error(name);
 }};
 vm.runInNewContext(fs.readFileSync(require.resolve("../rehabilitacion"),"utf8"),context);
 const request={auth:{uid:"owner",token:{app:"mi_comunidad",role:"superadmin"}},data:{orderId:id,paymentId:"99",accion:"confirmar_reverso_total",motivo:"Reembolso confirmado con comprobante contable 12345"}};
 return {state,request,run:()=>context.exports.resolverRevisionPagoMiComunidad(request),restart:()=>context.exports.reiniciarCheckoutFallidoMiComunidad(request)};
}
test("reverso restaura saldo anterior e incrementa ciclo recompra en misma transacción",async()=>{
 const h=harness();await h.run();assert.equal(h.state.order.status,"reversed_resolved");assert.equal(h.state.license.lastPaymentId,"88");assert.equal(h.state.license.paidUntil.toISOString(),"2030-01-01T00:00:00.000Z");assert.equal(h.state.license.estado,"active");assert.equal(h.state.license.checkoutRevision,5);assert.equal(h.state.audits[0].actorUid,"owner");await assert.rejects(h.run(),{code:"failed-precondition"});assert.equal(h.state.audits.length,1);
});
test("rechaza admin antes de consultar API",async()=>{const h=harness();h.request.auth.token.role="admin";await assert.rejects(h.run(),{code:"permission-denied"});assert.equal(h.state.apiCalls,0);});
test("parcial, saldo desconocido, vigencia cambiada y vendedor ajeno preservan revisión",async()=>{
 for(const scenario of ["partial","missing","changed","seller"]){const h=harness();if(scenario==="partial"){h.state.payment.status="approved";h.state.payment.transaction_amount_refunded=100;}if(scenario==="missing")delete h.state.order.licenseBeforeRenewal;if(scenario==="changed")h.state.license.paidUntil=new Date("2032-01-01T00:00:00Z");if(scenario==="seller")h.state.payment.collector_id=999;await assert.rejects(h.run(),{code:"failed-precondition"});assert.equal(h.state.order.status,"payment_review");assert.equal(h.state.license.estado,"suspended");assert.equal(h.state.audits.length,0);}
});
test("histórico no cambia licencia posterior",async()=>{const h=harness();h.state.license.lastPaymentId="100";h.state.license.estado="active";h.request.data.accion="cerrar_revision_historica";await h.run();assert.equal(h.state.license.lastPaymentId,"100");assert.equal(h.state.license.estado,"active");});
test("pago retenido se aplica una vez y registra baseline para futuros reversos",async()=>{
 const h=harness();h.request.data.accion="aplicar_pago_verificado";h.state.order.paymentStatus="approved_while_suspended";h.state.payment.status="approved";h.state.payment.transaction_amount_refunded=0;h.state.license={estado:"trial",trialEndsAt:new Date("2030-01-01T00:00:00Z"),paidUntil:null};await h.run();assert.equal(h.state.order.status,"paid");assert.equal(h.state.license.lastPaymentId,"99");assert.equal(h.state.order.licenseBeforeRenewal.estado,"trial");assert.ok(h.state.order.paidUntilApplied);await assert.rejects(h.run(),{code:"failed-precondition"});
});
test("segundo cobro devuelto resuelve incidencia sin tocar pago original ni licencia",async()=>{
 for(const more of [false,true]){const h=harness();h.state.order.status="paid";h.state.order.additionalPaymentReview=true;h.state.payment.id=100;h.request.data.paymentId="100";h.request.data.accion="cerrar_pago_adicional_reembolsado";if(more)h.state.incidents["101"]={estado:"pendiente"};await h.run();assert.equal(h.state.order.status,"paid");assert.equal(h.state.order.paymentId,"99");assert.equal(h.state.license.lastPaymentId,"99");assert.equal(h.state.incidents["100"].estado,"resuelta");assert.equal(h.state.order.additionalPaymentReview,more);await assert.rejects(h.run(),{code:"failed-precondition"});}
});
test("segundo cobro parcial no permite cierre ni otorgar meses",async()=>{const h=harness();h.state.order.status="paid";h.state.order.additionalPaymentReview=true;h.state.payment.id=100;h.state.payment.status="approved";h.state.payment.transaction_amount_refunded=1;h.request.data.paymentId="100";h.request.data.accion="cerrar_pago_adicional_reembolsado";await assert.rejects(h.run(),{code:"failed-precondition"});assert.equal(h.state.incidents["100"].estado,"pendiente");});

test("reinicio administrativo exige verificación y cierra orden con nuevo ciclo de compra",async()=>{
 const h=harness();h.state.order.status="checkout_error";h.state.order.creationOutcome="rejected";delete h.state.order.preferenceId;
 await assert.rejects(h.restart(),{code:"failed-precondition"});assert.equal(h.state.order.status,"checkout_error");
 h.state.restartVerified=true;await h.restart();assert.equal(h.state.order.status,"checkout_cancelled");assert.equal(h.state.license.checkoutRevision,5);assert.equal(h.state.audits[0].accion,"reinicio_checkout_verificado");
 await assert.rejects(h.restart(),{code:"failed-precondition"});assert.equal(h.state.license.checkoutRevision,5);
});
test("reinicio no cierra resultado incierto ni preferencia ya creada",async()=>{
 for(const outcome of ["uncertain","post_started","rejected"]){const h=harness();h.state.restartVerified=true;h.state.order.status="checkout_error";h.state.order.creationOutcome=outcome;if(outcome!=="rejected")delete h.state.order.preferenceId;await assert.rejects(h.restart(),{code:"failed-precondition"});assert.equal(h.state.audits.length,0);assert.equal(h.state.license.checkoutRevision,4);}
});
