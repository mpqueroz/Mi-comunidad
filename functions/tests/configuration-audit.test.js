'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {configuration} = require('../../scripts/auditar-configuracion.cjs');
const rules = fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8');

function fixture() {
  const urls = [];
  return {urls, projectId: 'demo-mi-comunidad', localRules: rules, getRules: async () => ({source: [{content: rules}]}),
    read: async url => {
      urls.push(url);
      if (url.startsWith('https://firebase.googleapis.com/')) return {projectId: 'demo-mi-comunidad', projectNumber: '123456'};
      if (url.startsWith('https://firebaseappcheck.googleapis.com/')) return {services: [{name: 'projects/123456/services/firestore.googleapis.com', enforcementMode: 'UNENFORCED'}]};
      if (url.startsWith('https://apikeys.googleapis.com/')) return {keys: [{keyString: 'NO-IMPRIMIR', displayName: 'NO-IMPRIMIR', restrictions: {browserKeyRestrictions: {}, apiTargets: [{}]}}, {}]};
      return {functions: [{name: 'projects/demo/locations/region/functions/crearCuentaMiComunidad', state: 'ACTIVE', buildConfig: {runtime: 'nodejs22'}, serviceConfig: {environmentVariables: {SECRET: 'NO-IMPRIMIR'}}},
        {name: 'projects/demo/locations/region/functions/otraAplicacion', buildConfig: {runtime: 'nodejs24'}}]};
    }};
}

test('configuración devuelve solo modos, conteos y metadatos; nunca claves o variables', async () => {
  const f = fixture(), report = await configuration(f);
  assert.equal(report.complete, true);
  assert.equal(report.firestoreRules.sameMiComunidad, true);
  assert.equal(report.firestoreRules.sameOtherApps, true);
  assert.equal(report.appCheck.services[0].enforcementMode, 'UNENFORCED');
  assert.equal(report.apiKeyRestrictions.keysCount, 2);
  assert.equal(report.apiKeyRestrictions.withApplicationRestriction, 1);
  assert.equal(report.functionsMetadata.functions.length, 1);
  assert.ok(!JSON.stringify(report).includes('NO-IMPRIMIR'));
  assert.ok(f.urls.every(url => new URL(url).searchParams.has('fields')));
});

test('reglas locales sin publicar se distinguen de cambios en las otras aplicaciones', async () => {
  const f = fixture(); f.localRules = rules.replace('function mcEsComunidadActiva(comunidadId) {', 'function mcEsComunidadActiva(comunidadId) {\n // nueva revisión');
  const report = await configuration(f);
  assert.equal(report.firestoreRules.sameMiComunidad, false);
  assert.equal(report.firestoreRules.sameOtherApps, true);
});

test('permiso denegado y respuestas parciales no se presentan como verificación completa', async () => {
  const f = fixture(), original = f.read;
  f.getRules = async () => { throw Object.assign(Error('NO-IMPRIMIR'), {status: 403}); };
  f.read = async url => url.startsWith('https://apikeys.googleapis.com/') ? {keys: [], nextPageToken: 'NO-IMPRIMIR'} : original(url);
  const report = await configuration(f);
  assert.equal(report.complete, false);
  assert.equal(report.firestoreRules.verified, false);
  assert.equal(report.firestoreRules.httpStatus, 403);
  assert.equal(report.apiKeyRestrictions.verified, false);
  assert.ok(!JSON.stringify(report).includes('NO-IMPRIMIR'));
});

test('proyecto diferente impide consultar restricciones o App Check de otro proyecto', async () => {
  const f = fixture(), original = f.read;
  f.read = async url => url.startsWith('https://firebase.googleapis.com/') ? {projectId: 'otro-proyecto', projectNumber: '999999'} : original(url);
  const report = await configuration(f);
  assert.equal(report.complete, false);
  assert.equal(report.project.verified, false);
  assert.equal(report.appCheck.verified, false);
  assert.ok(!f.urls.some(url => url.includes('firebaseappcheck') || url.includes('apikeys')));
});

test('diagnóstico de 403 distingue causas permitidas sin exponer mensaje, permiso ni metadatos',async()=>{
 const {apiFailure}=require('../../scripts/auditar-configuracion.cjs');
 for(const reason of ['SERVICE_DISABLED','IAM_PERMISSION_DENIED','ACCESS_TOKEN_SCOPE_INSUFFICIENT']){
  const f=fixture(),original=f.read;
  f.read=async url=>{
   if(url.startsWith('https://firebaseappcheck.googleapis.com/'))throw apiFailure(403,{error:{message:'NO-IMPRIMIR',details:[{'@type':'type.googleapis.com/google.rpc.ErrorInfo',reason,metadata:{permission:'NO-IMPRIMIR',service:'NO-IMPRIMIR'}}]}});
   return original(url);
  };
  const result=await configuration(f);assert.equal(result.appCheck.reason,reason);assert.equal(result.appCheck.httpStatus,403);assert.equal(result.complete,false);assert.ok(!JSON.stringify(result).includes('NO-IMPRIMIR'));
 }
 const unknown=apiFailure(403,{error:{details:[{'@type':'type.googleapis.com/google.rpc.ErrorInfo',reason:'NO-IMPRIMIR'}]}});
 assert.equal(unknown.reason,undefined);assert.equal(unknown.message,'Consulta no completada.');
});

test('requisitos de Almacén exponen esquema técnico y nunca literales privados del código',()=>{
 const {storeAccessRequirements}=require('../../scripts/auditar-configuracion.cjs');
 const fixture=rules.replace('function esDueno(storeId) {',`function licenciaAlmacen(storeId){
  let doc=get(/databases/$(database)/documents/almacen_licencias/$(storeId));
  let deadline=doc.get('validUntil',null);
  return doc.data.get('estado','') == 'active' && request.auth.token.get('app','') == 'almacen_digital' && 'NO-IMPRIMIR@example.invalid' != '';
 }
 function esDueno(storeId) {`)
 .replace(/function esDueno\(storeId\) \{/,"function esDueno(storeId) {\n // NO-IMPRIMIR\n");
 // Insert a technical dependency, without relying on its truth in this parser test.
 const withDependency=fixture.replace('function esDueno(storeId) {','function esDueno(storeId) {\n let valid=licenciaAlmacen(storeId);');
 const result=storeAccessRequirements(withDependency);
 const item=result.find(r=>r.helper==='licenciaAlmacen');assert.ok(item);assert.deepEqual(item.collections,['almacen_licencias']);assert.deepEqual(item.dataFields,['estado','validUntil']);assert.deepEqual(item.claimFields,['app']);assert.ok(!JSON.stringify(result).includes('NO-IMPRIMIR'));
});
