"use strict";
// Mercado Pago Checkout Pro. No desplegar sin configurar secretos y pruebas.
const crypto = require("crypto");
const {onCall, onRequest, HttpsError} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {defineSecret} = require("firebase-functions/params");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {applyVerifiedRenewal} = require("./licencias");

const ACCESS_TOKEN = defineSecret("MC_MP_ACCESS_TOKEN");
const WEBHOOK_SECRET = defineSecret("MC_MP_WEBHOOK_SECRET");
const PLAN_PRICE = defineSecret("MC_PLAN_ANUAL_CLP");
const WEBHOOK_URL = defineSecret("MC_MP_WEBHOOK_URL");
const ORDERS = "mi_comunidad_ordenes_pago";
const LICENSES = "mi_comunidad_licencias";
const API = "https://api.mercadopago.com";
const MONTHS = 12;

async function mpRequest(path, token, options = {}) {
  const response = await fetch(API + path, {
    ...options,
    headers: {"Authorization": "Bearer " + token, "Content-Type": "application/json", ...(options.headers || {})},
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Mercado Pago respondió " + response.status);
  return response.json();
}

function validateSignature(headers, query, secret, now = Date.now()) {
  const signature = String(headers["x-signature"] || "");
  const requestId = String(headers["x-request-id"] || "");
  const id = String(query["data.id"] || "");
  const ts = /^ts=(\d+)(?:,|$)/.exec(signature)?.[1] ||
    /(?:^|,)ts=(\d+)(?:,|$)/.exec(signature)?.[1];
  const hash = /(?:^|,)v1=([a-f0-9]{64})(?:,|$)/i.exec(signature)?.[1];
  if (!id || !/^\d{1,20}$/.test(id) || !requestId || !ts || !hash || !secret) return false;
  const milliseconds = Number(ts) * 1000;
  if (!Number.isFinite(milliseconds) || Math.abs(now - milliseconds) > 10 * 60 * 1000) return false;
  const manifest = "id:" + id.toLowerCase() + ";request-id:" + requestId + ";ts:" + ts + ";";
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(hash, "hex"));
}

function verifyPayment(payment, order, paymentId) {
  return String(payment.id) === String(paymentId) &&
    payment.status === "approved" &&
    payment.external_reference === order.id &&
    String(payment.preference_id) === String(order.preferenceId) &&
    payment.currency_id === "CLP" &&
    Number(payment.transaction_amount) === order.amount &&
    order.months === MONTHS &&
    payment.live_mode === order.liveMode;
}

// La misma transacción sirve para webhook y conciliación programada.
async function settleVerifiedPayment(db, orderId, payment, paymentId) {
  const orderRef = db.collection(ORDERS).doc(orderId);
      return db.runTransaction(async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists) throw new Error("Orden no encontrada: reintentar notificación");
        const order = orderSnap.data();
        if (order.status === "paid") return;
        if (order.status !== "checkout_ready") throw new Error("Orden todavía no lista para confirmación");
        if (!verifyPayment(payment, order, paymentId)) {
          console.warn("Pago no coincide con orden", orderId);
          return;
        }
        const licenseRef = db.collection(LICENSES).doc(order.comunidadId);
        const licenseSnap = await tx.get(licenseRef);
        if (!licenseSnap.exists) throw new Error("Licencia no encontrada: requiere conciliación");
        if (licenseSnap.get("estado") === "suspended") return;
        const updated = applyVerifiedRenewal(licenseSnap.data(), {months: MONTHS});
        tx.update(licenseRef, {...updated, lastPaymentId: paymentId,
          updatedAt: FieldValue.serverTimestamp()});
        tx.update(orderRef, {status: "paid", paymentId,
          paidAt: FieldValue.serverTimestamp()});
      });
}

function registerMercadoPago() {
  const createCheckout = onCall({secrets: [ACCESS_TOKEN, PLAN_PRICE, WEBHOOK_URL]}, async (request) => {
    const token = request.auth?.token;
    if (!token || token.app !== "mi_comunidad" || token.role !== "admin" ||
        !/^[a-z0-9-]+$/.test(String(token.comunidadId || ""))) {
      throw new HttpsError("permission-denied", "Solo el administrador de la comunidad puede pagar.");
    }
    const amount = Number(PLAN_PRICE.value());
    const url = WEBHOOK_URL.value();
    if (!Number.isSafeInteger(amount) || amount <= 0 || !/^https:\/\//.test(url)) {
      throw new HttpsError("failed-precondition", "Configuración comercial incompleta.");
    }
    const db = getFirestore();
    const comunidadId = token.comunidadId;
    const comunidad = await db.collection("mi_comunidad_comunidades").doc(comunidadId).get();
    const licencia = await db.collection(LICENSES).doc(comunidadId).get();
    if (!comunidad.exists || !licencia.exists || licencia.get("estado") === "suspended") {
      throw new HttpsError("failed-precondition", "Comunidad no habilitada para compra.");
    }
    const orderRef = db.collection(ORDERS).doc();
    const order = {id: orderRef.id, comunidadId, adminUid: request.auth.uid,
      amount, currency: "CLP", months: MONTHS, status: "pending",
      createdAt: FieldValue.serverTimestamp()};
    await orderRef.create(order);
    try {
      const pref = await mpRequest("/checkout/preferences", ACCESS_TOKEN.value(), {
        method: "POST",
        headers: {"X-Idempotency-Key": orderRef.id},
        body: JSON.stringify({
          items: [{id: "mc-anual", title: "Mi Comunidad Digital - 12 meses", quantity: 1,
            currency_id: "CLP", unit_price: amount}],
          external_reference: orderRef.id,
          notification_url: url,
        }),
      });
      if (!pref.id || !/^https:\/\/[^\s]+$/.test(pref.init_point || "")) throw new Error("Preferencia incompleta");
      const liveMode = !ACCESS_TOKEN.value().startsWith("TEST-");
      await orderRef.update({preferenceId: String(pref.id), liveMode, status: "checkout_ready"});
      return {checkoutUrl: pref.init_point, orderId: orderRef.id};
    } catch (err) {
      await orderRef.update({status: "checkout_error"});
      throw new HttpsError("unavailable", "No fue posible iniciar el pago.");
    }
  });

  const webhook = onRequest({secrets: [ACCESS_TOKEN, WEBHOOK_SECRET]}, async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Método no permitido");
    if (!validateSignature(req.headers, req.query, WEBHOOK_SECRET.value())) {
      return res.status(401).send("Firma inválida");
    }
    if (req.body?.type !== "payment" || String(req.body?.data?.id) !== String(req.query["data.id"])) {
      return res.status(200).send("Evento ignorado");
    }
    try {
      const paymentId = String(req.query["data.id"]);
      const payment = await mpRequest("/v1/payments/" + paymentId, ACCESS_TOKEN.value());
      if (payment.status !== "approved") return res.status(200).send("Pago aún no aprobado");
      const orderId = String(payment.external_reference || "");
      if (!/^[a-zA-Z0-9]{10,80}$/.test(orderId)) return res.status(200).send("Referencia inválida");
      await settleVerifiedPayment(getFirestore(), orderId, payment, paymentId);
      return res.status(200).send("Recibido");
    } catch (err) {
      console.error("Error verificando pago", err);
      return res.status(500).send("Reintentar");
    }
  });
  // Rescate de pagos aprobados cuando la notificación no llegó.
  // Límite por ejecución para controlar costos y cuota de API.
  const reconcile = onSchedule({
    schedule: "every 60 minutes",
    secrets: [ACCESS_TOKEN],
    timeZone: "America/Santiago",
  }, async () => {
    const db = getFirestore();
    const pending = await db.collection(ORDERS)
      .where("status", "==", "checkout_ready").limit(30).get();
    for (const doc of pending.docs) {
      const order = doc.data();
      try {
        const search = await mpRequest("/v1/payments/search?external_reference=" +
          encodeURIComponent(doc.id) + "&limit=20", ACCESS_TOKEN.value());
        const results = Array.isArray(search.results) ? search.results : [];
        for (const candidate of results) {
          if (candidate.status !== "approved") continue;
          const paymentId = String(candidate.id);
          if (!/^\\d{1,20}$/.test(paymentId)) continue;
          // Siempre consultar el recurso individual, no confiar solo en la búsqueda.
          const payment = await mpRequest("/v1/payments/" + paymentId, ACCESS_TOKEN.value());
          if (!verifyPayment(payment, order, paymentId)) continue;
          await settleVerifiedPayment(db, doc.id, payment, paymentId);
          break;
        }
      } catch (err) {
        console.error("Conciliación pendiente", doc.id, err);
      }
    }
  });
  return {crearCheckoutMiComunidad: createCheckout,
    webhookMercadoPagoMiComunidad: webhook,
    conciliarPagosMiComunidad: reconcile};
}
module.exports = {registerMercadoPago, validateSignature, verifyPayment};
