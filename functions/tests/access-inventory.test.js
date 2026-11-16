'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {inventory, options, paged} = require('../../scripts/auditar-accesos.cjs');

function fixtures(entries, pages) {
  const reads = [];
  const forbidden = () => { throw Error('El inventario intentó escribir'); };
  function ref(path) {
    return {path, collection: name => collection(path + '/' + name), set: forbidden, update: forbidden,
      create: forbidden, delete: forbidden, async get() {
        reads.push(path);
        const data = entries[path];
        return {id: path.split('/').at(-1), exists: data !== undefined, ref: ref(path),
          data: () => data, get: key => data?.[key]};
      }};
  }
  function collection(path) {
    return {doc: id => ref(path + '/' + id), add: forbidden, orderBy(name) {
      assert.equal(name, '__name__');
      return {limit(size) {
        assert.equal(size, 500);
        let after = '';
        return {startAfter(doc) { after = doc.id; return this; }, async get() {
          const keys = Object.keys(entries).filter(key => key.startsWith(path + '/') &&
            key.slice(path.length + 1).indexOf('/') === -1 && key.slice(path.length + 1) > after).sort().slice(0, size);
          return {docs: await Promise.all(keys.map(key => ref(key).get()))};
        }};
      }};
    }};
  }
  let calls = 0;
  return {db: {collection, batch: forbidden, runTransaction: forbidden}, auth: {
    createUser: forbidden, setCustomUserClaims: forbidden, updateUser: forbidden,
    async listUsers(size, token) {
      assert.equal(size, 1000);
      assert.equal(token, calls ? 'next-' + calls : undefined);
      const users = pages[calls++] || [];
      return {users, ...(calls < pages.length ? {pageToken: 'next-' + calls} : {})};
    }
  }, reads};
}
const base = 'mi_comunidad_comunidades/torre';
const validLicense = {estado: 'active', paidUntil: new Date('2099-01-01')};
const user = (uid, role, extra = {}) => ({uid, email: 'NO-IMPRIMIR@example.invalid', passwordHash: 'NO-IMPRIMIR',
  customClaims: {app: 'mi_comunidad', role, comunidadId: 'torre', ...extra}});

test('inventario exige proyecto explícito y rechaza opciones desconocidas antes de usar ADC', () => {
  for (const args of [[], ['--project'], ['--apply'], ['--project', 'mercado-ciudadano', '--project', 'otro-proyecto']]) {
    assert.throws(() => options(args));
  }
  assert.deepEqual(options(['--project', 'mercado-ciudadano', '--require-clean']),
    {projectId: 'mercado-ciudadano', requireClean: true, details: false});
});

test('inventario pagina Auth, separa otras apps y no devuelve datos personales', async () => {
  const f = fixtures({[base]: {nombre: 'NO-IMPRIMIR'},
    'mi_comunidad_licencias/torre': validLicense, [base + '/administradores/a']: {estado: 'Activo'},
    [base + '/residentes/r']: {estado: 'Activo', depto: '101'}},
  [[user('a', 'admin'), {...user('otra', 'admin'), customClaims: {app: 'otra_app'}}], [user('r', 'residente', {depto: '101'})]]);
  const report = await inventory(f.db, f.auth);
  assert.equal(report.readyForStrictAccess, true);
  assert.equal(report.appAccounts, 2);
  assert.equal(report.communities, 1);
  assert.ok(!JSON.stringify(report).includes('NO-IMPRIMIR'));
  assert.equal(report.issues, undefined);
});

test('inventario detecta excepciones heredadas e inconsistencias sin crear ni habilitar cuentas', async () => {
  const f = fixtures({[base]: {}, [base + '/administradores/huérfano']: {estado: 'Activo'},
    [base + '/residentes/r']: {estado: 'Activo', depto: '202'},
    [base + '/conserjes/c']: {estado: 'Activo'}},
  [[user('a', 'admin'), user('r', 'residente', {depto: '101'}), {...user('c', 'conserje'), disabled: true},
    user('otro', 'admin', {comunidadId: 'inexistente'})]]);
  const report = await inventory(f.db, f.auth, {details: true});
  assert.equal(report.readyForStrictAccess, false);
  for (const kind of ['licencia_ausente', 'ficha_ausente_admin', 'departamento_inconsistente',
    'estado_auth_ficha_inconsistente', 'cuenta_sin_comunidad', 'ficha_admin_sin_cuenta_valida']) assert.equal(report.issueCounts[kind], 1, kind);
  assert.ok(!JSON.stringify(report).includes('NO-IMPRIMIR'));
});

test('inventario distingue licencia vencida existente de ausencia que requiere migración', async () => {
  const f = fixtures({[base]: {}, 'mi_comunidad_licencias/torre': {estado: 'expired'}}, [[]]);
  const report = await inventory(f.db, f.auth);
  assert.equal(report.issueCounts.licencia_sin_acceso, 1);
  assert.equal(report.readyForStrictAccess, true);
});

test('inventario no informa éxito parcial ante fallo de lectura o paginación Auth repetida', async () => {
  await assert.rejects(inventory({collection() { throw Error('sin permiso'); }}, {}), /sin permiso/);
  const f = fixtures({}, [[]]);
  await assert.rejects(inventory(f.db, {listUsers: async () => ({users: [], pageToken: 'repetido'})}), /Paginación/);
});

test('paginación Firestore continúa después de 500 documentos, sin omitir el último bloque', async () => {
  const docs = Array.from({length: 501}, (_, i) => ({id: String(i).padStart(4, '0')}));
  const visited = [];
  const collection = {orderBy: () => ({limit: () => {
    let start = 0;
    return {startAfter(doc) { start = docs.indexOf(doc) + 1; return this; }, async get() { return {docs: docs.slice(start, start + 500)}; }};
  }})};
  await paged(collection, doc => visited.push(doc.id));
  assert.equal(visited.length, 501);
  assert.equal(new Set(visited).size, 501);
});

test('inventario clasifica administradores sin ficha sin identificadores y sin cambiar los bloqueos',async()=>{
 const f=fixtures({[base]:{estado:'Activa',adminUid:'NO-IMPRIMIR-owner'},'mi_comunidad_licencias/torre':validLicense},
 [[user('NO-IMPRIMIR-owner','admin'),{...user('NO-IMPRIMIR-old','admin'),disabled:true}]]);
 const result=await inventory(f.db,f.auth);
 assert.deepEqual(result.missingAdminProfiles,{authEnabled:1,authDisabled:1,matchesCommunityOwner:1,ownerNotRecorded:0,differentCommunityOwner:1,currentlyLicensedAndActive:1});
 assert.equal(result.readyForStrictAccess,false);assert.equal(result.issueCounts.ficha_ausente_admin,2);assert.ok(!JSON.stringify(result).includes('NO-IMPRIMIR'));
});

test('inventario revisa bloques históricos y bloquea publicación sin imprimir sus datos',async()=>{
 const good={lugar:'Quincho',nombre:'NO-IMPRIMIR',horaInicio:'10:00',horaFin:'14:00',activo:true,ts:1};
 const entries={[base]:{estado:'Activa'},'mi_comunidad_licencias/torre':validLicense,[base+'/bloquesReserva/NO-IMPRIMIR-1']:good,[base+'/bloquesReserva/NO-IMPRIMIR-2']:{...good,horaInicio:'25:00'}};
 const f=fixtures(entries,[[]]),r=await inventory(f.db,f.auth);
 assert.deepEqual(r.reservationBlocks,{scanned:2,compatible:1,incompatible:1});
 assert.equal(r.issueCounts.bloque_reserva_incompatible,1);assert.equal(r.readyForStrictAccess,false);
 assert.ok(!JSON.stringify(r).includes('NO-IMPRIMIR'));
 delete entries[base+'/bloquesReserva/NO-IMPRIMIR-2'];
 const clean=await inventory(fixtures(entries,[[]]).db,fixtures(entries,[[]]).auth);
 assert.equal(clean.readyForStrictAccess,true);
});
test('compatibilidad de bloques exige campos, tipos, tamaños y horas válidas',()=>{
 const {compatibleReservationBlock:valid}=require('../../scripts/auditar-accesos.cjs');
 const good={lugar:'Quincho',nombre:'Noche',horaInicio:'22:00',horaFin:'06:00',activo:true,ts:1};
 assert.equal(valid(good),true);
 for(const patch of [{lugar:'Otro'},{nombre:''},{nombre:'x'.repeat(101)},{horaInicio:'24:00'},{horaFin:'6:00'},{activo:1},{ts:1.5},{extra:true}])assert.equal(valid({...good,...patch}),false);
 for(const key of Object.keys(good)){const copy={...good};delete copy[key];assert.equal(valid(copy),false);}
});
