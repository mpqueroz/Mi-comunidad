'use strict';
// Conserva las reglas actualmente publicadas de las demás aplicaciones.
const fs=require('node:fs');
const path=require('node:path');
const {createRequire}=require('node:module');

function skip(source,at){
  while(at<source.length){
    if(/\s/.test(source[at])){at++;continue;}
    if(source.startsWith('//',at)){const end=source.indexOf('\n',at);at=end<0?source.length:end+1;continue;}
    if(source.startsWith('/*',at)){const end=source.indexOf('*/',at+2);if(end<0)throw Error('Comentario de reglas sin cerrar.');at=end+2;continue;}
    break;
  }
  return at;
}
function endBlock(source,at){
  let depth=0;
  for(let i=at;i<source.length;i++){
    if(source.startsWith('//',i)||source.startsWith('/*',i)){i=skip(source,i)-1;continue;}
    if(source[i]==="'"||source[i]==='"'){
      const quote=source[i];let closed=false;
      while(++i<source.length){if(source[i]==='\\'){i++;continue;}if(source[i]===quote){closed=true;break;}}
      if(!closed)throw Error('Texto de reglas sin cerrar.');
      continue;
    }
    if(source[i]==='{')depth++;
    if(source[i]==='}'&&--depth===0)return i+1;
  }
  throw Error('Bloque de reglas sin cerrar.');
}
function section(source){
  const starts=[...source.matchAll(/\bfunction\s+mcEsMiComunidad\s*\(\s*\)\s*\{/g)];
  if(starts.length!==1)throw Error('No se identificó una única sección de Mi Comunidad.');
  const start=starts[0].index;let at=start;
  while(at<source.length){
    at=skip(source,at);
    const fn=source.slice(at).match(/^function\s+mc\w+\s*\([^)]*\)\s*\{/);
    if(fn){at=endBlock(source,at+fn[0].length-1);continue;}
    const license=source.slice(at).match(/^match\s+\/mi_comunidad_licencias\/\{comunidadId\}\s*\{/);
    if(license){at=endBlock(source,at+license[0].length-1);continue;}
    const match=source.slice(at).match(/^match\s+\/mi_comunidad_comunidades\/\{comunidadId\}\s*\{/);
    if(!match)throw Error('La sección contiene reglas ajenas o una estructura inesperada; no se reemplazará.');
    return {start,end:endBlock(source,at+match[0].length-1)};
  }
  throw Error('No se encontró el bloque de comunidades.');
}
function merge(live,local){
  const a=section(live),b=section(local);
  return live.slice(0,a.start)+local.slice(b.start,b.end)+live.slice(a.end);
}
async function main(){
  const root=path.join(__dirname,'..');
  const sdk=createRequire(path.join(root,'functions/package.json'));
  const {initializeApp,applicationDefault}=sdk('firebase-admin/app');
  const {getSecurityRules}=sdk('firebase-admin/security-rules');
  const projectId=JSON.parse(fs.readFileSync(path.join(root,'.firebaserc'),'utf8')).projects.default;
  const app=initializeApp({credential:applicationDefault(),projectId});
  const rules=getSecurityRules(app);
  const current=await rules.getFirestoreRuleset();
  if(current.source.length!==1)throw Error('El conjunto publicado tiene varios archivos; requiere revisión.');
  const file=path.join(root,'firestore.rules');
  const local=fs.readFileSync(file,'utf8');
  if(process.argv.includes('--verify')){
    if(current.source[0].content!==local)throw Error('Las reglas publicadas no coinciden con las preparadas.');
    console.log('Reglas publicadas verificadas; se conservaron las demás aplicaciones.');
    return;
  }
  const live=current.source[0].content;
  const merged=merge(live,local);
  const backup=path.join(process.env.RUNNER_TEMP||require('node:os').tmpdir(),'mi-comunidad-reglas-anteriores.rules');
  fs.writeFileSync(backup,live,{mode:0o600});
  fs.writeFileSync(file,merged);
  console.log('Preparadas únicamente las reglas de Mi Comunidad sobre las reglas vigentes.');
}
module.exports={merge,section};
if(require.main===module)main().catch(err=>{console.error(err.message);process.exitCode=1;});
