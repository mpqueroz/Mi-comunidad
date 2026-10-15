'use strict';
const crypto = require('node:crypto');
module.exports = function profesional(admin, onCall, HttpsError) {
  const db = admin.firestore();
  const stamp = () => admin.firestore.FieldValue.serverTimestamp();
  const text = (v, max = 2000) => String(v || '').trim().slice(0, max);
  const normalize = v => text(v, 200).toLocaleLowerCase('es-CL');
  const hash = (answer, salt) => crypto.scryptSync(normalize(answer), salt, 32).toString('hex');
  function secret(answer) {const salt = crypto.randomBytes(16).toString('hex'); return {salt, hash: hash(answer, salt), actualizadoEn: stamp()};}
  function matches(answer, stored) {if(!stored?.salt || !/^[a-f0-9]{64}$/.test(stored.hash || ''))return false;return crypto.timingSafeEqual(Buffer.from(hash(answer, stored.salt), 'hex'), Buffer.from(stored.hash, 'hex'));}
  async function scope(req, roles) {
    const token = req.auth?.token;
    if(!token || token.app !== 'mi_comunidad' || !roles.includes(token.role))throw new HttpsError('permission-denied', 'Tu cuenta no puede realizar esta operación.');
    const comunidadId = text(req.data?.comunidadId, 100);
    if(!comunidadId || comunidadId !== token.comunidadId)throw new HttpsError('permission-denied', 'La operación no corresponde a tu comunidad.');
    const base = db.collection('mi_comunidad_comunidades').doc(comunidadId);
    const community = await base.get();
    if(!community.exists || community.data().estado === 'Suspendida')throw new HttpsError('failed-precondition', 'La comunidad no está activa.');
    const person = token.role === 'conserje' ? await base.collection('conserjes').doc(req.auth.uid).get() : token.role === 'residente' ? await base.collection('residentes').doc(req.auth.uid).get() : null;
    if(person && (!person.exists || person.data().estado === 'Inactivo'))throw new HttpsError('permission-denied', 'La cuenta no está habilitada.');
    const nombre = person?.data()?.nombre || community.data().adminNombre || 'Administración';
    return {base, uid:req.auth.uid, role:token.role, nombre};
  }
  function docId(id) {if(typeof id!=='string'||!id||id.includes('/')||id.length>200)throw new HttpsError('invalid-argument','Identificador inválido.');return id;}
  function log(tx, s, title, meta, turnoId = '') {tx.set(s.base.collection('novedades').doc(), {icon:'clipboard-list',title:text(title),meta:text(meta,500),badgeClass:'',badgeText:'Registro',autorUid:s.uid,autorNombre:s.nombre,turnoId,ts:stamp()});}
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
        const data={estado:'Entregado',resumen,entregadoEn:stamp(),entregadoPor:s.uid,pendientesSnapshot:tareas.docs.map(d=>({id:d.id,titulo:d.data().titulo,prioridad:d.data().prioridad,responsable:d.data().responsable||'',compromiso:d.data().compromiso||''}))};
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
  const configurarIdentidadMiComunidad=onCall(async req=>{
    const s=await scope(req,['admin','residente']);const uid=docId(req.data.uid);
    if(s.role==='residente'&&uid!==s.uid)throw new HttpsError('permission-denied','Solo puedes cambiar tu propia respuesta.');
    const ref=s.base.collection('residentes').doc(uid);const snap=await ref.get();
    if(!snap.exists)throw new HttpsError('not-found','No se encontró la ficha.');
    const pregunta=text(req.data.pregunta,200),respuesta=text(req.data.respuesta,200);
    if(!pregunta||!respuesta)throw new HttpsError('invalid-argument','Completa pregunta y respuesta.');
    const batch=db.batch();batch.set(ref.collection('privado').doc('identidad'),secret(respuesta));batch.update(ref,{preguntaSecreta:pregunta,respuestaSecreta:admin.firestore.FieldValue.delete()});await batch.commit();return {ok:true};
  });
  const verificarFichaMiComunidad=onCall(async req=>{
    const s=await scope(req,['admin','conserje']);const uid=docId(req.data.uid);const ref=s.base.collection('residentes').doc(uid);const snap=await ref.get();
    if(!snap.exists)throw new HttpsError('not-found','No se encontró la ficha.');
    const motivo=text(req.data.motivo,500);
    if(motivo.length>=10) {await s.base.collection('auditoria').add({tipo:'Verificación manual de ficha',residenteUid:uid,actorUid:s.uid,actorNombre:s.nombre,motivo,ts:stamp()});return {ok:true};}
    const secretSnap=await ref.collection('privado').doc('identidad').get();
    if(!secretSnap.exists)throw new HttpsError('failed-precondition','Administración debe actualizar la privacidad de esta ficha.');
    const valid=matches(req.data.respuesta,secretSnap.data());
    const attempts=s.base.collection('verificaciones').doc(`${s.uid}_${uid}`);
    const result=await db.runTransaction(async tx=>{
      const a=await tx.get(attempts);const data=a.exists?a.data():{};const now=Date.now();const fresh=!data.inicio||now-data.inicio>900000;const intentos=fresh?0:data.intentos||0;
      if(intentos>=5)return 'limit';
      tx.set(attempts,{inicio:fresh?now:data.inicio,intentos:intentos+1,ultimo:stamp()});
      tx.create(s.base.collection('auditoria').doc(),{tipo:'Verificación de ficha',residenteUid:uid,actorUid:s.uid,actorNombre:s.nombre,resultado:valid?'Correcta':'Incorrecta',ts:stamp()});return valid?'ok':'wrong';
    });
    if(result==='limit')throw new HttpsError('resource-exhausted','Se alcanzó el límite de intentos. Espera 15 minutos.');
    if(result!=='ok')throw new HttpsError('permission-denied','La respuesta no coincide.');
    return {ok:true};
  });
  const migrarPrivacidadMiComunidad=onCall({timeoutSeconds:120},async req=>{
    const s=await scope(req,['admin']);const snap=await s.base.collection('residentes').get();let migrados=0;let pendientes=0;
    for(const doc of snap.docs) {
      const answer=doc.data().respuestaSecreta;
      if(typeof answer!=='string')continue;
      if(migrados>=100){pendientes++;continue;}
      // La transacción evita sobrescribir una respuesta que el residente cambie durante la migración.
      await db.runTransaction(async tx=>{
        const current=await tx.get(doc.ref);if(typeof current.data()?.respuestaSecreta!=='string')return;
        const a=current.data().respuestaSecreta;
        if(a.trim())tx.set(doc.ref.collection('privado').doc('identidad'),secret(a));
        tx.update(doc.ref,{respuestaSecreta:admin.firestore.FieldValue.delete()});
      });migrados++;
    }
    await s.base.collection('auditoria').add({tipo:'Migración de respuestas',actorUid:s.uid,actorNombre:s.nombre,migrados,ts:stamp()});return {migrados,mas:pendientes>0};
  });

  function hoyChile(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
  function rutValido(value){
    if(!/^[0-9]{7,8}[0-9K]$/.test(value))return false;
    const body=value.slice(0,-1);let total=0,m=2;
    for(let i=body.length-1;i>=0;i--){total+=Number(body[i])*m;m=m===7?2:m+1;}
    const n=11-total%11;return value.slice(-1)===(n===11?'0':n===10?'K':String(n));
  }
  const gestionarVisitaMiComunidad=onCall(async req=>{
    const s=await scope(req,['admin','conserje']);
    const d=req.data;
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
      tx.create(nueva,{nombre,rut,depto,motivo,estado:restriccion?'Denegado':'Dentro',restringido:restriccion,programadaId:programada?.id||'',ingresoPor:s.uid,ingresoPorNombre:s.nombre,ts:Date.now()});
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
  const configurarPagosMiComunidad=onCall(async req=>{
    const s=await scope(req,['admin']);const d=req.data;
    const permitidos=['Transferencia','Depósito','Efectivo en conserjería','Otro'];
    if(!Array.isArray(d.metodos)||!d.metodos.length||d.metodos.length>4||d.metodos.some(m=>!permitidos.includes(m)))throw new HttpsError('invalid-argument','Selecciona al menos un método de pago válido.');
    const configuracion={metodos:[...new Set(d.metodos)],banco:text(d.banco,150),tipoCuenta:text(d.tipoCuenta,150),titular:text(d.titular,150),rut:text(d.rut,150),numeroCuenta:text(d.numeroCuenta,150),correo:text(d.correo,150),enlace:text(d.enlace,500),instrucciones:text(d.instrucciones,2000)};
    if(configuracion.enlace){let url;try{url=new URL(configuracion.enlace);}catch(_){throw new HttpsError('invalid-argument','El enlace de pago no es válido.');}if(url.protocol!=='https:'||url.username||url.password)throw new HttpsError('invalid-argument','Usa un enlace HTTPS sin credenciales.');}
    if(configuracion.correo&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuracion.correo))throw new HttpsError('invalid-argument','El correo de comprobantes no es válido.');
    return db.runTransaction(async tx=>{const snap=await tx.get(s.base);const version=snap.data().configuracionPago?.version||0;if(version!==(d.version||0))throw new HttpsError('failed-precondition','La configuración cambió. Vuelve a abrirla.');configuracion.version=version+1;tx.update(s.base,{configuracionPago:configuracion,configuracionPagoActualizadaEn:stamp(),configuracionPagoActualizadaPor:s.uid});log(tx,s,'Configuración de pagos actualizada',configuracion.metodos.join(', '));return {configuracion};});
  });
  return {configurarPagosMiComunidad,guardarPlanMantencionMiComunidad,registrarRevisionMantencionMiComunidad,gestionarAvisoMiComunidad,confirmarAvisoMiComunidad,gestionarVisitaMiComunidad,cancelarReservaMiComunidad,registrarEncomiendaMiComunidad,gestionarTurnoMiComunidad,gestionarEncomiendaMiComunidad,configurarIdentidadMiComunidad,verificarFichaMiComunidad,migrarPrivacidadMiComunidad};
};
