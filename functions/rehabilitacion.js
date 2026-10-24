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
    const nuevoEstado = pagada.allowed ? "active" : prueba.allowed ? "trial" : null;
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
