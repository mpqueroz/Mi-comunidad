'use strict';
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.mcIniciarAppCheck=api.initialize;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const CONFIG=Object.freeze({
  projectId:'mercado-ciudadano',
  appId:'1:165528119795:web:6590d7dd3f164e7c70ca86',
  siteKey:'6LfE2CMuAAAAAMFP3OOSjxVJoUsd0aOroYjDmBfh'
 });
 function initialize({firebase,hostname}){
  if(typeof hostname!=='string'||!hostname)throw Error('Entorno no identificable.');
  // Solo los emuladores locales omiten atestación. No habilita tokens de depuración.
  if(['localhost','127.0.0.1','[::1]','::1'].includes(hostname))
   return Object.freeze({environment:'emulator',check:async()=>({ok:false,estado:'emulador-sin-atestacion'})});
  if(typeof firebase?.app!=='function'||typeof firebase?.appCheck!=='function'||
     typeof firebase.appCheck.ReCaptchaEnterpriseProvider!=='function')throw Error('SDK App Check no disponible.');
  const app=firebase.app();
  if(app.options?.projectId!==CONFIG.projectId||app.options?.appId!==CONFIG.appId)throw Error('Aplicación no autorizada.');
  const appCheck=firebase.appCheck(app);
  appCheck.activate(new firebase.appCheck.ReCaptchaEnterpriseProvider(CONFIG.siteKey),true);
  return Object.freeze({environment:'web',check:async()=>{
   try{
    const result=await appCheck.getToken(false);
    return result&&typeof result.token==='string'&&result.token.length>0?
     {ok:true,estado:'token-obtenido'}:{ok:false,estado:'token-no-obtenido'};
   }catch(_){return {ok:false,estado:'token-no-obtenido'};}
  }});
 }
 return {initialize,CONFIG};
});
