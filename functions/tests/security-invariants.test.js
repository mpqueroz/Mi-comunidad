"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const rules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
const functions = fs.readFileSync(path.join(root, "functions", "mercadopago.js"), "utf8");
const hosting = JSON.parse(fs.readFileSync(path.join(root, "firebase.json"), "utf8"));

test("las licencias no admiten escrituras directas del cliente", () => {
  const block = rules.match(/match \/mi_comunidad_licencias\/\{comunidadId\} \{([\s\S]*?)\n    \}/);
  assert.ok(block, "No se encontró el bloque de licencias");
  assert.match(block[1], /allow create, update, delete: if false;/);
});

test("los pagos dependen de secretos del servidor y de la verificación de firma", () => {
  assert.match(functions, /defineSecret\("MC_MP_ACCESS_TOKEN"\)/);
  assert.match(functions, /defineSecret\("MC_MP_WEBHOOK_SECRET"\)/);
  assert.match(functions, /signatureFailure\(req\.headers, req\.query, WEBHOOK_SECRET\.value\(\)\)/);
  assert.match(functions, /fetchCheckoutPayment\(paymentId,ACCESS_TOKEN\.value\(\)\)/);
});

test("el hosting aplica cabeceras de seguridad", () => {
  const headers = hosting.hosting.headers.find(item => item.source === "**").headers;
  const map = Object.fromEntries(headers.map(({key,value}) => [key.toLowerCase(), value]));
  assert.match(map["content-security-policy"], /object-src 'none'/);
  assert.match(map["content-security-policy"], /frame-ancestors 'none'/);
  assert.equal(map["x-content-type-options"], "nosniff");
});

test("el despliegue apunta al hosting de Mi Comunidad, no a otras apps", () => {
  assert.equal(hosting.hosting.site, "mi-comunidad-md");
  assert.equal(hosting.firestore.rules, "firestore.rules");
});
