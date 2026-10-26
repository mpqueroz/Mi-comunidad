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
  for (const f of ['app', 'auth', 'firestore', 'functions']) {
    const file = `firebase-${f}-compat.js`;
    assert.ok(html.includes(`vendor/firebase-10.13.2/${file}`), file);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, file))).digest('hex');
    assert.ok(leeme.includes(`${hash}  ${file}`), 'hash registrado de ' + file);
  }
});

test('SheetJS se carga desde su CDN solo con huella de integridad', () => {
  const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  const carga = html.slice(html.indexOf('cdn.sheetjs.com/xlsx-0.20.3'), html.indexOf('cdn.sheetjs.com/xlsx-0.20.3') + 400);
  assert.match(carga, /script\.integrity = "sha384-EnyY0\/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP\+39Ckmn92stwABZynq1JyzdT"/);
  assert.match(carga, /script\.crossOrigin = "anonymous"/);
});
