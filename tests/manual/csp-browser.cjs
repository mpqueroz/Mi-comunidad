'use strict';
// Prueba local aislada. Requiere Playwright/Chromium; no usa cuentas ni red de Firebase.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../public');
const config=require('../../firebase.json');
async function main(){
 const server=http.createServer((req,res)=>{
  const file=path.join(root,req.url==='/'?'index.html':req.url);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const mime=file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html';
  for(const h of config.hosting.headers.find(h=>h.source==='**').headers)res.setHeader(h.key,h.value);
  res.setHeader('Content-Type',mime);fs.readFile(file,(err,data)=>{res.writeHead(err?404:200).end(err?'':data);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.MC_CHROMIUM_PATH || undefined,headless:true,args:['--no-sandbox']});
  const page=await browser.newPage(),errors=[];
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>typeof mcDespacharEvento==='function');
  assert.equal(await page.locator('[onclick],[oninput],[onkeydown]').count(),0);
  await page.evaluate(()=>{
   window.probe={calls:[],violations:[]};
   document.addEventListener('securitypolicyviolation',e=>probe.violations.push(e.effectiveDirective));
   login=()=>probe.calls.push('login');
   navigate=(...args)=>probe.calls.push(args);
  });
  await page.locator('#loginBtn').click();
  await page.locator('#loginPassword').press('a');
  await page.locator('#loginPassword').press('Enter');
  assert.deepEqual(await page.evaluate(()=>probe.calls),['login','login']);
  const payload=`'\"><img src=x onerror=alert(1)>`;
  await page.evaluate(value=>{
   const zone=document.createElement('div');zone.id='probe-zone';
   zone.innerHTML=`<button id="probe-action" ${mcEvento('click','navigate',value)}>Acción</button><input id="probe-field" ${mcEvento('input','mcNormalizarIdComunidad')}>`;
   document.body.append(zone);
   const script=document.createElement('script');script.textContent='window.injectedScript=true';document.body.append(script);
   const button=document.createElement('button');button.id='probe-injected';button.textContent='Inyectado';button.setAttribute('onclick','window.injectedHandler=true');zone.append(button);
  },payload);
  await page.locator('#probe-action').click();assert.deepEqual(await page.evaluate(()=>probe.calls.at(-1)),[payload]);
  await page.locator('#probe-field').fill('TORRE Norte!');assert.equal(await page.locator('#probe-field').inputValue(),'torre-norte-');
  await page.locator('#probe-injected').click();
  assert.equal(await page.evaluate(()=>!!window.injectedScript||!!window.injectedHandler),false);
  const violations=await page.evaluate(()=>probe.violations);
  assert.ok(violations.includes('script-src-elem'));assert.ok(violations.includes('script-src-attr'));
  assert.deepEqual(errors,[]);
  console.log('PASS Chromium: app externa, clic/Enter/input, datos hostiles y bloqueo CSP de script/handler inline; sin acceso a Firebase.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
