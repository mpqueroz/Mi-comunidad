"use strict";
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {getFirestore} = require("firebase-admin/firestore");
const dateString = (v) => {
  const d = v && typeof v.toDate === "function" ? v.toDate() : v;
  const parsed = d ? new Date(d) : null;
  return parsed && Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
};
exports.resumenComercialMiComunidad = onCall(async (request) => {
  const t = request.auth?.token;
  if (t?.app !== "mi_comunidad" || t?.role !== "superadmin") {
    throw new HttpsError("permission-denied", "Acceso reservado al superadministrador.");
  }
  const db = getFirestore();
  const [communities, licenses, reviews] = await Promise.all([
    db.collection("mi_comunidad_comunidades").limit(200).get(),
    db.collection("mi_comunidad_licencias").limit(200).get(),
    db.collection("mi_comunidad_ordenes_pago").where("status", "==", "payment_review").limit(100).get(),
  ]);
  const licenseMap = new Map(licenses.docs.map((d) => [d.id, d.data()]));
  return {
    comunidades: communities.docs.map((doc) => {
      const c = doc.data(), l = licenseMap.get(doc.id);
      return {id: doc.id, nombre: String(c.name || doc.id).slice(0, 120),
        estadoAdministrativo: c.estado === "Suspendida" ? "Suspendida" : "Activa",
        licencia: l ? String(l.estado || "sin_estado") : "sin_licencia",
        trialEndsAt: dateString(l?.trialEndsAt), paidUntil: dateString(l?.paidUntil),
        suspensionReason: String(l?.suspensionReason || "")};
    }),
    revisiones: reviews.docs.map((doc) => {
      const o = doc.data();
      return {id: doc.id, comunidadId: String(o.comunidadId || ""),
        amount: Number(o.amount) || 0, paymentStatus: String(o.paymentStatus || "")};
    }),
    limitado: communities.size === 200 || licenses.size === 200 || reviews.size === 100,
  };
});

/**
 * Historial comercial por comunidad. Solo lectura y únicamente superadmin.
 * No devuelve credenciales, datos bancarios ni datos de residentes.
 */
exports.historialPagosMiComunidad = onCall(async (request) => {
  const token = request.auth?.token;
  if (token?.app !== "mi_comunidad" || token?.role !== "superadmin") {
    throw new HttpsError("permission-denied", "Acceso reservado al superadministrador.");
  }
  const comunidadId = String(request.data?.comunidadId || "");
  if (!/^[a-z0-9-]{1,100}$/.test(comunidadId)) {
    throw new HttpsError("invalid-argument", "Identificador de comunidad inválido.");
  }
  const db = getFirestore();
  const community = await db.collection("mi_comunidad_comunidades").doc(comunidadId).get();
  if (!community.exists) throw new HttpsError("not-found", "Comunidad no encontrada.");
  const snapshot = await db.collection("mi_comunidad_ordenes_pago")
    .where("comunidadId", "==", comunidadId).limit(100).get();
  const pagos = snapshot.docs.map((doc) => {
    const p = doc.data();
    return {id: doc.id, estado: String(p.status || ""),
      monto: Number(p.amount) || 0, moneda: String(p.currency || "CLP"),
      meses: Number(p.months) || 0,
      creado: dateString(p.createdAt), pagado: dateString(p.paidAt),
      paymentStatus: String(p.paymentStatus || "")};
  }).sort((a, b) => String(b.creado || "").localeCompare(String(a.creado || "")));
  return {comunidadId, pagos, limitado: snapshot.size === 100};
});
