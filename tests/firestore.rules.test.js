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
    await db.doc(`${BASE}/conserjes/con1`).set({nombre: "Conserje", estado: "Activo"});
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

test("entregas de encomiendas solo se actualizan mediante el servidor", async () => {
  const db=conserje();
  await assertFails(db.doc(`${BASE}/encomiendas/e1`).update({estado: "En proceso de entrega"}));
  await assertFails(db.doc(`${BASE}/encomiendas/e1`).update({estado: "Entregado"}));
  await assertFails(db.doc(`${BASE}/encomiendas/e2`).set({estado:"Recibido",depto:"101"}));
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

// ---- conciliación bancaria ----

const movBanco = {fecha: "2026-09-02", descripcion: "TRANSF DEPTO 101", monto: 85000, saldo: 100000,
  periodo: "2026-09", orden: 1, estado: "Pendiente", importacionId: "i1", ts: 1};

test("administración importa y concilia movimientos bancarios", async () => {
  const db = adminDb();
  const ref = db.doc(`${BASE}/movimientosBancarios/m1`);
  await assertSucceeds(ref.set(movBanco));
  await assertSucceeds(ref.update({estado: "Conciliado", asociado: {tipo: "gasto", id: "g1"}}));
  await assertSucceeds(db.collection(`${BASE}/historialConciliacion`).add({
    accion: "conciliar", movimientoId: "m1", porUid: "adm1", ts: 1}));
  await assertSucceeds(db.collection(`${BASE}/saldosAFavor`).add({depto: "101", monto: 5000}));
  await assertSucceeds(db.collection(`${BASE}/importacionesBancarias`).add({archivo: "c.csv"}));
});

test("NO se puede cambiar el monto ni borrar un movimiento bancario", async () => {
  await env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc(`${BASE}/movimientosBancarios/m1`).set(movBanco));
  const ref = adminDb().doc(`${BASE}/movimientosBancarios/m1`);
  await assertFails(ref.update({monto: 1}));
  await assertFails(ref.delete());
});

test("el historial de conciliación es solo-agregar y a nombre propio", async () => {
  await env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc(`${BASE}/historialConciliacion/h1`).set({porUid: "adm1"}));
  const db = adminDb();
  await assertFails(db.doc(`${BASE}/historialConciliacion/h1`).update({por: "otro"}));
  await assertFails(db.doc(`${BASE}/historialConciliacion/h1`).delete());
  await assertFails(db.collection(`${BASE}/historialConciliacion`).add({porUid: "otro-uid"}));
});

test("conserjería y residentes NO ven la conciliación bancaria", async () => {
  await env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc(`${BASE}/movimientosBancarios/m1`).set(movBanco));
  for (const db of [conserje(), residente()]) {
    await assertFails(db.doc(`${BASE}/movimientosBancarios/m1`).get());
    await assertFails(db.collection(`${BASE}/movimientosBancarios`).add(movBanco));
    await assertFails(db.collection(`${BASE}/saldosAFavor`).get());
  }
});


test('turnos, planes y bitácora son operativos: residentes no acceden', async()=>{
  await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();await db.doc(`${BASE}/turnos/t`).set({estado:'Activo'});await db.doc(`${BASE}/planesMantencion/p`).set({titulo:'Portón'});await db.doc(`${BASE}/novedades/n`).set({title:'Turno'});});
  for(const path of ['turnos/t','planesMantencion/p','novedades/n']){await assertSucceeds(conserje().doc(`${BASE}/${path}`).get());await assertFails(residente().doc(`${BASE}/${path}`).get());}
  await assertFails(adminDb().doc(`${BASE}/turnos/t`).update({estado:'Cerrado'}));
});
test('cada cuenta solo puede leer sus propias confirmaciones; administración ve todas',async()=>{
 await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();await db.doc(`${BASE}/lecturasAvisos/propia`).set({uid:'res1',avisoId:'a'});await db.doc(`${BASE}/lecturasAvisos/ajena`).set({uid:'otro',avisoId:'a'});});
 await assertSucceeds(residente().doc(`${BASE}/lecturasAvisos/propia`).get());await assertFails(residente().doc(`${BASE}/lecturasAvisos/ajena`).get());await assertSucceeds(residente().collection(`${BASE}/lecturasAvisos`).where('uid','==','res1').get());await assertSucceeds(adminDb().collection(`${BASE}/lecturasAvisos`).get());await assertFails(residente().doc(`${BASE}/lecturasAvisos/nueva`).set({uid:'res1',avisoId:'a'}));
});
test('conversación de solicitud respeta departamento y autor',async()=>{
 const {serverTimestamp}=require('firebase/firestore');
 await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();await db.doc(`${BASE}/incidencias/propia`).set({depto:'101',estado:'Pendiente'});await db.doc(`${BASE}/incidencias/ajena`).set({depto:'999',estado:'Pendiente'});});
 const mensaje={texto:'Gracias',foto:'',autorUid:'res1',autorNombre:'Ana',rol:'residente',ts:serverTimestamp()};
 await assertSucceeds(residente().doc(`${BASE}/incidencias/propia/mensajes/m1`).set(mensaje));await assertFails(residente().doc(`${BASE}/incidencias/ajena/mensajes/m1`).set({...mensaje,ts:serverTimestamp()}));await assertFails(residente().doc(`${BASE}/incidencias/propia/mensajes/m2`).set({...mensaje,autorUid:'adm1',ts:serverTimestamp()}));
});

// ---- datos del edificio, visitas anunciadas e invitados ----

test("administración edita contacto del edificio pero no plan, contadores ni pagos", async () => {
  await assertSucceeds(adminDb().doc(BASE).update({telefonoAdministracion: "+56 2 2222 2222"}));
  await assertFails(adminDb().doc(BASE).update({plan: "Enterprise"}));
  await assertFails(adminDb().doc(BASE).update({numResidentes: 0}));
  await assertFails(adminDb().doc(BASE).update({configuracionPago: {enlace: "javascript:alert(1)"}}));
});

test("visita anunciada solo con los campos de la app y en estado Pendiente", async () => {
  const visita = {depto: "101", nombre: "Pedro", rut: "", fecha: "2026-10-26", hora: "18:00", motivo: "", estado: "Pendiente", ts: 1};
  await assertSucceeds(residente().collection(`${BASE}/visitasProgramadas`).add(visita));
  await assertFails(residente().collection(`${BASE}/visitasProgramadas`).add({...visita, estado: "Ingresó"}));
  await assertFails(residente().collection(`${BASE}/visitasProgramadas`).add({...visita, extra: true}));
  await assertFails(residente().collection(`${BASE}/visitasProgramadas`).add({...visita, nombre: "x".repeat(151)}));
});

test("invitados de una reserva deben ser una lista acotada", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`${BASE}/reservas/r1`).set({depto: "101", lugar: "Quincho", fecha: "2099-01-01", hora: "10:00 - 14:00", bloqueId: "b1", estado: "Confirmada", invitados: []});
  });
  await assertSucceeds(residente().doc(`${BASE}/reservas/r1`).update({invitados: [{nombre: "Luis", rut: ""}]}));
  await assertFails(residente().doc(`${BASE}/reservas/r1`).update({invitados: "texto"}));
  await assertFails(residente().doc(`${BASE}/reservas/r1`).update({invitados: Array(101).fill({nombre: "x", rut: ""})}));
});

// ---- fichas, administración desactivada y altas acotadas ----

test("conserjería NO lee fichas de residentes; administración y el propio residente sí", async () => {
  await assertFails(conserje().doc(`${BASE}/residentes/res1`).get());
  await assertFails(conserje().collection(`${BASE}/residentes`).get());
  await assertSucceeds(adminDb().collection(`${BASE}/residentes`).get());
  await assertSucceeds(residente().doc(`${BASE}/residentes/res1`).get());
});

test("administración desactivada pierde el acceso aunque su token siga vigente", async () => {
  await assertSucceeds(adminDb().doc(`${BASE}/residentes/res1`).get());
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`${BASE}/administradores/adm1`).set({nombre: "Admin", estado: "Activo"});
  });
  await assertSucceeds(adminDb().doc(`${BASE}/residentes/res1`).get());
  await assertSucceeds(adminDb().doc(`${BASE}/administradores/adm1`).get());
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`${BASE}/administradores/adm1`).update({estado: "Inactivo"});
  });
  await assertFails(adminDb().doc(`${BASE}/residentes/res1`).get());
  await assertFails(adminDb().doc(BASE).get());
});

test("nadie escribe la lista de administradores desde el cliente", async () => {
  await assertFails(adminDb().doc(`${BASE}/administradores/adm1`).set({estado: "Activo"}));
  await assertFails(conserje().doc(`${BASE}/administradores/adm1`).get());
  await assertFails(residente().doc(`${BASE}/administradores/adm1`).get());
});

test("notificación de residente: solo campos conocidos y tamaños acotados", async () => {
  const n = {icon: "💵", titulo: "Pago informado", meta: "Depto 101", depto: "101", paraTodos: false, leidaPor: [], fecha: "26-10-2026", hora: "10:00", ts: 1};
  await assertSucceeds(residente().collection(`${BASE}/notificaciones`).add(n));
  await assertFails(residente().collection(`${BASE}/notificaciones`).add({...n, enlace: "https://x"}));
  await assertFails(residente().collection(`${BASE}/notificaciones`).add({...n, titulo: "x".repeat(201)}));
});

test("bitácoras de conserjería aceptan solo los campos de la app", async () => {
  const v = {patente: "ABCD12", depto: "101", tipo: "Ingreso", fecha: "2026-10-26", hora: "09:08\u202fp.\u00a0m.", ts: 1};
  await assertSucceeds(conserje().collection(`${BASE}/vehiculos`).add(v));
  await assertFails(conserje().collection(`${BASE}/vehiculos`).add({...v, extra: 1}));
  await assertFails(conserje().collection(`${BASE}/vehiculos`).add({...v, patente: "X".repeat(13)}));
  const a = {nombre: "Repartidor", rut: "", motivo: "Delivery", tipo: "Entrada", fecha: "2026-10-26", hora: "10:00", restringido: false, ts: 1};
  await assertSucceeds(conserje().collection(`${BASE}/accesos`).add(a));
  await assertFails(conserje().collection(`${BASE}/accesos`).add({...a, tipo: "Otro"}));
  const r = {patente: "ABCD12", depto: "101", categoria: "Sospechoso", notas: "", ts: 1};
  await assertSucceeds(conserje().collection(`${BASE}/vehiculosRegistrados`).add(r));
  await assertFails(conserje().collection(`${BASE}/vehiculosRegistrados`).add({...r, notas: "x".repeat(501)}));
});

// Regresión comercial: estas pruebas sí crean licencias en el emulador.
test('trial vencido corta lectura y escritura operativa; licencia vigente las permite', async()=>{
 const {Timestamp}=require('firebase/firestore');
 for(const [license,allowed] of [
  [{estado:'trial',trialEndsAt:Timestamp.fromMillis(1)},false],
  [{estado:'active',paidUntil:Timestamp.fromMillis(1)},false],
  [{estado:'suspended',paidUntil:Timestamp.fromMillis(4102444800000)},false],
  [{estado:'trial',trialEndsAt:Timestamp.fromMillis(4102444800000)},true],
  [{estado:'active',paidUntil:Timestamp.fromMillis(4102444800000)},true],
 ]){
  await env.withSecurityRulesDisabled(ctx=>ctx.firestore().doc(`mi_comunidad_licencias/${C}`).set(license));
  for(const db of [adminDb(),conserje(),residente()]){
   const check=allowed?assertSucceeds:assertFails;
   await check(db.doc(`${BASE}/encomiendas/e1`).get());
   await check(db.collection(`${BASE}/notificaciones`).add({titulo:'Prueba',depto:'101',paraTodos:false,leidaPor:[],ts:1}));
  }
 }
});
test('licencia solo es consultable por su admin o superadmin y nadie la modifica desde cliente',async()=>{
 await env.withSecurityRulesDisabled(ctx=>ctx.firestore().doc(`mi_comunidad_licencias/${C}`).set({estado:'trial'}));
 const superDb=env.authenticatedContext('super',{app:'mi_comunidad',role:'superadmin'}).firestore();
 const other=env.authenticatedContext('otro',token('admin',{comunidadId:'otro'})).firestore();
 for(const db of [adminDb(),superDb])await assertSucceeds(db.doc(`mi_comunidad_licencias/${C}`).get());
 for(const db of [residente(),conserje(),other])await assertFails(db.doc(`mi_comunidad_licencias/${C}`).get());
 for(const db of [adminDb(),superDb,residente(),other]){
  const ref=db.doc(`mi_comunidad_licencias/${C}`);
  await assertFails(ref.update({estado:'active'}));await assertFails(ref.delete());
 }
});
test('regresión compartida: anuncios públicos y almacén propio mantienen acceso aislado',async()=>{
 await env.withSecurityRulesDisabled(async ctx=>{
  await ctx.firestore().doc('anuncios/publico').set({aprobado:true,autorUid:'vendedor'});
  await ctx.firestore().doc('stores/dueno/products/p1').set({nombre:'Producto',stock:1});
 });
 await assertSucceeds(env.unauthenticatedContext().firestore().doc('anuncios/publico').get());
 const owner=env.authenticatedContext('dueno',{}).firestore();
 await assertSucceeds(owner.doc('stores/dueno/products/p1').get());
 await assertSucceeds(owner.doc('stores/dueno/products/p1').update({stock:2}));
 await assertFails(adminDb().doc('stores/dueno/products/p1').get());
 await assertFails(owner.doc(`${BASE}/encomiendas/e1`).get());
});
