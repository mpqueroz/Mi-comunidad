'use strict';
// Prueba local aislada. Requiere Playwright/Chromium; no usa cuentas ni red de Firebase.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../public');
const config=require('../../firebase.json');
async function comprobarDemo(browser,origin){
 const page=await browser.newPage(),errors=[],connections=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const request=route.request();
  if(['fetch','xhr','websocket'].includes(request.resourceType()))connections.push(request.url());
  return new URL(request.url()).origin===origin?route.continue():route.abort();
 });
 await page.goto(origin+'/demo/');
 await page.waitForFunction(()=>typeof demoEntrar==='function'&&typeof mcDespacharEvento==='function');
 assert.equal(await page.locator('[onclick],[oninput],[onchange]').count(),0);
 // Claves ficticias que simulan preferencias ajenas y el espacio de esta demo.
 await page.evaluate(()=>{
  localStorage.setItem('mc_otra_comunidad_tema','conservar');
  localStorage.setItem('mc_los-robles_tema','conservar');
  localStorage.setItem('mc_demo_los-robles_tema','dark');
 });
 for(const role of ['admin','conserje','residente']){
  const selector=`button[data-mc-click='${JSON.stringify(['demoEntrar',role]).replaceAll(',',', ')}']`;
  await page.locator(selector).click();
  await page.waitForFunction(role=>currentRole===role&&!document.getElementById('app').classList.contains('hidden'),role);
  assert.ok((await page.locator('#content').innerText()).trim().length>0);
  // Recorre las vistas habilitadas de cada rol y verifica el HTML generado.
  await page.evaluate(()=>{for(const view of rolesConfig[currentRole].paginas)navigate(view);});
  assert.equal(await page.locator('#app [onclick],#app [oninput],#app [onchange]').count(),0);
  await page.locator('.demo-switch').click();
  await page.waitForFunction(()=>currentRole===null);
 }
 await page.evaluate(()=>{
  window.demoProbe={reports:[]};
  document.addEventListener('securitypolicyviolation',e=>demoProbe.reports.push(e.effectiveDirective));
  const script=document.createElement('script');script.textContent='window.demoInjected=true';document.body.append(script);
  const button=document.createElement('button');button.id='demo-injected';button.textContent='Control de prueba';
  button.style.cssText='position:fixed;top:10px;left:10px;z-index:2147483647';
  button.setAttribute('onclick','window.demoInjected=true');document.body.append(button);
 });
 await page.locator('#demo-injected').click();
 await page.waitForFunction(()=>demoProbe.reports.includes('script-src-elem')&&demoProbe.reports.includes('script-src-attr'),null,{timeout:5000});
 assert.equal(await page.evaluate(()=>!!window.demoInjected),false);
 await page.locator('#demo-injected').evaluate(el=>el.remove());
 page.once('dialog',dialog=>dialog.accept());
 await Promise.all([page.waitForEvent('load'),page.locator('.demo-reset').click()]);
 await page.waitForFunction(()=>typeof demoEntrar==='function'&&document.getElementById('loginScreen'));
 const storage=await page.evaluate(()=>({other:localStorage.getItem('mc_otra_comunidad_tema'),legacy:localStorage.getItem('mc_los-robles_tema'),demo:localStorage.getItem('mc_demo_los-robles_tema')}));
 assert.deepEqual(storage,{other:'conservar',legacy:'conservar',demo:null});
 assert.deepEqual(errors,[]);assert.deepEqual(connections,[],'La demo no debe consultar ningún backend');
 console.log('PASS Chromium demo: tres roles, vistas, reinicio aislado y rechazo CSP sin consultas al backend.');
 await page.close();
}
async function main(){
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.join(root,pathname.endsWith('/')?pathname+'index.html':pathname);
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
  const origin=`http://127.0.0.1:${server.address().port}`;
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/');
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
   // Controles de prueba lejos del aviso fijo inferior del emulador.
   zone.style.cssText='position:fixed;top:20px;left:20px;z-index:2147483647;background:white;padding:16px';
   zone.innerHTML=`<button id="probe-action" ${mcEvento('click','navigate',value)}>Acción</button><input id="probe-field" ${mcEvento('input','mcNormalizarIdComunidad')}>`;
   document.body.append(zone);
   const script=document.createElement('script');script.textContent='window.injectedScript=true';document.body.append(script);
   const button=document.createElement('button');button.id='probe-injected';button.textContent='Inyectado';button.setAttribute('onclick','window.injectedHandler=true');zone.append(button);
  },payload);
  await page.locator('#probe-action').click();assert.deepEqual(await page.evaluate(()=>probe.calls.at(-1)),[payload]);
  await page.locator('#probe-field').fill('TORRE Norte!');assert.equal(await page.locator('#probe-field').inputValue(),'torre-norte-');
  await page.locator('#probe-injected').click();
  assert.equal(await page.evaluate(()=>!!window.injectedScript||!!window.injectedHandler),false);
  // Los reportes de CSP se entregan como eventos asíncronos.
  await page.waitForFunction(()=>probe.violations.includes('script-src-elem')&&probe.violations.includes('script-src-attr'), null, {timeout:5000});
  const violations=await page.evaluate(()=>probe.violations);
  assert.ok(violations.includes('script-src-elem'));assert.ok(violations.includes('script-src-attr'));
  assert.deepEqual(errors,[]);
  await comprobarDemo(browser,origin);
  console.log('PASS Chromium: app externa, clic/Enter/input, datos hostiles y bloqueo CSP de script/handler inline; sin acceso a Firebase.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
