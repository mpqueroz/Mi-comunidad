'use strict';
// El sitio debe seguir sirviendo sus cabeceras de seguridad y el SDK local.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const hosting = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8')).hosting;

test('cabeceras de seguridad en todas las rutas', () => {
  const h = Object.fromEntries(hosting.headers.find(x => x.source === '**').headers.map(x => [x.key, x.value]));
  for (const d of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "default-src 'self'"]) assert.ok(h['Content-Security-Policy'].includes(d), d);
  assert.ok(!/unsafe-eval/.test(h['Content-Security-Policy']));
  assert.equal(h['X-Frame-Options'], 'DENY');
  assert.equal(h['X-Content-Type-Options'], 'nosniff');
  assert.match(h['Permissions-Policy'], /microphone=\(\)/);
});

test('el SDK de Firebase se sirve desde el sitio y coincide con su registro', () => {
  const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  assert.ok(!html.includes('gstatic.com/firebasejs'), 'sin SDK desde CDN');
  const dir = path.join(root, 'public/vendor/firebase-10.13.2');
  const leeme = fs.readFileSync(path.join(dir, 'LEEME.md'), 'utf8');
  for (const f of ['app', 'auth', 'firestore', 'functions', 'app-check']) {
    const file = `firebase-${f}-compat.js`;
    assert.ok(html.includes(`vendor/firebase-10.13.2/${file}`), file);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, file))).digest('hex');
    assert.ok(leeme.includes(`${hash}  ${file}`), 'hash registrado de ' + file);
  }
});

test('SheetJS se carga desde su CDN solo con huella de integridad', () => {
  const html = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
  const carga = html.slice(html.indexOf('cdn.sheetjs.com/xlsx-0.20.3'), html.indexOf('cdn.sheetjs.com/xlsx-0.20.3') + 400);
  assert.match(carga, /script\.integrity = "sha384-EnyY0\/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP\+39Ckmn92stwABZynq1JyzdT"/);
  assert.match(carga, /script\.crossOrigin = "anonymous"/);
});

test('la app autenticada añade CSP sin scripts inline ni manejadores HTML',()=>{
 const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
 const main=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
 const meta=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
 assert.ok(meta);assert.match(meta[1],/script-src 'self' https:\/\/cdn.sheetjs.com/);assert.match(meta[1],/script-src-attr 'none'/);assert.doesNotMatch(meta[1],/unsafe-inline|unsafe-eval/);
 assert.ok(html.indexOf(meta[0])<html.indexOf('<script'));
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){assert.match(match[1],/src=/);assert.equal(match[2].trim(),'');}
 assert.doesNotMatch(html,/\son\w+\s*=/i);assert.doesNotMatch(main,/\son(?:click|change|input|keydown)\s*=/i);
 assert.ok(hosting.headers.some(h=>h.source==='/app.js'&&h.headers.some(x=>x.key==='Cache-Control'&&x.value==='no-cache')));
});

test('App Check permite solo rutas de reCAPTCHA y conserva bloqueo de código inline',()=>{
 const policy=hosting.headers.find(x=>x.source==='**').headers.find(x=>x.key==='Content-Security-Policy').value;
 const script=policy.split(';').find(x=>x.trim().startsWith('script-src ')).trim();
 assert.equal(script,"script-src 'self' https://cdn.sheetjs.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/");
 assert.ok(policy.includes('frame-src https://mercado-ciudadano.firebaseapp.com https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/;'));
 assert.ok(policy.includes('https://www.google.com/recaptcha/;'));
 assert.doesNotMatch(script,/unsafe-inline|unsafe-eval|https:\/\/\*/);
});
