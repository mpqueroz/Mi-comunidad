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
  const create = () => functions.crearCheckoutMiComunidad({auth: {uid: "admin-test",
    token: {app: "mi_comunidad", role: "admin", comunidadId: "test-edificio"}},
    data: {amount: 1, months: 999}});
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
  return {create, webhook, state, secrets, helpers, docs,
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
  const h = harness(); await h.create(); await h.webhook();
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
