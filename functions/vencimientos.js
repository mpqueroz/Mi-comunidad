"use strict";
const {evaluateLicense} = require("./licencias");

// Releer cada registro dentro de una transacción evita devolver a Atrasado
// un cobro que otro operador pagó después de consultar la página.
async function marcarVencidos(db, query, campoFecha, hoy, nuevoEstado, estadoAnterior) {
  let cursor;
  let total = 0;
  for (;;) {
    let page = query.orderBy("__name__").limit(200);
    if (cursor) page = page.startAfter(cursor);
    const snap = await page.get();
    if (snap.empty) break;
    for (const doc of snap.docs) {
      const fecha = String(doc.get(campoFecha) || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha >= hoy) continue;
      const changed = await db.runTransaction(async tx => {
        const current = await tx.get(doc.ref);
        const value = String(current.get(campoFecha) || "");
        if (!current.exists || current.get("estado") !== estadoAnterior ||
            !/^\d{4}-\d{2}-\d{2}$/.test(value) || value >= hoy) return false;
        tx.update(doc.ref, {estado: nuevoEstado});
        return true;
      });
      if (changed) total++;
    }
    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < 200) break;
  }
  return total;
}

async function actualizarVencimientos(db, hoy, logger = console) {
  let cursor;
  let gastos = 0;
  let mantenciones = 0;
  const fallos = [];
  for (;;) {
    let query = db.collection("mi_comunidad_comunidades").orderBy("__name__").limit(100);
    if (cursor) query = query.startAfter(cursor);
    const snap = await query.get();
    if (snap.empty) break;
    for (const c of snap.docs) {
      try {
        if (c.get("estado") === "Suspendida") continue;
        const license = await db.collection("mi_comunidad_licencias").doc(c.id).get();
        if (license.exists && !evaluateLicense(license.data()).allowed) continue;
        gastos += await marcarVencidos(db, c.ref.collection("gastosComunes").where("estado", "==", "Pendiente"),
            "vencimiento", hoy, "Atrasado", "Pendiente");
        mantenciones += await marcarVencidos(db, c.ref.collection("mantenciones").where("estado", "==", "Programada"),
            "fecha", hoy, "Atrasada", "Programada");
      } catch (error) {
        fallos.push(c.id);
        logger.error("Vencimientos incompletos", {comunidadId: c.id, mensaje: error.message});
      }
    }
    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < 100) break;
  }
  logger.log(`Vencimientos ${hoy}: ${gastos} gastos y ${mantenciones} mantenciones`);
  if (fallos.length) throw new Error(`Vencimientos incompletos en ${fallos.length} comunidades`);
  return {gastos, mantenciones};
}
module.exports = {marcarVencidos, actualizarVencimientos};
