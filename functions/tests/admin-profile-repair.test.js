'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {repairAdminProfile}=require('../../scripts/regularizar-ficha-admin.cjs');
function fixture(){
 const uid='u',comunidadId='c',base='mi_comunidad_comunidades/c',profile=base+'/administradores/u';
 const rows=new Map([[base,{estado:'Activa',adminUid:uid}]]),writes=[];
 let user={uid,disabled:false,customClaims:{app:'mi_comunidad',role:'admin',comunidadId}};
 const snap=path=>({exists:rows.has(path),get:k=>rows.get(path)?.[k]});
 const ref=path=>({path,get:async()=>snap(path),collection:n=>({doc:id=>ref(path+'/'+n+'/'+id)})});
 const forbidden=()=>{throw Error('Escritura no autorizada');};
 const db={projectId:'mercado-ciudadano',collection:n=>({doc:id=>ref(n+'/'+id)}),runTransaction:async fn=>{
  const staged=[];const result=await fn({get:async r=>snap(r.path),create:(r,d)=>staged.push([r.path,d]),set:forbidden,update:forbidden,delete:forbidden});
  for(const [path,data]of staged){assert.equal(rows.has(path),false);writes.push(path);rows.set(path,data);}return result;
 }};
 const auth={app:{options:{projectId:'mercado-ciudadano'}},getUser:async()=>structuredClone(user),updateUser:forbidden,setCustomUserClaims:forbidden,createUser:forbidden};
 return {projectId:'mercado-ciudadano',db,auth,uid,comunidadId,nombre:'Nombre verificado',expectedAuth:{uid,disabled:false,app:'mi_comunidad',role:'admin',comunidadId},expectedOwner:uid,approved:true,administrativeChangesPaused:true,serverTimestamp:()=>({serverTime:true}),rows,writes,base,profile,setUser:v=>user=v};
}
test('ficha: el plan solo lee; sin autorización no llega a escribir',async()=>{
 const f=fixture(),r=await repairAdminProfile(f);assert.equal(r.readOnly,true);assert.equal(r.ownerMatches,true);assert.equal(f.writes.length,0);
 for(const patch of [{approved:false},{administrativeChangesPaused:false},{nombre:''},{projectId:'otro'},{uid:'ruta/ajena'}]){
  await assert.rejects(repairAdminProfile({...f,apply:true,...patch}));assert.equal(f.writes.length,0);
 }
});
test('ficha: reparación aprobada crea solo la ficha ausente y repetir no sobrescribe',async()=>{
 const f=fixture();assert.equal((await repairAdminProfile({...f,apply:true})).created,true);
 assert.deepEqual(f.writes,[f.profile]);assert.deepEqual(f.rows.get(f.profile),{nombre:'Nombre verificado',estado:'Activo',creadoEn:{serverTime:true}});
 f.rows.get(f.profile).estado='Inactivo';await repairAdminProfile({...f,apply:true});assert.equal(f.writes.length,1);assert.equal(f.rows.get(f.profile).estado,'Inactivo');
});
test('ficha: no repara cuentas deshabilitadas, de otra app, rol o comunidad',async()=>{
 for(const change of [{disabled:true},{customClaims:{app:'otra',role:'admin',comunidadId:'c'}},{customClaims:{app:'mi_comunidad',role:'residente',comunidadId:'c'}},{customClaims:{app:'mi_comunidad',role:'admin',comunidadId:'otra'}}]){
  const f=fixture();f.setUser({uid:'u',disabled:false,customClaims:{app:'mi_comunidad',role:'admin',comunidadId:'c'},...change});
  await assert.rejects(repairAdminProfile({...f,apply:true}));assert.equal(f.writes.length,0);
 }
});
test('ficha: propietario ausente requiere verificación privada; propietario distinto siempre aborta',async()=>{
 const f=fixture();delete f.rows.get(f.base).adminUid;
 assert.equal((await repairAdminProfile(f)).requiresPrivateOwnershipVerification,true);
 await assert.rejects(repairAdminProfile({...f,apply:true,expectedOwner:null}));
 assert.equal((await repairAdminProfile({...f,apply:true,expectedOwner:null,ownershipVerified:true})).created,true);
 const g=fixture();g.rows.get(g.base).adminUid='otro';await assert.rejects(repairAdminProfile({...g,apply:true,ownershipVerified:true}));assert.equal(g.writes.length,0);
});
test('ficha: cambio de Auth o propietario entre lectura y transacción impide crear',async()=>{
 const f=fixture(),get=f.auth.getUser;let calls=0;f.auth.getUser=async()=>{const u=await get();if(++calls===2)u.disabled=true;return u;};
 await assert.rejects(repairAdminProfile({...f,apply:true}));assert.equal(f.writes.length,0);
 const g=fixture(),run=g.db.runTransaction;g.db.runTransaction=fn=>{g.rows.get(g.base).adminUid='otro';return run(fn);};
 await assert.rejects(repairAdminProfile({...g,apply:true}));assert.equal(g.writes.length,0);
});
test('ficha: una ficha creada concurrentemente nunca se sobrescribe ni reactiva',async()=>{
 const f=fixture(),run=f.db.runTransaction;f.db.runTransaction=fn=>{f.rows.set(f.profile,{nombre:'Existente',estado:'Inactivo'});return run(fn);};
 assert.equal((await repairAdminProfile({...f,apply:true})).status,'already-exists');assert.equal(f.writes.length,0);assert.equal(f.rows.get(f.profile).estado,'Inactivo');
});

test('ficha: SDK de otro proyecto o aprobación textual no autorizan escrituras',async()=>{
 const f=fixture();
 for(const patch of [{approved:'true'},{administrativeChangesPaused:'true'},{db:{...f.db,projectId:'otro'}},{auth:{...f.auth,app:{options:{projectId:'otro'}}}}])
  await assert.rejects(repairAdminProfile({...f,apply:true,...patch}));
 assert.equal(f.writes.length,0);
});
