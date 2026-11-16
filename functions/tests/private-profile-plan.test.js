'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {spawnSync}=require('node:child_process');
test('revisión privada: lectura, privacidad, huellas, diagnóstico seguro y bloqueo en CI',()=>{
 const r=spawnSync('python3',['-B',path.join(__dirname,'../../tests/private-profile-plan.py')],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);assert.ok(!r.stdout.includes('Nombre privado'));
});
