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

