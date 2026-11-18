'use strict';
document.getElementById('dominio').textContent=location.hostname;
const button=document.getElementById('comprobar');
const result=document.getElementById('resultado');
let check;
button.addEventListener('click',async()=>{
 button.disabled=true;result.textContent='Comprobando con Google…';
 let timer;
 try{
  check=check||mcIniciarAppCheck({firebase,hostname:location.hostname});
  const state=await Promise.race([check.check(),new Promise(resolve=>{timer=setTimeout(()=>resolve({ok:false}),45000);})]);
  result.textContent=state.ok?'Comprobación correcta: Google entregó un token de App Check.':'No se pudo comprobar. Revisa el dominio permitido y la configuración de App Check.';
 }catch(_){result.textContent='No se pudo iniciar la comprobación. Revisa la configuración de App Check.';}
 finally{clearTimeout(timer);button.disabled=false;}
});
