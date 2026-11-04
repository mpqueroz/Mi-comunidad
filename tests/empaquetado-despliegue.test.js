'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {prepare}=require('../scripts/firebase-cli.cjs');
test('despliegue: empaqueta Functions con minimatch parcheado y conserva exclusiones',async()=>{
 const {firebase}=prepare();
 const mm=firebase('minimatch');assert.equal(typeof mm,'function');assert.equal(typeof mm.minimatch,'function');assert.equal(typeof mm.Minimatch,'function');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-package-'));
 let archive;
 try{
  fs.mkdirSync(path.join(dir,'functions/node_modules/private'),{recursive:true});
  fs.writeFileSync(path.join(dir,'functions/index.js'),'exports.ensayo = true;');
  fs.writeFileSync(path.join(dir,'functions/credentials.local'),'FICTITIOUS_SECRET');
  fs.writeFileSync(path.join(dir,'functions/node_modules/private/key.txt'),'FICTITIOUS_SECRET');
  const config={ignore:['node_modules','*.local']};
  const files=await firebase('./lib/fsAsync').readdirRecursive({path:path.join(dir,'functions'),ignoreStrings:config.ignore});
  assert.deepEqual(files.map(f=>path.relative(path.join(dir,'functions'),f.name)),['index.js']);
  const packed=await firebase('./lib/deploy/functions/prepareFunctionsUpload').prepareFunctionsUpload(dir,path.join(dir,'functions'),config,[]);
  archive=packed.pathToSource;assert.ok(archive);assert.ok(fs.statSync(archive).size>0);assert.equal(fs.readFileSync(archive).subarray(0,2).toString(),'PK');
 }finally{fs.rmSync(dir,{recursive:true,force:true});if(archive)fs.rmSync(archive,{force:true});}
});
test('despliegue: la entrada real de la CLI conserva sus argumentos',()=>{
 const {execFileSync}=require('node:child_process');
 const version=execFileSync(process.execPath,[path.join(__dirname,'../scripts/firebase-cli.cjs'),'--version'],{encoding:'utf8'}).trim();
 assert.match(version,/^15\.34\.0$/);
});
