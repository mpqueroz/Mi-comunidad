"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");
const {applyVerifiedRenewal} = require("../licencias");

function harness() {
  const orderId = "order000000000000001";
  const docs = new Map([
    ["mi_comunidad_comunidades/test-edificio", {estado: "Activa"}],
    ["mi_comunidad_licencias/test-edificio", {estado: "trial", paidUntil: null}],
  ]);
  const secrets = {MC_MP_ACCESS_TOKEN: "ficticio", MC_MP_WEBHOOK_SECRET: "firma-ficticia",
    MC_MP_ENVIRONMENT: "test", MC_MP_TEST_ACCOUNT: JSON.stringify({collectorId:"123",liveMode:false}), MC_PLAN_ANUAL_CLP: "1000",
    MC_MP_WEBHOOK_URL: "https://example.invalid/webhook"};
  const state = {
    calls: [],
    payment: {id: 99, status: "approved", external_reference: orderId,
      order: {id: 55, type: "mercadopago"}, transaction_amount: 1000,
      currency_id: "CLP", live_mode: false, collector_id:123},
    merchant: {id: 55, external_reference: orderId, preference_id: "pref-1", payments: [{id: 99}]},
  };
  function ref(path) {
    return {id: path.split("/").at(-1), path,
      get: async () => ({exists: docs.has(path), data: () => docs.get(path), get: k => docs.get(path)?.[k]}),
      create: async data => { assert.equal(docs.has(path), false); docs.set(path, {...data}); },
      update: async data => { assert.equal(docs.has(path), true); docs.set(path, {...docs.get(path), ...data}); }};
  }
  let lock = Promise.resolve();
  const db = {collection: name => ({doc: id => ref(name + "/" + (id || orderId))}),
    runTransaction: async fn => {
      const previous = lock;
      let release;
      lock = new Promise(resolve => { release = resolve; });
      await previous;
      try { return await fn({get: r => r.get(), update: (r, data) => r.update(data)}); }
      finally { release(); }
    }};
  const context = {Buffer, Date, AbortSignal,
    console: {info() {}, warn() {}, error() {}}, module: {exports: {}},
    require: name => {
      if (name === "crypto") return crypto;
      if (name === "./licencias") return {applyVerifiedRenewal};
      if (name === "firebase-admin/firestore") return {getFirestore: () => db,
        FieldValue: {serverTimestamp: () => new Date()}};
      if (name === "firebase-functions/v2/https") return {onCall: (_, fn) => fn,
        onRequest: (_, fn) => fn, HttpsError: class extends Error {}};
      if (name === "firebase-functions/v2/scheduler") return {onSchedule: (_, fn) => fn};
      if (name === "firebase-functions/params") return {defineSecret: name => ({value: () => secrets[name]})};
      throw new Error("Unexpected import " + name);
    },
    fetch: async (url, options) => {
      const path = url.replace("https://api.mercadopago.com", "");
      state.calls.push(path);
      let result;
      if (path === "/checkout/preferences") {
        state.preference = JSON.parse(options.body);
        result = {id: "pref-1", collector_id:123, init_point: "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=pref-1"};
      } else if (path === "/v1/payments/99") result = {...state.payment};
      else if (path === "/merchant_orders/55") result = {...state.merchant};
      else throw new Error("Unexpected API request " + path);
      return {ok: true, json: async () => result};
    },
  };
  vm.runInNewContext(fs.readFileSync(require.resolve("../mercadopago"), "utf8"), context);
  const helpers = context.module.exports;
  const functions = helpers.registerMercadoPago();
  const create = (documentoTributario = {tipo: "boleta", correo: "comprador@example.test"}) => functions.crearCheckoutMiComunidad({auth: {uid: "admin-test",
    token: {app: "mi_comunidad", role: "admin", comunidadId: "test-edificio"}},
    data: {amount: 1, months: 999, documentoTributario}});
  async function webhook(validSignature = true) {
    const ts = String(Math.floor(Date.now() / 1000)), requestId = "test-request";
    const hash = crypto.createHmac("sha256", secrets.MC_MP_WEBHOOK_SECRET)
      .update("id:99;request-id:" + requestId + ";ts:" + ts + ";").digest("hex");
    const response = {code: 200, status(code) {this.code = code; return this;},
      send(body) {this.body = body; return this;}};
    await functions.webhookMercadoPagoMiComunidad({method: "POST",
      headers: {"x-request-id": requestId,
        "x-signature": "ts=" + ts + ",v1=" + (validSignature ? hash : "0".repeat(64))},
      query: {"data.id": "99"}, body: {type: "payment", data: {id: "99"}}}, response);
    return response;
  }
  return {create, webhook, state, secrets, helpers, docs, db,
    order: () => docs.get("mi_comunidad_ordenes_pago/" + orderId),
    license: () => docs.get("mi_comunidad_licencias/test-edificio")};
}

test("Checkout fija el monto en servidor y activa con pago sin preference_id", async () => {
  const h = harness();
  await h.create();
  assert.equal(h.state.preference.items[0].unit_price, 1000);
  assert.equal(h.order().months, 12);
  assert.equal(h.state.payment.preference_id, undefined);
  assert.equal((await h.webhook()).code, 200);
  assert.equal(h.order().status, "paid");
  assert.equal(h.license().estado, "active");
  assert.ok(h.license().paidUntil > new Date());
  assert.ok(h.state.calls.includes("/merchant_orders/55"));
});

test("avisos duplicados concurrentes no duplican el año contratado", async () => {
  const h = harness(); await h.create();
  await Promise.all([h.webhook(), h.webhook()]);
  const until = h.license().paidUntil.getTime();
  await Promise.all([h.webhook(), h.webhook()]);
  assert.equal(h.license().paidUntil.getTime(), until);
});

test("monto, moneda, modo o preferencia ajenos no activan licencia", async () => {
  for (const change of [{transaction_amount: 1}, {currency_id: "USD"}, {live_mode: true}]) {
    const h = harness(); await h.create(); Object.assign(h.state.payment, change);
    await h.webhook(); assert.equal(h.order().status, "checkout_ready");
    assert.equal(h.license().estado, "trial");
  }
  const h = harness(); await h.create(); h.state.merchant.preference_id = "otra";
  await h.webhook(); assert.equal(h.license().estado, "trial");
});

test("orden comercial incoherente requiere reintento y no activa", async () => {
  for (const change of [{id: 56}, {external_reference: "ajena"}, {payments: []}, {preference_id: ""}]) {
    const h = harness(); await h.create(); Object.assign(h.state.merchant, change);
    assert.equal((await h.webhook()).code, 500);
    assert.equal(h.license().estado, "trial");
  }
});

test("pago pendiente o rechazado no consulta orden comercial ni activa", async () => {
  for (const status of ["pending", "rejected"]) {
    const h = harness(); await h.create(); h.state.payment.status = status;
    assert.equal((await h.webhook()).code, 200);
    assert.equal(h.license().estado, "trial");
    assert.equal(h.state.calls.includes("/merchant_orders/55"), false);
  }
});

test("firma inválida se rechaza antes de consultar el pago", async () => {
  const h = harness(); await h.create(); const calls = h.state.calls.length;
  assert.equal((await h.webhook(false)).code, 401);
  assert.equal(h.state.calls.length, calls);
  assert.equal(h.license().estado, "trial");
});

test("reembolso posterior verifica orden comercial y suspende último pago", async () => {
  const h = harness(); await h.create(); await h.webhook();
  h.state.payment.status = "refunded";
  assert.equal((await h.webhook()).code, 200);
  assert.equal(h.order().status, "payment_review");
  assert.equal(h.license().estado, "suspended");
});

test("pago sin orden comercial no se habilita aunque declare preference_id", async () => {
  const h = harness(); await h.create(); h.state.payment.order = undefined;
  h.state.payment.preference_id = "pref-1";
  assert.equal((await h.webhook()).code, 500);
  assert.equal(h.license().estado, "trial");
});

test("Checkout con cuenta de prueba API live conserva validación del vendedor", async()=>{
  const h=harness();
  h.secrets.MC_MP_TEST_ACCOUNT=JSON.stringify({collectorId:"123",liveMode:true});
  h.state.payment.live_mode=true;
  await h.create();
  assert.equal(h.order().liveMode,true);
  assert.equal(h.order().collectorId,"123");
  assert.equal((await h.webhook()).code,200);
  assert.equal(h.license().estado,"active");
  const end=h.license().paidUntil.getTime();
  await h.webhook();
  assert.equal(h.license().paidUntil.getTime(),end);
});

test("un vendedor ajeno no genera una orden habilitada", async()=>{
  const h=harness();
  h.secrets.MC_MP_TEST_ACCOUNT=JSON.stringify({collectorId:"999",liveMode:true});
  await assert.rejects(h.create());
  assert.equal(h.order().status,"checkout_error");
  assert.equal(h.license().estado,"trial");
});

test("producción cobra 800000 CLP y aplica exactamente 12 meses", async()=>{
  const h=harness();
  h.secrets.MC_MP_ENVIRONMENT="production";
  h.secrets.MC_PLAN_ANUAL_CLP="800000";
  h.state.payment.transaction_amount=800000;
  h.state.payment.live_mode=true;
  await h.create();
  assert.equal(h.state.preference.items[0].unit_price,800000);
  assert.equal(h.order().months,12);
  await h.webhook();
  assert.equal(h.order().status,"paid");
  const until=h.license().paidUntil.getTime();
  await h.webhook();
  assert.equal(h.license().paidUntil.getTime(),until);
});

test("producción bloquea fixture antes de crear orden o preferencia", async()=>{
  const h=harness();
  h.secrets.MC_MP_ENVIRONMENT="production";
  h.secrets.MC_PLAN_ANUAL_CLP="800000";
  h.docs.get("mi_comunidad_comunidades/test-edificio").mpTestFixture=true;
  await assert.rejects(h.create(), /failed-precondition/);
  assert.equal(h.order(),undefined);
  assert.equal(h.state.calls.length,0);
});



test("suspensión administrativa impide iniciar cobro", async () => {
  const h = harness(); h.docs.get("mi_comunidad_comunidades/test-edificio").estado = "Suspendida";
  await assert.rejects(h.create()); assert.equal(h.state.calls.length, 0);
});
test("pago iniciado antes de suspensión queda en revisión sin habilitar acceso", async () => {
  const h = harness(); await h.create();
  h.docs.get("mi_comunidad_comunidades/test-edificio").estado = "Suspendida";
  await h.webhook(); assert.equal(h.order().status, "payment_review");
  assert.equal(h.license().estado, "trial");
});
test("reembolso parcial aprobado suspende el último pago sin sumar vigencia", async () => {
  const h = harness(); await h.create(); await h.webhook();
  const until = h.license().paidUntil.getTime();
  h.state.payment.transaction_amount_refunded = 100;
  await h.webhook(); assert.equal(h.order().status, "payment_review");
  assert.equal(h.license().estado, "suspended");
  assert.equal(h.license().paidUntil.getTime(), until);
});
test("contracargo antiguo queda en revisión sin suspender una renovación posterior", async () => {
  const h = harness(); await h.create(); await h.webhook();
  h.license().lastPaymentId = "100"; h.state.payment.status = "charged_back";
  await h.webhook(); assert.equal(h.order().status, "payment_review");
  assert.equal(h.license().estado, "active");
});


test("conciliación detecta reembolso perdido de una orden pagada", async () => {
 const h=harness(); await h.create(); await h.webhook();
 h.state.payment.status="refunded";
 const cursor={exists:false};
 const db={...h.db,collection(name){
  if(name==="mi_comunidad_config_comercial")return {doc:()=>({get:async()=>cursor,set:async data=>Object.assign(cursor,{exists:true,get:k=>data[k]})})};
  const base=h.db.collection(name);
  if(name==="mi_comunidad_ordenes_pago")return {...base,where:()=>({orderBy:()=>({limit:()=>({get:async()=>({empty:false,docs:[{id:h.order().id,data:()=>h.order()}]})})})})};
  return base;
 }};
 await h.helpers.reconcilePayments(db,"ficticio",async path=>path.startsWith("/v1/payments/")?h.state.payment:h.state.merchant);
 assert.equal(h.order().status,"payment_review"); assert.equal(h.license().estado,"suspended");
});
test("cursor recorre 65 órdenes, tolera fallo intermedio y vuelve al inicio",async()=>{
 const h=harness(),seen=[],cursor={lastOrderId:""};
 const orders=Array.from({length:65},(_,i)=>({id:String(i).padStart(20,"0"),data:()=>({status:"checkout_ready"})}));
 const query=(after="",cap=30)=>({orderBy(){return this;},startAfter(id){return query(id,cap);},limit(n){return query(after,n);},async get(){const docs=orders.filter(d=>d.id>after).slice(0,cap);return {docs,empty:!docs.length};}});
 const db={collection(name){return name==="mi_comunidad_config_comercial"?{doc:()=>({get:async()=>({exists:true,get:k=>cursor[k]}),set:async data=>Object.assign(cursor,data)})}:{where:()=>query()};}};
 const request=async path=>{const id=new URL("https://example.invalid"+path).searchParams.get("external_reference");seen.push(id);if(id===orders[12].id)throw Error("fallo simulado");return {results:[]};};
 for(let i=0;i<3;i++)await h.helpers.reconcilePayments(db,"ficticio",request);
 assert.equal(new Set(seen).size,65);assert.equal(cursor.lastOrderId,orders[64].id);
 await h.helpers.reconcilePayments(db,"ficticio",request);
 assert.equal(seen.filter(id=>id===orders[12].id).length,2);
});

const factura = {tipo: "factura", correo: "contabilidad@example.test", rut: "76.123.456-0",
  razonSocial: "Comunidad de prueba", giro: "Administración", direccion: "Calle de prueba 123", comuna: "Peñalolén"};
test("datos tributarios inválidos no crean orden ni contactan Mercado Pago", async () => {
  for (const input of [null, {}, {tipo:"otro",correo:"a@b.cl"}, {tipo:"boleta",correo:"invalido"},
    {...factura,rut:"76.123.456-1"}, {...factura,giro:""}, {...factura,comuna:"x".repeat(101)},
    {...factura,razonSocial:"Nombre\nInyectado"}]) {
    const h = harness();
    await assert.rejects(h.create(input));
    assert.equal(h.order(), undefined);
    assert.equal(h.state.calls.length, 0);
  }
});
test("factura queda ligada a orden y conserva datos tras pago sin emitir un DTE", async () => {
  const h = harness(); await h.create({...factura, estado:"emitido", folio:"falso"});
  const d = h.order().documentoTributario;
  assert.equal(d.tipo,"factura"); assert.equal(d.rut,"76123456-0");
  assert.equal(d.estado,"no_emitido"); assert.equal(d.folio,undefined);
  assert.equal(d.modalidad,"manual_sii");
  assert.equal(h.state.preference.documentoTributario,undefined);
  await h.webhook();
  assert.equal(h.order().status,"paid");
  assert.equal(h.order().documentoTributario,d);
  assert.equal(d.estado,"no_emitido");
});
test("boleta guarda correo y descarta datos de factura y estados enviados por cliente", async () => {
  const h = harness(); await h.create({...factura,tipo:"boleta",correo:" comprador@example.test ",estado:"emitido"});
  assert.equal(h.order().documentoTributario.correo,"comprador@example.test");
  assert.equal(h.order().documentoTributario.rut,undefined);
  assert.equal(h.order().documentoTributario.estado,"no_emitido");
});
