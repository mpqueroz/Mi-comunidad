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
  {coleccion: "auditoria", meses: 24},
];

// Los registros guardan ts como milisegundos (Date.now()) o como Timestamp del
// servidor; Firestore compara cada tipo por separado, así que se consultan ambos.
async function vencidos(ref, plazo, ahora, Timestamp) {
  const corte = ahora - plazo.meses * MES_MS;
  const [numericos, fechas] = await Promise.all([
    ref.collection(plazo.coleccion).where("ts", "<", corte).get(),
    ref.collection(plazo.coleccion).where("ts", "<", Timestamp.fromMillis(corte)).get(),
  ]);
  return [...numericos.docs, ...fechas.docs].filter((d) => !(plazo.conservar && plazo.conservar(d.data())));
}

// Recorre todas las comunidades; con borrar=false solo devuelve cuántos
// registros vencidos hay por comunidad y colección.
async function depurar(db, {ahora = Date.now(), borrar = DEPURACION_ACTIVA, Timestamp, FieldValue}) {
  const resumen = [];
  const comunidades = await db.collection("mi_comunidad_comunidades").get();
  for (const comunidad of comunidades.docs) {
    const conteo = {};
    let total = 0;
    for (const plazo of PLAZOS) {
      const docs = await vencidos(comunidad.ref, plazo, ahora, Timestamp);
      conteo[plazo.coleccion] = docs.length;
      total += docs.length;
      if (borrar) {
        for (let i = 0; i < docs.length; i += 400) {
          const batch = db.batch();
          docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
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
  }
  return resumen;
}

module.exports = {depurar, PLAZOS, DEPURACION_ACTIVA};
