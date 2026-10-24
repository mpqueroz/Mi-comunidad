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
