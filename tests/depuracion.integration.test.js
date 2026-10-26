'use strict';
// Depuración programada contra el emulador de Firestore.
const {test, before} = require('node:test');
const assert = require('node:assert/strict');
const enabled = !!process.env.FIRESTORE_EMULATOR_HOST;
let db, Timestamp, FieldValue, depurar;
before(() => {
  if (!enabled) return;
  const projectId = 'demo-mi-comunidad-depuracion';
  process.env.GCLOUD_PROJECT = projectId; process.env.FIREBASE_CONFIG = JSON.stringify({projectId});
  const sdk = require('node:module').createRequire(require.resolve('../functions/index'));
  const {initializeApp, getApps} = sdk('firebase-admin/app');
  if (!getApps().length) initializeApp({projectId});
  ({Timestamp, FieldValue} = sdk('firebase-admin/firestore'));
  db = sdk('firebase-admin/firestore').getFirestore();
  ({depurar} = require('../functions/depuracion'));
});

const DIA = 24 * 60 * 60 * 1000;
const ahora = Date.UTC(2027, 5, 1);
async function sembrar() {
  const base = db.collection('mi_comunidad_comunidades').doc('dep-' + Math.random().toString(36).slice(2));
  await base.set({estado: 'Activa'});
  const viejo = ahora - 400 * DIA, nuevo = ahora - 10 * DIA;
  const w = db.batch();
  for (const col of ['visitas', 'visitasProgramadas', 'accesos', 'vehiculos']) {
    w.set(base.collection(col).doc('viejo-ms'), {ts: viejo});
    w.set(base.collection(col).doc('viejo-ts'), {ts: Timestamp.fromMillis(viejo)});
    w.set(base.collection(col).doc('nuevo'), {ts: nuevo});
  }
  w.set(base.collection('encomiendas').doc('entregada-vieja'), {estado: 'Entregado', ts: viejo});
  w.set(base.collection('encomiendas').doc('pendiente-vieja'), {estado: 'Recibido', ts: viejo});
  w.set(base.collection('auditoria').doc('de-hace-400-dias'), {ts: Timestamp.fromMillis(viejo)});
  w.set(base.collection('auditoria').doc('de-hace-3-anos'), {ts: Timestamp.fromMillis(ahora - 1100 * DIA)});
  w.set(base.collection('gastosComunes').doc('cobro-viejo'), {ts: viejo, monto: 1000});
  w.set(base.collection('movimientosContables').doc('mov-viejo'), {ts: viejo});
  await w.commit();
  return base;
}
const ids = async (ref, col) => (await ref.collection(col).get()).docs.map((d) => d.id).sort();

test('simulación cuenta los vencidos sin borrar nada', {skip: !enabled}, async () => {
  const base = await sembrar();
  const resumen = await depurar(db, {ahora, borrar: false, Timestamp, FieldValue});
  const c = resumen.find((r) => r.comunidadId === base.id);
  assert.deepEqual(c.conteo, {visitas: 2, visitasProgramadas: 2, accesos: 2, vehiculos: 2, encomiendas: 1, auditoria: 1});
  assert.equal(c.total, 10);
  assert.deepEqual(await ids(base, 'visitas'), ['nuevo', 'viejo-ms', 'viejo-ts']);
  assert.equal((await base.collection('auditoria').get()).size, 2);
});

test('borrado real respeta plazos, encomiendas pendientes y datos financieros', {skip: !enabled}, async () => {
  const base = await sembrar();
  await depurar(db, {ahora, borrar: true, Timestamp, FieldValue});
  for (const col of ['visitas', 'visitasProgramadas', 'accesos', 'vehiculos']) assert.deepEqual(await ids(base, col), ['nuevo'], col);
  assert.deepEqual(await ids(base, 'encomiendas'), ['pendiente-vieja']);
  assert.deepEqual(await ids(base, 'gastosComunes'), ['cobro-viejo']);
  assert.deepEqual(await ids(base, 'movimientosContables'), ['mov-viejo']);
  const auditoria = (await base.collection('auditoria').get()).docs.map((d) => d.data());
  assert.ok(auditoria.some((a) => a.tipo === 'Depuración programada' && a.detalle.visitas === 2));
  assert.ok(!auditoria.some((a) => a.ts && a.ts.toMillis && a.ts.toMillis() < ahora - 1000 * DIA), 'auditoría de 3 años borrada');
  const segunda = (await depurar(db, {ahora, borrar: true, Timestamp, FieldValue})).find((r) => r.comunidadId === base.id);
  assert.equal(segunda.total, 0, 'repetir no borra nada más');
});

test('la tarea queda en simulación hasta activarla', () => {
  assert.equal(require('../functions/depuracion').DEPURACION_ACTIVA, false);
});
