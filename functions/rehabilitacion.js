"use strict";
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {evaluateLicense} = require("./licencias");

exports.rehabilitarLicenciaMiComunidad = onCall(async (request) => {
  const token = request.auth?.token;
  if (token?.app !== "mi_comunidad" || token?.role !== "superadmin" || !request.auth.uid) {
    throw new HttpsError("permission-denied", "Solo el superadministrador puede rehabilitar.");
  }
  const id = String(request.data?.comunidadId || "");
  const motivo = String(request.data?.motivo || "").trim();
  if (!/^[a-z0-9-]{1,100}$/.test(id) || motivo.length < 15 || motivo.length > 500) {
    throw new HttpsError("invalid-argument", "Se requiere comunidad y justificación.");
  }
  const db = getFirestore();
  const comunidadRef = db.collection("mi_comunidad_comunidades").doc(id);
  const licenciaRef = db.collection("mi_comunidad_licencias").doc(id);
  const auditoriaRef = db.collection("mi_comunidad_auditoria_comercial").doc();
  return db.runTransaction(async (tx) => {
    const comunidad = await tx.get(comunidadRef);
    const licencia = await tx.get(licenciaRef);
    if (!comunidad.exists || !licencia.exists) {
      throw new HttpsError("not-found", "Comunidad o licencia inexistente.");
    }
    const data = licencia.data();
    if (data.estado !== "suspended" || data.suspensionReason !== "administrative" ||
        comunidad.get("estado") === "Suspendida") {
      throw new HttpsError("failed-precondition", "Esta suspensión requiere revisión especial.");
    }
    const pagada = evaluateLicense({...data, estado: "active"});
    const prueba = evaluateLicense({...data, estado: "trial"});
    const nuevoEstado = pagada.reason === "paid" ? "active" :
      prueba.reason === "trial" ? "trial" : null;
    if (!nuevoEstado) {
      throw new HttpsError("failed-precondition", "Licencia vencida: requiere pago.");
    }
    tx.update(licenciaRef, {estado: nuevoEstado,
      suspensionReason: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp()});
    tx.create(auditoriaRef, {accion: "rehabilitacion", comunidadId: id,
      actorUid: request.auth.uid, motivo, estadoAnterior: data.estado,
      estadoNuevo: nuevoEstado, fecha: FieldValue.serverTimestamp()});
    return {ok: true, estado: nuevoEstado};
  });
});

// La revisión exige una respuesta actual del proveedor y nunca concede períodos arbitrarios.
const {ACCESS_TOKEN, obtenerPagoRevision, verifyPayment} = require("./mercadopago");
const {applyVerifiedRenewal} = require("./licencias");
exports.resolverRevisionPagoMiComunidad = onCall({secrets:[ACCESS_TOKEN]}, async request => {
  const token = request.auth?.token;
  if (token?.app !== "mi_comunidad" || token?.role !== "superadmin" || !request.auth.uid) {
    throw new HttpsError("permission-denied", "Solo el superadministrador puede resolver pagos.");
  }
  const {orderId, paymentId, accion, motivo} = request.data || {};
  if (typeof orderId !== "string" || !/^[a-zA-Z0-9_-]{10,100}$/.test(orderId) ||
      !/^\d{1,20}$/.test(String(paymentId || "")) || typeof motivo !== "string" ||
      motivo.trim().length < 20 || motivo.length > 1000 ||
      !["aplicar_pago_verificado","confirmar_reverso_total","cerrar_revision_historica","cerrar_pago_adicional_reembolsado"].includes(accion)) {
    throw new HttpsError("invalid-argument", "Indica orden, pago, acción y justificación detallada.");
  }
  let payment;
  try { payment = await obtenerPagoRevision(String(paymentId)); }
  catch { throw new HttpsError("unavailable", "No fue posible verificar el pago. La revisión sigue pendiente."); }
  const db = getFirestore(), orderRef = db.collection("mi_comunidad_ordenes_pago").doc(orderId);
  const auditRef = db.collection("mi_comunidad_auditoria_comercial").doc();
  return db.runTransaction(async tx => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) throw new HttpsError("not-found", "Orden inexistente.");
    const order = orderSnap.data();
    if (String(payment.id) !== String(paymentId) || payment.external_reference !== orderId ||
        String(payment.preference_id) !== String(order.preferenceId) || !order.collectorId ||
        String(payment.collector_id) !== String(order.collectorId) || payment.live_mode !== order.liveMode ||
        payment.currency_id !== "CLP" || Number(payment.transaction_amount) !== order.amount) {
      throw new HttpsError("failed-precondition", "El pago verificado no coincide con esta orden.");
    }
    const total = ["refunded","charged_back"].includes(payment.status) || Number(payment.transaction_amount_refunded) >= order.amount;
    if (accion === "cerrar_pago_adicional_reembolsado") {
      if (order.status !== "paid" || String(order.paymentId) === String(paymentId) || !order.additionalPaymentReview || !total) {
        throw new HttpsError("failed-precondition", "El segundo cobro debe estar íntegramente devuelto y pendiente de revisión.");
      }
      const incidentRef = orderRef.collection("incidencias").doc(String(paymentId));
      const incident = await tx.get(incidentRef);
      const incidents = await tx.get(orderRef.collection("incidencias"));
      if (!incident.exists || incident.get("estado") === "resuelta") throw new HttpsError("failed-precondition", "Incidencia inexistente o ya resuelta.");
      const remaining = incidents.docs.some(doc => doc.id !== String(paymentId) && doc.get("estado") !== "resuelta");
      tx.update(incidentRef, {estado:"resuelta", resolution:accion, resolvedAt:FieldValue.serverTimestamp(), actorUid:request.auth.uid, motivo:motivo.trim()});
      tx.update(orderRef,{additionalPaymentReview:remaining});
      tx.create(auditRef,{accion,orderId,paymentId:String(paymentId),comunidadId:order.comunidadId,actorUid:request.auth.uid,
        motivo:motivo.trim(),paymentStatusVerificado:payment.status,fecha:FieldValue.serverTimestamp()});
      return {ok:true,status:"additional_payment_resolved"};
    }
    if (order.status !== "payment_review" || String(order.paymentId) !== String(paymentId)) {
      throw new HttpsError("failed-precondition", "La revisión cambió o ya está resuelta. Actualiza la pantalla.");
    }
    const community = await tx.get(db.collection("mi_comunidad_comunidades").doc(order.comunidadId));
    const licenseRef = db.collection("mi_comunidad_licencias").doc(order.comunidadId), licenseSnap = await tx.get(licenseRef);
    if (!community.exists || !licenseSnap.exists) throw new HttpsError("not-found", "Comunidad o licencia inexistente.");
    const license = licenseSnap.data(), lastPayment = String(license.lastPaymentId || "");
    let result;
    if (accion === "aplicar_pago_verificado") {
      if (order.paymentStatus !== "approved_while_suspended" || !verifyPayment(payment,order,paymentId) ||
          community.get("estado") === "Suspendida" || license.estado === "suspended" || lastPayment === String(paymentId)) {
        throw new HttpsError("failed-precondition", "Regulariza la suspensión; el pago debe seguir aprobado y sin reembolsos.");
      }
      const next = applyVerifiedRenewal(license,{months:12});
      tx.update(licenseRef,{...next,lastPaymentId:String(paymentId),updatedAt:FieldValue.serverTimestamp()});
      result="paid";
      tx.update(orderRef,{status:result,paidAt:FieldValue.serverTimestamp(),
        licenseBeforeRenewal:{estado:license.estado,paidUntil:license.paidUntil || null,trialEndsAt:license.trialEndsAt || null,lastPaymentId:license.lastPaymentId || null},
        paidUntilApplied:next.paidUntil,reviewResolution:accion,resolvedAt:FieldValue.serverTimestamp()});
    } else {
      if (!total) throw new HttpsError("failed-precondition", "Un reverso parcial requiere revisión contable; no se modificará la vigencia.");
      if (accion === "confirmar_reverso_total") {
        if (lastPayment !== String(paymentId) || license.estado !== "suspended" || license.suspensionReason !== "payment_reversed") {
          throw new HttpsError("failed-precondition", "La licencia cambió; revisa el historial.");
        }
        const before=order.licenseBeforeRenewal;
        const millis=value=>value && typeof value.toDate === "function" ? value.toDate().getTime() : value ? new Date(value).getTime() : null;
        if (!before || !order.paidUntilApplied || millis(license.paidUntil) !== millis(order.paidUntilApplied)) {
          throw new HttpsError("failed-precondition", "Falta saldo anterior verificable o la vigencia cambió. Requiere revisión contable especial.");
        }
        const restored={...license,estado:before.estado,paidUntil:before.paidUntil || null,trialEndsAt:before.trialEndsAt || null};
        tx.update(licenseRef,{estado:evaluateLicense(restored).allowed ? before.estado : "expired",paidUntil:restored.paidUntil,
          trialEndsAt:restored.trialEndsAt,lastPaymentId:before.lastPaymentId || FieldValue.delete(),
          checkoutRevision:(Number.isSafeInteger(license.checkoutRevision) ? license.checkoutRevision : 0)+1,
          suspensionReason:FieldValue.delete(),updatedAt:FieldValue.serverTimestamp()});
      } else if (!lastPayment || lastPayment === String(paymentId)) {
        throw new HttpsError("failed-precondition", "No es un reverso histórico de una licencia posterior.");
      }
      result="reversed_resolved";
      tx.update(orderRef,{status:result,reviewResolution:accion,resolvedAt:FieldValue.serverTimestamp()});
    }
    tx.create(auditRef,{accion,orderId,paymentId:String(paymentId),comunidadId:order.comunidadId,actorUid:request.auth.uid,
      motivo:motivo.trim(),estadoAnterior:license.estado,paidUntilAnterior:license.paidUntil || null,
      estadoOrdenAnterior:order.status,estadoOrdenNuevo:result,paymentStatusVerificado:payment.status,
      reembolsoVerificado:Number(payment.transaction_amount_refunded) || 0,fecha:FieldValue.serverTimestamp()});
    return {ok:true,status:result};
  });
});

// Reiniciar únicamente si el envío no comenzó o fue rechazado inequívocamente;
// una búsqueda vacía no autoriza repetir un POST de resultado incierto.
const {assertCheckoutCanRestart} = require("./mercadopago");
exports.reiniciarCheckoutFallidoMiComunidad = onCall({secrets:[ACCESS_TOKEN]}, async request => {
  const token=request.auth?.token;
  if(token?.app!=="mi_comunidad" || token?.role!=="superadmin" || !request.auth.uid)throw new HttpsError("permission-denied","Solo el superadministrador puede reiniciar una compra.");
  const {orderId,motivo}=request.data || {};
  if(typeof orderId!=="string" || !/^[a-zA-Z0-9_-]{10,100}$/.test(orderId) || typeof motivo!=="string" || motivo.trim().length<20 || motivo.length>1000)throw new HttpsError("invalid-argument","Indica orden y justificación detallada.");
  const db=getFirestore();
  let checked;
  try { checked=await assertCheckoutCanRestart(db,orderId); }
  catch {throw new HttpsError("failed-precondition","No se ha demostrado un reinicio seguro. Recupera la compra existente o solicita revisión especial.");}
  const ref=db.collection("mi_comunidad_ordenes_pago").doc(orderId),auditRef=db.collection("mi_comunidad_auditoria_comercial").doc();
  return db.runTransaction(async tx=>{
    const order=await tx.get(ref);
    const licenseRef=db.collection("mi_comunidad_licencias").doc(checked.comunidadId),license=await tx.get(licenseRef);
    if(!order.exists || !license.exists || !["pending","checkout_error"].includes(order.get("status")) ||
        !["not_started","rejected"].includes(order.get("creationOutcome")) || order.get("creationOutcome")!==checked.creationOutcome ||
        order.get("comunidadId")!==checked.comunidadId || order.get("preferenceId"))throw new HttpsError("failed-precondition","La compra cambió. No se reinició.");
    tx.update(ref,{status:"checkout_cancelled",cancelledAt:FieldValue.serverTimestamp(),cancelReason:"verified_not_created"});
    tx.update(licenseRef,{checkoutRevision:(Number.isSafeInteger(license.get("checkoutRevision"))?license.get("checkoutRevision"):0)+1,updatedAt:FieldValue.serverTimestamp()});
    tx.create(auditRef,{accion:"reinicio_checkout_verificado",orderId,comunidadId:checked.comunidadId,actorUid:request.auth.uid,motivo:motivo.trim(),creationOutcome:checked.creationOutcome,fecha:FieldValue.serverTimestamp()});
    return {ok:true,status:"checkout_cancelled"};
  });
});
