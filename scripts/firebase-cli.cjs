'use strict';
// minimatch 11 conserva los parches de seguridad, pero la CLI todavía usa
// require('minimatch') como función. Adaptar solo su export CommonJS en este
// proceso; mantener también todos los exports de la API moderna.
const path=require('node:path');
const {createRequire}=require('node:module');
function prepare(){
 const tools=createRequire(path.join(__dirname,'../tests/package.json'));
 const firebasePackage=tools.resolve('firebase-tools/package.json');
 const firebase=createRequire(firebasePackage);
 const resolved=firebase.resolve('minimatch');
 const api=firebase('minimatch');
 if(typeof api!=='function'){
  if(typeof api?.minimatch!=='function')throw Error('Export de minimatch no reconocido; se detiene la CLI.');
  const compatible=Object.assign((...args)=>api.minimatch(...args),api);
  require.cache[resolved].exports=compatible;
 }
 return {firebase,root:path.dirname(firebasePackage)};
}
module.exports={prepare};
if(require.main===module){const {root}=prepare();require(path.join(root,'lib/bin/firebase.js'));}
