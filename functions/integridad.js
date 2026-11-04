'use strict';
const crypto = require('node:crypto');
const {evaluateLicense} = require('./licencias');

// Finanzas e integrantes son operaciones de servidor. No aceptar un estado
// pagado desde el navegador ni reemplazar una lista leída en otra sesión.
module.exports = function integridad(admin, onCall, HttpsError) {
  const db = admin.firestore();
  const stamp = () => admin.firestore.FieldValue.serverTimestamp();
  const fail = (code, message) => {throw new HttpsError(code, message);};
  function id(value) {
    if (typeof value !== 'string' || !value || value.length > 200 || value.includes('/')) fail('invalid-argument','Identificador inválido.');
    return value;
  }
  function text(value, max, required = false) {
    if (typeof value !== 'string' || value.length > max || /[\x00-\x1f\x7f]/.test(value) || (required && !value.trim())) fail('invalid-argument','Los datos no son válidos.');
    return value.trim();
  }
  function persona(value, tipo) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('invalid-argument','La persona debe ser un objeto.');
    const extra = tipo === 'familiares' ? 'parentesco' : 'motivo';
    if (Object.keys(value).some(k => !['nombre','rut',extra].includes(k))) fail('invalid-argument','La persona contiene campos desconocidos.');
    const nombre = text(value.nombre,150,true);
    const rut = text(value.rut === undefined ? '' : value.rut,20).replace(/[.\-\s]/g,'').toUpperCase();
    if (rut) {
      if (!/^[0-9]{7,8}[0-9K]$/.test(rut)) fail('invalid-argument','El RUT no es válido.');
      let total = 0, m = 2;
      for (let n = rut.length - 2; n >= 0; n--) {total += Number(rut[n]) * m; m = m === 7 ? 2 : m + 1;}
      const d = 11 - total % 11;
      if (rut.at(-1) !== (d === 11 ? '0' : d === 10 ? 'K' : String(d))) fail('invalid-argument','El RUT no es válido.');
    }
    return {nombre,rut,[extra]:text(value[extra] === undefined ? '' : value[extra],tipo === 'familiares' ? 60 : 500)};
  }
  function fecha(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('invalid-argument','Fecha de pago inválida.');
    const date = new Date(value + 'T00:00:00.000Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) fail('invalid-argument','Fecha de pago inválida.');
    return value;
  }
  const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const key = p => JSON.stringify(p);
  async function scope(tx, req, roles) {
    const token = req.auth?.token;
    if (!req.auth?.uid || !token || token.app !== 'mi_comunidad' || !roles.includes(token.role)) fail('permission-denied','Tu cuenta no puede realizar esta operación.');
    const comunidadId = id(req.data?.comunidadId);
    if (token.comunidadId !== comunidadId) fail('permission-denied','La operación no corresponde a tu comunidad.');
    const base = db.collection('mi_comunidad_comunidades').doc(comunidadId);
    const community = await tx.get(base);
    const license = await tx.get(db.collection('mi_comunidad_licencias').doc(comunidadId));
    const account = await tx.get(base.collection(token.role === 'admin' ? 'administradores' : 'residentes').doc(req.auth.uid));
    if (!community.exists || community.get('estado') === 'Suspendida' || (license.exists && !evaluateLicense(license.data()).allowed)) fail('failed-precondition','La comunidad o licencia no está activa.');
    if ((token.role !== 'admin' && !account.exists) || (account.exists && account.get('estado') === 'Inactivo') || (token.role === 'residente' && account.get('depto') !== token.depto)) fail('permission-denied','La cuenta no está habilitada.');
    return {base,token,uid:req.auth.uid};
  }
  function ledgerId(direction, tipo, entityId) {
    return direction + '_' + tipo + '_' + crypto.createHash('sha256').update(entityId).digest('hex');
  }
  const registrarPagoOperativoMiComunidad = onCall(async req => {
    const tipo = req.data?.tipo;
    if (!['remuneracion','mantencion'].includes(tipo)) fail('invalid-argument','Tipo de pago inválido.');
    const entityId = id(req.data?.id), movimientoId = ledgerId('egreso',tipo,entityId);
    return db.runTransaction(async tx => {
      const s = await scope(tx,req,['admin']);
      const ref = s.base.collection(tipo === 'remuneracion' ? 'remuneraciones' : 'mantenciones').doc(entityId);
      const mov = s.base.collection('movimientosContables').doc(movimientoId);
      const entity = await tx.get(ref), movement = await tx.get(mov);
      if (!entity.exists) fail('not-found','No se encontró el registro.');
      const e = entity.data(), estadoFinal = tipo === 'remuneracion' ? 'Pagado' : 'Realizada';
      if (!Number.isSafeInteger(e.monto) || e.monto <= 0) fail('failed-precondition','El monto del registro requiere revisión.');
      if (movement.exists) {
        const old = movement.data();
        if (e.estado !== estadoFinal || e.movimientoId !== movimientoId || old.entidadId !== entityId || old.entidadTipo !== tipo || old.monto !== e.monto || old.tipo !== 'Egreso') fail('failed-precondition','El pago presenta una inconsistencia y requiere revisión.');
        return {ok:true,movimientoId,repetido:true};
      }
      if (!((tipo === 'remuneracion' && e.estado === 'Pendiente') || (tipo === 'mantencion' && ['Programada','Atrasada'].includes(e.estado)))) fail('failed-precondition','El estado requiere revisión antes de registrar un egreso.');
      const fecha = today();
      tx.create(mov,{fecha,tipo:'Egreso',categoria:tipo === 'remuneracion' ? 'Remuneraciones' : 'Proveedores',descripcion:tipo === 'remuneracion' ? `Sueldo ${String(e.nombre || '').slice(0,150)} · ${String(e.periodo || '').slice(0,20)}` : `${String(e.tipo || '').slice(0,150)} · ${String(e.proveedor || '').slice(0,150)}`,monto:e.monto,origen:'Automático',entidadId:entityId,entidadTipo:tipo,registradoPor:s.uid,ts:Date.now(),creadoEn:stamp()});
      tx.update(ref,{estado:estadoFinal,[tipo === 'remuneracion' ? 'fechaPago' : 'fechaRealizada']:fecha,movimientoId,registradoPor:s.uid});
      tx.create(s.base.collection('auditoria').doc(),{tipo:'Registro de egreso operativo',entidadId:entityId,entidadTipo:tipo,movimientoId,monto:e.monto,actorUid:s.uid,ts:stamp()});
      return {ok:true,movimientoId,repetido:false};
    });
  });
  const confirmarIngresoComunidad = onCall(async req => {
    const d = req.data || {}, tipo = d.tipo;
    if (!['gasto','multa'].includes(tipo)) fail('invalid-argument','Tipo de ingreso inválido.');
    const entityId = id(d.id), movimientoId = ledgerId('ingreso',tipo,entityId);
    const fechaSolicitada = d.fechaPago === undefined ? null : fecha(d.fechaPago);
    const metodoSolicitado = d.metodoPago === undefined ? null : text(d.metodoPago,150,true);
    return db.runTransaction(async tx => {
      const s = await scope(tx,req,['admin']);
      const ref = s.base.collection(tipo === 'gasto' ? 'gastosComunes' : 'multas').doc(entityId);
      const mov = s.base.collection('movimientosContables').doc(movimientoId);
      const snap = await tx.get(ref), movement = await tx.get(mov);
      if (!snap.exists) fail('not-found','No se encontró la deuda.');
      const e = snap.data(), estadoFinal = tipo === 'gasto' ? 'Pagado' : 'Pagada';
      if (!Number.isSafeInteger(e.monto) || e.monto <= 0) fail('failed-precondition','El monto requiere revisión.');
      if (typeof e.depto !== 'string' || !e.depto.trim() || e.depto.length > 40) fail('failed-precondition','El departamento de la deuda requiere revisión.');
      if (movement.exists) {
        const old = movement.data();
        if (e.estado !== estadoFinal || e.movimientoId !== movimientoId || old.entidadId !== entityId || old.entidadTipo !== tipo || old.monto !== e.monto || old.tipo !== 'Ingreso') fail('failed-precondition','El ingreso presenta una inconsistencia y requiere revisión.');
        return {ok:true,movimientoId,repetido:true};
      }
      if (!(tipo === 'gasto' ? ['Pendiente','Atrasado','Por confirmar'] : ['Pendiente','Por confirmar']).includes(e.estado)) fail('failed-precondition','La deuda requiere revisión antes de confirmar un ingreso.');
      const fechaPago = fechaSolicitada || (typeof e.pagoInformado?.fecha === 'string' ? fecha(e.pagoInformado.fecha) : today());
      const metodoPago = metodoSolicitado || 'Registrado por administración';
      const descripcion = tipo === 'gasto' ? `Gasto común depto ${String(e.depto || '').slice(0,40)} · ${String(e.periodo || '').slice(0,20)}` : `Multa ${String(e.tipoMultaNombre || '').slice(0,150)} · Depto ${String(e.depto || '').slice(0,40)}`;
      tx.create(mov,{fecha:fechaPago,tipo:'Ingreso',categoria:tipo === 'gasto' ? 'Gasto común' : 'Multa',descripcion,monto:e.monto,origen:'Automático',depto:String(e.depto || ''),entidadId:entityId,entidadTipo:tipo,registradoPor:s.uid,ts:Date.now(),creadoEn:stamp()});
      tx.update(ref,{estado:estadoFinal,fechaPago,metodoPago,movimientoId,confirmadoEn:Date.now(),confirmadoPor:s.uid});
      // La transacción y el asiento determinista garantizan un solo aviso.
      // Un ID aleatorio impide que un cliente reserve de antemano su ruta.
      tx.create(s.base.collection('notificaciones').doc(),{icon:'circle-check',titulo:tipo === 'gasto' ? 'Pago de gasto común confirmado' : 'Pago de multa confirmado',meta:descripcion,depto:e.depto,paraTodos:false,leidaPor:[],ts:Date.now()});
      tx.create(s.base.collection('auditoria').doc(),{tipo:'Confirmación de ingreso',entidadId:entityId,entidadTipo:tipo,movimientoId,monto:e.monto,actorUid:s.uid,ts:stamp()});
      return {ok:true,movimientoId,repetido:false};
    });
  });
  const gestionarIntegrantesFichaMiComunidad = onCall(async req => {
    const d = req.data || {}, uid = id(d.uid), tipo = d.tipo;
    if (!['familiares','restringidos'].includes(tipo) || !['agregar','eliminar'].includes(d.accion)) fail('invalid-argument','Operación de integrantes inválida.');
    const target = persona(d.persona,tipo);
    return db.runTransaction(async tx => {
      const s = await scope(tx,req,['admin','residente']);
      if (s.token.role === 'residente' && uid !== s.uid) fail('permission-denied','Solo puedes editar tu propia ficha.');
      const ref = s.base.collection('residentes').doc(uid), snap = await tx.get(ref);
      if (!snap.exists) fail('not-found','No se encontró la ficha.');
      const raw = snap.data()[tipo] === undefined ? [] : snap.data()[tipo];
      let people;
      try {
        if (!Array.isArray(raw) || raw.length > 50) throw Error('legacy');
        people = raw.map(p => persona(p,tipo));
      } catch (_) {fail('failed-precondition','La lista histórica contiene datos inválidos. Requiere revisión administrativa; no se modificó.');}
      const pos = people.findIndex(p => key(p) === key(target));
      if ((d.accion === 'agregar' && pos >= 0) || (d.accion === 'eliminar' && pos < 0)) return {ok:true,personas:people,repetido:true};
      if (d.accion === 'agregar') {
        if (people.length >= 50) fail('failed-precondition','La lista ya contiene 50 personas.');
        people.push(target);
      } else people.splice(pos,1);
      tx.update(ref,{[tipo]:people});
      tx.create(s.base.collection('auditoria').doc(),{tipo:'Cambio de integrantes',lista:tipo,accion:d.accion,residenteUid:uid,actorUid:s.uid,ts:stamp()});
      return {ok:true,personas:people,repetido:false};
    });
  });
  return {registrarPagoOperativoMiComunidad,confirmarIngresoComunidad,gestionarIntegrantesFichaMiComunidad};
};
