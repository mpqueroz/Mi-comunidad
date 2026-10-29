'use strict';
const crypto = require('node:crypto');
const {evaluateLicense} = require('./licencias');
module.exports = function profesional(admin, onCall, HttpsError) {
  const db = admin.firestore();
  const stamp = () => admin.firestore.FieldValue.serverTimestamp();
  const text = (v, max = 2000) => String(v || '').trim().slice(0, max);
  const normalize = v => text(v, 200).toLocaleLowerCase('es-CL');
  async function scope(req, roles) {
    const token = req.auth?.token;
    if(!token || token.app !== 'mi_comunidad' || !roles.includes(token.role))throw new HttpsError('permission-denied', 'Tu cuenta no puede realizar esta operación.');
    const comunidadId = text(req.data?.comunidadId, 100);
    if(!comunidadId || comunidadId !== token.comunidadId)throw new HttpsError('permission-denied', 'La operación no corresponde a tu comunidad.');
    const base = db.collection('mi_comunidad_comunidades').doc(comunidadId);
    const community = await base.get();
    if(!community.exists || community.data().estado === 'Suspendida')throw new HttpsError('failed-precondition', 'La comunidad no está activa.');
    const license = await db.collection('mi_comunidad_licencias').doc(comunidadId).get();
    if(license.exists && !evaluateLicense(license.data()).allowed)throw new HttpsError('failed-precondition', 'Licencia no vigente.');
    const person = token.role === 'conserje' ? await base.collection('conserjes').doc(req.auth.uid).get() : token.role === 'residente' ? await base.collection('residentes').doc(req.auth.uid).get() : null;
    if(person && (!person.exists || person.data().estado === 'Inactivo' || (token.role === 'residente' && person.data().depto !== token.depto)))throw new HttpsError('permission-denied', 'La cuenta no está habilitada.');
    // Administración: sin documento sigue habilitada; "Inactivo" la corta.
    const adminDoc = token.role === 'admin' ? await base.collection('administradores').doc(req.auth.uid).get() : null;
    if(adminDoc?.exists && adminDoc.data().estado === 'Inactivo')throw new HttpsError('permission-denied', 'La cuenta de administración fue desactivada.');
    const nombre = person?.data()?.nombre || adminDoc?.data()?.nombre || token.name || community.data().adminNombre || 'Administración';
    return {base, uid:req.auth.uid, role:token.role, nombre};
  }
  function docId(id) {if(typeof id!=='string'||!id||id.includes('/')||id.length>200)throw new HttpsError('invalid-argument','Identificador inválido.');return id;}
  function log(tx, s, title, meta, turnoId = '') {tx.set(s.base.collection('novedades').doc(), {icon:'clipboard-list',title:text(title),meta:text(meta,500),badgeClass:'',badgeText:'Registro',autorUid:s.uid,autorNombre:s.nombre,turnoId,ts:stamp()});}
  // Todos los datos se leen dentro de la misma transacción de entrega.
  // Se conserva una selección acotada y se informa cuando no está completa.
  async function resumenOperacion(tx, s) {
    const hoy=hoyChile();
    const horizonte=new Date(Date.parse(hoy+'T12:00:00Z')+7*86400000).toISOString().slice(0,10);
    const specs=[
      ['visitasDentro','visitas','estado','Dentro',v=>true,v=>[v.nombre,`Depto ${text(v.depto,40)}`]],
      ['visitasEsperadas','visitasProgramadas','fecha',hoy,v=>v.estado==='Pendiente'&&(!v.qrFin||v.qrFin>=ahoraChile()),v=>[v.nombre,`Depto ${text(v.depto,40)} · ${text(v.hora,20)||'Sin hora'}`]],
      ['solicitudes','incidencias','estado','Pendiente',v=>true,v=>[v.categoria,`Depto ${text(v.depto,40)} · ${text(v.responsable,100)||'Sin responsable'} · ${text(v.compromiso,10)||'Sin compromiso'}`]],
      ['solicitudes','incidencias','estado','En proceso',v=>true,v=>[v.categoria,`Depto ${text(v.depto,40)} · ${text(v.responsable,100)||'Sin responsable'} · ${text(v.compromiso,10)||'Sin compromiso'}`]],
      ['encomiendas','encomiendas','estado','Recibido',v=>true,v=>[v.codigo||v.title,`Depto ${text(v.depto,40)} · ${text(v.ubicacion,100)||'Sin ubicación'}`]],
      ['encomiendas','encomiendas','estado','En proceso de entrega',v=>true,v=>[v.codigo||v.title,`Depto ${text(v.depto,40)} · En proceso de entrega`]],
      ['mantenciones','planesMantencion','activo',true,v=>v.proximaFecha&&v.proximaFecha<=horizonte,v=>[v.titulo,`${text(v.proximaFecha,10)} · ${text(v.responsable,100)||'Sin responsable'}`]]
    ];
    const result={generadoEn:Date.now()};
    for(const [key,collection,field,value,filter,format] of specs){
      const snap=await tx.get(s.base.collection(collection).where(field,'==',value).limit(51));
      const group=result[key]||(result[key]={items:[],limitado:false});
      group.limitado=group.limitado||snap.size>50;
      for(const doc of snap.docs){
        const v=doc.data();if(!filter(v))continue;
        if(group.items.length>=50){group.limitado=true;continue;}
        const [titulo,detalle]=format(v);
        group.items.push({id:doc.id,titulo:text(titulo,150),detalle:text(detalle,250)});
      }
    }
    return result;
  }
  const gestionarTurnoMiComunidad = onCall(async req => {
    const s = await scope(req, ['admin','conserje']);
    const accion = req.data.accion;
    const resumen = text(req.data.resumen,3000);
    const actual = s.base.collection('operacion').doc('turnoActual');
    const nuevo = s.base.collection('turnos').doc();
    return db.runTransaction(async tx => {
      const actualSnap = await tx.get(actual);
      const old = actualSnap.exists ? actualSnap.data() : null;
      if(accion === 'iniciar') {
        if(old && old.estado !== 'Cerrado')throw new HttpsError('failed-precondition','Ya existe un turno en curso o pendiente de recepción.');
        const data={id:nuevo.id,estado:'Activo',autorUid:s.uid,autorNombre:s.nombre,ts:stamp(),notaInicio:resumen};
        tx.create(nuevo,data);tx.set(actual,data);log(tx,s,'Turno iniciado',resumen,nuevo.id);return {id:nuevo.id};
      }
      if(!old || old.id !== req.data.turnoId)throw new HttpsError('failed-precondition','El turno cambió. Actualiza la pantalla.');
      const ref=s.base.collection('turnos').doc(old.id);
      if(accion === 'entregar') {
        if(old.estado!=='Activo')throw new HttpsError('failed-precondition','Este turno ya fue entregado.');
        if(old.autorUid!==s.uid && s.role!=='admin')throw new HttpsError('permission-denied','Solo quien inició el turno o administración puede entregarlo.');
        if(!resumen)throw new HttpsError('invalid-argument','Escribe el resumen de entrega.');
        const tareas=await tx.get(s.base.collection('tareasTurno').where('estado','==','Pendiente').limit(101));
        if(tareas.size>100)throw new HttpsError('failed-precondition','Hay más de 100 pendientes. Administración debe revisar y resolver los antiguos antes de entregar.');
        const operacionSnapshot=await resumenOperacion(tx,s);
        const data={estado:'Entregado',resumen,entregadoEn:stamp(),entregadoPor:s.uid,operacionSnapshot,pendientesSnapshot:tareas.docs.map(d=>({id:d.id,titulo:d.data().titulo,prioridad:d.data().prioridad,responsable:d.data().responsable||'',compromiso:d.data().compromiso||''}))};
        tx.update(ref,data);tx.update(actual,data);log(tx,s,'Turno entregado',resumen,old.id);return {id:old.id};
      }
      if(accion === 'recibir') {
        if(old.estado!=='Entregado')throw new HttpsError('failed-precondition','El turno todavía no está entregado.');
        if(old.autorUid===s.uid)throw new HttpsError('failed-precondition','La recepción debe confirmarla otra persona.');
        tx.update(ref,{estado:'Cerrado',recibidoEn:stamp(),recibidoPor:s.uid,recibidoPorNombre:s.nombre,observacionRecepcion:resumen});
        const data={id:nuevo.id,estado:'Activo',autorUid:s.uid,autorNombre:s.nombre,ts:stamp(),turnoAnteriorId:old.id,notaInicio:resumen};
        tx.create(nuevo,data);tx.set(actual,data);log(tx,s,'Turno recibido',`Recibe entrega de ${old.autorNombre}. ${resumen}`,nuevo.id);return {id:nuevo.id};
      }
      throw new HttpsError('invalid-argument','Acción de turno no válida.');
    });
  });
  const registrarEncomiendaMiComunidad=onCall(async req=>{
    const s=await scope(req,['admin','conserje']);const d=req.data;
    const title=text(d.titulo,150),depto=text(d.depto,40),destinatario=text(d.destinatario,150),tracking=text(d.tracking,150),ubicacion=text(d.ubicacion,100);
    const foto=typeof d.foto==='string'?d.foto:'';
    if(!title||!depto)throw new HttpsError('invalid-argument','Completa el origen y el departamento.');
    if(foto.length>180000||(foto&&!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(foto)))throw new HttpsError('invalid-argument','La fotografía no es válida.');
    const residente=await s.base.collection('residentes').where('depto','==',depto).limit(1).get();
    if(residente.empty)throw new HttpsError('not-found','No hay un departamento registrado con ese número.');
    const year=Number(new Intl.DateTimeFormat('en',{timeZone:'America/Santiago',year:'numeric'}).format(new Date()));
    const contador=s.base.collection('contadores').doc('encomiendas_'+year),ref=s.base.collection('encomiendas').doc();
    return db.runTransaction(async tx=>{
      const c=await tx.get(contador);const valor=(c.exists?Number(c.data().valor)||0:0)+1;
      const codigo=`PAQ-${year}-${String(valor).padStart(6,'0')}`;
      tx.set(contador,{valor});
      tx.create(ref,{title,depto,destinatario,tracking,ubicacion,foto,estado:'Recibido',codigo,qrToken:crypto.randomBytes(16).toString('hex'),recibidoPor:s.nombre,recibidoPorUid:s.uid,retiradoPor:null,confirmadoPor:null,entregadoEn:null,ts:Date.now()});
      tx.create(s.base.collection('notificaciones').doc(),{icon:'package',titulo:'Tienes una encomienda para retirar',meta:`Depto ${depto} · ${codigo}`,depto,paraTodos:false,leidaPor:[],ts:Date.now()});
      log(tx,s,'Encomienda recibida',`${codigo} · Depto ${depto} · ${ubicacion||'Sin ubicación'}`);
      return {id:ref.id,codigo};
    });
  });
  const gestionarEncomiendaMiComunidad = onCall(async req => {
    const s=await scope(req,['admin','conserje']);
    const ref=s.base.collection('encomiendas').doc(docId(req.data.id));
    const accion=req.data.accion;
    const token=crypto.randomBytes(16).toString('hex');
    return db.runTransaction(async tx=>{
      const snap=await tx.get(ref);
      if(!snap.exists)throw new HttpsError('not-found','No se encontró la encomienda.');
      const e=snap.data();
      if(e.estado==='Entregado') {
        if(accion==='confirmar'&&e.confirmadoPorUid===s.uid&&e.entregaToken===req.data.token)return {ok:true};
        throw new HttpsError('failed-precondition','La encomienda ya fue entregada.');
      }
      const now=Date.now();
      if(accion==='iniciar') {
        if(e.estado!=='Recibido' && !(e.estado==='En proceso de entrega'&&(e.entregaHasta?.toMillis?.()||0)<=now))throw new HttpsError('already-exists','Otra persona está realizando la entrega.');
        tx.update(ref,{estado:'En proceso de entrega',entregaUid:s.uid,entregaToken:token,entregaHasta:admin.firestore.Timestamp.fromMillis(now+300000)});
        return {token};
      }
      if(e.estado!=='En proceso de entrega'||e.entregaUid!==s.uid||e.entregaToken!==req.data.token)throw new HttpsError('permission-denied','No tienes la entrega activa. Vuelve a abrirla.');
      if(accion==='cancelar') {
        tx.update(ref,{estado:'Recibido',entregaUid:admin.firestore.FieldValue.delete(),entregaToken:admin.firestore.FieldValue.delete(),entregaHasta:admin.firestore.FieldValue.delete()});return {ok:true};
      }
      if(accion==='confirmar') {
        if((e.entregaHasta?.toMillis?.()||0)<now)throw new HttpsError('failed-precondition','El tiempo de entrega venció. Cierra y vuelve a iniciar el retiro.');
        const nombre=text(req.data.retiradoPor?.nombre,150),relacion=text(req.data.retiradoPor?.relacion,20);
        if(!nombre||!['Titular','Otro','Familiar'].includes(relacion))throw new HttpsError('invalid-argument','Falta identificar a quien retira.');
        tx.update(ref,{estado:'Entregado',retiradoPor:{nombre,relacion},confirmadoPor:s.nombre,confirmadoPorUid:s.uid,entregadoEn:stamp()});
        tx.create(s.base.collection('notificaciones').doc(),{icon:'circle-check',titulo:'Encomienda retirada',meta:`${e.codigo||''} · Retirada por ${nombre}`,depto:e.depto,paraTodos:false,leidaPor:[],ts:Date.now()});
        log(tx,s,'Encomienda entregada',`${e.codigo||snap.id} · Depto ${e.depto} · Retira ${nombre}`);return {ok:true};
      }
      throw new HttpsError('invalid-argument','Acción no válida.');
    });
  });
  function hoyChile(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
  function ahoraChile(){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
    const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }
  const hashPase=token=>crypto.createHash('sha256').update(token).digest('hex');
  function validarPase(v,token){
    if(!/^[a-f0-9]{64}$/.test(token||'')||!/^[a-f0-9]{64}$/.test(v.qrHash||'')||!crypto.timingSafeEqual(Buffer.from(hashPase(token),'hex'),Buffer.from(v.qrHash,'hex')))throw new HttpsError('permission-denied','El pase no es válido o fue reemplazado.');
    if(v.estado!=='Pendiente')throw new HttpsError('failed-precondition','El pase ya fue utilizado o cancelado.');
    const now=ahoraChile();
    if(!v.qrInicio||!v.qrFin||now<v.qrInicio||now>v.qrFin)throw new HttpsError('failed-precondition','El pase está fuera de su horario de validez.');
  }
  function rutValido(value){
    if(!/^[0-9]{7,8}[0-9K]$/.test(value))return false;
    const body=value.slice(0,-1);let total=0,m=2;
    for(let i=body.length-1;i>=0;i--){total+=Number(body[i])*m;m=m===7?2:m+1;}
    const n=11-total%11;return value.slice(-1)===(n===11?'0':n===10?'K':String(n));
  }
  const gestionarVisitaMiComunidad=onCall(async req=>{
    const d=req.data;
    const s=await scope(req,['emitirPase','revocarPase'].includes(d?.accion)?['residente']:['admin','conserje']);
    if(d.accion==='emitirPase'||d.accion==='revocarPase'){
      const ref=s.base.collection('visitasProgramadas').doc(docId(d.id));
      const token=crypto.randomBytes(32).toString('hex');
      return db.runTransaction(async tx=>{
        const snap=await tx.get(ref);
        if(!snap.exists)throw new HttpsError('not-found','La visita anunciada ya no existe.');
        const v=snap.data();
        if(v.depto!==req.auth.token.depto)throw new HttpsError('permission-denied','Solo puedes autorizar visitas de tu departamento.');
        if(v.estado!=='Pendiente')throw new HttpsError('failed-precondition','Esta visita ya fue atendida o cancelada.');
        if(d.accion==='revocarPase'){
          tx.update(ref,{estado:'Cancelada',qrHash:admin.firestore.FieldValue.delete(),canceladaPor:s.uid,canceladaEn:stamp()});
          log(tx,s,'Invitación cancelada',`${text(v.nombre,150)} · Depto ${text(v.depto,40)}`);return {ok:true};
        }
        const hora=v.hora||'00:00',hasta=d.hasta||'23:59';
        if(!fechaReal(v.fecha)||v.fecha<hoyChile()||!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(hasta)||hasta<hora||`${v.fecha}T${hasta}`<ahoraChile())throw new HttpsError('invalid-argument','Revisa la fecha y el horario. El término debe ser posterior al inicio y no estar vencido.');
        tx.update(ref,{qrHash:hashPase(token),qrInicio:`${v.fecha}T${hora}`,qrFin:`${v.fecha}T${hasta}`,autorizadaPor:s.uid,autorizadaEn:stamp()});
        log(tx,s,'Pase de visita emitido',`${text(v.nombre,150)} · Depto ${text(v.depto,40)} · ${v.fecha} ${hora}–${hasta}`);
        return {id:snap.id,token,nombre:text(v.nombre,150),depto:text(v.depto,40),inicio:`${v.fecha}T${hora}`,fin:`${v.fecha}T${hasta}`};
      });
    }
    if(d.accion==='revisarPase'){
      const snap=await s.base.collection('visitasProgramadas').doc(docId(d.id)).get();
      if(!snap.exists)throw new HttpsError('not-found','No se encontró la invitación en esta comunidad.');
      const v=snap.data();validarPase(v,d.token);
      return {id:snap.id,nombre:text(v.nombre,150),depto:text(v.depto,40),inicio:v.qrInicio,fin:v.qrFin};
    }
    if(d.accion==='salir'){
      const ref=s.base.collection('visitas').doc(docId(d.id));
      return db.runTransaction(async tx=>{
        const snap=await tx.get(ref);
        if(!snap.exists)throw new HttpsError('not-found','No se encontró la visita.');
        const v=snap.data();
        if(v.estado==='Salió')return {ok:true};
        if(v.estado!=='Dentro')throw new HttpsError('failed-precondition','Este registro no corresponde a una visita dentro del edificio.');
        tx.update(ref,{estado:'Salió',salidaEn:stamp(),salidaPor:s.uid,salidaPorNombre:s.nombre});
        log(tx,s,'Salida de visita',`${v.nombre} · Depto ${v.depto}`);return {ok:true};
      });
    }
    if(d.accion!=='ingresar')throw new HttpsError('invalid-argument','Acción de visita no válida.');
    const programada=d.programadaId?s.base.collection('visitasProgramadas').doc(docId(d.programadaId)):null;
    const nueva=s.base.collection('visitas').doc();
    return db.runTransaction(async tx=>{
      let datos=d;
      if(programada){
        const p=await tx.get(programada);
        if(!p.exists)throw new HttpsError('not-found','La visita anunciada ya no existe.');
        datos=p.data();
        // Un pase QR no puede eludir su horario usando el ingreso por ID.
        if(datos.qrHash){
          validarPase(datos,d.token);
          if(d.identidadConfirmada!==true)throw new HttpsError('failed-precondition','Confirma que comprobaste la identidad de la visita.');
          const autor=await tx.get(s.base.collection('residentes').doc(docId(datos.autorizadaPor)));
          if(!autor.exists||autor.data().estado==='Inactivo'||autor.data().depto!==datos.depto)throw new HttpsError('failed-precondition','La cuenta que autorizó la visita ya no está habilitada para ese departamento.');
        }
        if(datos.estado!=='Pendiente')throw new HttpsError('failed-precondition','Esta visita ya fue atendida.');
        if(datos.fecha!==hoyChile())throw new HttpsError('failed-precondition','Esta invitación no corresponde a hoy.');
      }
      const nombre=text(datos.nombre,150),depto=text(datos.depto,40),motivo=text(datos.motivo,500);
      const rut=String(datos.rut||'').replace(/[^0-9kK]/g,'').toUpperCase();
      if(!nombre||!depto)throw new HttpsError('invalid-argument','Completa nombre y departamento.');
      if(datos.rut&&!rutValido(rut))throw new HttpsError('invalid-argument','El RUT no es válido.');
      const residentes=await tx.get(s.base.collection('residentes').where('depto','==',depto));
      if(residentes.empty)throw new HttpsError('not-found','No existe un departamento registrado con ese número.');
      const restriccion=residentes.docs.some(r=>(r.data().restringidos||[]).some(p=>{
        const prut=String(p.rut||'').replace(/[^0-9kK]/g,'').toUpperCase();
        return rut&&prut?rut===prut:normalize(p.nombre)===normalize(nombre);
      }));
      const conPaseQr=!!programada&&!!datos.qrHash;
      tx.create(nueva,{nombre,rut,depto,motivo,estado:restriccion?'Denegado':'Dentro',restringido:restriccion,programadaId:programada?.id||'',conPaseQr,identidadConfirmada:conPaseQr&&d.identidadConfirmada===true,ingresoPor:s.uid,ingresoPorNombre:s.nombre,ts:Date.now()});
      if(programada)tx.update(programada,{estado:restriccion?'Rechazada':'Ingresó',visitaId:nueva.id,atendidaPor:s.uid,atendidaEn:stamp()});
      log(tx,s,restriccion?'Intento de ingreso denegado':'Ingreso de visita',`${nombre} · Depto ${depto}`);
      if(restriccion)tx.create(s.base.collection('notificaciones').doc(),{icon:'ban',titulo:'Se registró un intento de ingreso restringido',meta:`${nombre} · Depto ${depto}`,depto,paraTodos:false,leidaPor:[],ts:Date.now()});
      return {id:nueva.id,denegado:restriccion};
    });
  });
  const cancelarReservaMiComunidad=onCall(async req=>{
    const s=await scope(req,['admin','residente']);
    const motivo=text(req.data.motivo,500);
    if(!motivo)throw new HttpsError('invalid-argument','Escribe el motivo de la cancelación.');
    const ref=s.base.collection('reservas').doc(docId(req.data.id));
    return db.runTransaction(async tx=>{
      const snap=await tx.get(ref);
      if(!snap.exists)throw new HttpsError('not-found','No se encontró la reserva.');
      const r=snap.data();
      if(s.role==='residente'&&r.depto!==req.auth.token.depto)throw new HttpsError('permission-denied','Solo puedes cancelar una reserva de tu departamento.');
      if(r.estado==='Cancelada')return {ok:true};
      if(r.estado!=='Confirmada')throw new HttpsError('failed-precondition','La reserva no está confirmada.');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(r.fecha)||(r.fecha<hoyChile()||(r.fecha===hoyChile()&&s.role!=='admin')))throw new HttpsError('failed-precondition','Las reservas del mismo día requieren administración; las fechas anteriores no se pueden cancelar.');
      const bloqueo=s.base.collection('bloquesOcupados').doc(`${r.fecha}_${docId(r.bloqueId)}`);
      const b=await tx.get(bloqueo);
      if(b.exists&&b.data().reservaId&&b.data().reservaId!==snap.id)throw new HttpsError('failed-precondition','El horario está asociado a otra reserva. Contacta a administración.');
      tx.update(ref,{estado:'Cancelada',canceladaEn:stamp(),canceladaPor:s.uid,canceladaPorNombre:s.nombre,motivoCancelacion:motivo});
      if(b.exists)tx.delete(bloqueo);
      log(tx,s,'Reserva cancelada',`${r.lugar} · ${r.fecha} · Depto ${r.depto} · ${motivo}`);
      tx.create(s.base.collection('notificaciones').doc(),{icon:'calendar',titulo:'Reserva cancelada',meta:`${r.lugar} · ${r.fecha}`,depto:r.depto,paraTodos:false,leidaPor:[],ts:Date.now()});
      return {ok:true};
    });
  });

  function fechaReal(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
  function fotoValida(value){return typeof value==='string'&&value.length<=180000&&(!value||/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value));}
  function requestKey(value){if(typeof value!=='string'||!/^[a-f0-9]{32}$/.test(value))throw new HttpsError('invalid-argument','Identificador de solicitud inválido.');return value;}
  function siguienteRevision(base,frecuencia,ancla){
    const [year,month,day]=base.split('-').map(Number);
    if(frecuencia==='Semanal')return new Date(Date.UTC(year,month-1,day+7,12)).toISOString().slice(0,10);
    const meses={Mensual:1,Trimestral:3,Semestral:6,Anual:12}[frecuencia];
    if(!meses)return null;
    const target=new Date(Date.UTC(year,month-1+meses,1,12));
    const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
    target.setUTCDate(Math.min(ancla||day,last));return target.toISOString().slice(0,10);
  }
  const guardarPlanMantencionMiComunidad=onCall(async req=>{
    const s=await scope(req,['admin']);const d=req.data;
    const titulo=text(d.titulo,150),equipo=text(d.equipo,100),responsable=text(d.responsable,100),proveedor=text(d.proveedor,150),detalle=text(d.detalle,2000);
    const periodicidad=d.periodicidad,proximaFecha=d.proximaFecha;
    if(!titulo||!fechaReal(proximaFecha)||!['Única','Semanal','Mensual','Trimestral','Semestral','Anual'].includes(periodicidad))throw new HttpsError('invalid-argument','Completa el título, la fecha válida y la frecuencia.');
    if(typeof d.activo!=='boolean')throw new HttpsError('invalid-argument','Indica el estado del plan.');
    const ref=s.base.collection('planesMantencion').doc(d.id?docId(d.id):'plan_'+requestKey(d.solicitud));
    return db.runTransaction(async tx=>{
      const snap=await tx.get(ref);
      if(!d.id&&snap.exists){if(snap.data().creadoPor===s.uid)return {id:ref.id};throw new HttpsError('already-exists','La solicitud ya fue utilizada.');}
      if(d.id&&!snap.exists)throw new HttpsError('not-found','No se encontró el plan.');
      const old=snap.exists?snap.data():{};
      if(d.id&&old.version!==d.version)throw new HttpsError('failed-precondition','Otra persona actualizó el plan. Ábrelo nuevamente.');
      const ancla=old.proximaFecha===proximaFecha&&old.periodicidad===periodicidad?old.diaReferencia:Number(proximaFecha.slice(-2));
      const data={titulo,equipo,responsable,proveedor,detalle,periodicidad,proximaFecha,activo:d.activo,finalizado:old.finalizado===true&&!d.activo&&periodicidad==='Única',diaReferencia:ancla||Number(proximaFecha.slice(-2)),version:(old.version||0)+1,actualizadoPor:s.uid,actualizadoEn:stamp()};
      if(snap.exists)tx.update(ref,data);else tx.create(ref,{...data,creadoPor:s.uid,creadoEn:stamp()});
      log(tx,s,snap.exists?'Plan preventivo actualizado':'Plan preventivo creado',`${titulo} · ${proximaFecha} · ${periodicidad}`);
      return {id:ref.id};
    });
  });
  const registrarRevisionMantencionMiComunidad=onCall(async req=>{
    const s=await scope(req,['admin','conserje']);const d=req.data;
    const observacion=text(d.observacion,2000),foto=d.foto||'';
    if(!observacion||!fotoValida(foto))throw new HttpsError('invalid-argument','Describe el trabajo y revisa la fotografía.');
    const ref=s.base.collection('planesMantencion').doc(docId(d.id));
    const revision=ref.collection('revisiones').doc(requestKey(d.solicitud));
    return db.runTransaction(async tx=>{
      const p=await tx.get(ref),r=await tx.get(revision);
      if(r.exists){if(r.data().autorUid!==s.uid)throw new HttpsError('permission-denied','La solicitud pertenece a otra cuenta.');return {ok:true,proximaFecha:r.data().proximaFecha};}
      if(!p.exists)throw new HttpsError('not-found','El plan ya no existe.');
      const plan=p.data();
      if(!plan.activo)throw new HttpsError('failed-precondition','El plan está pausado.');
      if(plan.version!==d.version)throw new HttpsError('failed-precondition','El plan cambió o ya fue revisado. Ábrelo nuevamente.');
      const base=plan.proximaFecha>hoyChile()?plan.proximaFecha:hoyChile();
      const proximaFecha=siguienteRevision(base,plan.periodicidad,plan.diaReferencia);
      tx.create(revision,{observacion,foto,autorUid:s.uid,autorNombre:s.nombre,fechaProgramada:plan.proximaFecha,proximaFecha,ts:stamp()});
      tx.update(ref,{activo:!!proximaFecha,finalizado:!proximaFecha,proximaFecha:proximaFecha||plan.proximaFecha,version:plan.version+1,ultimaRevisionEn:stamp(),ultimaRevisionPor:s.uid,actualizadoEn:stamp()});
      log(tx,s,'Revisión preventiva realizada',`${plan.titulo} · ${observacion}`);
      return {ok:true,proximaFecha};
    });
  });
  const gestionarAvisoMiComunidad=onCall(async req=>{
    const s=await scope(req,['admin']);const d=req.data;
    if(d.accion==='archivar'){
      const ref=s.base.collection('avisos').doc(docId(d.id));
      return db.runTransaction(async tx=>{
        const snap=await tx.get(ref);if(!snap.exists)throw new HttpsError('not-found','No se encontró el aviso.');
        if(snap.data().estado==='Archivado')return {ok:true};
        tx.update(ref,{estado:'Archivado',archivadoEn:stamp(),archivadoPor:s.uid});log(tx,s,'Aviso archivado',snap.data().title||'Aviso');return {ok:true};
      });
    }
    if(d.accion!=='publicar')throw new HttpsError('invalid-argument','Acción de aviso no válida.');
    const title=text(d.titulo,150),description=text(d.texto,4000),vence=d.vence||'';
    if(!title||!description||!['General','Importante','Mantención'].includes(d.categoria)||(vence&&(!fechaReal(vence)||vence<hoyChile())))throw new HttpsError('invalid-argument','Revisa título, mensaje, categoría y vigencia.');
    const ref=s.base.collection('avisos').doc('aviso_'+requestKey(d.solicitud));
    return db.runTransaction(async tx=>{
      const snap=await tx.get(ref);
      if(snap.exists){if(snap.data().creadoPor!==s.uid)throw new HttpsError('permission-denied','La solicitud pertenece a otra cuenta.');return {id:ref.id};}
      tx.create(ref,{title,description,categoria:d.categoria,vence,fijado:d.fijado===true,confirmacion:d.confirmacion===true,estado:'Publicado',creadoPor:s.uid,date:hoyChile(),meta:s.nombre,ts:Date.now()});
      tx.create(s.base.collection('notificaciones').doc(),{icon:'megaphone',titulo:title,meta:'Nuevo aviso de administración',avisoId:ref.id,paraTodos:true,leidaPor:[],ts:Date.now()});
      log(tx,s,'Aviso publicado',title);return {id:ref.id};
    });
  });
  const confirmarAvisoMiComunidad=onCall(async req=>{
    const s=await scope(req,['admin','conserje','residente']);
    const id=docId(req.data.id);const ref=s.base.collection('avisos').doc(id);
    const lectura=s.base.collection('lecturasAvisos').doc(`${id}_${s.uid}`);
    return db.runTransaction(async tx=>{
      const a=await tx.get(ref),l=await tx.get(lectura);
      if(l.exists)return {ok:true};
      if(!a.exists)throw new HttpsError('not-found','No se encontró el aviso.');
      const aviso=a.data();
      if(!aviso.confirmacion||aviso.estado==='Archivado'||(aviso.vence&&aviso.vence<hoyChile()))throw new HttpsError('failed-precondition','Este aviso ya no solicita confirmación.');
      tx.create(lectura,{avisoId:id,uid:s.uid,nombre:s.nombre,rol:s.role,depto:s.role==='residente'?req.auth.token.depto:'',ts:stamp()});return {ok:true};
    });
  });
  // Cobranza interna: no realiza pagos ni integra una pasarela. El ID por
  // departamento/mes y las transacciones hacen seguros los reintentos.
  const generarCobrosMiComunidad=onCall({timeoutSeconds:300},async req=>{
    const s=await scope(req,['admin']);
    const monto=req.data.monto,vencimiento=req.data.vencimiento;
    if(!Number.isSafeInteger(monto)||monto<=0||monto>100000000||!fechaReal(vencimiento)){
      throw new HttpsError('invalid-argument','Indica un monto entero positivo y una fecha válida.');
    }
    const periodo=hoyChile().slice(0,7);
    const residentes=await s.base.collection('residentes').get();
    const departamentos=[...new Set(residentes.docs
      .filter(d=>d.data().estado!=='Inactivo')
      .map(d=>String(d.data().depto||'').trim()).filter(Boolean))].sort();
    if(departamentos.some(d=>d.length>40||d.includes('/'))){
      throw new HttpsError('failed-precondition','Revisa los departamentos registrados antes de generar el cobro.');
    }
    let creados=0;
    // Cada lote se confirma completo; si se interrumpe la solicitud, repetirla
    // completa los faltantes y conserva los montos/estados ya registrados.
    for(let offset=0;offset<departamentos.length;offset+=100){
      const lote=departamentos.slice(offset,offset+100);
      const cantidad=await db.runTransaction(async tx=>{
        const comunidad=await tx.get(s.base);
        if(!comunidad.exists||comunidad.data().estado==='Suspendida'){
          throw new HttpsError('failed-precondition','La comunidad no está activa.');
        }
        const licencia=await tx.get(db.collection('mi_comunidad_licencias').doc(s.base.id));
        if(licencia.exists&&!evaluateLicense(licencia.data()).allowed)throw new HttpsError('failed-precondition','Licencia no vigente.');
        // También se respetan los cobros antiguos con identificadores aleatorios.
        const anteriores=await tx.get(s.base.collection('gastosComunes').where('periodo','==',periodo));
        const yaCobrados=new Set(anteriores.docs.map(d=>d.data().depto));
        const refs=lote.map(depto=>s.base.collection('gastosComunes')
          .doc(`${periodo}_${Buffer.from(depto).toString('base64url')}`));
        const snapshots=await tx.getAll(...refs);
        let nuevos=0;
        lote.forEach((depto,i)=>{
          if(yaCobrados.has(depto)||snapshots[i].exists)return;
          tx.create(refs[i],{depto,periodo,monto,vencimiento,estado:'Pendiente',
            fechaPago:null,metodoPago:null,creadoPor:s.uid,ts:Date.now()});
          nuevos++;
        });
        if(nuevos){
          tx.create(s.base.collection('notificaciones').doc(),{
            icon:'💵',titulo:'Nuevo gasto común generado',meta:`${periodo} · Vence ${vencimiento}`,
            paraTodos:true,leidaPor:[],ts:Date.now()
          });
          log(tx,s,'Cobro mensual generado',`${periodo} · ${nuevos} departamentos`);
        }
        return nuevos;
      });
      creados+=cantidad;
    }
    return {creados,existentes:departamentos.length-creados,departamentos:departamentos.length,periodo};
  });
  const configurarPagosMiComunidad=onCall(async req=>{
    const s=await scope(req,['admin']);const d=req.data;
    const permitidos=['Transferencia','Depósito','Efectivo en conserjería','Otro'];
    if(!Array.isArray(d.metodos)||!d.metodos.length||d.metodos.length>4||d.metodos.some(m=>!permitidos.includes(m)))throw new HttpsError('invalid-argument','Selecciona al menos un método de pago válido.');
    const configuracion={metodos:[...new Set(d.metodos)],banco:text(d.banco,150),tipoCuenta:text(d.tipoCuenta,150),titular:text(d.titular,150),rut:text(d.rut,150),numeroCuenta:text(d.numeroCuenta,150),correo:text(d.correo,150),enlace:text(d.enlace,500),instrucciones:text(d.instrucciones,2000)};
    if(configuracion.enlace){let url;try{url=new URL(configuracion.enlace);}catch(_){throw new HttpsError('invalid-argument','El enlace de pago no es válido.');}if(url.protocol!=='https:'||url.username||url.password)throw new HttpsError('invalid-argument','Usa un enlace HTTPS sin credenciales.');}
    if(configuracion.correo&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuracion.correo))throw new HttpsError('invalid-argument','El correo de comprobantes no es válido.');
    return db.runTransaction(async tx=>{const snap=await tx.get(s.base);const version=snap.data().configuracionPago?.version||0;if(version!==(d.version||0))throw new HttpsError('failed-precondition','La configuración cambió. Vuelve a abrirla.');configuracion.version=version+1;tx.update(s.base,{configuracionPago:configuracion,configuracionPagoActualizadaEn:stamp(),configuracionPagoActualizadaPor:s.uid});log(tx,s,'Configuración de pagos actualizada',configuracion.metodos.join(', '));return {configuracion};});
  });
  return {generarCobrosMiComunidad,configurarPagosMiComunidad,guardarPlanMantencionMiComunidad,registrarRevisionMantencionMiComunidad,gestionarAvisoMiComunidad,confirmarAvisoMiComunidad,gestionarVisitaMiComunidad,cancelarReservaMiComunidad,registrarEncomiendaMiComunidad,gestionarTurnoMiComunidad,gestionarEncomiendaMiComunidad};
};
