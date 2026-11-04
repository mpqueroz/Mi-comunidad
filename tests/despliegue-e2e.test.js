'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const {createRequire}=require('node:module');
const {spawnSync}=require('node:child_process');
const {stage,transformPayment,FUNCTIONS,WEBHOOK,ENTRY}=require('../scripts/preparar-pagos-e2e.cjs');
const {SECRETS}=require('../scripts/preparar-pagos-produccion.cjs');
const root=path.join(__dirname,'..');
function isolatedHarness(){
 const harnessPath=path.join(root,'functions/tests/checkout-harness.cjs');
 let source=fs.readFileSync(harnessPath,'utf8').replace(/\bmi_comunidad(?=_|\b)/g,'mi_comunidad_e2e');
 for(const name of SECRETS)source=source.replaceAll(name,name+'_E2E');
 source=source.replace("'https://example.invalid/webhook'",JSON.stringify(WEBHOOK));
 source=source.replace("vm.runInNewContext(fs.readFileSync(require.resolve('../mercadopago'),'utf8'),context);","vm.runInNewContext(transformPayment(fs.readFileSync(require.resolve('../mercadopago'),'utf8')),context);");
 const context={require:createRequire(harnessPath),module:{exports:{}},structuredClone,transformPayment,Buffer,URL,AbortSignal,Date};
 vm.runInNewContext(source,context);
 return context.module.exports.harness();
}
test('E2E: handlers checkout y webhook del candidato mutan solo el namespace de prueba',async()=>{
 const h=isolatedHarness();
 const productionLicense={estado:'active',paidUntil:'2030-01-01'};
 h.docs.set('mi_comunidad_licencias/test-edificio',productionLicense);
 h.docs.set('mi_comunidad_ordenes_pago/order000000000000001',{status:'paid'});
 await h.create();
 assert.equal(h.state.preference.notification_url,WEBHOOK);
 assert.equal(h.state.preference.items[0].unit_price,1000);
 assert.equal((await h.webhook()).code,200);
 const end=h.license().paidUntil.getTime();
 assert.equal(h.license().estado,'active');
 assert.equal((await h.webhook(true,'second-event')).code,200);
 assert.equal(h.license().paidUntil.getTime(),end);
 assert.equal(h.order().status,'paid');
 assert.deepEqual(h.docs.get('mi_comunidad_licencias/test-edificio'),productionLicense);
 assert.equal(h.docs.get('mi_comunidad_ordenes_pago/order000000000000001').status,'paid');
 const paths=[...h.docs.keys()].filter(p=>!['mi_comunidad_licencias/test-edificio','mi_comunidad_ordenes_pago/order000000000000001'].includes(p));
 assert.ok(paths.every(p=>p.startsWith('mi_comunidad_e2e_')));
});
test('E2E: claims productivos, entorno productivo, importe y webhook ajenos se rechazan antes del POST',async()=>{
 for(const change of [h=>h.auth.token.app='mi_comunidad',h=>h.secrets.MC_MP_ENVIRONMENT_E2E='production',h=>h.secrets.MC_PLAN_ANUAL_CLP_E2E='800000',h=>h.secrets.MC_MP_WEBHOOK_URL_E2E=WEBHOOK.replace('MiComunidadE2E','MiComunidad')]){
  const h=isolatedHarness();change(h);
  await assert.rejects(h.create());assert.equal(h.state.postCount,0);
  assert.equal(h.docs.size,2);
 }
});
test('E2E: webhook no consulta API si el entorno secreto dejó de ser test',async()=>{
 const h=isolatedHarness();await h.create();
 const calls=h.state.calls.length;
 h.secrets.MC_MP_ENVIRONMENT_E2E='production';
 assert.equal((await h.webhook()).code,500);
 assert.equal(h.state.calls.length,calls);
 assert.equal(h.license().estado,'trial');
});
test('E2E: copia privada con lista cerrada, nombres aislados y sin secretos o tareas periódicas exportadas',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-e2e-stage-'));
 try{
  const target=path.join(dir,'release');stage(root,target);
  assert.equal(fs.statSync(target).mode&0o777,0o700);
  assert.deepEqual(fs.readdirSync(path.join(target,'functions')).sort(),['index.js','licencias.js','mercadopago.js','package-lock.json','package.json','rehabilitacion.js']);
  const config=JSON.parse(fs.readFileSync(path.join(target,'firebase.json')));
  assert.equal(config.functions[0].codebase,'mi-comunidad-e2e');
  const manifest=JSON.parse(fs.readFileSync(path.join(target,'e2e-manifest.json')));
  assert.equal(manifest.published,false);
  assert.deepEqual(manifest.functions,FUNCTIONS);
  const payment=fs.readFileSync(path.join(target,'functions/mercadopago.js'),'utf8');
  const review=fs.readFileSync(path.join(target,'functions/rehabilitacion.js'),'utf8');
  for(const name of SECRETS){assert.ok(payment.includes(`defineSecret("${name}_E2E")`));assert.ok(!payment.includes(`defineSecret("${name}")`));}
  assert.doesNotMatch(payment+review,/\bmi_comunidad(?!_e2e)(?=_|\b)/);
  assert.ok(review.includes('secrets:[ACCESS_TOKEN, MP_ENVIRONMENT]'));
  assert.throws(()=>stage(root,target));
  const source=fs.readFileSync(path.join(root,'functions/mercadopago.js'),'utf8');
  assert.throws(()=>transformPayment(source.replace('amount<=0','amount<0')));
  assert.ok(!ENTRY.includes('registered.conciliarPagosMiComunidad'));
  const exported=[...ENTRY.matchAll(/exports\.(\w+)=/g)].map(x=>x[1]).sort();
  assert.deepEqual(exported,[...FUNCTIONS].sort());
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('E2E: conciliación manual exige superadmin aislado y test; no crea Scheduler',async()=>{
 let invoked=0,handler;
 const secret={value:()=>environment};let environment='test';
 const endpoint={};
 const mp={registerMercadoPago:()=>endpoint,ACCESS_TOKEN:secret,E2E_ENVIRONMENT:secret,reconcilePayments:async()=>{invoked++;}};
 const context={exports:{},require:name=>{
  if(name==='firebase-admin/app')return {initializeApp(){}};
  if(name==='firebase-admin/firestore')return {getFirestore:()=>({})};
  if(name==='firebase-functions/v2')return {setGlobalOptions(){}};
  if(name==='firebase-functions/v2/https')return {onCall:(opts,fn)=>{handler=fn;return fn;},HttpsError:class extends Error{}};
  if(name==='./mercadopago')return mp;
  if(name==='./rehabilitacion')return {};
  throw Error('Import inesperado '+name);
 }};
 vm.runInNewContext(ENTRY,context);
 for(const auth of [undefined,{uid:'u',token:{app:'mi_comunidad',role:'superadmin'}},{uid:'u',token:{app:'mi_comunidad_e2e',role:'admin'}}])await assert.rejects(handler({auth}));
 assert.equal(invoked,0);
 const request={auth:{uid:'u',token:{app:'mi_comunidad_e2e',role:'superadmin'}}};
 await handler(request);assert.equal(invoked,1);
 environment='production';await assert.rejects(handler(request));assert.equal(invoked,1);
});
test('E2E: script histórico bloquea sin ejecutar herramientas de nube',()=>{
 const result=spawnSync('bash',['scripts/desplegar-pagos-prueba.sh'],{cwd:root,encoding:'utf8',env:{PATH:'/usr/bin:/bin'}});
 assert.equal(result.status,1);assert.match(result.stderr,/BLOQUEADO/);
 assert.equal(result.stdout,'');
});
