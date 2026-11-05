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
    'gestionarEncomiendaMiComunidad', 'verificarFichaMiComunidad',
    'consultarLicenciaMiComunidad', 'crearCheckoutMiComunidad',
  ];
  // El grupo comercial se valida solo tras su publicación explícita separada.
  if(process.argv.includes('--commercial'))functions.push('cotizarPlanMiComunidad',
      'resolverRevisionPagoMiComunidad', 'reiniciarCheckoutFallidoMiComunidad');
  // Las funciones nuevas solo existen publicadas después del deploy.
  if(process.argv.includes('--release'))functions.push('registrarPagoOperativoMiComunidad', 'gestionarIntegrantesFichaMiComunidad', 'confirmarIngresoComunidad', 'conciliarMovimientoComunidad', 'desvincularConciliacionComunidad', 'generarCobrosMiComunidad',
      'directorioConserjeriaMiComunidad', 'cambiarEstadoAdminMiComunidad', 'cambiarEstadoCuentaMiComunidad', 'crearAdministradorMiComunidad',
      'resumenComercialMiComunidad', 'historialPagosMiComunidad', 'rehabilitarLicenciaMiComunidad');
  for (const name of functions) {
    // Usar datos estructuralmente válidos para llegar al control de sesión.
    // Ninguna solicitud incluye credenciales ni puede operar una comunidad real.
    const scope = {comunidadId:'smoke-sin-sesion', id:'smoke-sin-sesion'};
    const payloads = {
      registrarPagoOperativoMiComunidad: {...scope,tipo:'remuneracion'},
      confirmarIngresoComunidad: {...scope,tipo:'gasto'},
      conciliarMovimientoComunidad: {...scope,tipo:'gasto',movimientoId:'smoke-sin-sesion'},
      desvincularConciliacionComunidad: {...scope,movimientoId:'smoke-sin-sesion',motivo:'Comprobación pública de rechazo sin sesión'},
      gestionarIntegrantesFichaMiComunidad: {...scope,uid:'smoke-sin-sesion',tipo:'familiares',accion:'agregar',persona:{nombre:'Ensayo sin sesión',rut:'',parentesco:'Prueba'}},
    };
    const response = await fetch(`https://us-central1-mercado-ciudadano.cloudfunctions.net/${name}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({data: payloads[name] || {}}),
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
