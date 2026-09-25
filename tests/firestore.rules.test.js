// Tests de firestore.rules (solo la parte de Mi Comunidad), contra el
// emulador de Firestore. Correr desde esta carpeta: npm install && npm test
// (necesita Java instalado para el emulador).

const {test, before, after, beforeEach} = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");

const C = "edificio1";
const BASE = `mi_comunidad_comunidades/${C}`;
let env;

const token = (role, extra = {}) => ({app: "mi_comunidad", role, comunidadId: C, ...extra});
const residente = () => env.authenticatedContext("res1", token("residente", {depto: "101"})).firestore();
const conserje = () => env.authenticatedContext("con1", token("conserje")).firestore();
const adminDb = () => env.authenticatedContext("adm1", token("admin")).firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-mi-comunidad",
    firestore: {rules: fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8")},
  });
});

after(async () => env && env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc(BASE).set({nombre: "Edificio 1", estado: "Activa"});
    await db.doc(`${BASE}/residentes/res1`).set({
      depto: "101", nombre: "Ana", rut: "11111111-1", telefono: "", estado: "Activo",
      familiares: [], restringidos: [],
    });
    await db.doc(`${BASE}/encomiendas/e1`).set({
      depto: "101", codigo: "PAQ-2026-000001", qrToken: "abc", estado: "Recibido",
    });
    await db.doc(`${BASE}/contadores/encomiendas_2026`).set({valor: 5});
  });
});

// ---- notificaciones ----

test("residente crea notificación para su propio depto", async () => {
  await assertSucceeds(residente().collection(`${BASE}/notificaciones`).add({
    titulo: "Pago informado", depto: "101", paraTodos: false, leidaPor: [], ts: 1,
  }));
});

test("residente NO puede notificar a todo el edificio", async () => {
  await assertFails(residente().collection(`${BASE}/notificaciones`).add({
    titulo: "Aviso falso", depto: null, paraTodos: true, leidaPor: [], ts: 1,
  }));
});

test("residente NO puede notificar a otro depto", async () => {
  await assertFails(residente().collection(`${BASE}/notificaciones`).add({
    titulo: "x", depto: "202", paraTodos: false, leidaPor: [], ts: 1,
  }));
});

test("administración sigue pudiendo notificar a todos", async () => {
  await assertSucceeds(adminDb().collection(`${BASE}/notificaciones`).add({
    titulo: "Nuevo aviso", depto: null, paraTodos: true, leidaPor: [], ts: 1,
  }));
});

// ---- ficha del residente ----

test("residente edita sus familiares y restringidos", async () => {
  const ref = residente().doc(`${BASE}/residentes/res1`);
  await assertSucceeds(ref.update({familiares: [{nombre: "Luis", relacion: "Hijo"}]}));
  await assertSucceeds(ref.update({restringidos: [{nombre: "Pedro"}]}));
});

test("residente NO puede agregar campos nuevos a su ficha", async () => {
  await assertFails(residente().doc(`${BASE}/residentes/res1`).update({alDia: true}));
});

test("residente NO puede cambiar su depto", async () => {
  await assertFails(residente().doc(`${BASE}/residentes/res1`).update({depto: "202"}));
});

test("residente NO puede inflar la lista de familiares", async () => {
  const muchos = Array.from({length: 51}, (_, i) => ({nombre: "F" + i}));
  await assertFails(residente().doc(`${BASE}/residentes/res1`).update({familiares: muchos}));
});

// ---- encomiendas ----

test("flujo completo de entrega de encomienda", async () => {
  const ref = conserje().doc(`${BASE}/encomiendas/e1`);
  await assertSucceeds(ref.update({estado: "En proceso de entrega"}));
  await assertSucceeds(ref.update({estado: "Recibido"}));
  await assertSucceeds(ref.update({estado: "En proceso de entrega"}));
  await assertSucceeds(ref.update({
    estado: "Entregado", retiradoPor: {nombre: "Ana", relacion: "Titular"},
    confirmadoPor: "Conserje", entregadoEn: 123,
  }));
  await assertFails(ref.update({estado: "Recibido"}));
});

test("conserjería NO puede cambiar el depto ni el QR de una encomienda", async () => {
  const ref = conserje().doc(`${BASE}/encomiendas/e1`);
  await assertFails(ref.update({depto: "202"}));
  await assertFails(ref.update({qrToken: "otro"}));
  await assertFails(ref.update({estado: "En proceso de entrega", depto: "202"}));
});

test("NO se puede saltar directo de Recibido a Entregado", async () => {
  await assertFails(conserje().doc(`${BASE}/encomiendas/e1`).update({estado: "Entregado"}));
});

// ---- contadores ----

test("contador de encomiendas solo avanza de a 1", async () => {
  const db = conserje();
  await assertSucceeds(db.doc(`${BASE}/contadores/encomiendas_2026`).set({valor: 6}));
  await assertFails(db.doc(`${BASE}/contadores/encomiendas_2026`).set({valor: 1}));
  await assertFails(db.doc(`${BASE}/contadores/encomiendas_2026`).set({valor: 99}));
  await assertFails(db.doc(`${BASE}/contadores/encomiendas_2026`).delete());
  await assertSucceeds(db.doc(`${BASE}/contadores/encomiendas_2027`).set({valor: 1}));
});

test("la transacción de generarCodigoEncomienda sigue funcionando", async () => {
  const db = conserje();
  const ref = db.doc(`${BASE}/contadores/encomiendas_2026`);
  await assertSucceeds(db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    t.set(ref, {valor: (snap.data().valor || 0) + 1});
  }));
});

// ---- ultimoAcceso ----

test("ultimoAcceso acepta la hora actual", async () => {
  await assertSucceeds(residente().doc(BASE).update({ultimoAcceso: Date.now()}));
});

test("ultimoAcceso rechaza fechas inventadas o texto", async () => {
  await assertFails(residente().doc(BASE).update({ultimoAcceso: Date.now() + 365 * 86400000}));
  await assertFails(residente().doc(BASE).update({ultimoAcceso: "ayer"}));
});
