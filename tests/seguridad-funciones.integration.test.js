'use strict';
// Funciones de identidad y cuentas contra los emuladores de Firestore y Auth.
const {test, before} = require('node:test');
const assert = require('node:assert/strict');
const enabled = !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
let api, db, auth;
before(() => {
  if (!enabled) return;
  const projectId = 'demo-mi-comunidad-seguridad';
  process.env.GCLOUD_PROJECT = projectId; process.env.FIREBASE_CONFIG = JSON.stringify({projectId});
  api = require('../functions/index');
  const sdk = require('node:module').createRequire(require.resolve('../functions/index'));
  db = sdk('firebase-admin/firestore').getFirestore();
  auth = sdk('firebase-admin/auth').getAuth();
});
let seq = 0;
async function fixture() {
  const id = 'seg-' + Date.now() + '-' + (++seq);
  const base = db.collection('mi_comunidad_comunidades').doc(id);
  await base.set({estado: 'Activa', adminNombre: 'Administración'});
  await base.collection('residentes').doc('r1').set({nombre: 'Ana', depto: '101', estado: 'Activo', rut: '111111111', telefono: '+56911111111',
    nombreDueno: 'Dueña', familiares: [{nombre: 'Luis', parentesco: 'Hijo', rut: '222222222'}], restringidos: [{nombre: 'Pedro', rut: '333333333', motivo: 'Orden judicial'}]});
  await base.collection('residentes').doc('r2').set({nombre: 'Berta', depto: '102', estado: 'Activo', rut: '444444444', familiares: [], restringidos: []});
  await base.collection('conserjes').doc('c1').set({nombre: 'Conserje Uno', estado: 'Activo'});
  const call = (name, data, uid = 'c1', role = 'conserje', extra = {}) => api[name].run({auth: {uid, token: {app: 'mi_comunidad', role, comunidadId: id, depto: '101', ...extra}}, data: {comunidadId: id, ...data}});
  return {id, base, call};
}
const sinComunidad = (name, data, uid, role) => api[name].run({auth: {uid, token: {app: 'mi_comunidad', role}}, data});

test('directorio de conserjería no incluye RUT, motivos ni datos de propiedad', {skip: !enabled}, async () => {
  const h = await fixture();
  await h.call('definirPreguntaSecretaMiComunidad', {uid: 'r1', pregunta: '¿Mascota?', respuesta: 'Luna'}, 'r1', 'residente');
  const {residentes} = await h.call('directorioConserjeriaMiComunidad', {});
  const ana = residentes.find(r => r.uid === 'r1');
  assert.equal(ana.nombre, 'Ana'); assert.equal(ana.telefono, '+56911111111'); assert.equal(ana.preguntaSecreta, '¿Mascota?');
  assert.deepEqual(ana.familiares, [{nombre: 'Luis', parentesco: 'Hijo'}]);
  assert.deepEqual(ana.restringidos, [{nombre: 'Pedro', rut: '333333333'}]);
  const texto = JSON.stringify(residentes);
  for (const dato of ['111111111', '222222222', 'Orden judicial', 'Dueña', 'hash', 'sal']) assert.ok(!texto.includes(dato), dato);
  assert.equal(residentes.find(r => r.uid === 'r2').preguntaSecreta, '');
  await assert.rejects(h.call('directorioConserjeriaMiComunidad', {}, 'r1', 'residente'), {code: 'permission-denied'});
});

test('respuesta correcta entrega la ficha protegida y todo intento queda auditado', {skip: !enabled}, async () => {
  const h = await fixture();
  await h.call('definirPreguntaSecretaMiComunidad', {uid: 'r1', pregunta: '¿Mascota?', respuesta: 'Luna'}, 'r1', 'residente');
  const mal = await h.call('verificarPreguntaSecretaMiComunidad', {uid: 'r1', respuesta: 'Sol'});
  assert.equal(mal.ok, false); assert.equal(mal.ficha, undefined);
  const bien = await h.call('verificarPreguntaSecretaMiComunidad', {uid: 'r1', respuesta: ' lúna '});
  assert.equal(bien.ok, true); assert.equal(bien.ficha.rut, '111111111'); assert.equal(bien.ficha.restringidos[0].motivo, 'Orden judicial');
  const audit = (await h.base.collection('auditoria').get()).docs.map(d => d.data());
  assert.deepEqual(audit.map(a => a.resultado).sort(), ['Correcta', 'Incorrecta']);
  assert.ok(audit.every(a => a.actorNombre === 'Conserje Uno' && a.depto === '101'));
});

test('bloqueo de 15 minutos y tope diario de intentos fallidos', {skip: !enabled}, async () => {
  const h = await fixture();
  await h.call('definirPreguntaSecretaMiComunidad', {uid: 'r1', pregunta: '¿Mascota?', respuesta: 'Luna'}, 'r1', 'residente');
  for (let i = 0; i < 4; i++) assert.equal((await h.call('verificarPreguntaSecretaMiComunidad', {uid: 'r1', respuesta: 'x' + i})).ok, false);
  await assert.rejects(h.call('verificarPreguntaSecretaMiComunidad', {uid: 'r1', respuesta: 'x'}), {code: 'resource-exhausted'});
  await assert.rejects(h.call('verificarPreguntaSecretaMiComunidad', {uid: 'r1', respuesta: 'Luna'}), {code: 'resource-exhausted'});
  // Simula que pasaron los 15 minutos con 14 fallos en el día: el siguiente fallo bloquea por 24 horas.
  await h.base.collection('secretos').doc('r1').update({bloqueadoHasta: 0, intentosFallidos: 0, fallosDia: 14, ventanaInicio: Date.now()});
  await assert.rejects(h.call('verificarPreguntaSecretaMiComunidad', {uid: 'r1', respuesta: 'mal'}), /24 horas/);
  const s = (await h.base.collection('secretos').doc('r1').get()).data();
  assert.ok(s.bloqueadoHasta > Date.now() + 23 * 3600 * 1000);
});

test('verificación manual solo sin pregunta configurada, auditada y avisada al depto', {skip: !enabled}, async () => {
  const h = await fixture();
  await assert.rejects(h.call('verificarFichaMiComunidad', {uid: 'r2', motivo: 'corto'}), {code: 'invalid-argument'});
  const r = await h.call('verificarFichaMiComunidad', {uid: 'r2', motivo: 'Cédula vista en conserjería'});
  assert.equal(r.ficha.rut, '444444444');
  assert.equal((await h.base.collection('auditoria').where('tipo', '==', 'Verificación manual de ficha').get()).size, 1);
  const avisos = (await h.base.collection('notificaciones').where('depto', '==', '102').get()).docs;
  assert.equal(avisos.length, 1); assert.equal(avisos[0].data().paraTodos, false);
  await h.call('definirPreguntaSecretaMiComunidad', {uid: 'r1', pregunta: '¿Mascota?', respuesta: 'Luna'}, 'r1', 'residente');
  await assert.rejects(h.call('verificarFichaMiComunidad', {uid: 'r1', motivo: 'Cédula vista en conserjería'}), {code: 'failed-precondition'});
  await assert.rejects(h.call('verificarFichaMiComunidad', {uid: 'r2', motivo: 'Cédula vista en conserjería'}, 'r1', 'residente'), {code: 'permission-denied'});
});

test('administración desactivada queda fuera de las funciones', {skip: !enabled}, async () => {
  const h = await fixture();
  await h.base.collection('administradores').doc('adm').set({nombre: 'Admin', estado: 'Inactivo'});
  await assert.rejects(h.call('generarCobrosMiComunidad', {monto: 1000, vencimiento: '2099-12-31'}, 'adm', 'admin'), {code: 'permission-denied'});
  await assert.rejects(h.call('directorioConserjeriaMiComunidad', {}, 'adm', 'admin'), {code: 'permission-denied'});
  await h.base.collection('administradores').doc('adm').update({estado: 'Activo'});
  assert.equal((await h.call('generarCobrosMiComunidad', {monto: 1000, vencimiento: '2099-12-31'}, 'adm', 'admin')).creados, 2);
});

test('restablecer clave: administración solo toca residentes y conserjes; claves de 8+', {skip: !enabled}, async () => {
  const h = await fixture();
  const crear = async (rol, extra = {}) => {
    const u = await auth.createUser({password: 'Clave-inicial-1'});
    await auth.setCustomUserClaims(u.uid, {app: 'mi_comunidad', role: rol, comunidadId: h.id, ...extra});
    return u.uid;
  };
  const residente = await crear('residente', {depto: '101'});
  const otroAdmin = await crear('admin');
  await assert.rejects(h.call('restablecerClaveMiComunidad', {uid: residente, nuevaClave: 'corta12'}, 'adm', 'admin'), {code: 'invalid-argument'});
  await h.call('restablecerClaveMiComunidad', {uid: residente, nuevaClave: 'Clave-nueva-123'}, 'adm', 'admin');
  assert.ok((await auth.getUser(residente)).tokensValidAfterTime);
  await assert.rejects(h.call('restablecerClaveMiComunidad', {uid: otroAdmin, nuevaClave: 'Clave-nueva-123'}, 'adm', 'admin'), {code: 'permission-denied'});
  await sinComunidad('restablecerClaveMiComunidad', {comunidadId: h.id, uid: otroAdmin, nuevaClave: 'Clave-nueva-123'}, 'super', 'superadmin');
});

test('superadmin desactiva y reactiva administración, y crea una nueva', {skip: !enabled}, async () => {
  const h = await fixture();
  const u = await auth.createUser({password: 'Clave-inicial-1', displayName: 'Admin Uno'});
  await auth.setCustomUserClaims(u.uid, {app: 'mi_comunidad', role: 'admin', comunidadId: h.id});
  await assert.rejects(h.call('cambiarEstadoAdminMiComunidad', {uid: u.uid, estado: 'Inactivo'}, 'adm', 'admin'), {code: 'permission-denied'});
  await sinComunidad('cambiarEstadoAdminMiComunidad', {comunidadId: h.id, uid: u.uid, estado: 'Inactivo'}, 'super', 'superadmin');
  assert.equal((await auth.getUser(u.uid)).disabled, true);
  assert.equal((await h.base.collection('administradores').doc(u.uid).get()).data().estado, 'Inactivo');
  await sinComunidad('cambiarEstadoAdminMiComunidad', {comunidadId: h.id, uid: u.uid, estado: 'Activo'}, 'super', 'superadmin');
  assert.equal((await auth.getUser(u.uid)).disabled, false);
  await assert.rejects(sinComunidad('cambiarEstadoAdminMiComunidad', {comunidadId: 'otra', uid: u.uid, estado: 'Inactivo'}, 'super', 'superadmin'), {code: 'permission-denied'});
  const rut = String(10000000 + seq) ; const dv = (() => {let s = 0, m = 2; for (let i = rut.length - 1; i >= 0; i--) {s += Number(rut[i]) * m; m = m === 7 ? 2 : m + 1;} const n = 11 - s % 11; return n === 11 ? '0' : n === 10 ? 'K' : String(n);})();
  await assert.rejects(sinComunidad('crearAdministradorMiComunidad', {comunidadId: h.id, nombre: 'Nueva', rut: rut + dv, password: 'corta'}, 'super', 'superadmin'), {code: 'invalid-argument'});
  const nuevo = await sinComunidad('crearAdministradorMiComunidad', {comunidadId: h.id, nombre: 'Nueva Admin', rut: rut + dv, password: 'Clave-segura-1'}, 'super', 'superadmin');
  assert.equal((await auth.getUser(nuevo.uid)).customClaims.role, 'admin');
  assert.equal((await h.base.get()).data().adminUid, nuevo.uid);
});

test('crear cuenta exige clave de 8+, estado válido y administración habilitada', {skip: !enabled}, async () => {
  const h = await fixture();
  const datos = {rol: 'residente', rut: '12.345.678-5', nombre: 'Carla', depto: '103', password: 'Clave-segura-1'};
  await assert.rejects(h.call('crearCuentaMiComunidad', {...datos, password: '1234567'}, 'adm', 'admin'), {code: 'invalid-argument'});
  await assert.rejects(h.call('crearCuentaMiComunidad', {...datos, estado: 'Admin'}, 'adm', 'admin'), {code: 'invalid-argument'});
  const conserje = await h.call('crearCuentaMiComunidad', {rol: 'conserje', rut: '9.876.543-3', nombre: 'Diego', turno: 'Noche', estado: 'Fuera de turno', password: 'Clave-segura-1'}, 'adm', 'admin');
  assert.equal((await h.base.collection('conserjes').doc(conserje.uid).get()).data().estado, 'Fuera de turno');
  await h.base.collection('administradores').doc('adm').set({estado: 'Inactivo'});
  await assert.rejects(h.call('crearCuentaMiComunidad', datos, 'adm', 'admin'), {code: 'permission-denied'});
});
