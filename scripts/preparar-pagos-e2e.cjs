'use strict';
// Prepara archivos locales; nunca publica, crea secretos ni toca datos remotos.
const fs = require('node:fs');
const path = require('node:path');
const {SECRETS} = require('./preparar-pagos-produccion.cjs');
const PROJECT = 'mercado-ciudadano';
const WEBHOOK = `https://us-central1-${PROJECT}.cloudfunctions.net/webhookMercadoPagoMiComunidadE2E`;
const NAMESPACE = 'mi_comunidad_e2e';
const FUNCTIONS = ['cotizarPlanMiComunidadE2E', 'crearCheckoutMiComunidadE2E',
  'webhookMercadoPagoMiComunidadE2E', 'conciliarPagosMiComunidadE2E',
  'resolverRevisionPagoMiComunidadE2E', 'reiniciarCheckoutFallidoMiComunidadE2E'];
function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error('El candidato cambió: revisar transformación E2E.');
  return source.replace(before, after);
}
function namespace(source) {
  const transformed = source.replace(/\bmi_comunidad(?=_|\b)/g, NAMESPACE);
  if (/\bmi_comunidad(?!_e2e)(?=_|\b)/.test(transformed)) throw new Error('Namespace productivo restante.');
  return transformed;
}
function transformPayment(source) {
  for (const name of SECRETS) {
    source = replaceOnce(source, `defineSecret("${name}")`, `defineSecret("${name}_E2E")`);
  }
  source = namespace(source);
  source = replaceOnce(source,
    'if(!["test","production"].includes(environment)||!Number.isSafeInteger(amount)||amount<=0)',
    'if(environment!=="test"||amount!==1000)');
  source = replaceOnce(source, 'async function mpRequest(path, token, options = {}) {',
    'async function mpRequest(path, token, options = {}) {\n  if(MP_ENVIRONMENT.value()!=="test")throw new HttpsError("failed-precondition","E2E exige entorno TEST.");');
  source = replaceOnce(source, 'if(!/^https:\\/\\//.test(url))', `if(url!==${JSON.stringify(WEBHOOK)})`);
  source = replaceOnce(source, 'secrets: [ACCESS_TOKEN, WEBHOOK_SECRET]', 'secrets: [ACCESS_TOKEN, WEBHOOK_SECRET, MP_ENVIRONMENT]');
  source = replaceOnce(source, 'secrets: [ACCESS_TOKEN],', 'secrets: [ACCESS_TOKEN, MP_ENVIRONMENT],');
  return source + '\n// Solo la entrada E2E importa este parámetro, sin revelar su valor.\nmodule.exports.E2E_ENVIRONMENT=MP_ENVIRONMENT;\n';
}
function transformReview(source) {
  source = namespace(source);
  if(source.split('secrets:[ACCESS_TOKEN]').length!==3)throw new Error('Revisar enlaces E2E de las dos acciones de revisión.');
  source = source.replaceAll('secrets:[ACCESS_TOKEN]', 'secrets:[ACCESS_TOKEN, MP_ENVIRONMENT]');
  return '"use strict";\nconst MP_ENVIRONMENT=require("./mercadopago").E2E_ENVIRONMENT;\n'+source;
}
// Las otras funciones del repositorio no se importan ni se exportan.
const ENTRY = `"use strict";
const {initializeApp}=require("firebase-admin/app");
const {getFirestore}=require("firebase-admin/firestore");
const {setGlobalOptions}=require("firebase-functions/v2");
const {onCall,HttpsError}=require("firebase-functions/v2/https");
setGlobalOptions({maxInstances:1,concurrency:1});
initializeApp();
const mp=require("./mercadopago");
const registered=mp.registerMercadoPago();
const reviews=require("./rehabilitacion");
exports.cotizarPlanMiComunidadE2E=registered.cotizarPlanMiComunidad;
exports.crearCheckoutMiComunidadE2E=registered.crearCheckoutMiComunidad;
exports.webhookMercadoPagoMiComunidadE2E=registered.webhookMercadoPagoMiComunidad;
exports.resolverRevisionPagoMiComunidadE2E=reviews.resolverRevisionPagoMiComunidad;
exports.reiniciarCheckoutFallidoMiComunidadE2E=reviews.reiniciarCheckoutFallidoMiComunidad;
// Ejecución explícita: no crear Scheduler ni conciliación periódica durante E2E.
exports.conciliarPagosMiComunidadE2E=onCall({secrets:[mp.ACCESS_TOKEN,mp.E2E_ENVIRONMENT],timeoutSeconds:540},async request=>{
  if(!request.auth?.uid||request.auth.token?.app!=="mi_comunidad_e2e"||request.auth.token.role!=="superadmin")throw new HttpsError("permission-denied","Solo superadministración E2E.");
  if(mp.E2E_ENVIRONMENT.value()!=="test")throw new HttpsError("failed-precondition","E2E exige entorno TEST.");
  await mp.reconcilePayments(getFirestore(),mp.ACCESS_TOKEN.value());
  return {ok:true};
});
`;
function stage(root, destination) {
  if (fs.existsSync(destination)) throw new Error('El destino debe ser nuevo.');
  const source = path.join(root, 'functions');
  const payment = transformPayment(fs.readFileSync(path.join(source, 'mercadopago.js'), 'utf8'));
  const review = transformReview(fs.readFileSync(path.join(source, 'rehabilitacion.js'), 'utf8'));
  const license = namespace(fs.readFileSync(path.join(source, 'licencias.js'), 'utf8'));
  fs.mkdirSync(destination, {mode:0o700});
  const target = path.join(destination, 'functions');
  fs.mkdirSync(target, {mode:0o700});
  for (const name of ['package.json', 'package-lock.json']) fs.copyFileSync(path.join(source, name), path.join(target, name));
  for (const [name, content] of Object.entries({'mercadopago.js':payment, 'rehabilitacion.js':review, 'licencias.js':license, 'index.js':ENTRY})) {
    fs.writeFileSync(path.join(target, name), content, {mode:0o600});
  }
  fs.writeFileSync(path.join(destination, 'firebase.json'), JSON.stringify({functions:[{source:'functions',codebase:'mi-comunidad-e2e',ignore:['node_modules','.*','*.local']}]}, null, 2), {mode:0o600});
  fs.writeFileSync(path.join(destination, 'e2e-manifest.json'), JSON.stringify({project:PROJECT,namespace:NAMESPACE,amount:1000,environment:'test',webhook:WEBHOOK,functions:FUNCTIONS,secrets:SECRETS.map(name=>name+'_E2E'),published:false},null,2), {mode:0o600});
}
module.exports={stage,transformPayment,transformReview,namespace,FUNCTIONS,WEBHOOK,NAMESPACE,ENTRY};
if(require.main===module){
  if(process.argv.length!==3)throw new Error('Uso: node scripts/preparar-pagos-e2e.cjs DESTINO_NUEVO');
  stage(path.join(__dirname,'..'),path.resolve(process.argv[2]));
  console.log('Candidato E2E local preparado; no publicado, sin secretos ni datos remotos.');
}
