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
 const project=await request('GET',`https://firebase.googleapis.com/v1beta1/projects/${PROJECT}?fields=projectId,projectNumber`);
 if(project.projectId!==PROJECT||!/^\d+$/.test(String(project.projectNumber||'')))throw Error('Proyecto no coincide.');
 const results=[];
 for(const service of SERVICES){
  const resource=`projects/${project.projectNumber}/services/${service}`;
  const endpoint=`https://serviceusage.googleapis.com/v1/${resource}`;
  const before=await request('GET',endpoint+'?fields=state');
  if(!['ENABLED','DISABLED'].includes(before.state))throw Error('Estado de API no verificable.');
  if(before.state==='DISABLED'){
   let operation=await request('POST',endpoint+':enable');
   for(let attempt=0;!operation.done&&attempt<30;attempt++){
    if(!/^operations\/[A-Za-z0-9_.-]+$/.test(operation.name||''))throw Error('Operación no válida.');
    await wait();operation=await request('GET',`https://serviceusage.googleapis.com/v1/${operation.name}`);
   }
   if(!operation.done||operation.error)throw Error('No se confirmó la habilitación.');
  }
  const after=await request('GET',endpoint+'?fields=state');
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
module.exports={enableAuditApis,argumentsFor,SERVICES};
if(require.main===module)main().catch(error=>{
 console.error(JSON.stringify({event:'api-enablement-not-complete',httpStatus:Number.isInteger(error.status)?error.status:null,
  ...(['SERVICE_DISABLED','IAM_PERMISSION_DENIED','ACCESS_TOKEN_SCOPE_INSUFFICIENT'].includes(error.reason)?{reason:error.reason}:{})}));
 process.exitCode=1;
});
