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
const MP_ENVIRONMENT = defineSecret("MC_MP_ENVIRONMENT");
const TEST_ACCOUNT = defineSecret("MC_MP_TEST_ACCOUNT");
const ORDERS = "mi_comunidad_ordenes_pago";
const LICENSES = "mi_comunidad_licencias";
const API = "https://api.mercadopago.com";
const MONTHS = 12;

// Solo recoge la solicitud: no emite DTE ni considera el recibo de pago una boleta.
function validarDocumentoTributario(input) {
  const fail = () => { throw new HttpsError("invalid-argument", "Revisa el tipo de documento y los datos tributarios."); };
  if (!input || typeof input !== "object" || !["boleta", "factura"].includes(input.tipo)) return fail();
  const texto = (value, max) => {
    if (typeof value !== "string" || !value.trim() || value.length > max || /[\x00-\x1f\x7f]/.test(value)) return fail();
    return value.trim();
  };
  const correo = texto(input.correo, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return fail();
  const documento = {tipo: input.tipo, correo, estado: "no_emitido", modalidad: "manual_sii"};
  if (input.tipo === "factura") {
    const rut = texto(input.rut, 16).replace(/\./g, "").toUpperCase();
    if (!/^[1-9]\d{6,7}-[0-9K]$/.test(rut)) return fail();
    const [numero, dv] = rut.split("-");
    let suma = 0, factor = 2;
    for (const digit of numero.split("").reverse()) {
      suma += Number(digit) * factor;
      factor = factor === 7 ? 2 : factor + 1;
    }
    const resto = 11 - suma % 11;
    if (dv !== (resto === 11 ? "0" : resto === 10 ? "K" : String(resto))) return fail();
    Object.assign(documento, {rut, razonSocial: texto(input.razonSocial, 150),
      giro: texto(input.giro, 150), direccion: texto(input.direccion, 200), comuna: texto(input.comuna, 100)});
  }
  return documento;
}

async function mpRequest(path, token, options = {}) {
  const response = await fetch(API + path, {
    ...options,
    headers: {"Authorization": "Bearer " + token, "Content-Type": "application/json", ...(options.headers || {})},
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Mercado Pago respondió " + response.status);
  return response.json();
}

function signatureFailure(headers, query, secret, now = Date.now()) {
  const signature = String(headers["x-signature"] || "");
  const requestId = String(headers["x-request-id"] || "");
  const id = String(query["data.id"] || "");
  // Mercado Pago may include spaces after commas in x-signature.
  const ts = /(?:^|,)\s*ts=(\d+)\s*(?=,|$)/.exec(signature)?.[1];
  const hash = /(?:^|,)\s*v1=([a-f0-9]{64})\s*(?=,|$)/i.exec(signature)?.[1];
  if (!id || !/^\d{1,20}$/.test(id) || !requestId || !ts || !hash || !secret) return "missing_or_invalid_fields";
  // Preserve the original ts in the HMAC; normalize only for the age check.
  const milliseconds = /^\d{13}$/.test(ts) ? Number(ts) : /^\d{10}$/.test(ts) ? Number(ts) * 1000 : NaN;
  if (!Number.isSafeInteger(milliseconds) || Math.abs(now - milliseconds) > 10 * 60 * 1000) return "timestamp_outside_window";
  const manifest = "id:" + id.toLowerCase() + ";request-id:" + requestId + ";ts:" + ts + ";";
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(hash, "hex")) ? null : "hmac_mismatch";
}

function validateSignature(headers, query, secret, now = Date.now()) {
  return signatureFailure(headers, query, secret, now) === null;
}

function checkoutIdentity(environment, pref, testAccount) {
  const collectorId = String(pref.collector_id || "");
  if (!/^\d{1,20}$/.test(collectorId)) throw new Error("Preferencia sin vendedor verificable");
  if (environment === "production") return {collectorId, liveMode: true};
  if (environment !== "test" || !testAccount ||
      String(testAccount.collectorId) !== collectorId || typeof testAccount.liveMode !== "boolean") {
    throw new Error("La preferencia no pertenece al vendedor de prueba configurado");
  }
  return {collectorId, liveMode: testAccount.liveMode};
}

function verifyPayment(payment, order, paymentId) {
  return typeof order.preferenceId === "string" && order.preferenceId.length > 0 &&
    String(payment.id) === String(paymentId) &&
    payment.status === "approved" &&
    !(Number(payment.transaction_amount_refunded) > 0) &&
    payment.external_reference === order.id &&
    String(payment.preference_id) === String(order.preferenceId) &&
    payment.currency_id === "CLP" &&
    Number(payment.transaction_amount) === order.amount &&
    order.months === MONTHS &&
    payment.live_mode === order.liveMode &&
    (!order.collectorId || String(payment.collector_id) === order.collectorId);
}

// Payments no garantiza preference_id: Checkout Pro la publica en merchant_orders.
// Consultar ambos recursos con el mismo token y verificar su relación antes de usarla.
async function fetchCheckoutPayment(paymentId, token, request = mpRequest) {
  if (!/^\d{1,20}$/.test(String(paymentId))) throw new Error("Identificador de pago inválido");
  const payment = await request("/v1/payments/" + paymentId, token);
  if (String(payment.id) !== String(paymentId)) throw new Error("Pago distinto al solicitado");
  if (!["approved", "refunded", "charged_back"].includes(payment.status)) return payment;
  const merchantId = String(payment.order?.id || "");
  if (!/^\d{1,20}$/.test(merchantId)) throw new Error("Pago sin orden comercial verificable");
  const merchant = await request("/merchant_orders/" + merchantId, token);
  if (String(merchant.id) !== merchantId ||
      merchant.external_reference !== payment.external_reference ||
      typeof merchant.preference_id !== "string" || !merchant.preference_id ||
      !Array.isArray(merchant.payments) ||
      !merchant.payments.some(p => String(p.id) === String(paymentId))) {
    throw new Error("El pago no corresponde a la orden comercial");
  }
  return {...payment, preference_id: merchant.preference_id};
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
        const community = await tx.get(db.collection("mi_comunidad_comunidades").doc(order.comunidadId));
        if (!community.exists || community.get("estado") === "Suspendida") {
          tx.update(orderRef, {status: "payment_review", paymentId, paymentStatus: "approved_while_suspended", reviewedAt: FieldValue.serverTimestamp()});
          return;
        }
        const licenseRef = db.collection(LICENSES).doc(order.comunidadId);
        const licenseSnap = await tx.get(licenseRef);
        if (!licenseSnap.exists) throw new Error("Licencia no encontrada: requiere conciliación");
        if (licenseSnap.get("estado") === "suspended") {
          tx.update(orderRef, {status: "payment_review", paymentId, paymentStatus: "approved_while_suspended", reviewedAt: FieldValue.serverTimestamp()});
          return;
        }
        const updated = applyVerifiedRenewal(licenseSnap.data(), {months: MONTHS});
        tx.update(licenseRef, {...updated, lastPaymentId: paymentId,
          updatedAt: FieldValue.serverTimestamp()});
        tx.update(orderRef, {status: "paid", paymentId,
          paidAt: FieldValue.serverTimestamp()});
      });
}

// Reversos: bloquear solo si esta compra es la última aplicada.
// No recalcular ni quitar períodos históricos sin una revisión contable.
async function flagReversedPayment(db, orderId, payment, paymentId) {
  const orderRef = db.collection(ORDERS).doc(orderId);
  return db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) return;
    const order = orderSnap.data();
    if (order.status !== "paid" || String(order.paymentId) !== paymentId) return;
    if (payment.external_reference !== orderId ||
        String(payment.preference_id) !== String(order.preferenceId) ||
        Number(payment.transaction_amount) !== order.amount ||
        payment.currency_id !== "CLP" ||
        payment.live_mode !== order.liveMode ||
        (order.collectorId && String(payment.collector_id) !== order.collectorId)) return;
    const licenseRef = db.collection(LICENSES).doc(order.comunidadId);
    const licenseSnap = await tx.get(licenseRef);
    tx.update(orderRef, {status: "payment_review", paymentStatus: payment.status,
      reviewedAt: FieldValue.serverTimestamp()});
    if (licenseSnap.exists && String(licenseSnap.get("lastPaymentId")) === paymentId) {
      tx.update(licenseRef, {estado: "suspended", suspensionReason: "payment_reversed",
        updatedAt: FieldValue.serverTimestamp()});
    }
  });
}

async function reconcilePayments(db, token, request = mpRequest) {
    // Cursor persistente: evita revisar siempre las primeras 30 órdenes.
    const cursorRef = db.collection("mi_comunidad_config_comercial").doc("conciliacion");
    const cursorSnap = await cursorRef.get();
    const lastId = cursorSnap.exists ? String(cursorSnap.get("lastOrderId") || "") : "";
    // Ordenación por ID de documento para que el cursor recorra todas las órdenes.
    // Si llega al final, vuelve al comienzo en la próxima ejecución.
    const base = db.collection(ORDERS).where("status", "in", ["checkout_ready", "paid"])
      .orderBy("__name__");
    let pending = await (lastId ? base.startAfter(lastId) : base).limit(30).get();
    if (pending.empty && lastId) pending = await base.limit(30).get();
    for (const doc of pending.docs) {
      const order = doc.data();
      try {
        if (order.status === "paid") {
          const paymentId = String(order.paymentId || "");
          const payment = await fetchCheckoutPayment(paymentId, token, request);
          if (["refunded", "charged_back"].includes(payment.status) || Number(payment.transaction_amount_refunded) > 0) {
            await flagReversedPayment(db, doc.id, payment, paymentId);
          }
          continue;
        }
        const search = await request("/v1/payments/search?external_reference=" +
          encodeURIComponent(doc.id) + "&limit=20", token);
        const results = Array.isArray(search.results) ? search.results : [];
        for (const candidate of results) {
          if (candidate.status !== "approved") continue;
          const paymentId = String(candidate.id);
          if (!/^[0-9]{1,20}$/.test(paymentId)) continue;
          // Siempre consultar el recurso individual, no confiar solo en la búsqueda.
          const payment = await fetchCheckoutPayment(paymentId, token, request);
          if (!verifyPayment(payment, order, paymentId)) continue;
          await settleVerifiedPayment(db, doc.id, payment, paymentId);
          break;
        }
      } catch (err) {
        console.error("Conciliación pendiente", doc.id, err);
      }
    }
    if (!pending.empty) {
      await cursorRef.set({lastOrderId: pending.docs[pending.docs.length - 1].id,
        updatedAt: FieldValue.serverTimestamp()}, {merge: true});
    }
}

function registerMercadoPago() {
  const createCheckout = onCall({secrets: [ACCESS_TOKEN, PLAN_PRICE, WEBHOOK_URL, MP_ENVIRONMENT, TEST_ACCOUNT]}, async (request) => {
    const token = request.auth?.token;
    if (!token || token.app !== "mi_comunidad" || token.role !== "admin" ||
        !/^[a-z0-9-]+$/.test(String(token.comunidadId || ""))) {
      throw new HttpsError("permission-denied", "Solo el administrador de la comunidad puede pagar.");
    }
    const documentoTributario = validarDocumentoTributario(request.data?.documentoTributario);
    const environment = String(MP_ENVIRONMENT.value() || "");
    if (!["test", "production"].includes(environment)) {
      throw new HttpsError("failed-precondition", "Entorno de Mercado Pago no configurado.");
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
    if (!comunidad.exists || comunidad.get("estado") === "Suspendida" || !licencia.exists || licencia.get("estado") === "suspended") {
      throw new HttpsError("failed-precondition", "Comunidad no habilitada para compra.");
    }
    if (environment === "production" && (comunidad.get("mpTestFixture") === true ||
        comunidadId === "nodar-pagos-prueba-20261025" || request.auth.uid === "nodar-mp-prueba-20261025")) {
      throw new HttpsError("failed-precondition", "La comunidad de prueba no admite cobros reales.");
    }
    const orderRef = db.collection(ORDERS).doc();
    const order = {id: orderRef.id, comunidadId, adminUid: request.auth.uid,
      amount, currency: "CLP", months: MONTHS, status: "pending",
      documentoTributario, createdAt: FieldValue.serverTimestamp()};
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
      // El entorno comercial y live_mode de la API son conceptos distintos.
      // La cuenta de prueba se configura desde Cloud Shell, nunca desde el cliente.
      const identity = checkoutIdentity(environment, pref, environment === "test" ? JSON.parse(TEST_ACCOUNT.value()) : null);
      await orderRef.update({preferenceId: String(pref.id), ...identity, environment, status: "checkout_ready"});
      return {checkoutUrl: pref.init_point, orderId: orderRef.id};
    } catch (err) {
      await orderRef.update({status: "checkout_error"});
      throw new HttpsError("unavailable", "No fue posible iniciar el pago.");
    }
  });

  const webhook = onRequest({secrets: [ACCESS_TOKEN, WEBHOOK_SECRET], invoker: "public"}, async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Método no permitido");
    const failure = signatureFailure(req.headers, req.query, WEBHOOK_SECRET.value());
    if (failure) {
      console.warn("Webhook rechazado", {reason: failure});
      return res.status(401).send("Firma inválida");
    }
    if (req.body?.type !== "payment" || String(req.body?.data?.id) !== String(req.query["data.id"])) {
      return res.status(200).send("Evento ignorado");
    }
    try {
      const paymentId = String(req.query["data.id"]);
      const payment = await fetchCheckoutPayment(paymentId, ACCESS_TOKEN.value());
      if (["refunded", "charged_back"].includes(payment.status) || Number(payment.transaction_amount_refunded) > 0) {
        const orderId = String(payment.external_reference || "");
        if (/^[a-zA-Z0-9]{10,80}$/.test(orderId)) {
          await flagReversedPayment(getFirestore(), orderId, payment, paymentId);
        }
        return res.status(200).send("Reverso registrado para revisión");
      }
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
    await reconcilePayments(getFirestore(), ACCESS_TOKEN.value());
  });
  return {crearCheckoutMiComunidad: createCheckout,
    webhookMercadoPagoMiComunidad: webhook,
    conciliarPagosMiComunidad: reconcile};
}
module.exports = {reconcilePayments, settleVerifiedPayment, flagReversedPayment, registerMercadoPago, validateSignature, signatureFailure, checkoutIdentity, verifyPayment, fetchCheckoutPayment};
