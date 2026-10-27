"use strict";
const crypto = require("node:crypto");
const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const secret = defineSecret("MC_MP_WEBHOOK_SECRET");
function valid(headers, query, value) {
  const signature = String(headers["x-signature"] || "");
  const requestId = String(headers["x-request-id"] || "");
  const id = String(query["data.id"] || "");
  const ts = /(?:^|,)\s*ts=(\d+)(?:,|$)/.exec(signature)?.[1];
  const hash = /(?:^|,)\s*v1=([a-f0-9]{64})(?:,|$)/i.exec(signature)?.[1];
  if (!/^\d{1,20}$/.test(id) || !requestId || !ts || !hash || !value) return false;
  if (Math.abs(Date.now() - Number(ts) * 1000) > 600000) return false;
  const manifest = "id:" + id.toLowerCase() + ";request-id:" + requestId + ";ts:" + ts + ";";
  const expected = crypto.createHmac("sha256", value).update(manifest).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(hash, "hex"));
}
exports.webhookMercadoPagoNodarTest = onRequest({
  secrets: [secret],
  invoker: "public",
  maxInstances: 1,
  concurrency: 1,
  timeoutSeconds: 15,
  memory: "256MiB",
}, (req, res) => {
  res.set("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).send("Método no permitido");
  if (!valid(req.headers, req.query, secret.value())) return res.status(401).send("Firma inválida");
  if (req.body?.type !== "payment" || String(req.body?.data?.id) !== String(req.query["data.id"])) {
    return res.status(200).send("Evento ignorado");
  }
  console.info("Notificación de prueba validada");
  return res.status(200).send("Notificación de prueba recibida");
});
