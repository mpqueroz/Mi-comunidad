'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {merge,section}=require('../scripts/preparar-reglas-compartidas.cjs');
const local=fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8');
test('despliegue: conserva byte por byte reglas ajenas actualizadas en producción',()=>{
 const live=local.replace("match /anuncios/{id} {", "match /anuncios/{id} {\n   // Cambio posterior de otra aplicación { }\n")
   .replace('match /conserjes/{uid} {','match /conserjes/{uid} {\n // Versión anterior de Mi Comunidad');
 const a=section(live),b=section(local),merged=merge(live,local);
 assert.equal(merged,live.slice(0,a.start)+local.slice(b.start,b.end)+live.slice(a.end));
 assert.ok(merged.includes('Cambio posterior de otra aplicación'));
 assert.ok(!merged.includes('Versión anterior de Mi Comunidad'));
});
test('despliegue: bloquea estructuras desconocidas en lugar de sobrescribir otras apps',()=>{
 assert.throws(()=>merge(local.replace('function mcEsMiComunidad()', 'function otraFuncion()'),local));
 assert.throws(()=>merge(local.replace('function mcRol()', 'function funcionAjena()'),local));
 assert.equal(merge(local,local),local);
});
