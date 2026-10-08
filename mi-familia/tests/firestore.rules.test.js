// Tests de firestore.rules contra el emulador de Firestore.
// Correr desde esta carpeta: npm install && npm test (necesita Java).

const {test, before, after, beforeEach} = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const {initializeTestEnvironment, assertSucceeds, assertFails} = require("@firebase/rules-unit-testing");

const F = "fam1";
const BASE = `mi_familia_families/${F}`;
let env;

const as = (uid) => env.authenticatedContext(uid).firestore();
const mama = () => as("mama");   // admin
const abuela = () => as("abuela"); // adulto
const hija = () => as("hija");   // nino
const extrano = () => as("extrano"); // no es de la familia
const anon = () => env.unauthenticatedContext().firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-mi-familia",
    firestore: {rules: fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8")},
  });
});
after(async () => env && env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc(BASE).set({name: "Familia", ownerUid: "mama", createdAt: 1});
    await db.doc(`${BASE}/members/mama`).set({name: "Mamá", role: "admin"});
    await db.doc(`${BASE}/members/abuela`).set({name: "Abuela", role: "adulto"});
    await db.doc(`${BASE}/members/hija`).set({name: "Hija", role: "nino", medical: {}});
    await db.doc(`${BASE}/avisos/a1`).set({by: "mama", texto: "Hola", encargado: null, createdAt: 1});
    await db.doc(`${BASE}/cuentas/c1`).set({by: "mama", nombre: "Luz", monto: 1, dia: 5, pagado: {}});
    await db.doc(`${BASE}/salidas/s1`).set({by: "mama", quien: "hija", destino: "Colegio", estado: "en_camino", salioAt: 1});
    await db.doc(`mi_familia_invites/ABC123`).set({familyId: F, familyName: "Familia", role: "nino", by: "mama", expiresAt: Date.now() + 864e5});
    await db.doc(`mi_familia_invites/VIEJO1`).set({familyId: F, familyName: "Familia", role: "adulto", by: "mama", expiresAt: Date.now() - 1000});
  });
});

// ---------- aislamiento entre familias ----------

test("un miembro lee los avisos de su familia", async () => {
  await assertSucceeds(hija().doc(`${BASE}/avisos/a1`).get());
  await assertSucceeds(hija().collection(`${BASE}/avisos`).get());
});

test("alguien de fuera NO lee nada de la familia", async () => {
  await assertFails(extrano().doc(BASE).get());
  await assertFails(extrano().collection(`${BASE}/avisos`).get());
  await assertFails(extrano().collection(`${BASE}/members`).get());
  await assertFails(anon().doc(`${BASE}/avisos/a1`).get());
});

test("alguien de fuera NO puede escribir en la familia", async () => {
  await assertFails(extrano().collection(`${BASE}/avisos`).add({by: "extrano", texto: "spam"}));
  await assertFails(extrano().doc(`${BASE}/sos/x`).set({by: "extrano", at: 1}));
});

test("colecciones desconocidas están cerradas", async () => {
  await assertFails(mama().collection(`${BASE}/cualquiera`).add({by: "mama"}));
  await assertFails(mama().collection(`${BASE}/cualquiera`).get());
});

// ---------- autoría ----------

test("se crea con by = uno mismo, no a nombre de otro", async () => {
  await assertSucceeds(hija().collection(`${BASE}/compras`).add({by: "hija", texto: "Cereal"}));
  await assertFails(hija().collection(`${BASE}/compras`).add({by: "mama", texto: "Cereal"}));
});

test("cualquiera colabora (yo me encargo) pero no cambia el autor", async () => {
  await assertSucceeds(hija().doc(`${BASE}/avisos/a1`).update({encargado: "hija"}));
  await assertFails(hija().doc(`${BASE}/avisos/a1`).update({by: "hija"}));
});

test("solo el autor o un admin borran", async () => {
  await assertFails(hija().doc(`${BASE}/avisos/a1`).delete());
  await assertFails(abuela().doc(`${BASE}/avisos/a1`).delete());
  await assertSucceeds(mama().doc(`${BASE}/avisos/a1`).delete());
});

test("quien viaja puede cancelar su salida aunque la anotó otro", async () => {
  await assertSucceeds(hija().doc(`${BASE}/salidas/s1`).update({estado: "llego", llegoAt: 2}));
  await assertSucceeds(hija().doc(`${BASE}/salidas/s1`).delete());
});

// ---------- cuentas y fijados: solo adultos ----------

test("niños no ven ni tocan las cuentas", async () => {
  await assertFails(hija().doc(`${BASE}/cuentas/c1`).get());
  await assertFails(hija().collection(`${BASE}/cuentas`).get());
  await assertFails(hija().collection(`${BASE}/cuentas`).add({by: "hija", nombre: "x"}));
  await assertSucceeds(abuela().doc(`${BASE}/cuentas/c1`).get());
  await assertSucceeds(abuela().doc(`${BASE}/cuentas/c1`).update({"pagado.2026-10": {by: "abuela", at: 1}}));
});

test("niños no fijan información", async () => {
  await assertFails(hija().collection(`${BASE}/fijados`).add({by: "hija", titulo: "x"}));
  await assertSucceeds(abuela().collection(`${BASE}/fijados`).add({by: "abuela", titulo: "WiFi"}));
});

// ---------- respuestas: una por persona y día ----------

test("respuesta del día con id fecha_uid, y no se edita la de otro", async () => {
  await assertSucceeds(hija().doc(`${BASE}/respuestas/2026-10-08_hija`).set({by: "hija", fecha: "2026-10-08", texto: "hola"}));
  await assertFails(hija().doc(`${BASE}/respuestas/2026-10-08_mama`).set({by: "hija", fecha: "2026-10-08", texto: "x"}));
  await assertFails(mama().doc(`${BASE}/respuestas/2026-10-08_hija`).update({texto: "cambiado"}));
});

// ---------- miembros y roles ----------

test("nadie se sube el rol solo", async () => {
  await assertFails(hija().doc(`${BASE}/members/hija`).update({role: "admin"}));
  await assertFails(abuela().doc(`${BASE}/members/abuela`).update({role: "admin"}));
  await assertSucceeds(hija().doc(`${BASE}/members/hija`).update({mood: "😄", moodAt: 1}));
});

test("solo un admin cambia roles de otros", async () => {
  await assertFails(abuela().doc(`${BASE}/members/hija`).update({role: "adulto"}));
  await assertSucceeds(mama().doc(`${BASE}/members/hija`).update({role: "adulto"}));
});

test("un adulto completa la ficha médica de otro, pero nada más", async () => {
  await assertSucceeds(abuela().doc(`${BASE}/members/hija`).update({medical: {alergias: "maní"}}));
  await assertFails(abuela().doc(`${BASE}/members/hija`).update({name: "Otra"}));
  await assertFails(hija().doc(`${BASE}/members/abuela`).update({medical: {alergias: "x"}}));
});

test("un admin saca a alguien; un adulto no", async () => {
  await assertFails(abuela().doc(`${BASE}/members/hija`).delete());
  await assertSucceeds(mama().doc(`${BASE}/members/hija`).delete());
});

test("cada uno puede salir de la familia", async () => {
  await assertSucceeds(hija().doc(`${BASE}/members/hija`).delete());
});

// ---------- ubicación ----------

test("la ubicación en vivo solo la escribe su dueño", async () => {
  await assertSucceeds(hija().doc(`${BASE}/ubicaciones/hija`).set({lat: 1, lng: 2, at: 1, hasta: 2}));
  await assertFails(mama().doc(`${BASE}/ubicaciones/hija`).set({lat: 9, lng: 9, at: 1, hasta: 2}));
  await assertSucceeds(mama().doc(`${BASE}/ubicaciones/hija`).get());
  await assertFails(extrano().doc(`${BASE}/ubicaciones/hija`).get());
});

// ---------- entrar a una familia ----------

test("con una invitación válida se entra con el rol de la invitación", async () => {
  await assertSucceeds(extrano().doc("mi_familia_invites/ABC123").get());
  await assertSucceeds(extrano().doc(`${BASE}/members/extrano`).set({name: "Nuevo", role: "nino", invite: "ABC123"}));
});

test("no se puede entrar con otro rol del que dice la invitación", async () => {
  await assertFails(extrano().doc(`${BASE}/members/extrano`).set({name: "Nuevo", role: "admin", invite: "ABC123"}));
});

test("invitaciones vencidas o inexistentes no sirven", async () => {
  await assertFails(extrano().doc(`${BASE}/members/extrano`).set({name: "Nuevo", role: "adulto", invite: "VIEJO1"}));
  await assertFails(extrano().doc(`${BASE}/members/extrano`).set({name: "Nuevo", role: "nino", invite: "NOEXIS"}));
  await assertFails(extrano().doc(`${BASE}/members/extrano`).set({name: "Nuevo", role: "nino"}));
});

test("no se pueden listar las invitaciones", async () => {
  await assertFails(extrano().collection("mi_familia_invites").get());
});

test("crear invitaciones: adultos (no admin) y nunca para otra familia", async () => {
  const inv = (by, role, extra = {}) => ({familyId: F, familyName: "Familia", role, by, createdAt: 1, expiresAt: Date.now() + 864e5, ...extra});
  await assertSucceeds(abuela().doc("mi_familia_invites/NUEVO1").set(inv("abuela", "adulto")));
  await assertFails(abuela().doc("mi_familia_invites/NUEVO2").set(inv("abuela", "admin")));
  await assertSucceeds(mama().doc("mi_familia_invites/NUEVO3").set(inv("mama", "admin")));
  await assertFails(hija().doc("mi_familia_invites/NUEVO4").set(inv("hija", "nino")));
  await assertFails(extrano().doc("mi_familia_invites/NUEVO5").set(inv("extrano", "nino")));
  await assertFails(mama().doc("mi_familia_invites/NUEVO6").set(inv("mama", "nino", {expiresAt: Date.now() + 60 * 864e5})));
});

test("crear una familia: el creador entra como admin", async () => {
  await assertSucceeds(extrano().doc("mi_familia_families/nueva").set({name: "Nueva", ownerUid: "extrano", createdAt: 1}));
  await assertSucceeds(extrano().doc("mi_familia_families/nueva/members/extrano").set({name: "Yo", role: "admin"}));
  await assertFails(hija().doc("mi_familia_families/nueva/members/hija").set({name: "Colada", role: "admin"}));
});

test("no se crea una familia a nombre de otro", async () => {
  await assertFails(extrano().doc("mi_familia_families/otra").set({name: "X", ownerUid: "mama"}));
});

// ---------- mi_familia_users ----------

test("mi_familia_users/{uid} es privado", async () => {
  await assertSucceeds(hija().doc("mi_familia_users/hija").set({familias: {[F]: "Familia"}, fcmTokens: ["t"]}));
  await assertFails(mama().doc("mi_familia_users/hija").get());
});

// ---------- colegio ----------

test("un adulto envía una tarea al hijo/a y el hijo/a la marca vista y lista", async () => {
  const ref = mama().collection(`${BASE}/colegio`).doc("t1");
  await assertSucceeds(ref.set({by: "mama", para: "hija", tipo: "prueba", titulo: "Fracciones", fecha: "2026-10-09", hecho: false}));
  await assertSucceeds(hija().doc(`${BASE}/colegio/t1`).update({vistoAt: 1}));
  await assertSucceeds(hija().doc(`${BASE}/colegio/t1`).update({hecho: true, hechoAt: 2, hechoBy: "hija"}));
  await assertFails(hija().doc(`${BASE}/colegio/t1`).update({by: "hija"}));
});

test("el hijo/a anota sus propias tareas, pero no a nombre de otro", async () => {
  await assertSucceeds(hija().collection(`${BASE}/colegio`).add({by: "hija", para: "hija", tipo: "tarea", titulo: "Inglés", hecho: false}));
  await assertFails(hija().collection(`${BASE}/colegio`).add({by: "mama", para: "hija", tipo: "tarea", titulo: "x", hecho: false}));
});

test("alguien de fuera no ve las tareas del colegio", async () => {
  await assertFails(extrano().collection(`${BASE}/colegio`).get());
});

// ---------- convivencia con Rol de turnos ----------

test("Rol de turnos sigue igual: cada uno ve solo sus datos", async () => {
  await assertSucceeds(as("ana").doc("users/ana").set({nombre: "Ana"}));
  await assertSucceeds(as("ana").doc("users/ana/meta/config").set({x: 1}));
  await assertSucceeds(as("ana").doc("users/ana/extras/2026-10-08").set({horas: 2}));
  await assertFails(as("beto").doc("users/ana").get());
  await assertFails(as("beto").doc("users/ana/extras/2026-10-08").get());
  await assertFails(anon().doc("users/ana").get());
});

test("un usuario de Rol de turnos no ve nada de Mi Familia", async () => {
  await assertFails(as("ana").doc(BASE).get());
  await assertFails(as("ana").collection(`${BASE}/avisos`).get());
  await assertFails(as("ana").collection(`${BASE}/ubicaciones`).get());
});

test("todo lo que no está en las reglas sigue bloqueado", async () => {
  await assertFails(mama().collection("otra_cosa").add({x: 1}));
  await assertFails(mama().doc("families/fam1").get());
});
