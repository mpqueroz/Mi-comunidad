'use strict';
// Obtiene exclusivamente el SDK público oficial, sin credenciales ni APIs de proyecto.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const URL='https://www.gstatic.com/firebasejs/10.13.2/firebase-app-check-compat.js';
async function main(){
 const args=process.argv.slice(2);if(args.length!==1||!['--export','--verify'].includes(args[0]))throw Error('Modo no válido.');
 const response=await fetch(URL,{redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Descarga oficial no completada.');
 const buffer=Buffer.from(await response.arrayBuffer());
 if(buffer.length<10000||buffer.length>150000||!buffer.toString('utf8').includes('ReCaptchaEnterpriseProvider'))throw Error('SDK no reconocido.');
 const sha256=crypto.createHash('sha256').update(buffer).digest('hex');
 console.log('APP_CHECK_SDK_SHA256='+sha256);
 if(args[0]==='--export'){
  const data=buffer.toString('base64');for(let n=0;n<data.length;n+=6000)console.log('APP_CHECK_SDK_BASE64='+data.slice(n,n+6000));
 }else{
  const local=fs.readFileSync(path.join(__dirname,'../public/vendor/firebase-10.13.2/firebase-app-check-compat.js'));
  if(!buffer.equals(local))throw Error('La copia local no coincide con la URL oficial fijada.');
  console.log('SDK oficial y copia local idénticos.');
 }
}
main().catch(()=>{console.error('No se pudo verificar el SDK público oficial de App Check.');process.exitCode=1;});
