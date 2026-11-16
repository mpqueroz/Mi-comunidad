'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {initialize,CONFIG}=require('../../public/app-check.js');
function sdk(options=CONFIG){
 const calls=[];const service={activate:(provider,refresh)=>calls.push({key:provider.key,refresh}),getToken:async force=>{calls.push({force});return {token:'SIMULATED_TOKEN_NOT_FOR_PRODUCTION'};}};
 const firebase={app:()=>({options}),appCheck:Object.assign(()=>service,{ReCaptchaEnterpriseProvider:class{constructor(key){this.key=key;}}})};
 return {firebase,service,calls};
}
test('App Check usa Enterprise y renovación, sin exponer tokens en el diagnóstico',async()=>{
 const f=sdk(),app=initialize({...f,hostname:'mi-comunidad-md.web.app'});
 assert.deepEqual(f.calls,[{key:CONFIG.siteKey,refresh:true}]);
 assert.deepEqual(await app.check(),{ok:true,estado:'token-obtenido'});
 assert.deepEqual(f.calls[1],{force:false});assert.ok(!JSON.stringify(await app.check()).includes('SIMULATED_TOKEN'));
});
test('App Check solo omite atestación en hosts locales exactos, sin debug de producción',async()=>{
 for(const hostname of ['localhost','127.0.0.1','[::1]','::1']){
  const app=initialize({firebase:{},hostname});assert.equal(app.environment,'emulator');assert.equal((await app.check()).ok,false);
 }
 const f=sdk();initialize({...f,hostname:'not-localhost.example'});assert.equal(f.calls.length,1);
 assert.throws(()=>initialize({firebase:{},hostname:''}));
});
test('App Check rechaza SDK ausente o configuración de otra app/proyecto antes de activar',()=>{
 for(const options of [{...CONFIG,projectId:'otra'},{...CONFIG,appId:'otra'}]){
  const f=sdk(options);assert.throws(()=>initialize({...f,hostname:'mi-comunidad-md.web.app'}));assert.equal(f.calls.length,0);
 }
 assert.throws(()=>initialize({firebase:{},hostname:'mi-comunidad-md.web.app'}));
});
test('App Check no convierte rechazo o respuesta vacía en una verificación exitosa',async()=>{
 const f=sdk();f.service.getToken=async()=>{throw Error('PRIVATE_ERROR_WITH_TOKEN');};
 assert.deepEqual(await initialize({...f,hostname:'mi-comunidad-md.web.app'}).check(),{ok:false,estado:'token-no-obtenido'});
 f.service.getToken=async()=>({});assert.equal((await initialize({...f,hostname:'mi-comunidad-md.web.app'}).check()).ok,false);
});
test('App Check se inicializa antes de Auth/Firestore y sus scripts son locales',()=>{
 const root=path.join(__dirname,'../..'),main=fs.readFileSync(path.join(root,'public/app.js'),'utf8'),html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
 assert.ok(main.indexOf('mcIniciarAppCheck({firebase,hostname:location.hostname})')<main.indexOf('const auth = firebase.auth()'));
 assert.ok(html.indexOf('firebase-app-check-compat.js')<html.indexOf('src="app.js"'));
 assert.ok(html.indexOf('src="app-check.js"')<html.indexOf('src="app.js"'));
 assert.ok(!html.includes('gstatic.com/firebasejs'));
 assert.ok(!fs.readFileSync(path.join(root,'public/demo/index.html'),'utf8').includes('app-check'));
});
