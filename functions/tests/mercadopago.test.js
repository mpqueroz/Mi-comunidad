"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const Module = require("node:module");

const originalLoad = Module._load;
let helpers;
try {
  Module._load = function(name, parent, isMain) {
    if (name === "firebase-functions/v2/https") return {onCall: () => {}, onRequest: () => {}};
    if (name === "firebase-functions/v2/scheduler") return {onSchedule: () => {}};
    if (name === "firebase-functions/params") return {defineSecret: () => ({})};
    if (name === "firebase-admin/firestore") return {getFirestore: () => {}, FieldValue: {}};
    return originalLoad.call(this, name, parent, isMain);
  };
  helpers = require("../mercadopago");
} finally {
  Module._load = originalLoad;
}

test("firma de notificación auténtica y reciente", () => {
  const secret = "clave-de-prueba";
  const ts = "1792843200";
  const id = "123456";
  const requestId = "test-request";
  const manifest = "id:" + id + ";request-id:" + requestId + ";ts:" + ts + ";";
  const hash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const headers = {"x-signature": "ts=" + ts + ",v1=" + hash, "x-request-id": requestId};
  const query = {"data.id": id};
  assert.equal(helpers.validateSignature(headers, query, secret, Number(ts) * 1000), true);
  assert.equal(helpers.validateSignature(headers, query, "clave-distinta", Number(ts) * 1000), false);
  assert.equal(helpers.validateSignature(headers, query, secret, Number(ts) * 1000 + 660000), false);
});

test("el pago debe coincidir exactamente con la orden", () => {
  const order = {id: "orden-1234567890", preferenceId: "pref-1", amount: 800000, months: 12, liveMode: false};
  const payment = {id: 99, status: "approved", external_reference: order.id,
    preference_id: "pref-1", transaction_amount: 800000, currency_id: "CLP", live_mode: false};
  assert.equal(helpers.verifyPayment(payment, order, "99"), true);
  for (const changes of [{status: "pending"}, {transaction_amount: 100},
    {currency_id: "USD"}, {preference_id: "pref-2"}, {live_mode: true}]) {
    assert.equal(helpers.verifyPayment({...payment, ...changes}, order, "99"), false);
  }
});


test("la notificación rechaza identificadores inválidos y firmas manipuladas", () => {
  const secret = "clave-de-prueba";
  const ts = "1792843200";
  const requestId = "request-seguro";
  const id = "123456";
  const manifest = "id:" + id + ";request-id:" + requestId + ";ts:" + ts + ";";
  const hash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const headers = {"x-signature": "ts=" + ts + ",v1=" + hash, "x-request-id": requestId};
  const now = Number(ts) * 1000;
  assert.equal(helpers.validateSignature(headers, {"data.id": id}, secret, now), true);
  for (const invalid of ["", "123abc", "-123", "1".repeat(21), "123/456"]) {
    assert.equal(helpers.validateSignature(headers, {"data.id": invalid}, secret, now), false);
  }
  assert.equal(helpers.validateSignature({...headers, "x-request-id": "otro"}, {"data.id": id}, secret, now), false);
  assert.equal(helpers.validateSignature({...headers, "x-signature": "ts=" + ts + ",v1=" + "0".repeat(64)}, {"data.id": id}, secret, now), false);
  assert.equal(helpers.validateSignature(headers, {"data.id": id}, secret, now - 660000), false);
});

test("no acepta pagos de otra orden ni identificadores diferentes", () => {
  const order = {id: "orden-1234567890", preferenceId: "pref-1", amount: 800000, months: 12, liveMode: false};
  const payment = {id: 99, status: "approved", external_reference: order.id,
    preference_id: "pref-1", transaction_amount: 800000, currency_id: "CLP", live_mode: false};
  assert.equal(helpers.verifyPayment(payment, order, "99"), true);
  for (const changes of [{external_reference: "orden-ajena"}, {id: 100},
    {transaction_amount: 799999}, {status: "refunded"}, {status: "charged_back"}]) {
    assert.equal(helpers.verifyPayment({...payment, ...changes}, order, "99"), false);
  }
  assert.equal(helpers.verifyPayment(payment, {...order, months: 6}, "99"), false);
});

test("acepta espacios en encabezado x-signature de Mercado Pago", () => {
  const secret = "clave-de-prueba";
  const ts = "1792843200";
  const id = "123456";
  const requestId = "test-request";
  const manifest = "id:" + id + ";request-id:" + requestId + ";ts:" + ts + ";";
  const hash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const now = Number(ts) * 1000;
  for (const signature of [
    "ts=" + ts + ", v1=" + hash,
    "v1=" + hash + ", ts=" + ts,
    "ts=" + ts + " , v1=" + hash,
  ]) {
    assert.equal(helpers.validateSignature(
      {"x-signature": signature, "x-request-id": requestId},
      {"data.id": id}, secret, now), true);
  }
});


test("firma acepta segundos y milisegundos sin cambiar el manifest", () => {
  for (const ts of ["1792843200", "1792843200123"]) {
    const now = ts.length === 13 ? Number(ts) : Number(ts)*1000;
    const hash = crypto.createHmac("sha256", "secreto").update("id:99;request-id:r;ts:"+ts+";").digest("hex");
    const headers={"x-signature":"ts="+ts+",v1="+hash,"x-request-id":"r"};
    assert.equal(helpers.validateSignature(headers,{"data.id":"99"},"secreto",now),true);
    assert.equal(helpers.signatureFailure(headers,{"data.id":"99"},"secreto",now+660000),"timestamp_outside_window");
    assert.equal(helpers.signatureFailure(headers,{"data.id":"99"},"otra",now),"hmac_mismatch");
  }
});

test("live_mode de cuenta de prueba requiere vendedor configurado y coincidencia del cobro", () => {
  const expected={collectorId:"123",liveMode:true};
  assert.deepEqual(helpers.checkoutIdentity("test",{collector_id:123},expected),expected);
  assert.throws(()=>helpers.checkoutIdentity("test",{collector_id:456},expected));
  assert.throws(()=>helpers.checkoutIdentity("test",{collector_id:123},null));
  assert.deepEqual(helpers.checkoutIdentity("production",{collector_id:456},expected),{collectorId:"456",liveMode:true});
  const order={id:"order0000000001",preferenceId:"p",amount:1000,months:12,...expected};
  const payment={id:99,status:"approved",external_reference:order.id,preference_id:"p",transaction_amount:1000,currency_id:"CLP",live_mode:true,collector_id:123};
  assert.equal(helpers.verifyPayment(payment,order,"99"),true);
  assert.equal(helpers.verifyPayment({...payment,collector_id:456},order,"99"),false);
  assert.equal(helpers.verifyPayment({...payment,live_mode:false},order,"99"),false);
});

const {planRecovery}=require("../../scripts/recuperar-pago-prueba");
function recoveryFixture(){
  const order={id:"bMD6LqqClo6nUQ2VETv3",comunidadId:"nodar-pagos-prueba-20261025",adminUid:"nodar-mp-prueba-20261025",amount:1000,currency:"CLP",months:12,preferenceId:"p",liveMode:false,status:"checkout_ready"};
  const payment={id:186051318596,status:"approved",external_reference:order.id,preference_id:"p",transaction_amount:1000,currency_id:"CLP",live_mode:true,collector_id:3791682940};
  return {community:{mpTestFixture:true},order,license:{estado:"trial",paidUntil:null},payment};
}
test("recuperación verifica pago real de API y no duplica los 12 meses",()=>{
  const f=recoveryFixture();
  const plan=planRecovery(f.community,f.order,f.license,f.payment,helpers.verifyPayment);
  assert.equal(plan.license.estado,"active");
  assert.equal(plan.order.liveMode,true);
  assert.equal(plan.order.collectorId,"3791682940");
  assert.equal(planRecovery(f.community,{...f.order,...plan.order},{...f.license,...plan.license},f.payment,helpers.verifyPayment),null);
});
test("recuperación no activa órdenes, vendedores, montos o pagos ajenos",()=>{
  const f=recoveryFixture();
  for (const change of [{collector_id:123},{transaction_amount:1},{external_reference:"otra"},{status:"pending"},{preference_id:"otra"},{live_mode:false}]){
    assert.throws(()=>planRecovery(f.community,f.order,f.license,{...f.payment,...change},helpers.verifyPayment));
  }
  for (const change of [{comunidadId:"otra"},{amount:800000},{adminUid:"otro"},{months:24},{status:"checkout_error"}]){
    assert.throws(()=>planRecovery(f.community,{...f.order,...change},f.license,f.payment,helpers.verifyPayment));
  }
  assert.throws(()=>planRecovery({mpTestFixture:false},f.order,f.license,f.payment,helpers.verifyPayment));
  assert.throws(()=>planRecovery(f.community,f.order,{estado:"suspended"},f.payment,helpers.verifyPayment));
  assert.throws(()=>planRecovery(f.community,f.order,{...f.license,lastPaymentId:"otro"},f.payment,helpers.verifyPayment));
});
