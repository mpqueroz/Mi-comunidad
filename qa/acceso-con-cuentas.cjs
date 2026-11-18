'use strict';

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const sdk = createRequire(require.resolve('../functions/package.json'));
const { initializeApp, deleteApp } = sdk('firebase-admin/app');
const { getAuth } = sdk('firebase-admin/auth');
const { getFirestore } = sdk('firebase-admin/firestore');

async function main() {
  const projectId = 'demo-mi-comunidad';
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  const app = initializeApp({ projectId });
  const auth = getAuth(app);
  const db = getFirestore(app);
  const community = db.collection('mi_comunidad_comunidades').doc();
  const license = db.collection('mi_comunidad_licencias').doc(community.id);
  const profiles = { admin: 'administradores', conserje: 'conserjes', residente: 'residentes' };
  const sessions = {};
  const authUrl = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo';
  const firestoreUrl = 'http://127.0.0.1:8080/v1/projects/' + projectId + '/databases/(default)/documents/';

  async function expectRead(role, path, status) {
    const response = await fetch(firestoreUrl + community.path + '/' + path, {
      headers: { Authorization: 'Bearer ' + sessions[role].idToken }
    });
    assert.equal(response.status, status, role + ' leyendo ' + path);
  }

  try {
    await community.set({estado: 'Activa'});
    await license.set({estado: 'active', paidUntil: new Date(Date.now() + 86400000)});
    await community.collection('avisos').doc('prueba').set({titulo: 'Ensayo'});
    for (const [role, collection] of Object.entries(profiles)) {
      const password = randomUUID();
      const email = randomUUID() + '@example.invalid';
      const { uid } = await auth.createUser({email, password});
      await auth.setCustomUserClaims(uid, {app: 'mi_comunidad', role, comunidadId: community.id, depto: '101'});
      await community.collection(collection).doc(uid).set({estado: 'Activo', depto: '101'});
      const response = await fetch(authUrl, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password, returnSecureToken: true})
      });
      assert.equal(response.status, 200, 'Inicio de sesión ' + role);
      const { localId, idToken } = await response.json();
      assert.equal(localId, uid);
      sessions[role] = {uid, idToken};
      await expectRead(role, collection + '/' + uid, 200);
      await expectRead(role, 'avisos/prueba', 200);
    }
    await expectRead('admin', 'residentes/' + sessions.residente.uid, 200);
    await expectRead('conserje', 'residentes/' + sessions.residente.uid, 403);
    await expectRead('residente', 'conserjes/' + sessions.conserje.uid, 403);
    await license.update({paidUntil: new Date(0)});
    for (const role of Object.keys(profiles)) await expectRead(role, 'avisos/prueba', 403);
    console.log('PASS: login de tres cuentas, permisos por ficha y vencimiento con sesiones abiertas');
  } finally {
    await db.terminate();
    await deleteApp(app);
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
