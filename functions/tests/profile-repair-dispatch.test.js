'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process'),path=require('node:path');
const {codesFrom,fingerprint,runRepairs}=require('../../scripts/ejecutar-reparacion-fichas.cjs');
const evidence={projectId:'mercado-ciudadano',expectedAuth:{uid:'u',disabled:false,app:'mi_comunidad',role:'admin',comunidadId:'c'},expectedOwner:'u',
 communityName:'Comunidad privada',communityState:'Activa',accountDisplayName:'Nombre privado',registeredAdminName:'Admin registrado'};
function fixture(){
 const values={nombre:evidence.communityName,estado:'Activa',adminUid:'u',adminNombre:evidence.registeredAdminName};
 return {db:{projectId:'mercado-ciudadano',collection:()=>({doc:()=>({get:async()=>({exists:true,get:k=>values[k]})})})},
  auth:{app:{options:{projectId:'mercado-ciudadano'}},listUsers:async()=>({users:[{uid:'u',displayName:'Nombre privado',customClaims:{app:'mi_comunidad',role:'admin',comunidadId:'c'}}]})},codes:[fingerprint(evidence)]};
}
test('reparación: solo admite uno o dos códigos únicos, nunca nombres, UID ni comandos',()=>{
 assert.deepEqual(codesFrom('a'.repeat(64)+','+'b'.repeat(64)),['a'.repeat(64),'b'.repeat(64)]);
 for(const raw of ['', 'u', '$(comando)', 'a'.repeat(64)+','+'a'.repeat(64),['a','b','c'].map(x=>x.repeat(64)).join(',')])assert.throws(()=>codesFrom(raw));
});
test('huella privada Python y ejecutor JS coinciden, incluso con el orden de campos distinto',()=>{
 const cmd="import importlib.util,pathlib; p=pathlib.Path('scripts/verificar-fichas-privadas.py'); s=importlib.util.spec_from_file_location('plan',p); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); import json,hashlib,sys; e=json.loads(sys.argv[1]); print(hashlib.sha256(json.dumps(e,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest())";
 const r=spawnSync('python3',['-B','-c',cmd,JSON.stringify({...evidence,communityName:'Edificio Ñandú 🏠'})],{cwd:path.join(__dirname,'../..'),encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);assert.equal(fingerprint({...evidence,communityName:'Edificio Ñandú 🏠'}),r.stdout.trim());
});
test('reparación: identidad cambiada y aprobación incompleta impiden toda escritura',async()=>{
 const f=fixture();let writes=0;const repair=async()=>{writes++;return {created:true};};
 await assert.rejects(runRepairs({...f,apply:true,approved:false,paused:true,repair}));
 await assert.rejects(runRepairs({...f,apply:true,approved:true,paused:false,repair}));
 await assert.rejects(runRepairs({...f,codes:['a'.repeat(64)],apply:true,approved:true,paused:true,repair}));
 assert.equal(writes,0);
 const events=[];const r=await runRepairs({...f,apply:true,approved:true,paused:true,repair:async opts=>{assert.equal(opts.uid,'u');assert.equal(opts.nombre,'Nombre privado');assert.equal(opts.expectedOwner,'u');return {created:true};},emit:e=>events.push(e)});
 assert.equal(r.created,1);assert.ok(!JSON.stringify(events).includes('Nombre privado'));assert.ok(!JSON.stringify(events).includes('comunidadId'));
});
