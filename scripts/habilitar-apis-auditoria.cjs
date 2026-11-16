'use strict';
// Autorización limitada: habilitar estas dos APIs, sin tocar su configuración.
// https://docs.cloud.google.com/service-usage/docs/reference/rest/v1/services/enable
const path=require('node:path'),fs=require('node:fs');
const {createRequire}=require('node:module');
const {apiFailure}=require('./auditar-configuracion.cjs');
const PROJECT='mercado-ciudadano';
const SERVICES=Object.freeze(['firebaseappcheck.googleapis.com','apikeys.googleapis.com']);
function argumentsFor(argv){
 const opts={apply:false};
 for(let i=0;i<argv.length;i++){
  if(argv[i]==='--project'&&!opts.projectId)opts.projectId=argv[++i];
  else if(argv[i]==='--apply'&&!opts.apply)opts.apply=true;
  else throw Error('Opciones inválidas.');
 }
 if(opts.projectId!==PROJECT)throw Error('Solo se admite el proyecto autorizado.');
 return opts;
}
async function enableAuditApis({projectId,apply=false,approved=false,request,wait=()=>new Promise(r=>setTimeout(r,2000)),emit=()=>{}}){
 if(projectId!==PROJECT)throw Error('Proyecto no autorizado.');
 if(!apply)return {projectId,apply:false,services:[...SERVICES]};
 if(!approved)throw Error('Falta autorización explícita.');
 // Solo etiquetas constantes; nunca copiar mensajes ni URLs de error al log.
 async function query(phase,method,url,service){
  try{return await request(method,url);}catch(error){
   const failure=new Error('La solicitud autorizada no se completó.');
   failure.status=error.status;failure.reason=error.reason;failure.phase=phase;
   if(SERVICES.includes(service))failure.service=service;
   throw failure;
  }
 }
 const project=await query('verify-project','GET',`https://firebase.googleapis.com/v1beta1/projects/${PROJECT}?fields=projectId,projectNumber`);
 if(project.projectId!==PROJECT||!/^\d+$/.test(String(project.projectNumber||'')))throw Error('Proyecto no coincide.');
 const results=[];
 for(const service of SERVICES){
  const resource=`projects/${project.projectNumber}/services/${service}`;
  const endpoint=`https://serviceusage.googleapis.com/v1/${resource}`;
  const before=await query('inspect-service','GET',endpoint+'?fields=state',service);
  if(!['ENABLED','DISABLED'].includes(before.state))throw Error('Estado de API no verificable.');
  if(before.state==='DISABLED'){
   let operation=await query('enable-service','POST',endpoint+':enable',service);
   for(let attempt=0;!operation.done&&attempt<30;attempt++){
    if(!/^operations\/[A-Za-z0-9_.-]+$/.test(operation.name||''))throw Error('Operación no válida.');
    await wait();operation=await query('poll-operation','GET',`https://serviceusage.googleapis.com/v1/${operation.name}`,service);
   }
   if(!operation.done||operation.error)throw Error('No se confirmó la habilitación.');
  }
  const after=await query('verify-service','GET',endpoint+'?fields=state',service);
  if(after.state!=='ENABLED')throw Error('La API no figura habilitada.');
  const result={service,before:before.state,after:after.state,changed:before.state==='DISABLED'};
  results.push(result);emit(result);
 }
 return {projectId,apply:true,services:results};
}
async function main(){
 const opts=argumentsFor(process.argv.slice(2));
 if(!opts.apply){console.log(JSON.stringify(await enableAuditApis(opts),null,2));return;}
 if(process.env.ENABLE_AUDIT_APIS_APPROVED!=='true')throw Error('Falta autorización explícita.');
 if(!process.env.GOOGLE_APPLICATION_CREDENTIALS||!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS))throw Error('ADC no disponible.');
 const sdk=createRequire(path.join(__dirname,'../functions/package.json'));
 const {applicationDefault}=sdk('firebase-admin/app');const credential=applicationDefault();
 await enableAuditApis({...opts,approved:true,emit:result=>console.log(JSON.stringify(result)),request:async(method,url)=>{
  const {access_token:token}=await credential.getAccessToken();
  const response=await fetch(url,{method,redirect:'error',headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(30000)});
  let body;try{body=await response.json();}catch(_){}
  if(!response.ok)throw apiFailure(response.status,body);
  return body||{};
 }});
}
function failureSummary(error){
 return {event:'api-enablement-not-complete',httpStatus:Number.isInteger(error.status)?error.status:null,
  ...(['verify-project','inspect-service','enable-service','poll-operation','verify-service'].includes(error.phase)?{phase:error.phase}:{}),
  ...(SERVICES.includes(error.service)?{service:error.service}:{}),
  ...(['SERVICE_DISABLED','IAM_PERMISSION_DENIED','ACCESS_TOKEN_SCOPE_INSUFFICIENT'].includes(error.reason)?{reason:error.reason}:{})};
}
module.exports={enableAuditApis,argumentsFor,SERVICES,failureSummary};
if(require.main===module)main().catch(error=>{
 console.error(JSON.stringify(failureSummary(error)));
 process.exitCode=1;
});
