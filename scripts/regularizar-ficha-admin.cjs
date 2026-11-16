'use strict';
// Preparación de una reparación puntual. No CLI ni workflow de escritura.
// La ejecución real exige aprobación por cuenta y verificación privada fuera de CI.
const PROJECT='mercado-ciudadano';
function identifier(value,max){return typeof value==='string'&&value.length>0&&value.length<=max&&!value.includes('/');}
function authState(user){
 const c=user.customClaims||{};
 return {uid:user.uid,disabled:!!user.disabled,app:c.app,role:c.role,comunidadId:c.comunidadId};
}
function sameAuth(a,b){return ['uid','disabled','app','role','comunidadId'].every(k=>a[k]===b[k]);}
async function repairAdminProfile({projectId,db,auth,uid,comunidadId,nombre,apply=false,approved=false,
 expectedAuth,expectedOwner,ownershipVerified=false,administrativeChangesPaused=false,serverTimestamp}){
 if(projectId!==PROJECT||db?.projectId!==PROJECT||auth?.app?.options?.projectId!==PROJECT||!identifier(uid,128)||!identifier(comunidadId,100))throw Error('Alcance no autorizado.');
 // Un plan nunca utiliza nombre ni autorización de escritura.
 if(apply&&(approved!==true||administrativeChangesPaused!==true||typeof serverTimestamp!=='function'))throw Error('Falta autorización o exclusión de cambios administrativos concurrentes.');
 if(apply&&(typeof nombre!=='string'||!nombre.trim()||nombre.length>150))throw Error('Falta nombre verificado.');
 const user=await auth.getUser(uid),identity=authState(user);
 if(user.uid!==uid||identity.disabled||identity.app!=='mi_comunidad'||identity.role!=='admin'||identity.comunidadId!==comunidadId)
  throw Error('La cuenta no conserva la autorización esperada.');
 const base=db.collection('mi_comunidad_comunidades').doc(comunidadId),profile=base.collection('administradores').doc(uid);
 const community=await base.get();
 if(!community.exists||community.get('estado')==='Suspendida')throw Error('Comunidad no habilitada.');
 const owner=community.get('adminUid')||null;
 if(owner&&owner!==uid)throw Error('El propietario registrado es otra cuenta.');
 const existing=await profile.get();
 if(existing.exists)return {readOnly:!apply,status:'already-exists',created:false};
 const requiresPrivateOwnershipVerification=owner===null;
 if(!apply)return {readOnly:true,status:'missing',ownerMatches:owner===uid,requiresPrivateOwnershipVerification,created:false};
 if(!expectedAuth||!sameAuth(identity,expectedAuth)||expectedOwner!==owner||
    (requiresPrivateOwnershipVerification&&ownershipVerified!==true))throw Error('La verificación privada o el estado aprobado no coinciden.');
 // Auth y Firestore no comparten transacción: el operador debe excluir cambios
 // administrativos concurrentes durante esta intervención. No se ofrece atomicidad entre ambos sistemas.
 const fresh=authState(await auth.getUser(uid));
 if(!sameAuth(identity,fresh))throw Error('La cuenta cambió desde la verificación.');
 return db.runTransaction(async tx=>{
  const currentCommunity=await tx.get(base),currentProfile=await tx.get(profile);
  if(!currentCommunity.exists||currentCommunity.get('estado')==='Suspendida'||(currentCommunity.get('adminUid')||null)!==expectedOwner)
   throw Error('La comunidad cambió desde la verificación.');
  if(currentProfile.exists)return {readOnly:false,status:'already-exists',created:false};
  tx.create(profile,{nombre:nombre.trim(),estado:'Activo',creadoEn:serverTimestamp()});
  return {readOnly:false,status:'created',created:true};
 });
}
module.exports={repairAdminProfile};
