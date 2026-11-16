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
    const body=definitions.get(name),fields=new Set(),collections=new Set(),claims=new Set(),literals=new Set(),strings=[];
    const code=body.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g,token=>{
      if(token.startsWith('//')||token.startsWith('/*'))return ' ';
      const plain=token.slice(1,-1);strings.push(plain);return `__literal${strings.length-1}__`;
    });
    const technicalKey=value=>typeof value==='string'&&/^[A-Za-z_][A-Za-z_]{0,39}$/.test(value);
    for(const m of code.matchAll(/\b([A-Za-z_]\w*)\.get\(\s*__literal(\d+)__/g))if(m[1]!=='token'&&technicalKey(strings[Number(m[2])]))fields.add(strings[Number(m[2])]);
    for(const m of code.matchAll(/\b[A-Za-z_]\w*\.([A-Za-z_][A-Za-z_]{0,39})/g))if(!['get','data','auth','token','uid','time'].includes(m[1]))fields.add(m[1]);
    for(const m of code.matchAll(/\.token\.get\(\s*__literal(\d+)__/g))if(technicalKey(strings[Number(m[1])]))claims.add(strings[Number(m[1])]);
    for(const m of code.matchAll(/\.token\.([A-Za-z_]\w*)/g))if(m[1]!=='get')claims.add(m[1]);
    for(const m of code.matchAll(/\/documents\/([A-Za-z_]{1,40})\/\$\(/g))collections.add(m[1]);
    for(const value of strings)if(allowedLiterals.includes(value))literals.add(value);
    const dependencies=[...definitions.keys()].filter(key=>key!==name&&new RegExp('\\b'+key+'\\s*\\(').test(code));
    pending.push(...dependencies);
    out.push({helper:name,collections:[...collections].sort(),dataFields:[...fields].sort(),claimFields:[...claims].sort(),knownStatesOrRoles:[...literals].sort(),dependencies});
  }
  return out;
}

function keyRestrictionDetails(keys){
  return keys.map(key=>{
    const r=key.restrictions||{},refs=r.browserKeyRestrictions?.allowedReferrers||[],targets=r.apiTargets||[];
    if(!Array.isArray(refs)||!Array.isArray(targets))throw Error('Restricciones no comparables.');
    let allHosts=0,wildcardHosts=0,unclassified=0;
    for(const pattern of refs){
      if(typeof pattern!=='string'){unclassified++;continue;}
      if(['*','http://*/*','https://*/*','*://*/*'].includes(pattern)){allHosts++;continue;}
      try{
        const u=new URL(pattern);
        if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error();
        if(u.hostname.includes('*'))wildcardHosts++;
      }catch(_){unclassified++;}
    }
    const unrestricted=targets.length===0;
    const permits=service=>unrestricted||targets.some(t=>t.service===service);
    return {restrictionTypes:['browserKeyRestrictions','serverKeyRestrictions','androidKeyRestrictions','iosKeyRestrictions'].filter(k=>!!r[k]),
      browserReferrerCount:refs.length,allHostsPatternCount:allHosts,wildcardHostPatternCount:wildcardHosts,unclassifiedReferrerCount:unclassified,
      apiTargetCount:targets.length,apiTargetsWithoutMethodLimits:targets.filter(t=>!t.methods?.length).length,
      authApiInAllowlist:permits('identitytoolkit.googleapis.com'),tokenApiInAllowlist:permits('securetoken.googleapis.com')};
  });
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
    // Consultar explícitamente los servicios web usados, aunque services.list sea vacío.
    for(const [label,service] of Object.entries({appCheckAuth:'identitytoolkit.googleapis.com',appCheckFirestore:'firestore.googleapis.com',
      appCheckStorage:'firebasestorage.googleapis.com',appCheckDatabase:'firebasedatabase.googleapis.com'})){
      await check(label,async()=>{
        const value=await read(`https://firebaseappcheck.googleapis.com/v1/projects/${number}/services/${service}?fields=enforcementMode,replayProtection`);
        const mode=v=>{if(v===undefined)return 'UNSPECIFIED';if(!['OFF','UNENFORCED','ENFORCED'].includes(v))throw Error('Modo no verificable.');return v;};
        return {service,enforcementMode:mode(value.enforcementMode),replayProtection:mode(value.replayProtection),scope:'explicit-service-get'};
      });
    }
    // La API resourcePolicies solo admite OAuth de iOS actualmente; no inventar overrides de Firestore.
    await check('appCheckResourcePolicies',async()=>{
      const data=await read(`https://firebaseappcheck.googleapis.com/v1/projects/${number}/services/oauth2.googleapis.com/resourcePolicies?pageSize=100&fields=resourcePolicies(enforcementMode),nextPageToken`);
      if(data.nextPageToken)throw Error('Listado parcial de políticas.');
      const modes={OFF:0,UNENFORCED:0,ENFORCED:0,UNSPECIFIED:0};
      for(const p of data.resourcePolicies||[]){const mode=p.enforcementMode||'UNSPECIFIED';if(!Object.hasOwn(modes,mode))throw Error('Modo no verificable.');modes[mode]++;}
      return {scope:'oauth-ios-resource-policies-only',count:Object.values(modes).reduce((a,b)=>a+b,0),modes};
    });
    await check('apiKeyRestrictions', async () => {
      const data = await read(`https://apikeys.googleapis.com/v2/projects/${number}/locations/global/keys?pageSize=300&fields=keys(restrictions),nextPageToken`);
      if (data.nextPageToken) throw Error('Listado parcial de restricciones.');
      const keys = data.keys || [];
      const appRestricted = key => !!(key.restrictions?.browserKeyRestrictions || key.restrictions?.serverKeyRestrictions ||
        key.restrictions?.androidKeyRestrictions || key.restrictions?.iosKeyRestrictions);
      return {keysCount: keys.length, withApplicationRestriction: keys.filter(appRestricted).length,
        withApiRestriction: keys.filter(key => key.restrictions?.apiTargets?.length).length,
        scope:'presence-and-breadth-not-client-key-binding',details:keyRestrictionDetails(keys)};
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
module.exports = {configuration, apiFailure, storeAccessRequirements, keyRestrictionDetails};
if (require.main === module) main().catch(() => {console.error('No se completó la consulta de configuración; no se modificó Firebase.'); process.exitCode = 1;});
