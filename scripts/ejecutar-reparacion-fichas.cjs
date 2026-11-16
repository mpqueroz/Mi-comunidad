'use strict';
// Reparación manual puntual; todos los identificadores y nombres permanecen en memoria.
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {createRequire}=require('node:module');
const {repairAdminProfile}=require('./regularizar-ficha-admin.cjs');
const PROJECT='mercado-ciudadano';
function codesFrom(value){
 if(typeof value!=='string'||value.length>260||!/^[a-f0-9]{64}(?:[\s,]+[a-f0-9]{64})?$/.test(value.trim()))throw Error('Códigos inválidos.');
 const codes=value.trim().split(/[\s,]+/);if(new Set(codes).size!==codes.length)throw Error('Códigos repetidos.');return codes;
}
function canonical(value){return value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;}
function fingerprint(evidence){return crypto.createHash('sha256').update(JSON.stringify(canonical(evidence))).digest('hex');}
function validId(id,max){return typeof id==='string'&&id.length>0&&id.length<=max&&!['.','..'].includes(id)&&!/[\x00-\x1f\x7f/]/.test(id);}
async function selectRepairs(db,auth,codes){
 if(db.projectId!==PROJECT||auth.app?.options?.projectId!==PROJECT)throw Error('Proyecto no autorizado.');
 const matches=new Map(),seen=new Set();let token;
 do{
  const page=await auth.listUsers(1000,token);
  for(const user of page.users){
   const c=user.customClaims||{};
   if(user.disabled||c.app!=='mi_comunidad'||c.role!=='admin')continue;
   if(!validId(user.uid,128)||!validId(c.comunidadId,100))throw Error('Identidad inválida.');
   const community=await db.collection('mi_comunidad_comunidades').doc(c.comunidadId).get();
   if(!community.exists)continue;
   const owner=community.get('adminUid')||null;
   const state={uid:user.uid,disabled:false,app:'mi_comunidad',role:'admin',comunidadId:c.comunidadId};
   const evidence={projectId:PROJECT,expectedAuth:state,expectedOwner:owner,communityName:community.get('nombre')||'',
    communityState:community.get('estado')||'',accountDisplayName:user.displayName||'',registeredAdminName:community.get('adminNombre')||''};
   const code=fingerprint(evidence);if(!codes.includes(code))continue;
   if(matches.has(code)||community.get('estado')==='Suspendida'||(owner&&owner!==user.uid))throw Error('La cuenta aprobada no es reparable.');
   const nombre=(evidence.accountDisplayName||evidence.registeredAdminName).trim();
   if(!nombre||nombre.length>150)throw Error('Falta nombre verificado.');
   matches.set(code,{uid:user.uid,comunidadId:c.comunidadId,nombre,expectedAuth:state,expectedOwner:owner,ownershipVerified:owner===null});
  }
  token=page.pageToken;if(token&&seen.has(token))throw Error('Paginación incompleta.');if(token)seen.add(token);
 }while(token);
 if(matches.size!==codes.length)throw Error('Una identidad aprobada cambió o no se encontró.');
 return codes.map(code=>matches.get(code));
}
async function runRepairs({db,auth,codes,apply=false,approved=false,paused=false,serverTimestamp,emit=()=>{},repair=repairAdminProfile}){
 codes=codesFrom(codes.join(','));
 if(apply&&(approved!==true||paused!==true))throw Error('Falta aprobación o exclusión de cambios concurrentes.');
 // Resolver y comprobar TODAS las identidades antes de la primera escritura.
 const plans=await selectRepairs(db,auth,codes);
 const totals={readOnly:!apply,approvedAccounts:plans.length,created:0,alreadyExists:0,plannedMissing:0};
 for(const plan of plans){
  const result=await repair({...plan,projectId:PROJECT,db,auth,apply,approved,administrativeChangesPaused:paused,serverTimestamp});
  if(result.created)totals.created++;
  else if(result.status==='already-exists')totals.alreadyExists++;
  else if(result.status==='missing')totals.plannedMissing++;
  emit({event:'profile-repair-progress',...totals});
 }
 return totals;
}
async function main(){
 const args=process.argv.slice(2),apply=args.includes('--apply');
 if(args.filter(a=>a==='--apply').length>1||args.filter(a=>a==='--project').length!==1||args.length!==(apply?3:2)||args[0]!=='--project'||args[1]!==PROJECT||(apply&&args[2]!=='--apply'))throw Error('Opciones inválidas.');
 const codes=codesFrom(process.env.PROFILE_REPAIR_CODES);
 if(apply&&(process.env.APPROVE_PROFILE_REPAIR!=='true'||process.env.ADMIN_CHANGES_PAUSED!=='true'))throw Error('Falta aprobación explícita.');
 if(!process.env.GOOGLE_APPLICATION_CREDENTIALS||!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS))throw Error('ADC no disponible.');
 const sdk=createRequire(path.join(__dirname,'../functions/package.json'));
 const {initializeApp,applicationDefault,deleteApp}=sdk('firebase-admin/app');
 const {getFirestore,FieldValue}=sdk('firebase-admin/firestore'),{getAuth}=sdk('firebase-admin/auth');
 const app=initializeApp({projectId:PROJECT,credential:applicationDefault()},'reparacion-fichas-aprobadas');
 try{
  const result=await runRepairs({db:getFirestore(app),auth:getAuth(app),codes,apply,approved:process.env.APPROVE_PROFILE_REPAIR==='true',paused:process.env.ADMIN_CHANGES_PAUSED==='true',
   serverTimestamp:()=>FieldValue.serverTimestamp(),emit:status=>console.log(JSON.stringify(status))});
  console.log(JSON.stringify({event:'profile-repair-completed',...result}));
 }finally{await deleteApp(app);}
}
module.exports={codesFrom,fingerprint,selectRepairs,runRepairs};
if(require.main===module)main().catch(()=>{console.error(JSON.stringify({event:'profile-repair-not-completed',message:'Revisa el alcance aprobado y los conteos previos; no se imprimen datos de las cuentas.'}));process.exitCode=1;});
