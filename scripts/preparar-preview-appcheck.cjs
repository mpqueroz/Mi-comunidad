'use strict';
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(ROOT,'.appcheck-preview');
function build(){
 const source=fs.readFileSync(path.join(ROOT,'public/app.js'),'utf8');
 const match=source.match(/const firebaseConfig = (\{[\s\S]*?\n\});/);
 if(!match)throw Error('Configuración no identificable.');
 const config=JSON.parse(match[1].replace(/^(\s*)(\w+):/gm,'$1"$2":'));
 if(config.projectId!=='mercado-ciudadano'||config.appId!=='1:165528119795:web:6590d7dd3f164e7c70ca86')throw Error('Proyecto inesperado.');
 fs.rmSync(OUT,{recursive:true,force:true});
 const pub=path.join(OUT,'public');fs.mkdirSync(pub,{recursive:true});
 for(const name of ['firebase-app-compat.js','firebase-app-check-compat.js'])
  fs.copyFileSync(path.join(ROOT,'public/vendor/firebase-10.13.2',name),path.join(pub,name));
 fs.copyFileSync(path.join(ROOT,'public/app-check.js'),path.join(pub,'app-check.js'));
 fs.copyFileSync(path.join(ROOT,'qa/appcheck-preview.html'),path.join(pub,'index.html'));
 fs.copyFileSync(path.join(ROOT,'qa/appcheck-preview.js'),path.join(pub,'diagnostico.js'));
 fs.writeFileSync(path.join(pub,'config.js'),'firebase.initializeApp('+JSON.stringify(config)+');\n');
 fs.writeFileSync(path.join(pub,'robots.txt'),'User-agent: *\nDisallow: /\n');
 const csp="default-src 'none'; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; connect-src https://content-firebaseappcheck.googleapis.com https://firebaseappcheck.googleapis.com https://www.google.com/recaptcha/; frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests";
 fs.writeFileSync(path.join(OUT,'firebase.json'),JSON.stringify({hosting:{site:'mi-comunidad-md',public:'public',ignore:[],headers:[{source:'**',headers:[
 {key:'Content-Security-Policy',value:csp},{key:'Cache-Control',value:'no-store'},
 {key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
 {key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'}]}]}}));
 return OUT;
}
module.exports={build,OUT};
if(require.main===module){build();console.log('Diagnóstico aislado preparado; sin Auth, Firestore ni Functions.');}
