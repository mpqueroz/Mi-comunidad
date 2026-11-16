'use strict';
// Solo GET y lectura de reglas. Nunca solicita valores de claves ni secretos.
// Referencias oficiales:
// https://firebase.google.com/docs/reference/appcheck/rest/v1/projects.services/list
// https://firebase.google.com/docs/reference/firebase-management/rest/v1beta1/projects/get
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {section, endBlock} = require('./preparar-reglas-compartidas.cjs');
const {options} = require('./auditar-accesos.cjs');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

function apiFailure(status, body){
  const error = Object.assign(Error('Consulta no completada.'), {status});
  const allowed = ['SERVICE_DISABLED', 'IAM_PERMISSION_DENIED', 'ACCESS_TOKEN_SCOPE_INSUFFICIENT',
    'API_KEY_SERVICE_BLOCKED', 'SERVICE_NOT_ACTIVATED', 'SECURITY_POLICY_VIOLATED'];
  const details = Array.isArray(body?.error?.details) ? body.error.details : [];
  const reason = details.find(item => item?.['@type'] === 'type.googleapis.com/google.rpc.ErrorInfo' && allowed.includes(item.reason))?.reason;
  if(reason) error.reason = reason;
  return error;
}

// Describe solo requisitos técnicos de los helpers de Almacén; no emite código,
// mensajes, documentos, UID, correos ni literales arbitrarios de las reglas.
function storeAccessRequirements(source){
  const prefix=source.slice(0,section(source).start), definitions=new Map();
  for(const m of prefix.matchAll(/\bfunction\s+(\w+)\s*\([^)]*\)\s*\{/g)){
    if(definitions.has(m[1]))throw Error('Helper ambiguo.');
    definitions.set(m[1],prefix.slice(m.index,endBlock(prefix,m.index+m[0].length-1)));
  }
  const pending=['esDueno','esMiembroEquipo','rolEquipo'],seen=new Set(),out=[];
  const allowedLiterals=['Activo','Activa','Inactivo','Suspendida','active','trial','expired','suspended','past_due',
    'vendedor','admin','owner','almacen','almacen_digital','almacenDigital','mi_almacen','almacen-digital'];
  while(pending.length){
    const name=pending.pop();if(seen.has(name)||!definitions.has(name))continue;seen.add(name);
    const body=definitions.get(name),fields=new Set(),collections=new Set(),claims=new Set(),literals=new Set();
    for(const m of body.matchAll(/\.data\.([A-Za-z_]\w*)/g))if(m[1]!=='get')fields.add(m[1]);
    for(const m of body.matchAll(/\.data\.get\(\s*['"]([A-Za-z_][A-Za-z_]{0,39})['"]/g))fields.add(m[1]);
    for(const m of body.matchAll(/\.token(?:\.get\(\s*['"]([A-Za-z_][A-Za-z_]{0,39})['"]|\.([A-Za-z_]\w*))/g))claims.add(m[1]||m[2]);
    for(const m of body.matchAll(/\/documents\/([A-Za-z_]{1,40})\/\$\(/g))collections.add(m[1]);
    for(const m of body.matchAll(/['"]([^'"\n]*)['"]/g))if(allowedLiterals.includes(m[1]))literals.add(m[1]);
    const dependencies=[...definitions.keys()].filter(key=>key!==name&&new RegExp('\\b'+key+'\\s*\\(').test(body));
    pending.push(...dependencies);
    out.push({helper:name,collections:[...collections].sort(),dataFields:[...fields].sort(),claimFields:[...claims].sort(),knownStatesOrRoles:[...literals].sort(),dependencies});
  }
  return out;
}

async function configuration({projectId, localRules, getRules, read}) {
  if (!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(projectId)) throw Error('Proyecto inválido.');
  const report = {readOnly: true, projectId, complete: true};
  async function check(name, action) {
    try { report[name] = {verified: true, ...await action()}; }
    catch (error) {
      report.complete = false;
      report[name] = {verified: false, httpStatus: Number.isInteger(error.status) ? error.status : null,
        ...(['SERVICE_DISABLED', 'IAM_PERMISSION_DENIED', 'ACCESS_TOKEN_SCOPE_INSUFFICIENT', 'API_KEY_SERVICE_BLOCKED', 'SERVICE_NOT_ACTIVATED', 'SECURITY_POLICY_VIOLATED'].includes(error.reason) ? {reason: error.reason} : {})};
    }
  }
  await check('firestoreRules', async () => {
    const rules = await getRules();
    if (rules.source?.length !== 1 || typeof rules.source[0].content !== 'string') throw Error('Reglas no comparables.');
    const live = rules.source[0].content, a = section(live), b = section(localRules);
    return {deployedSha256: digest(live), repositorySha256: digest(localRules),
      storeAccessRequirements: storeAccessRequirements(live),
      sameMiComunidad: live.slice(a.start, a.end) === localRules.slice(b.start, b.end),
      sameOtherApps: live.slice(0, a.start) === localRules.slice(0, b.start) && live.slice(a.end) === localRules.slice(b.end)};
  });
  let number;
  await check('project', async () => {
    const project = await read(`https://firebase.googleapis.com/v1beta1/projects/${projectId}?fields=projectId,projectNumber`);
    if (project.projectId !== projectId || !/^\d+$/.test(String(project.projectNumber || ''))) throw Error('Proyecto no coincide.');
    number = String(project.projectNumber);
    return {matchesRequestedProject: true};
  });
  if (number) {
    await check('appCheck', async () => {
      const data = await read(`https://firebaseappcheck.googleapis.com/v1/projects/${number}/services?pageSize=100&fields=services(name,enforcementMode),nextPageToken`);
      if (data.nextPageToken) throw Error('Listado parcial de App Check.');
      return {scope: 'service-baseline-only', services: (data.services || []).map(service => ({
        service: String(service.name || '').split('/').at(-1), enforcementMode: service.enforcementMode || 'UNSPECIFIED'}))};
    });
    await check('apiKeyRestrictions', async () => {
      const data = await read(`https://apikeys.googleapis.com/v2/projects/${number}/locations/global/keys?pageSize=300&fields=keys(restrictions),nextPageToken`);
      if (data.nextPageToken) throw Error('Listado parcial de restricciones.');
      const keys = data.keys || [];
      const appRestricted = key => !!(key.restrictions?.browserKeyRestrictions || key.restrictions?.serverKeyRestrictions ||
        key.restrictions?.androidKeyRestrictions || key.restrictions?.iosKeyRestrictions);
      return {keysCount: keys.length, withApplicationRestriction: keys.filter(appRestricted).length,
        withApiRestriction: keys.filter(key => key.restrictions?.apiTargets?.length).length};
    });
  } else {
    report.appCheck = report.apiKeyRestrictions = {verified: false, reason: 'project-number-unavailable'};
  }
  await check('functionsMetadata', async () => {
    const data = await read(`https://cloudfunctions.googleapis.com/v2/projects/${projectId}/locations/-/functions?pageSize=1000&fields=functions(name,state,buildConfig(runtime)),nextPageToken,unreachable`);
    if (data.nextPageToken || data.unreachable?.length) throw Error('Listado parcial de funciones.');
    return {scope: 'metadata-only-not-source-code', functions: (data.functions || []).filter(fn =>
      String(fn.name || '').split('/').at(-1).endsWith('MiComunidad')).map(fn => ({
      name: fn.name.split('/').at(-1), state: fn.state || 'UNKNOWN', runtime: fn.buildConfig?.runtime || 'UNKNOWN'}))};
  });
  return report;
}

async function main() {
  const opts = options(process.argv.slice(2));
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) throw Error('ADC no disponible.');
  const sdk = createRequire(path.join(__dirname, '../functions/package.json'));
  const {initializeApp, applicationDefault, deleteApp} = sdk('firebase-admin/app');
  const {getSecurityRules} = sdk('firebase-admin/security-rules');
  const credential = applicationDefault();
  const app = initializeApp({projectId: opts.projectId, credential}, 'auditoria-configuracion');
  try {
    const report = await configuration({projectId: opts.projectId, localRules: fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8'),
      getRules: () => getSecurityRules(app).getFirestoreRuleset(), read: async url => {
        const {access_token: token} = await credential.getAccessToken();
        const response = await fetch(url, {method: 'GET', redirect: 'error', headers: {Authorization: `Bearer ${token}`}, signal: AbortSignal.timeout(30000)});
        if (!response.ok) {
          let body; try { body = await response.json(); } catch (_) {}
          throw apiFailure(response.status, body);
        }
        return response.json();
      }});
    console.log(JSON.stringify(report, null, 2));
    if (!report.complete) process.exitCode = 2;
  } finally { await deleteApp(app); }
}
module.exports = {configuration, apiFailure, storeAccessRequirements};
if (require.main === module) main().catch(() => {console.error('No se completó la consulta de configuración; no se modificó Firebase.'); process.exitCode = 1;});
