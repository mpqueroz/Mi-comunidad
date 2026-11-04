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
  // Preparación de ingreso: todas las lecturas ocurren antes de aplicar
  // escrituras. La conciliación reutiliza esta fase dentro de SU transacción.
  async function prepararIngreso(tx, s, tipo, entityId, fechaSolicitada, metodoSolicitado) {
    const movimientoId = ledgerId('ingreso',tipo,entityId);
    const ref = s.base.collection(tipo === 'gasto' ? 'gastosComunes' : 'multas').doc(entityId);
    const mov = s.base.collection('movimientosContables').doc(movimientoId);
    const snap = await tx.get(ref), movement = await tx.get(mov);
    if (!snap.exists) fail('not-found','No se encontró la deuda.');
    const e = snap.data(), estadoFinal = tipo === 'gasto' ? 'Pagado' : 'Pagada';
    if (!Number.isSafeInteger(e.monto) || e.monto <= 0) fail('failed-precondition','El monto requiere revisión.');
    if (typeof e.depto !== 'string' || !e.depto.trim() || e.depto.length > 40) fail('failed-precondition','El departamento de la deuda requiere revisión.');
    const descripcion = tipo === 'gasto' ? `Gasto común depto ${e.depto} · ${String(e.periodo || '').slice(0,20)}` : `Multa ${String(e.tipoMultaNombre || '').slice(0,150)} · Depto ${e.depto}`;
    if (movement.exists) {
      const old = movement.data();
      if (e.estado !== estadoFinal || e.movimientoId !== movimientoId || old.entidadId !== entityId || old.entidadTipo !== tipo || old.monto !== e.monto || old.tipo !== 'Ingreso') fail('failed-precondition','El ingreso presenta una inconsistencia y requiere revisión.');
      return {movimientoId,ref,mov,e,ledger:old,repetido:true,descripcion};
    }
    if (!(tipo === 'gasto' ? ['Pendiente','Atrasado','Por confirmar'] : ['Pendiente','Por confirmar']).includes(e.estado)) fail('failed-precondition','La deuda requiere revisión antes de confirmar un ingreso.');
    const fechaPago = fechaSolicitada || (typeof e.pagoInformado?.fecha === 'string' ? fecha(e.pagoInformado.fecha) : today());
    const metodoPago = metodoSolicitado || 'Registrado por administración';
    const ledger = {fecha:fechaPago,tipo:'Ingreso',categoria:tipo === 'gasto' ? 'Gasto común' : 'Multa',descripcion,monto:e.monto,origen:'Automático',depto:e.depto,entidadId:entityId,entidadTipo:tipo,registradoPor:s.uid,ts:Date.now(),creadoEn:stamp()};
    return {movimientoId,ref,mov,e,ledger,repetido:false,descripcion,fechaPago,metodoPago,estadoFinal};
  }
  function aplicarIngreso(tx, s, p, bancoMovimientoId = null) {
    if (p.repetido) {
      if (bancoMovimientoId) tx.update(p.mov,{bancoMovimientoId});
      return;
    }
    tx.create(p.mov,{...p.ledger,...(bancoMovimientoId ? {bancoMovimientoId} : {})});
    tx.update(p.ref,{estado:p.estadoFinal,fechaPago:p.fechaPago,metodoPago:p.metodoPago,movimientoId:p.movimientoId,confirmadoEn:Date.now(),confirmadoPor:s.uid});
    // Aviso aleatorio en la misma transacción; el asiento determina idempotencia.
    tx.create(s.base.collection('notificaciones').doc(),{icon:'circle-check',titulo:p.ledger.entidadTipo === 'gasto' ? 'Pago de gasto común confirmado' : 'Pago de multa confirmado',meta:p.descripcion,depto:p.e.depto,paraTodos:false,leidaPor:[],ts:Date.now()});
    tx.create(s.base.collection('auditoria').doc(),{tipo:'Confirmación de ingreso',entidadId:p.ledger.entidadId,entidadTipo:p.ledger.entidadTipo,movimientoId:p.movimientoId,monto:p.e.monto,actorUid:s.uid,ts:stamp()});
  }
  const confirmarIngresoComunidad = onCall(async req => {
    const d = req.data || {}, tipo = d.tipo;
    if (!['gasto','multa'].includes(tipo)) fail('invalid-argument','Tipo de ingreso inválido.');
    const entityId = id(d.id);
    const fechaSolicitada = d.fechaPago === undefined ? null : fecha(d.fechaPago);
    const metodoSolicitado = d.metodoPago === undefined ? null : text(d.metodoPago,150,true);
    return db.runTransaction(async tx => {
      const s = await scope(tx,req,['admin']);
      const p = await prepararIngreso(tx,s,tipo,entityId,fechaSolicitada,metodoSolicitado);
      aplicarIngreso(tx,s,p);
      return {ok:true,movimientoId:p.movimientoId,repetido:p.repetido};
    });
  });
  const conciliarMovimientoComunidad = onCall(async req => {
    const d = req.data || {}, tipo = d.tipo, bankId = id(d.movimientoId);
    if (!['gasto','multa','contable','nuevo'].includes(tipo)) fail('invalid-argument','Tipo de asociación inválido.');
    const targetId = tipo === 'nuevo' ? ledgerId('conciliacion','nuevo',bankId) : id(d.id);
    const destino = d.destino || 'revisar';
    if (!['proximo','saldo','revisar'].includes(destino) || (d.automatico !== undefined && typeof d.automatico !== 'boolean')) fail('invalid-argument','Datos de conciliación inválidos.');
    const descripcionNueva = tipo === 'nuevo' ? text(d.descripcion,120,true) : null;
    const categoriaNueva = tipo === 'nuevo' ? text(d.categoria,80,true) : null;
    return db.runTransaction(async tx => {
      const s = await scope(tx,req,['admin']);
      const bankRef = s.base.collection('movimientosBancarios').doc(bankId), bankSnap = await tx.get(bankRef);
      if (!bankSnap.exists) fail('not-found','No se encontró el movimiento bancario.');
      const bank = bankSnap.data();
      if (bank.estado === 'Conciliado') {
        if (bank.integridadVersion !== 1 || bank.asociado?.tipo !== tipo || bank.asociado?.id !== targetId || (bank.diferencia > 0 && bank.destinoDiferencia !== destino)) fail('failed-precondition','El movimiento ya fue conciliado de otra manera o requiere revisión histórica.');
        return {ok:true,contableIds:bank.asociado.contableIds,repetido:true};
      }
      if (bank.estado !== 'Pendiente' || !Number.isSafeInteger(bank.monto) || bank.monto === 0) fail('failed-precondition','El movimiento bancario requiere revisión.');
      const fechaBanco = fecha(bank.fecha), bankAmount = Math.abs(bank.monto);
      let ingreso = null, ledgerRef, ledger, nuevo = false, etiqueta, depto = null;
      if (tipo === 'gasto' || tipo === 'multa') {
        if (bank.monto <= 0) fail('failed-precondition','Un cargo bancario no puede pagar una deuda.');
        ingreso = await prepararIngreso(tx,s,tipo,targetId,fechaBanco,'Transferencia (cartola bancaria)');
        ledgerRef = ingreso.mov;ledger = ingreso.ledger;etiqueta = ingreso.descripcion;depto = ingreso.e.depto;
      } else {
        ledgerRef = s.base.collection('movimientosContables').doc(targetId);
        const found = await tx.get(ledgerRef);
        if (tipo === 'nuevo') {
          const allowed = bank.monto > 0 ? ['Otros ingresos','Intereses','Arriendo de espacios','Aportes'] : ['Proveedores','Servicios básicos','Remuneraciones','Mantención','Comisiones bancarias','Otros egresos'];
          if (!allowed.includes(categoriaNueva)) fail('invalid-argument','La categoría no corresponde al movimiento bancario.');
          const proposed = {fecha:fechaBanco,tipo:bank.monto > 0 ? 'Ingreso' : 'Egreso',categoria:categoriaNueva,descripcion:descripcionNueva,monto:bankAmount,origen:'Conciliación',bancoOrigenId:bankId,registradoPor:s.uid,ts:Date.now(),creadoEn:stamp()};
          if (found.exists) {
            ledger = found.data();
            if (ledger.bancoOrigenId !== bankId || ['fecha','tipo','categoria','descripcion','monto','origen'].some(k => ledger[k] !== proposed[k])) fail('failed-precondition','Este banco ya originó un asiento. Reasócialo como movimiento contable existente.');
          } else {ledger=proposed;nuevo=true;}
        } else {
          if (!found.exists) fail('not-found','No se encontró el asiento contable.');
          ledger = found.data();
        }
        etiqueta = String(ledger.descripcion || ledger.categoria || 'Movimiento contable').slice(0,300);
        depto = typeof ledger.depto === 'string' && ledger.depto.length <= 40 ? ledger.depto : null;
      }
      if (!Number.isSafeInteger(ledger.monto) || ledger.monto <= 0 || ledger.tipo !== (bank.monto > 0 ? 'Ingreso' : 'Egreso')) fail('failed-precondition','El asiento no corresponde al signo o importe del banco.');
      if (ledger.bancoMovimientoId && ledger.bancoMovimientoId !== bankId) fail('already-exists','Ese ingreso o egreso ya está asociado a otro movimiento bancario.');
      const diferencia = bankAmount - ledger.monto;
      if (diferencia < 0 || (bank.monto < 0 && diferencia !== 0)) fail('failed-precondition','El importe no cubre la deuda o no coincide con el egreso. Requiere revisión; no se registró un pago.');
      const saldoId = ledgerId('saldo','conciliacion',bankId), saldoLedgerId = ledgerId('diferencia','conciliacion',bankId);
      const saldoRef = s.base.collection('saldosAFavor').doc(saldoId), saldoLedgerRef = s.base.collection('movimientosContables').doc(saldoLedgerId);
      // Leer las rutas deterministas ANTES de la primera escritura.
      const saldoSnap = await tx.get(saldoRef), saldoLedgerSnap = await tx.get(saldoLedgerRef);
      const generarSaldo = diferencia > 0 && ['proximo','saldo'].includes(destino);
      if (generarSaldo && (!depto || bank.monto <= 0)) fail('failed-precondition','Un saldo a favor requiere departamento verificable e ingreso bancario.');
      if (saldoSnap.exists || saldoLedgerSnap.exists) fail('failed-precondition','El banco ya tiene un saldo registrado. Requiere revisión antes de volver a conciliar.');
      const contableIds = [ledgerRef.id];
      // A partir de aquí todo se aplica o todo se cancela en el mismo commit.
      if (ingreso) aplicarIngreso(tx,s,ingreso,bankId);
      else if (nuevo) tx.create(ledgerRef,{...ledger,bancoMovimientoId:bankId});
      else tx.update(ledgerRef,{bancoMovimientoId:bankId});
      let notaDiferencia = '';
      if (generarSaldo) {
        const destinoTexto = destino === 'proximo' ? 'Abono al próximo período' : 'Saldo a favor';
        tx.create(saldoLedgerRef,{fecha:fechaBanco,tipo:'Ingreso',categoria:'Saldo a favor',descripcion:`${destinoTexto} depto ${depto}`,monto:diferencia,origen:'Conciliación',depto,bancoMovimientoId:bankId,bancoOrigenId:bankId,registradoPor:s.uid,ts:Date.now(),creadoEn:stamp()});
        tx.create(saldoRef,{depto,monto:diferencia,destino:destinoTexto,estado:'Disponible',movimientoId:bankId,movimientoContableId:saldoLedgerId,fechaOrigen:fechaBanco,por:s.uid,ts:Date.now()});
        contableIds.push(saldoLedgerId);notaDiferencia = `Diferencia de ${diferencia} CLP como ${destinoTexto.toLowerCase()}`;
      } else if (diferencia > 0) notaDiferencia = `Diferencia de ${diferencia} CLP por revisar`;
      const asociado = {tipo,id:targetId,depto,etiqueta,contableIds};
      const now = Date.now();
      tx.update(bankRef,{estado:'Conciliado',asociado,diferencia,destinoDiferencia:diferencia > 0 ? destino : null,notaDiferencia,conciliadoPor:s.uid,conciliadoPorUid:s.uid,conciliadoEn:now,automatico:!!d.automatico,integridadVersion:1,saldoFavorId:generarSaldo ? saldoId : null});
      tx.create(s.base.collection('historialConciliacion').doc(),{accion:'conciliar',movimientoId:bankId,fecha:fechaBanco,monto:bank.monto,descripcion:String(bank.descripcion || '').slice(0,300),asociado:etiqueta,depto,periodo:String(bank.periodo || fechaBanco.slice(0,7)),nota:notaDiferencia,automatico:!!d.automatico,por:s.uid,porUid:s.uid,ts:now});
      return {ok:true,contableIds,repetido:false};
    });
  });
  const desvincularConciliacionComunidad = onCall(async req => {
    const d = req.data || {}, bankId = id(d.movimientoId), motivo = text(d.motivo,1000,true);
    if (motivo.length < 15) fail('invalid-argument','Escribe una justificación de al menos 15 caracteres.');
    return db.runTransaction(async tx => {
      const s = await scope(tx,req,['admin']);
      const bankRef = s.base.collection('movimientosBancarios').doc(bankId), snap = await tx.get(bankRef);
      if (!snap.exists) fail('not-found','No se encontró el movimiento bancario.');
      const bank = snap.data();
      if (bank.estado === 'Pendiente' && bank.ultimaDesvinculacion?.actorUid === s.uid) return {ok:true,repetido:true};
      if (bank.estado !== 'Conciliado' || bank.integridadVersion !== 1 || !bank.asociado || bank.diferencia !== 0 || bank.saldoFavorId || !Array.isArray(bank.asociado.contableIds) || bank.asociado.contableIds.length !== 1) fail('failed-precondition','Esta conciliación tiene diferencia, saldo o antecedentes históricos y requiere revisión contable. No se modificó.');
      const ledgerRef = s.base.collection('movimientosContables').doc(id(bank.asociado.contableIds[0]));
      const ledgerSnap = await tx.get(ledgerRef);
      if (!ledgerSnap.exists || ledgerSnap.get('bancoMovimientoId') !== bankId) fail('failed-precondition','El vínculo contable cambió; requiere revisión.');
      const now = Date.now();
      tx.update(ledgerRef,{bancoMovimientoId:null,desvinculadoEn:stamp()});
      tx.update(bankRef,{estado:'Pendiente',asociado:null,diferencia:null,destinoDiferencia:null,notaDiferencia:null,conciliadoPor:null,conciliadoPorUid:null,conciliadoEn:null,automatico:false,saldoFavorId:null,ultimaDesvinculacion:{actorUid:s.uid,motivo,ts:now}});
      tx.create(s.base.collection('historialConciliacion').doc(),{accion:'desvincular',movimientoId:bankId,fecha:bank.fecha,monto:bank.monto,descripcion:String(bank.descripcion || '').slice(0,300),asociado:String(bank.asociado.etiqueta || '').slice(0,300),depto:bank.asociado.depto || null,periodo:String(bank.periodo || ''),nota:motivo,automatico:false,por:s.uid,porUid:s.uid,ts:now});
      return {ok:true,repetido:false};
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
  return {registrarPagoOperativoMiComunidad,confirmarIngresoComunidad,conciliarMovimientoComunidad,desvincularConciliacionComunidad,gestionarIntegrantesFichaMiComunidad};
};
