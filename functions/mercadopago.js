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
  if (!response.ok) {
    const error = new Error("Mercado Pago respondió " + response.status);
    error.mpStatus = response.status;
    throw error;
  }
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
        if (order.status === "paid") {
          if (String(order.paymentId) !== String(paymentId) && verifyPayment(payment, order, paymentId)) {
            const incident = orderRef.collection("incidencias").doc(String(paymentId));
            const existing = await tx.get(incident);
            // Retries must not reopen an incident already reviewed by superadmin.
            if (!existing.exists) tx.set(incident, {tipo:"additional_approved_payment", paymentId:String(paymentId),
              amount:Number(payment.transaction_amount), estado:"pendiente", createdAt:FieldValue.serverTimestamp()});
            if (!existing.exists || existing.get("estado") === "pendiente") tx.update(orderRef, {additionalPaymentReview:true});
          }
          return;
        }
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
        const licenseBeforeRenewal = {estado:licenseSnap.get("estado") || "expired",
          lastPaymentId:licenseSnap.get("lastPaymentId") || null, paidUntil:licenseSnap.get("paidUntil") || null,
          trialEndsAt:licenseSnap.get("trialEndsAt") || null};
        const updated = applyVerifiedRenewal(licenseSnap.data(), {months: MONTHS});
        tx.update(licenseRef, {...updated, lastPaymentId: paymentId,
          updatedAt: FieldValue.serverTimestamp()});
        tx.update(orderRef, {status: "paid", paymentId, licenseBeforeRenewal, paidUntilApplied:updated.paidUntil,
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

// Never repeat a POST whose outcome is uncertain. Recover its preference using
// the external reference, then verify the complete resource before accepting it.
async function searchPreferences(orderId, token, request = mpRequest) {
  const matches = [];
  let offset = 0;
  for (let page = 0; page < 5; page++) {
    const found = await request("/checkout/preferences/search?external_reference=" + encodeURIComponent(orderId) + "&limit=20&offset=" + offset, token);
    const elements = found.elements || found.results;
    if (!Array.isArray(elements)) throw new Error("Respuesta de preferencias inválida");
    matches.push(...elements.filter(p => p.external_reference === orderId));
    offset += elements.length;
    const total = Number(found.total ?? found.paging?.total);
    if (elements.length < 20 || (Number.isFinite(total) && offset >= total)) return matches;
  }
  throw new Error("La búsqueda de preferencias excede el volumen permitido; revisar manualmente");
}
function validCheckoutUrl(value) {
  try { const url = new URL(value); return url.protocol === "https:" &&
    ["www.mercadopago.cl", "www.mercadopago.com", "www.mercadopago.com.ar"].includes(url.hostname) &&
    !url.username && !url.password && !url.port; } catch { return false; }
}
async function recoverCheckout(db, orderId, token, request = mpRequest) {
  const ref = db.collection(ORDERS).doc(orderId), snap = await ref.get();
  if (!snap.exists) throw new Error("Orden inexistente");
  const order = snap.data();
  if (!["pending", "checkout_error"].includes(order.status)) return order;
  if (!["test", "production"].includes(order.environment)) throw new Error("Orden histórica sin entorno verificable");
  const created = order.createdAt?.toMillis?.() ?? order.createdAt?.getTime?.();
  if (created && Date.now() - created > 90 * 86400000) throw new Error("Orden fuera de ventana de recuperación; revisar manualmente");
  const matches = await searchPreferences(orderId, token, request);
  if (!matches.length) return order;
  if (matches.length !== 1) throw new Error("Múltiples preferencias requieren revisión");
  const pref = await request("/checkout/preferences/" + encodeURIComponent(matches[0].id), token);
  const identity = checkoutIdentity(order.environment, pref, order.testAccount || null);
  if (String(pref.id) !== String(matches[0].id) || pref.external_reference !== orderId ||
      !Array.isArray(pref.items) || pref.items.length !== 1 || pref.items[0].currency_id !== "CLP" ||
      Number(pref.items[0].unit_price) !== order.amount || Number(pref.items[0].quantity) !== 1 || !validCheckoutUrl(pref.init_point)) {
    throw new Error("La preferencia recuperada no coincide con la orden");
  }
  await db.runTransaction(async tx => {
    const current = await tx.get(ref);
    if (current.exists && ["pending", "checkout_error"].includes(current.get("status"))) {
      tx.update(ref, {...identity, preferenceId:String(pref.id), checkoutUrl:pref.init_point,
        status:"checkout_ready", creationOutcome:"recovered", recoveredAt:FieldValue.serverTimestamp()});
    }
  });
  return (await ref.get()).data();
}
// Restart is limited to attempts provably not sent or definitively rejected.
// Empty search alone never proves that an uncertain POST did not create a preference.
async function assertCheckoutCanRestart(db, orderId, token = ACCESS_TOKEN.value(), request = mpRequest) {
  const snap = await db.collection(ORDERS).doc(orderId).get();
  const order = snap.data();
  const created = order?.createdAt?.toMillis?.() ?? order?.createdAt?.getTime?.();
  if (!snap.exists || !["pending", "checkout_error"].includes(order.status) ||
      !["not_started", "rejected"].includes(order.creationOutcome) ||
      !created || Date.now() - created < 15 * 60000 || Date.now() - created > 90 * 86400000) {
    throw new Error("La compra no admite reinicio seguro; revisar manualmente");
  }
  if ((await searchPreferences(orderId, token, request)).length) throw new Error("Existe una preferencia; recuperar antes de reiniciar");
  const payments = await request("/v1/payments/search?external_reference=" + encodeURIComponent(orderId) + "&limit=1", token);
  if (!Array.isArray(payments.results) || payments.results.length || Number(payments.paging?.total || 0) > 0) throw new Error("La compra tiene pagos o búsqueda no verificable");
  return order;
}
async function reconcilePayments(db, token, request = mpRequest) {
  const cursorRef = db.collection("mi_comunidad_config_comercial").doc("conciliacion");
  const owner = crypto.randomUUID();
  const acquired = await db.runTransaction(async tx => {
    const snap = await tx.get(cursorRef);
    if (snap.exists && Number(snap.get("leaseUntil")) > Date.now()) return null;
    tx.set(cursorRef, {leaseOwner:owner, leaseUntil:Date.now()+15*60000}, {merge:true});
    return snap.exists ? String(snap.get("lastOrderId") || "") : "";
  });
  if (acquired === null) return {skipped:"lease_busy"};
  let lastId = acquired;
  const deadline = Date.now()+7*60000;
  try {
    const query = db.collection(ORDERS).where("status", "in", ["pending","checkout_error","checkout_ready","paid"]).orderBy("__name__");
    let batch = await (lastId ? query.startAfter(lastId) : query).limit(30).get();
    if (batch.empty && lastId) batch = await query.limit(30).get();
    for (const doc of batch.docs) {
      if (Date.now() >= deadline) break;
      let order = doc.data();
      try {
        if (["pending","checkout_error"].includes(order.status)) order = await recoverCheckout(db, doc.id, token, request);
        if (!["checkout_ready","paid"].includes(order.status)) {lastId=doc.id;continue;}
        if (order.status === "paid") {
          const paymentId = String(order.paymentId || "");
          const payment = await fetchCheckoutPayment(paymentId, token, request);
          if (["refunded","charged_back"].includes(payment.status) || Number(payment.transaction_amount_refunded)>0) {
            await flagReversedPayment(db, doc.id, payment, paymentId);
          }
        }
        let offset = Number.isSafeInteger(order.searchOffset) ? order.searchOffset : 0;
        for (let page=0;page<5;page++) {
          if (Date.now() >= deadline) break;
          const found=await request("/v1/payments/search?external_reference="+encodeURIComponent(doc.id)+"&limit=20"+(offset?"&offset="+offset:""),token);
          if (!Array.isArray(found.results)) throw new Error("Respuesta de pagos inválida");
          let processed=0;
          for (const candidate of found.results) {
            if (Date.now() >= deadline) break;
            if (candidate.status==="approved" && /^[0-9]{1,20}$/.test(String(candidate.id))) {
              const paymentId=String(candidate.id), payment=await fetchCheckoutPayment(paymentId,token,request);
              if (verifyPayment(payment,order,paymentId)) await settleVerifiedPayment(db,doc.id,payment,paymentId);
            }
            processed++;
          }
          offset+=processed;
          if (processed < found.results.length) {
            await db.collection(ORDERS).doc(doc.id).update({searchOffset:offset});
            break;
          }
          const total=Number(found.paging?.total);
          if (found.results.length<20 || (Number.isFinite(total)&&offset>=total)) {offset=0;break;}
          await db.collection(ORDERS).doc(doc.id).update({searchOffset:offset});
        }
        await db.collection(ORDERS).doc(doc.id).update({searchOffset:offset});
      } catch(error) {console.error("Conciliación pendiente",doc.id,error);}
      lastId=doc.id;
    }
  } finally {
    await db.runTransaction(async tx=>{
      const snap=await tx.get(cursorRef);
      if(snap.get("leaseOwner")===owner)tx.set(cursorRef,{lastOrderId:lastId,leaseOwner:"",leaseUntil:0,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    });
  }
}
async function checkoutContext(request) {
  const token=request.auth?.token;
  if(!request.auth?.uid || token?.app!=="mi_comunidad" || token.role!=="admin" || !/^[a-z0-9-]{1,100}$/.test(String(token.comunidadId||""))) {
    throw new HttpsError("permission-denied","Solo administración puede contratar.");
  }
  const db=getFirestore(), comunidadId=token.comunidadId;
  const ref=db.collection("mi_comunidad_comunidades").doc(comunidadId);
  const [comunidad,licencia,admin]=await Promise.all([ref.get(),db.collection(LICENSES).doc(comunidadId).get(),ref.collection("administradores").doc(request.auth.uid).get()]);
  if(admin.exists && admin.get("estado")!=="Activo")throw new HttpsError("permission-denied","Administración desactivada.");
  if(!comunidad.exists || comunidad.get("estado")==="Suspendida" || !licencia.exists || licencia.get("estado")==="suspended")throw new HttpsError("failed-precondition","Comunidad no habilitada para compra.");
  const environment=String(MP_ENVIRONMENT.value()||""),amount=Number(PLAN_PRICE.value());
  if(!["test","production"].includes(environment)||!Number.isSafeInteger(amount)||amount<=0)throw new HttpsError("failed-precondition","Configuración comercial incompleta.");
  if((environment==="test" && comunidad.get("mpTestFixture")!==true) || (environment==="production" && (comunidad.get("mpTestFixture")===true || comunidadId==="nodar-pagos-prueba-20261025" || request.auth.uid==="nodar-mp-prueba-20261025")))throw new HttpsError("failed-precondition","El cobro no está disponible para esta comunidad.");
  return {db,comunidadId,licencia,environment,amount};
}

function registerMercadoPago() {
  const createCheckout = onCall({secrets: [ACCESS_TOKEN, PLAN_PRICE, WEBHOOK_URL, MP_ENVIRONMENT, TEST_ACCOUNT]}, async (request) => {
    const {db,comunidadId,licencia,environment,amount}=await checkoutContext(request);
    const documentoTributario=validarDocumentoTributario(request.data?.documentoTributario);
    const url=WEBHOOK_URL.value();
    if(!/^https:\/\//.test(url))throw new HttpsError("failed-precondition","Webhook no configurado.");
    const testAccount=environment==="test"?JSON.parse(TEST_ACCOUNT.value()):null;
    const cycleDate=value=>value?.toMillis?value.toMillis():value?.getTime?value.getTime():String(value||"");
    const cycle=crypto.createHash("sha256").update(JSON.stringify([comunidadId,environment,cycleDate(licencia.get("paidUntil")),cycleDate(licencia.get("trialEndsAt")),licencia.get("checkoutRevision")||0])).digest("hex");
    const intentRef=db.collection("mi_comunidad_config_comercial").doc("checkout-"+comunidadId);
    const proposedRef=db.collection(ORDERS).doc();
    const selected=await db.runTransaction(async tx=>{
      const intent=await tx.get(intentRef);
      if(intent.exists&&intent.get("cycle")===cycle)return {id:intent.get("orderId"),fresh:false};
      tx.create(proposedRef,{id:proposedRef.id,comunidadId,adminUid:request.auth.uid,amount,currency:"CLP",months:MONTHS,environment,testAccount,
        status:"pending",creationOutcome:"not_started",documentoTributario,createdAt:FieldValue.serverTimestamp()});
      tx.set(intentRef,{cycle,orderId:proposedRef.id});
      return {id:proposedRef.id,fresh:true};
    });
    const orderRef=db.collection(ORDERS).doc(selected.id);
    if(!selected.fresh){
      const order=await recoverCheckout(db,selected.id,ACCESS_TOKEN.value());
      if(order.status==="checkout_ready"&&validCheckoutUrl(order.checkoutUrl))return {checkoutUrl:order.checkoutUrl,orderId:selected.id};
      throw new HttpsError("failed-precondition","La compra anterior está siendo verificada. No inicies otro pago.");
    }
    try {
      // Persist the send boundary first: a crash after this write remains uncertain.
      await db.runTransaction(async tx=>{
        const current=await tx.get(orderRef);
        if(!current.exists || current.get("status")!=="pending" || current.get("creationOutcome")!=="not_started") {
          throw new HttpsError("failed-precondition","La compra cambió; actualiza su estado antes de pagar.");
        }
        tx.update(orderRef,{creationOutcome:"post_started"});
      });
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
      if (!pref.id || !validCheckoutUrl(pref.init_point)) throw new Error("Preferencia incompleta");
      // El entorno comercial y live_mode de la API son conceptos distintos.
      // La cuenta de prueba se configura desde Cloud Shell, nunca desde el cliente.
      const identity = checkoutIdentity(environment, pref, environment === "test" ? JSON.parse(TEST_ACCOUNT.value()) : null);
      await orderRef.update({preferenceId: String(pref.id), ...identity, environment, checkoutUrl:pref.init_point, creationOutcome:"created", status: "checkout_ready"});
      return {checkoutUrl: pref.init_point, orderId: orderRef.id};
    } catch (err) {
      await db.runTransaction(async tx=>{
        const current=await tx.get(orderRef);
        if(current.exists && ["pending","checkout_error"].includes(current.get("status"))) {
          tx.update(orderRef,{status:"checkout_error",creationOutcome:[400,401,403,404,422].includes(err.mpStatus)?"rejected":"uncertain"});
        }
      });
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
    const paymentId=String(req.query["data.id"]);
    const receiptId=crypto.createHash("sha256").update(JSON.stringify([req.headers["x-request-id"],/(?:^|,)\s*ts=(\d+)/.exec(String(req.headers["x-signature"]))?.[1],paymentId])).digest("hex");
    const db=getFirestore(), receiptRef=db.collection("mi_comunidad_webhook_recibos").doc(receiptId), owner=crypto.randomUUID();
    try {
      const claim=await db.runTransaction(async tx=>{
        const current=await tx.get(receiptRef);
        if(current.exists&&current.get("done"))return "done";
        if(current.exists&&Number(current.get("leaseUntil"))>Date.now())return "busy";
        tx.set(receiptRef,{owner,leaseUntil:Date.now()+120000,expiresAt:new Date(Date.now()+86400000)});
        return "claimed";
      });
      if(claim==="done")return res.status(200).send("Notificación ya recibida");
      if(claim==="busy")return res.status(503).send("Notificación en procesamiento; reintentar");
      let done=false,message="Recibido";
      try {
        const payment=await fetchCheckoutPayment(paymentId,ACCESS_TOKEN.value());
        const orderId=String(payment.external_reference||"");
        if(["refunded","charged_back"].includes(payment.status)||Number(payment.transaction_amount_refunded)>0){
          if(/^[a-zA-Z0-9]{10,80}$/.test(orderId))await flagReversedPayment(db,orderId,payment,paymentId);
          message="Reverso registrado para revisión";
        }else if(payment.status!=="approved")message="Pago aún no aprobado";
        else if(!/^[a-zA-Z0-9]{10,80}$/.test(orderId))message="Referencia inválida";
        else await settleVerifiedPayment(db,orderId,payment,paymentId);
        done=true;
      }finally{
        await db.runTransaction(async tx=>{
          const current=await tx.get(receiptRef);
          if(current.get("owner")===owner)tx.set(receiptRef,{done,leaseUntil:0},{merge:true});
        });
      }
      return res.status(200).send(message);
    }catch(error){console.error("Error verificando pago",error);return res.status(500).send("Reintentar");}
  });
  // Rescate de pagos aprobados cuando la notificación no llegó.
  // Límite por ejecución para controlar costos y cuota de API.
  const reconcile = onSchedule({
    timeoutSeconds: 540,
    schedule: "every 60 minutes",
    secrets: [ACCESS_TOKEN],
    timeZone: "America/Santiago",
  }, async () => {
    await reconcilePayments(getFirestore(), ACCESS_TOKEN.value());
  });
  const quote=onCall({secrets:[PLAN_PRICE,MP_ENVIRONMENT]},async request=>{
    const {amount,environment}=await checkoutContext(request);
    return {amount,currency:"CLP",months:MONTHS,environment};
  });
  return {cotizarPlanMiComunidad:quote, crearCheckoutMiComunidad: createCheckout,
    webhookMercadoPagoMiComunidad: webhook,
    conciliarPagosMiComunidad: reconcile};
}
const obtenerPagoRevision=paymentId=>fetchCheckoutPayment(paymentId,ACCESS_TOKEN.value());
module.exports={ACCESS_TOKEN,obtenerPagoRevision,assertCheckoutCanRestart,searchPreferences,recoverCheckout,checkoutContext,validCheckoutUrl,reconcilePayments,settleVerifiedPayment,flagReversedPayment,registerMercadoPago,validateSignature,signatureFailure,checkoutIdentity,verifyPayment,fetchCheckoutPayment};
