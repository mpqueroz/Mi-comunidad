'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {inspectPrincipal,emailHash}=require('../../scripts/verificar-admin-principal.cjs');
const {fingerprint,runRepairs}=require('../../scripts/ejecutar-reparacion-fichas.cjs');
function fixture(){
 const values={nombre:'Privada',estado:'Activa',adminNombre:'Titular'};
 const document={get:async()=>({exists:true,get:k=>values[k]}),collection:()=>({doc:()=>({get:async()=>({exists:false})})})};
 const db={projectId:'mercado-ciudadano',collection:()=>({doc:()=>document})};
 const users=[{uid:'u',email:'owner@example.invalid',displayName:'Titular',customClaims:{app:'mi_comunidad',role:'admin',comunidadId:'c'}},
  {uid:'test',email:'test@example.invalid',displayName:'Prueba',customClaims:{app:'mi_comunidad',role:'admin',comunidadId:'c'}}];
 const auth={app:{options:{projectId:'mercado-ciudadano'}},listUsers:async()=>({users})};
 return {db,auth,emailSha256:emailHash(users[0].email),users,values};
}
test('principal: solo lee, selecciona por correo y su huella sirve para la reparación exacta',async()=>{
 const f=fixture(),result=await inspectPrincipal(f);
 assert.equal(result.principalMatchedByEmail,true);assert.equal(result.reparable,true);assert.equal(result.ownerRelationship,'not-recorded');
 assert.equal(result.verificationCode,fingerprint({projectId:'mercado-ciudadano',expectedAuth:{uid:'u',disabled:false,app:'mi_comunidad',role:'admin',comunidadId:'c'},expectedOwner:null,communityName:'Privada',communityState:'Activa',accountDisplayName:'Titular',registeredAdminName:'Titular',principalEmail:'owner@example.invalid'}));
 for(const secret of ['owner@example.invalid','Titular','Privada','comunidadId','test@example.invalid'])assert.ok(!JSON.stringify(result).includes(secret));
 const plan=await runRepairs({...f,codes:[result.verificationCode],repair:async opts=>{assert.equal(opts.uid,'u');assert.equal(opts.expectedEmail,'owner@example.invalid');return {status:'missing'};}});
 assert.equal(plan.plannedMissing,1);assert.equal(plan.readOnly,true);
});
test('principal: no elude proyecto, unicidad ni estado/rol del administrador',async()=>{
 for(const change of [f=>f.emailSha256='x',f=>f.db.projectId='otro',f=>f.users.push({...f.users[0]}),f=>f.users[0].disabled=true,f=>f.users[0].customClaims.role='residente',f=>f.emailSha256=emailHash('missing@example.invalid')]){
  const f=fixture();change(f);await assert.rejects(inspectPrincipal(f));
 }
 const f=fixture();f.values.adminUid='other';assert.equal((await inspectPrincipal(f)).reparable,false);
 f.values.adminUid='u';f.values.estado='Suspendida';assert.equal((await inspectPrincipal(f)).reparable,false);
});
