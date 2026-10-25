"use strict";
// Receptor aislado para verificar conectividad de Mercado Pago en TEST.
// No consulta pagos, no crea órdenes, no escribe Firestore ni activa licencias.
const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const {validateSignature} = require("./mercadopago");
const WEBHOOK_SECRET = defineSecret("MC_MP_WEBHOOK_SECRET");

exports.webhookMercadoPagoNodarTest = onRequest({
  secrets: [WEBHOOK_SECRET],
  invoker: "public",
  maxInstances: 1,
  concurrency: 1,
  timeoutSeconds: 15,
  memory: "256MiB",
}, (req, res) => {
  res.set("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).send("Método no permitido");
  if (!validateSignature(req.headers, req.query, WEBHOOK_SECRET.value())) {
    // Diagnóstico sin exponer encabezados, hashes, IDs ni secretos.
    const sig = String(req.headers["x-signature"] || "");
    const ts = /(?:^|,)\\s*ts=(\\d+)(?=\\s*(?:,|$))/.exec(sig)?.[1];
    const tsNum = Number(ts);
    const ageMinutes = ts && Number.isFinite(tsNum)
      ? Math.round(Math.abs(Date.now() - tsNum * 1000) / 60000) : null;
    const reason = !req.headers["x-signature"] ? "missing_signature"
      : !req.headers["x-request-id"] ? "missing_request_id"
      : !req.query["data.id"] ? "missing_query_payment_id"
      : !ts ? "missing_timestamp"
      : !/(?:^|,)\\s*v1=[a-f0-9]{64}(?=\\s*(?:,|$))/i.test(sig) ? "invalid_signature_format"
      : ageMinutes > 10 ? "timestamp_outside_window"
      : !WEBHOOK_SECRET.value() ? "missing_secret"
      : "hmac_mismatch";
    console.warn("MP test webhook rejected", {
      reason,
      ageMinutes: reason === "timestamp_outside_window" ? ageMinutes : undefined,
      // No registrar contenido de solicitudes ni firmas.
    });
    return res.status(401).send("Firma inválida");
  }
  if (req.body?.type !== "payment" ||
      String(req.body?.data?.id) !== String(req.query["data.id"])) {
    return res.status(200).send("Evento ignorado");
  }
  // No registrar payload, credenciales ni identificadores sensibles en logs.
  console.info("Notificación de prueba de Mercado Pago validada");
  return res.status(200).send("Notificación de prueba recibida");
});
