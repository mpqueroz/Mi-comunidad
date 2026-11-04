'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const {SECRETS,FUNCTIONS,productionSource,stage}=require('../scripts/preparar-pagos-produccion.cjs');
const {fingerprint,assertUnchanged}=require('../scripts/preparar-reglas-compartidas.cjs');
const root=path.join(__dirname,'..');
function python(body){const header="import sys; sys.dont_write_bytecode=True\nimport importlib.util\nspec=importlib.util.spec_from_file_location('verify','scripts/conectar-produccion.py')\nm=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)\n";const result=spawnSync('python3',['-c',header+body],{cwd:root,encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
test('producción: copia privada transforma secretos sin copiar credenciales ni cambiar origen',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mc-stage-'));
 try{
  const source=path.join(dir,'functions');fs.mkdirSync(source);
  const code=SECRETS.map((s,i)=>`const s${i}=defineSecret("${s}");`).join('\n');
  fs.writeFileSync(path.join(source,'mercadopago.js'),code);fs.writeFileSync(path.join(source,'index.js'),'// fixture');
  for(const name of ['.env','serviceAccountKey.json','key.pem','crear-superadmin.js','restablecer-clave.js'])fs.writeFileSync(path.join(source,name),'NO COPIAR');
  const target=path.join(dir,'release');stage(dir,target);
  assert.equal(fs.readFileSync(path.join(source,'mercadopago.js'),'utf8'),code);
  const transformed=fs.readFileSync(path.join(target,'functions/mercadopago.js'),'utf8');
  for(const s of SECRETS)assert.ok(transformed.includes(`defineSecret("${s}_PRODUCTION")`));
  assert.deepEqual(fs.readdirSync(path.join(target,'functions')).sort(),['index.js','mercadopago.js']);
  assert.equal(JSON.parse(fs.readFileSync(path.join(target,'firebase.json'))).functions[0].codebase,'mi-comunidad');
  assert.throws(()=>stage(dir,target));
  assert.throws(()=>productionSource(code.replace('MC_MP_ACCESS_TOKEN','RENAMED')));
  assert.throws(()=>productionSource(code+'\ndefineSecret("MC_MP_ACCESS_TOKEN")'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('producción: transforma declaraciones del backend actual',()=>{
 const result=productionSource(fs.readFileSync(path.join(root,'functions/mercadopago.js'),'utf8'));
 for(const s of SECRETS){assert.ok(result.includes(`defineSecret("${s}_PRODUCTION")`));assert.ok(!result.includes(`defineSecret("${s}")`));}
});
test('producción: selección comercial completa sin despliegue global y verificador sin mutaciones',()=>{
 const shell=fs.readFileSync(path.join(root,'scripts/habilitar-produccion.sh'),'utf8');
 for(const name of FUNCTIONS)assert.ok(shell.includes('functions:mi-comunidad:'+name));
 assert.ok(!shell.includes('npx'));
 const verifier=fs.readFileSync(path.join(root,'scripts/conectar-produccion.py'),'utf8');
 assert.ok(!verifier.includes('PATCH'));assert.ok(!verifier.includes('add-iam-policy-binding'));
});
test('reglas: aborta cambio de versión o contenido previo a publicación',()=>{
 const base={name:'projects/demo/rulesets/one',source:[{content:'fixture'}]};const saved=fingerprint(base);
 assert.doesNotThrow(()=>assertUnchanged(saved,base));
 assert.throws(()=>assertUnchanged(saved,{...base,name:'projects/demo/rulesets/two'}));
 assert.throws(()=>assertUnchanged(saved,{...base,source:[{content:'otra app'}]}));
 assert.throws(()=>assertUnchanged({},base));
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/firebase.yml'),'utf8');
 const check=workflow.indexOf('node scripts/preparar-reglas-compartidas.cjs --assert-unchanged');
 assert.ok(check>0&&check<workflow.indexOf('--only firestore:rules'));
});
test('verificador rechaza TEST e inactivos sin consultar red',()=>python(`for name,keys in m.EXPECTED.items():
    good={'state':'ACTIVE','serviceConfig':{'secretEnvironmentVariables':[{'key':k+'_PRODUCTION','secret':k+'_PRODUCTION','projectId':m.PROJECT,'version':'1'} for k in keys]}}
    m.verify_bindings(name,good)
    try: m.verify_bindings(name,{'state':'DEPLOYING'}); raise AssertionError('inactive accepted')
    except ValueError: pass
    if keys:
        good['serviceConfig']['secretEnvironmentVariables'][0]['secret']='TEST'
        try: m.verify_bindings(name,good); raise AssertionError('TEST accepted')
        except ValueError: pass
`));
test('TTL preflight bloquea ausencia, estados pendientes, otro campo y offset sin consultar secretos',()=>python(`name='projects/demo/databases/(default)/collectionGroups/mi_comunidad_webhook_recibos/fields/expiresAt'
m.verify_receipt_ttl([{'name':name,'ttlConfig':{'state':'ACTIVE'}}])
for fields in ([],[{'name':name,'ttlConfig':{'state':'CREATING'}}],[{'name':name,'ttlConfig':{'state':'NEEDS_REPAIR'}}],[{'name':name.replace('expiresAt','otro'),'ttlConfig':{'state':'ACTIVE'}}],[{'name':name,'ttlConfig':{'state':'ACTIVE','expirationOffset':'86400s'}}]):
    try: m.verify_receipt_ttl(fields); raise AssertionError('invalid TTL accepted')
    except ValueError: pass
calls=[]
def fake_read(*args):
    calls.append(args)
    return []
m.read=fake_read
try: m.preflight(); raise AssertionError('missing TTL accepted')
except ValueError: pass
assert len(calls)==1 and calls[0][:4]==('firestore','fields','ttls','list')
`));

test('smoke comercial exige rechazar sin sesión las nuevas acciones de recuperación',()=>{
 const smoke=fs.readFileSync(path.join(root,'scripts/comprobar-despliegue.cjs'),'utf8');
 assert.match(smoke,/process\.argv\.includes\('\-\-commercial'\)/);
 for(const name of ['cotizarPlanMiComunidad','resolverRevisionPagoMiComunidad','reiniciarCheckoutFallidoMiComunidad'])assert.ok(smoke.includes("'"+name+"'"));
 assert.match(smoke,/\[401, 403\]\.includes\(response\.status\)/);
 assert.ok(fs.readFileSync(path.join(root,'scripts/habilitar-produccion.sh'),'utf8').includes('comprobar-despliegue.cjs" --commercial'));
});

test('despliegue operativo incluye conciliación transaccional y smoke sin sesión',()=>{
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/firebase.yml'),'utf8');
 const smoke=fs.readFileSync(path.join(root,'scripts/comprobar-despliegue.cjs'),'utf8');
 for(const name of ['registrarPagoOperativoMiComunidad','gestionarIntegrantesFichaMiComunidad','confirmarIngresoComunidad','conciliarMovimientoComunidad','desvincularConciliacionComunidad']){
  assert.ok(workflow.includes('functions:'+name));assert.ok(smoke.includes("'"+name+"'"));
 }
});
