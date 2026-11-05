'use strict';
// Preflight y verificación con las credenciales existentes de la CLI o ADC.
// Solo los tres parámetros comerciales no sensibles se leen por valor.
const path=require('node:path'),assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const tools=createRequire(path.join(__dirname,'../tests/package.json'));
const project='mercado-ciudadano';
const EXPECTED={crearCheckoutMiComunidad:['MC_MP_ACCESS_TOKEN','MC_PLAN_ANUAL_CLP','MC_MP_ENVIRONMENT','MC_MP_WEBHOOK_URL','MC_MP_TEST_ACCOUNT'],cotizarPlanMiComunidad:['MC_PLAN_ANUAL_CLP','MC_MP_ENVIRONMENT'],resolverRevisionPagoMiComunidad:['MC_MP_ACCESS_TOKEN'],reiniciarCheckoutFallidoMiComunidad:['MC_MP_ACCESS_TOKEN'],webhookMercadoPagoMiComunidad:['MC_MP_ACCESS_TOKEN','MC_MP_WEBHOOK_SECRET'],conciliarPagosMiComunidad:['MC_MP_ACCESS_TOKEN'],consultarLicenciaMiComunidad:[]};
(async()=>{
 await tools('firebase-tools/lib/requireAuth').requireAuth({project});
 const sm=tools('firebase-tools/lib/gcp/secretManager');
 for(const key of new Set(Object.values(EXPECTED).flat())){const v=await sm.getSecretVersion(project,key+'_PRODUCTION','latest');assert.equal(v.state,'ENABLED',key+' no habilitado');}
 const values={MC_MP_ENVIRONMENT_PRODUCTION:'production',MC_PLAN_ANUAL_CLP_PRODUCTION:'800000',MC_MP_WEBHOOK_URL_PRODUCTION:'https://us-central1-mercado-ciudadano.cloudfunctions.net/webhookMercadoPagoMiComunidad'};
 for(const [name,value]of Object.entries(values))assert.equal((await sm.accessSecretVersion(project,name,'latest')).trim(),value,name+' inesperado');
 const {Client}=tools('firebase-tools/lib/apiv2');
 const api=new Client({urlPrefix:'https://firestore.googleapis.com',auth:true,apiVersion:'v1'});
 const field=(await api.get('projects/'+project+'/databases/(default)/collectionGroups/mi_comunidad_webhook_recibos/fields/expiresAt')).body;
 assert.equal(field.ttlConfig?.state,'ACTIVE');assert.ok(['0s','0.000000000s'].includes(field.ttlConfig.expirationOffset||'0s'));
 console.log('Preflight: secretos habilitados, 800000 CLP, production, URL y TTL comprobados.');
 if(process.argv.includes('--preflight'))return;
 const gcf=tools('firebase-tools/lib/gcp/cloudfunctionsv2');
 for(const [id,keys]of Object.entries(EXPECTED)){const f=await gcf.getFunction(project,'us-central1',id);assert.equal(f.state,'ACTIVE');const bindings=f.serviceConfig.secretEnvironmentVariables||[];assert.deepEqual(bindings.map(s=>s.key).sort(),keys.map(k=>k+'_PRODUCTION').sort());assert.ok(bindings.every(s=>s.secret===s.key&&s.version&&[project,'165528119795'].includes(String(s.projectId))));console.log(id+': ACTIVE y secretos de producción verificados.');}
 const scheduler=new Client({urlPrefix:'https://cloudscheduler.googleapis.com',auth:true,apiVersion:'v1'});
 const job=(await scheduler.get('projects/'+project+'/locations/us-central1/jobs/firebase-schedule-conciliarPagosMiComunidad-us-central1')).body;assert.equal(job.state,'ENABLED');console.log('Conciliación programada: ENABLED.');
})().then(()=>process.exit(0)).catch(e=>{console.error('Producción no confirmada: '+String(e.message).slice(0,180));process.exit(1);});
