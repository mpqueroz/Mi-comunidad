'use strict';
const fs=require('node:fs');
const path=require('node:path');
const SECRETS=['MC_MP_ACCESS_TOKEN','MC_MP_WEBHOOK_SECRET','MC_PLAN_ANUAL_CLP','MC_MP_WEBHOOK_URL','MC_MP_ENVIRONMENT','MC_MP_TEST_ACCOUNT'];
const FUNCTIONS=['webhookMercadoPagoMiComunidad','conciliarPagosMiComunidad','consultarLicenciaMiComunidad','cotizarPlanMiComunidad','resolverRevisionPagoMiComunidad','reiniciarCheckoutFallidoMiComunidad','crearCheckoutMiComunidad'];
function productionSource(source){
  for(const name of SECRETS){
    const re=new RegExp(`defineSecret\\(["']${name}["']\\)`,'g');
    if((source.match(re)||[]).length!==1)throw Error(`Declaración de secreto inesperada: ${name}`);
    source=source.replace(re,`defineSecret("${name}_PRODUCTION")`);
  }
  return source;
}
function stage(root,destination){
  if(fs.existsSync(destination))throw Error('El destino debe ser nuevo.');
  const source=path.join(root,'functions');
  const transformed=productionSource(fs.readFileSync(path.join(source,'mercadopago.js'),'utf8'));
  fs.mkdirSync(destination,{mode:0o700});
  fs.cpSync(source,path.join(destination,'functions'),{recursive:true,filter:file=>!path.relative(source,file).split(path.sep).some(part=>part.startsWith('.')||['node_modules','tests','crear-superadmin.js','restablecer-clave.js'].includes(part)||/serviceAccountKey|firebase-adminsdk|\.pem$|\.local$/.test(part))});
  fs.writeFileSync(path.join(destination,'functions/mercadopago.js'),transformed);
  fs.writeFileSync(path.join(destination,'firebase.json'),JSON.stringify({functions:[{source:'functions',codebase:'mi-comunidad',ignore:['node_modules','tests','*.local','.*']}]},null,2));
}
module.exports={SECRETS,FUNCTIONS,productionSource,stage};
if(require.main===module){if(process.argv.length!==3)throw Error('Uso: preparar-pagos-produccion.cjs DESTINO_NUEVO');stage(path.join(__dirname,'..'),path.resolve(process.argv[2]));}
