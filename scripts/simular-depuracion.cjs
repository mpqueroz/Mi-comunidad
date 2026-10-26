'use strict';
// Solo lectura: cuenta los registros que la depuración programada borraría
// hoy, por comunidad y colección, sin mostrar ningún dato personal.
const path = require('node:path');
const {createRequire} = require('node:module');

async function main() {
  const root = path.join(__dirname, '..');
  const sdk = createRequire(path.join(root, 'functions/package.json'));
  const {initializeApp, applicationDefault} = sdk('firebase-admin/app');
  const {getFirestore, Timestamp, FieldValue} = sdk('firebase-admin/firestore');
  const projectId = JSON.parse(require('node:fs').readFileSync(path.join(root, '.firebaserc'), 'utf8')).projects.default;
  initializeApp({credential: applicationDefault(), projectId});
  const {depurar, DEPURACION_ACTIVA} = require(path.join(root, 'functions/depuracion.js'));
  const resumen = await depurar(getFirestore(), {borrar: false, Timestamp, FieldValue});
  console.log(`Depuración ${DEPURACION_ACTIVA ? 'ACTIVA' : 'en simulación'}: registros vencidos por comunidad`);
  for (const c of resumen) console.log(`  ${c.comunidadId}: ${c.total} ${JSON.stringify(c.conteo)}`);
  console.log(`  Total: ${resumen.reduce((n, c) => n + c.total, 0)}`);
}
main().catch((err) => {console.error(err.message); process.exitCode = 1;});
