'use strict';
// Comprobación pública sin credenciales, datos reales ni operaciones autorizadas.
const assert = require('node:assert/strict');

async function main() {
  const hosting = await fetch('https://mi-comunidad-md.web.app', {
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(hosting.status, 200, 'Hosting debe responder');
  assert.match(hosting.headers.get('content-type') || '', /text\/html/);
  console.log('Hosting: HTTP 200');
  if(process.argv.includes('--release')){
    assert.match(await hosting.text(), /httpsCallable\("generarCobrosMiComunidad"\)/,
        'Hosting debe servir la nueva generación de cobros');
    assert.match(hosting.headers.get('cache-control') || '', /no-cache/,
        'La portada debe permitir recuperar las actualizaciones');
  }

  const functions=[
    'crearCuentaMiComunidad', 'restablecerClaveMiComunidad',
    'crearReservaMiComunidad', 'configurarPagosMiComunidad',
    'gestionarEncomiendaMiComunidad',
  ];
  if(process.argv.includes('--release'))functions.push('generarCobrosMiComunidad');
  for (const name of functions) {
    const response = await fetch(`https://us-central1-mercado-ciudadano.cloudfunctions.net/${name}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({data: {}}),
      signal: AbortSignal.timeout(30000),
    });
    const result = await response.json();
    assert.ok([401, 403].includes(response.status), `${name}: HTTP inesperado ${response.status}`);
    assert.ok(['UNAUTHENTICATED', 'PERMISSION_DENIED'].includes(result.error?.status),
        `${name}: debe rechazar la solicitud sin sesión`);
    console.log(`${name}: HTTP ${response.status}, acceso sin sesión rechazado`);
  }
}

main().catch(error => {console.error(error.message); process.exitCode = 1;});
