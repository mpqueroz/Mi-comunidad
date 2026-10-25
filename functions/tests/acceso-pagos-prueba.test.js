"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), vm = require("node:vm");
const crypto = require("node:crypto"), path = require("node:path");
const {createTrial} = require("../licencias");
function fixture(environment = "test") {
  const docs = new Map(), users = new Map(), logs = [];
  const comunidadId = "nodar-pagos-prueba-20261025";
  const communityPath = "mi_comunidad_comunidades/" + comunidadId;
  const licensePath = "mi_comunidad_licencias/" + comunidadId;
  const auth = {
    getUser: async uid => {if (!users.has(uid)) throw {code:"auth/user-not-found"}; return users.get(uid);},
    createUser: async u => users.set(u.uid, {...u}),
    updateUser: async (uid, data) => Object.assign(users.get(uid), data),
    setCustomUserClaims: async (uid, claims) => {users.get(uid).customClaims = claims;},
  };
  function ref(p) {return {path:p,get:async()=>({exists:docs.has(p),get:k=>docs.get(p)?.[k]})};}
  const db = {collection: name => {
    assert.ok(["mi_comunidad_comunidades","mi_comunidad_licencias"].includes(name));
    return {doc:id=>{assert.equal(id,comunidadId);return ref(name+"/"+id);}};
  },runTransaction:async fn=>{
    const pending=[];
    await fn({get:r=>r.get(),create:(r,data)=>pending.push([r.path,data])});
    for(const [p,d] of pending){assert.equal(docs.has(p),false);docs.set(p,d);}
  }};
  let initialized = false;
  const deps = name => name === "firebase-admin/app" ? {initializeApp:()=>{initialized=true;}} :
    name === "firebase-admin/auth" ? {getAuth:()=>auth} :
    name === "firebase-admin/firestore" ? {getFirestore:()=>db} : (()=>{throw Error(name);})();
  const customRequire = name => {
    if(name === "node:child_process") return {execFileSync:()=>environment};
    if(name === "node:crypto") return crypto;
    if(name === "node:path") return path;
    if(name === "node:module") return {createRequire:()=>deps};
    if(name === "../functions/licencias") return {createTrial};
    throw Error(name);
  };
  const ctx = {__dirname:"/repo/scripts",require:customRequire,module:{exports:{}},
    console:{log:line=>logs.push(line),error(){}},process:{}};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,"../../scripts/crear-acceso-pagos-prueba.js"),"utf8"),ctx);
  return {run:ctx.module.exports.main,docs,users,logs,communityPath,licensePath,initialized:()=>initialized};
}
test("el acceso técnico solo crea su comunidad y licencia; repetir conserva vigencia", async()=>{
  const f=fixture();await f.run();assert.equal(f.docs.size,2);assert.equal(f.users.size,1);
  assert.equal(f.docs.get(f.communityPath).mpTestFixture,true);
  const license=f.docs.get(f.licensePath);license.estado="active";license.paidUntil=new Date("2027-12-01T00:00:00Z");
  await f.run();assert.equal(f.docs.get(f.licensePath),license);
  assert.equal(f.docs.get(f.licensePath).estado,"active");
});
test("el bootstrap rechaza entorno productivo antes de inicializar Admin", async()=>{
  const f=fixture("production");await assert.rejects(f.run(),/entorno test/);
  assert.equal(f.initialized(),false);assert.equal(f.docs.size,0);assert.equal(f.users.size,0);
});
test("no modifica una comunidad ajena con el mismo identificador", async()=>{
  const f=fixture();f.docs.set(f.communityPath,{name:"Existente"});
  await assert.rejects(f.run(),/no pertenece/);assert.equal(f.users.size,0);
  assert.equal(f.docs.get(f.communityPath).name,"Existente");
});
