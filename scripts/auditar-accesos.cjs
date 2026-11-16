'use strict';
// Inventario de SOLO LECTURA. No crea licencias, no cambia claims ni fichas.
// Salida sin correos, nombres, RUT, teléfonos, hashes ni credenciales.
const {createRequire} = require('node:module');
const path = require('node:path');
const {evaluateLicense} = require('../functions/licencias');

function options(argv) {
  const result = {details: false, requireClean: false};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--project') {
      if (result.projectId || !argv[i + 1] || argv[i + 1].startsWith('--')) throw Error('Indica un solo --project explícito.');
      result.projectId = argv[++i];
    } else if (argv[i] === '--details') result.details = true;
    else if (argv[i] === '--require-clean') result.requireClean = true;
    else throw Error('Opción no admitida. Usa --project ID [--details] [--require-clean].');
  }
  if (!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(result.projectId || '')) throw Error('Se requiere --project con un ID válido.');
  return result;
}

async function paged(collection, visit) {
  let last;
  for (;;) {
    let query = collection.orderBy('__name__').limit(500);
    if (last) query = query.startAfter(last);
    const snap = await query.get();
    for (const doc of snap.docs) await visit(doc);
    if (snap.docs.length < 500) return;
    last = snap.docs[snap.docs.length - 1];
  }
}

async function inventory(db, auth, {now = new Date(), details = false} = {}) {
  const communities = new Map();
  const issues = [];
  const issueCounts = Object.create(null);
  function issue(kind, comunidadId, uid) {
    issueCounts[kind] = (issueCounts[kind] || 0) + 1;
    if (details) issues.push({kind, ...(comunidadId ? {comunidadId} : {}), ...(uid ? {uid} : {})});
  }
  await paged(db.collection('mi_comunidad_comunidades'), async doc => {
    const license = await db.collection('mi_comunidad_licencias').doc(doc.id).get();
    const state = {admins: new Map()};
    communities.set(doc.id, state);
    if (!license.exists) issue('licencia_ausente', doc.id);
    else {
      const access = evaluateLicense(license.data(), now);
      if (!access.allowed) issue('licencia_sin_acceso', doc.id);
    }
    await paged(doc.ref.collection('administradores'), admin => {
      state.admins.set(admin.id, {enabled: admin.get('estado') !== 'Inactivo', seen: false});
    });
  });
  let pageToken;
  let appAccounts = 0;
  const usedTokens = new Set();
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) {
      const claims = user.customClaims || {};
      if (claims.app !== 'mi_comunidad') continue;
      appAccounts++;
      if (claims.role === 'superadmin') continue;
      const id = claims.comunidadId;
      const community = communities.get(id);
      if (!community) { issue('cuenta_sin_comunidad', id, user.uid); continue; }
      if (!['admin', 'conserje', 'residente'].includes(claims.role)) {
        issue('rol_desconocido', id, user.uid); continue;
      }
      const collection = {admin: 'administradores', conserje: 'conserjes', residente: 'residentes'}[claims.role];
      const account = await db.collection('mi_comunidad_comunidades').doc(id).collection(collection).doc(user.uid).get();
      if (claims.role === 'admin' && community.admins.has(user.uid)) community.admins.get(user.uid).seen = true;
      if (!account.exists) { issue('ficha_ausente_' + claims.role, id, user.uid); continue; }
      const enabled = account.get('estado') !== 'Inactivo';
      if (enabled === !!user.disabled) issue('estado_auth_ficha_inconsistente', id, user.uid);
      if (claims.role === 'residente' && account.get('depto') !== claims.depto) issue('departamento_inconsistente', id, user.uid);
    }
    pageToken = page.pageToken;
    if (pageToken && usedTokens.has(pageToken)) throw Error('Paginación Auth repetida; inventario incompleto.');
    if (pageToken) usedTokens.add(pageToken);
  } while (pageToken);
  for (const [id, community] of communities) {
    for (const [uid, admin] of community.admins) {
      if (admin.enabled && !admin.seen) issue('ficha_admin_sin_cuenta_valida', id, uid);
    }
  }
  const migrationBlockers = ['licencia_ausente', 'ficha_ausente_admin', 'cuenta_sin_comunidad',
    'rol_desconocido', 'estado_auth_ficha_inconsistente', 'departamento_inconsistente', 'ficha_admin_sin_cuenta_valida',
    'ficha_ausente_conserje', 'ficha_ausente_residente'];
  return {readOnly: true, scannedAt: now.toISOString(), communities: communities.size, appAccounts,
    issueCounts, readyForStrictAccess: migrationBlockers.every(kind => !issueCounts[kind]),
    ...(details ? {issues} : {})};
}

async function main(argv = process.argv.slice(2)) {
  const opts = options(argv); // Validar ANTES de inicializar SDK o consultar red.
  // Esta utilidad se ejecuta desde un equipo/CI con ADC ya configurado.
  // No intenta descubrir credenciales a través de servidores de metadatos.
  const fs = require('node:fs');
  const adc = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(
    process.env.CLOUDSDK_CONFIG || path.join(require('node:os').homedir(), '.config/gcloud'),
    'application_default_credentials.json');
  if (!fs.existsSync(adc)) throw Error('Falta configurar ADC de solo lectura.');
  const sdk = createRequire(path.join(__dirname, '../functions/package.json'));
  const {initializeApp, applicationDefault, deleteApp} = sdk('firebase-admin/app');
  const {getFirestore} = sdk('firebase-admin/firestore');
  const {getAuth} = sdk('firebase-admin/auth');
  const app = initializeApp({projectId: opts.projectId, credential: applicationDefault()}, 'auditoria-solo-lectura');
  try {
    const report = await inventory(getFirestore(app), getAuth(app), opts);
    console.log(JSON.stringify({projectId: opts.projectId, ...report}, null, 2));
    if (opts.requireClean && !report.readyForStrictAccess) process.exitCode = 2;
  } finally { await deleteApp(app); }
}
module.exports = {inventory, options, paged};
if (require.main === module) main().catch(() => {
  // No reproducir mensajes del SDK que puedan incluir datos privados.
  console.error('Inventario incompleto. Comprueba --project, credenciales ADC de solo lectura y permisos de consulta Firestore/Auth.');
  process.exitCode = 1;
});
