'use strict';
// Solo lectura: prueba de identidad por huella de correo, sin publicar el correo.
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {createRequire}=require('node:module');
const {fingerprint}=require('./ejecutar-reparacion-fichas.cjs');
const PROJECT='mercado-ciudadano';
const emailHash=email=>crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
async function inspectPrincipal({db,auth,emailSha256}){
 if(!/^[a-f0-9]{64}$/.test(emailSha256||'')||db.projectId!==PROJECT||auth.app?.options?.projectId!==PROJECT)throw Error('Alcance no verificable.');
 let token;const seen=new Set(),matches=[];
 do{
  const page=await auth.listUsers(1000,token);
  for(const user of page.users)if(typeof user.email==='string'&&emailHash(user.email)===emailSha256)matches.push(user);
  token=page.pageToken;if(token&&seen.has(token))throw Error('Paginación incompleta.');if(token)seen.add(token);
 }while(token);
 if(matches.length!==1)throw Error('Identidad no única.');
 const user=matches[0],c=user.customClaims||{};
 if(user.disabled||c.app!=='mi_comunidad'||c.role!=='admin'||![user.uid,c.comunidadId].every(v=>typeof v==='string'&&v.length>0&&v.length<=100&&!['.','..'].includes(v)&&!/[\x00-\x1f\x7f/]/.test(v)))throw Error('La cuenta no es administradora habilitada de esta app.');
 const base=db.collection('mi_comunidad_comunidades').doc(c.comunidadId),community=await base.get();
 if(!community.exists)throw Error('Comunidad no verificable.');
 const profile=await base.collection('administradores').doc(user.uid).get(),owner=community.get('adminUid')||null;
 const evidence={projectId:PROJECT,expectedAuth:{uid:user.uid,disabled:false,app:'mi_comunidad',role:'admin',comunidadId:c.comunidadId},expectedOwner:owner,
  communityName:community.get('nombre')||'',communityState:community.get('estado')||'',accountDisplayName:user.displayName||'',registeredAdminName:community.get('adminNombre')||'',principalEmail:user.email.toLowerCase()};
 const name=(evidence.accountDisplayName||evidence.registeredAdminName).trim();
 const reparable=!profile.exists&&community.get('estado')!=='Suspendida'&&(!owner||owner===user.uid)&&!!name&&name.length<=150;
 return {readOnly:true,principalMatchedByEmail:true,emailBound:true,authEnabled:true,profileExists:profile.exists,communityEnabled:community.get('estado')!=='Suspendida',
  ownerRelationship:!owner?'not-recorded':owner===user.uid?'matches':'different',reparable,
  ...(reparable?{verificationCode:fingerprint(evidence)}:{})};
}
async function main(){
 if(JSON.stringify(process.argv.slice(2))!==JSON.stringify(['--project',PROJECT]))throw Error('Proyecto no autorizado.');
 const emailSha256=process.env.PRINCIPAL_EMAIL_SHA256;
 if(!/^[a-f0-9]{64}$/.test(emailSha256||''))throw Error('Huella no válida.');
 if(!process.env.GOOGLE_APPLICATION_CREDENTIALS||!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS))throw Error('ADC no disponible.');
 const sdk=createRequire(path.join(__dirname,'../functions/package.json'));
 const {initializeApp,applicationDefault,deleteApp}=sdk('firebase-admin/app'),{getFirestore}=sdk('firebase-admin/firestore'),{getAuth}=sdk('firebase-admin/auth');
 const app=initializeApp({projectId:PROJECT,credential:applicationDefault()},'verificar-principal-solo-lectura');
 try{console.log(JSON.stringify(await inspectPrincipal({db:getFirestore(app),auth:getAuth(app),emailSha256})));}finally{await deleteApp(app);}
}
module.exports={inspectPrincipal,emailHash};
if(require.main===module)main().catch(()=>{console.error(JSON.stringify({readOnly:true,event:'principal-verification-not-completed'}));process.exitCode=1;});
