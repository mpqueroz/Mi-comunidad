'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {build,OUT}=require('../scripts/preparar-preview-appcheck.cjs');
test('preview contiene exclusivamente diagnóstico y SDK públicos',()=>{
 try{
 build();
 const files=fs.readdirSync(path.join(OUT,'public')).sort();
 assert.deepEqual(files,['app-check.js','config.js','diagnostico.js','firebase-app-check-compat.js','firebase-app-compat.js','index.html','robots.txt'].sort());
 const cfg=JSON.parse(fs.readFileSync(path.join(OUT,'firebase.json'),'utf8'));
 assert.deepEqual(Object.keys(cfg),['hosting']);assert.equal(cfg.hosting.site,'mi-comunidad-md');
 assert.equal(cfg.hosting.public,'public');
 const html=fs.readFileSync(path.join(OUT,'public/index.html'),'utf8');
 assert.doesNotMatch(html,/\bonclick=|firebase-(?:auth|firestore|functions)|app\.js/);
 const js=fs.readFileSync(path.join(OUT,'public/diagnostico.js'),'utf8');
 assert.doesNotMatch(js,/console\.|\.token\b|innerHTML|fetch\(/);
 assert.match(js,/textContent/);assert.match(js,/45000/);
 const policy=cfg.hosting.headers[0].headers.find(x=>x.key==='Content-Security-Policy').value;
 assert.doesNotMatch(policy.split(';').find(x=>x.trim().startsWith('script-src')),/unsafe-inline|unsafe-eval|\*/);
 assert.doesNotMatch(policy,/unsafe-eval|\*/);
 assert.match(policy,/frame-ancestors 'none'/);
 }finally{fs.rmSync(OUT,{recursive:true,force:true});}
});
test('workflow publica solo canal temporal y conserva dominios de Auth',()=>{
 const s=fs.readFileSync(path.join(__dirname,'../.github/workflows/appcheck-preview.yml'),'utf8');
 assert.match(s,/hosting:channel:deploy auditoria-appcheck/);
 assert.match(s,/--no-authorized-domains/);assert.match(s,/--expires 1d/);
 assert.doesNotMatch(s,/pull_request_target|hosting:clone|--only functions|--only firestore/);
 assert.match(s,/head.repo.full_name == 'mpqueroz\/Mi-comunidad'/);
 assert.match(s,/head.ref == 'security\/auditoria-blindaje-2026-11'/);
 assert.ok(s.indexOf('npm ci --ignore-scripts')<s.indexOf('credentials_json:'));
});
