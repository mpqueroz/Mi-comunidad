'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,'public/demo',name),'utf8');

test('demo: carga externa ordenada, sin código ni manejadores HTML inline',()=>{
 const html=read('index.html');
 const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
 assert.deepEqual(scripts.map(m=>m[1].match(/src="([^"]+)"/)[1]),['backend.js','qr.js','eventos.js','app.js']);
 for(const m of scripts)assert.equal(m[2].trim(),'');
 assert.doesNotMatch(html,/\son\w+\s*=/i);
 for(const name of ['backend.js','qr.js','eventos.js','app.js'])new vm.Script(read(name),{filename:name});
 assert.doesNotMatch(read('app.js'),/\son(?:click|input|change|keydown)\s*=/i);
 assert.match(html,/connect-src 'none'; frame-src 'none'/);
 const config=require('../firebase.json');
 const policy=config.hosting.headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
 assert.doesNotMatch(policy.split(';').find(x=>x.trim().startsWith('script-src ')),/unsafe-inline|unsafe-eval/);
 assert.ok(config.hosting.headers.some(h=>h.source==='/demo/**'&&h.headers.some(x=>x.key==='Cache-Control'&&x.value==='no-cache')));
});

test('demo: reinicio elimina solo su base y preferencias, preservando claves ajenas',()=>{
 const storage=Object.create(null);let reloaded=0,cancelled=0;
 Object.defineProperties(storage,{
  getItem:{value:key=>storage[key]??null},
  setItem:{value:(key,value)=>{storage[key]=String(value);}},
  removeItem:{value:key=>{delete storage[key];}},
 });
 const ctx={crypto:require("node:crypto").webcrypto,localStorage:storage,location:{reload(){reloaded++;}},setTimeout:()=>1,clearTimeout:()=>cancelled++,console};ctx.window=ctx;
 vm.createContext(ctx);vm.runInContext(read('backend.js'),ctx);
 storage.mc_demo_db_v4='datos de ejemplo';storage.mc_demo_losRobles='otra demo';storage['mc_demo_los-robles_tema']='oscuro';
 storage.mc_los_robles_tema='conservar';storage.mc_otraComunidad='conservar';storage.firebaseLocalStorage='conservar';
 ctx.demoReiniciarDatos();
 assert.equal(storage.mc_demo_db_v4,undefined);assert.equal(storage['mc_demo_los-robles_tema'],undefined);
 for(const key of ['mc_demo_losRobles','mc_los_robles_tema','mc_otraComunidad','firebaseLocalStorage'])assert.equal(storage[key],key==='mc_demo_losRobles'?'otra demo':'conservar');
 assert.equal(reloaded,1);assert.ok(cancelled>0);
 assert.match(read('app.js'),/return"mc_demo_"\+LOCAL_STORAGE_COMUNIDAD_ID/);
});

test('demo: acciones migradas se resuelven por lista explícita a funciones existentes',()=>{
 const app=read('app.js'),events=read('eventos.js'),html=read('index.html');
 const targets=[...events.matchAll(/=> (\w+)\(\.\.\.args\)/g)].map(m=>m[1]);
 for(const name of targets)assert.match(app,new RegExp('function '+name+'\\('),name);
 const ctx={esc:value=>String(value),document:{addEventListener(){}},showToast(){}};vm.createContext(ctx);vm.runInContext(events,ctx);
 const names=[...app.matchAll(/mcEvento\("(?:click|input|change|keydown)", "(\w+)"/g)].map(m=>m[1]);
 for(const name of new Set(names))assert.equal(vm.runInContext('Object.hasOwn(mcAccionesPermitidas,'+JSON.stringify(name)+')',ctx),true,name);
 for(const m of html.matchAll(/data-mc-click="([^"\n]*)"/g)){
  const action=JSON.parse(m[1].replaceAll('&quot;','"'));
  assert.equal(vm.runInContext('Object.hasOwn(mcAccionesPermitidas,'+JSON.stringify(action[0])+')',ctx),true,action[0]);
 }
});
