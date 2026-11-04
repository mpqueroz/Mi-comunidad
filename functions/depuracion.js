"use strict";
// Borrado programado según los plazos de conservación de la política de
// privacidad. Solo bitácoras operativas y auditoría: cobros, multas,
// contabilidad, remuneraciones y fichas no se tocan.
//
// Activa desde el 26 de octubre de 2026, tras una simulación en producción
// sin registros vencidos. Con false la tarea solo cuenta; el despliegue
// siempre imprime las cifras del día (scripts/simular-depuracion.cjs).

const DEPURACION_ACTIVA = true;

const MES_MS = 30 * 24 * 60 * 60 * 1000;
const PLAZOS = [
  {coleccion: "visitas", meses: 12},
  {coleccion: "visitasProgramadas", meses: 12},
  {coleccion: "accesos", meses: 12},
  {coleccion: "vehiculos", meses: 12},
  // Solo las encomiendas ya entregadas; las pendientes se conservan.
  {coleccion: "encomiendas", meses: 12, conservar: (d) => d.estado !== "Entregado"},
  // novedades y notificaciones copian nombres de visitas y retiros: sin esto,
  // el dato seguía en la bitácora después de borrar la visita.
  {coleccion: "novedades", meses: 12},
  {coleccion: "notificaciones", meses: 12},
  // Las reservas guardan invitados con RUT; las de fecha futura se conservan.
  {coleccion: "reservas", meses: 12, conservar: (d, ahora) => String(d.fecha || "") >= new Date(ahora).toISOString().slice(0, 10)},
  {coleccion: "auditoria", meses: 24},
];

// Los registros guardan ts como milisegundos (Date.now()) o como Timestamp del
// servidor; Firestore compara cada tipo por separado, así que se consultan ambos.
async function* paginasVencidas(ref, plazo, ahora, Timestamp) {
  const corte = ahora - plazo.meses * MES_MS;
  for (const limite of [corte, Timestamp.fromMillis(corte)]) {
    let cursor;
    for (;;) {
      let query = ref.collection(plazo.coleccion).where("ts", "<", limite)
          .orderBy("ts").orderBy("__name__").limit(400);
      if (cursor) query = query.startAfter(cursor);
      const snap = await query.get();
      if (snap.empty) break;
      yield snap.docs.filter((d) => {
        const value = d.get("ts");
        const tipoCorrecto = typeof limite === "number" ? typeof value === "number" : typeof value?.toMillis === "function";
        return tipoCorrecto && !(plazo.conservar && plazo.conservar(d.data(), ahora));
      });
      // Avanzar incluso si la página completa contiene registros conservados.
      cursor = snap.docs[snap.docs.length - 1];
      if (snap.size < 400) break;
    }
  }
}

// Recorre todas las comunidades; con borrar=false solo devuelve cuántos
// registros vencidos hay por comunidad y colección.
async function depurar(db, {ahora = Date.now(), borrar = DEPURACION_ACTIVA, Timestamp, FieldValue}) {
  const resumen = [];
  const fallos = [];
  let cursor;
  for (;;) {
    let query = db.collection("mi_comunidad_comunidades").orderBy("__name__").limit(100);
    if (cursor) query = query.startAfter(cursor);
    const comunidades = await query.get();
    if (comunidades.empty) break;
    for (const comunidad of comunidades.docs) {
      const conteo = {};
      let total = 0;
      try {
      for (const plazo of PLAZOS) {
        conteo[plazo.coleccion] = 0;
        for await (const docs of paginasVencidas(comunidad.ref, plazo, ahora, Timestamp)) {
          if (borrar && docs.length) {
            const batch = db.batch();
            // No borrar un registro que cambió después de leer la página.
            docs.forEach((d) => batch.delete(d.ref, {lastUpdateTime: d.updateTime}));
            await batch.commit();
          }
          conteo[plazo.coleccion] += docs.length;
          total += docs.length;
        }
      }
      if (borrar && total > 0) {
        await comunidad.ref.collection("auditoria").add({
          tipo: "Depuración programada",
          detalle: conteo,
          actorNombre: "Sistema",
          ts: FieldValue.serverTimestamp(),
        });
      }
      resumen.push({comunidadId: comunidad.id, total, conteo});
      } catch (error) {
        fallos.push(comunidad.id);
        console.error("Depuración incompleta", {comunidadId: comunidad.id, mensaje: error.message});
      }
    }
    cursor = comunidades.docs[comunidades.docs.length - 1];
    if (comunidades.size < 100) break;
  }
  if (fallos.length) throw new Error(`Depuración incompleta en ${fallos.length} comunidades; revisar registros y reintentar.`);
  return resumen;
}

module.exports = {depurar, PLAZOS, DEPURACION_ACTIVA};
