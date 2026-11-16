'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {enableAuditApis,argumentsFor,SERVICES}=require('../../scripts/habilitar-apis-auditoria.cjs');
const projectId='mercado-ciudadano';
function fixture(initial='DISABLED'){
 const calls=[],events=[],states=new Map(SERVICES.map(s=>[s,initial]));
 return {calls,events,projectId,apply:true,approved:true,wait:async()=>{},emit:e=>events.push(e),request:async(method,url)=>{
  calls.push({method,url});
  if(url.startsWith('https://firebase.googleapis.com/'))return {projectId,projectNumber:'12345'};
  if(url.includes('/operations/'))return {done:true};
  const service=SERVICES.find(s=>url.includes('/services/'+s));assert.ok(service,'API ajena');
  if(method==='GET')return {state:states.get(service)};
  assert.equal(method,'POST');assert.ok(url.endsWith(':enable'));states.set(service,'ENABLED');return {name:'operations/enable-'+service};
 }};
}
test('API: sin --apply no inicializa ADC ni consulta red; proyecto y aprobación son explícitos',async()=>{
 const f=fixture();const plan=await enableAuditApis({...f,apply:false});assert.deepEqual(plan.services,[...SERVICES]);assert.equal(f.calls.length,0);
 await assert.rejects(enableAuditApis({...f,approved:false}));assert.equal(f.calls.length,0);
 await assert.rejects(enableAuditApis({...f,projectId:'otro-proyecto'}));
 for(const args of [[],['--project','otro-proyecto'],['--project',projectId,'--services','iam.googleapis.com']])assert.throws(()=>argumentsFor(args));
 assert.deepEqual(argumentsFor(['--project',projectId,'--apply']),{projectId,apply:true});
});
test('API: únicamente habilita las dos autorizadas y verifica el estado final',async()=>{
 const f=fixture(),result=await enableAuditApis(f);
 assert.equal(f.calls.filter(c=>c.method==='POST').length,2);assert.equal(result.services.length,2);assert.ok(result.services.every(s=>s.changed&&s.after==='ENABLED'));
 assert.equal(f.events.length,2);assert.ok(f.calls.every(c=>c.method==='GET'||c.url.endsWith(':enable')));
});
test('API: habilitadas son idempotentes, y otro proyecto impide cualquier escritura',async()=>{
 const f=fixture('ENABLED');await enableAuditApis(f);assert.ok(!f.calls.some(c=>c.method==='POST'));
 const mismatch=fixture();mismatch.request=async()=>({projectId:'otro',projectNumber:'12345'});await assert.rejects(enableAuditApis(mismatch),/Proyecto no coincide/);
});
test('API: operaciones externas o estado incierto se rechazan sin seguir URLs arbitrarias',async()=>{
 const f=fixture(),request=f.request;f.request=async(method,url)=>method==='POST'?{name:'https://NO-IMPRIMIR.invalid'}:request(method,url);
 await assert.rejects(enableAuditApis(f),/Operación no válida/);assert.ok(!f.calls.some(c=>c.url.includes('NO-IMPRIMIR')));
 const unknown=fixture(),r=unknown.request;unknown.request=async(method,url)=>url.includes('serviceusage.googleapis.com')?{state:'UNKNOWN'}:r(method,url);
 await assert.rejects(enableAuditApis(unknown));assert.ok(!unknown.calls.some(c=>c.method==='POST'));
});
test('API: no oculta habilitación parcial ni emite errores o credenciales recibidos',async()=>{
 const f=fixture(),r=f.request;
 f.request=async(method,url)=>{if(method==='POST'&&url.includes('apikeys.googleapis.com'))throw Error('NO-IMPRIMIR');return r(method,url);};
 await assert.rejects(enableAuditApis(f));assert.equal(f.events.length,1);assert.equal(f.events[0].service,SERVICES[0]);assert.ok(!JSON.stringify(f.events).includes('NO-IMPRIMIR'));
});

test('API: identifica fase y servicio denegados sin divulgar el error remoto',async()=>{
 const {failureSummary}=require('../../scripts/habilitar-apis-auditoria.cjs');
 for(const phase of ['inspect-service','enable-service']){
  const f=fixture(),r=f.request;
  f.request=async(method,url)=>{
   if(url.includes('serviceusage.googleapis.com')&&(phase==='inspect-service'||method==='POST'))
    throw Object.assign(Error('SECRETO-REMOTO'),{status:403,reason:'NO-PUBLICAR'});
   return r(method,url);
  };
  let failure;try{await enableAuditApis(f);}catch(e){failure=e;}
  assert.deepEqual(failureSummary(failure),{event:'api-enablement-not-complete',httpStatus:403,phase,service:SERVICES[0]});
  assert.ok(!JSON.stringify(failureSummary(failure)).includes('SECRETO'));
  if(phase==='inspect-service')assert.ok(!f.calls.some(c=>c.method==='POST'));
 }
 assert.deepEqual(failureSummary({status:403,phase:'NO-PUBLICAR',service:'NO-PUBLICAR',reason:'NO-PUBLICAR'}),{event:'api-enablement-not-complete',httpStatus:403});
});
