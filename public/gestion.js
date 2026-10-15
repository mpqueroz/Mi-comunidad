/* Gestión preventiva y comunicación de la comunidad. */
'use strict';
mc.planes=[];mc.lecturas=new Set();mc.planesFiltro='Activas';
for(const rol of ['residente','conserje','admin']){
  rolesConfig[rol].paginas.push('agenda');
  rolesConfig[rol].menu[0].items.push({page:'agenda',icon:'calendar',label:'Agenda y alertas'});
  if(rol!=='residente'){
    rolesConfig[rol].paginas.push('mantenciones');
    rolesConfig[rol].menu[0].items.push({page:'mantenciones',icon:'wrench',label:'Mantenciones'});
  }
}
const mcGestionReset=mcReset;
mcReset=function(){mcGestionReset();mc.planes=[];mc.lecturas=new Set();mc.planesFiltro='Activas';mcAvisosFiltro='Vigentes';};
const mcGestionSesion=iniciarSesionComunidad;
iniciarSesionComunidad=async function(id){
  await mcGestionSesion(id);
  const base=refComunidadActual();
  const fail=err=>{console.error(err);mc.errorCarga='Hay datos de gestión sin sincronizar. Revisa tu conexión y los permisos.';rerenderSiAppVisible();};
  mc.unsubs.push(base.collection('lecturasAvisos').where('uid','==',currentUid).onSnapshot(s=>{
    mc.lecturas=new Set(s.docs.map(d=>d.data().avisoId));rerenderSiAppVisible();
  },fail));
  if(mcStaff())mc.unsubs.push(base.collection('planesMantencion').onSnapshot(s=>{
    mc.planes=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.proximaFecha).localeCompare(String(b.proximaFecha)));rerenderSiAppVisible();
  },fail));
};
function mcDiasEntre(fecha,base=mcHoy()){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha||''))return null;
  return Math.round((Date.parse(fecha+'T12:00:00Z')-Date.parse(base+'T12:00:00Z'))/86400000);
}
function mcAvisosVigentes(){return avisos.filter(a=>a.estado!=='Archivado'&&(!a.vence||a.vence>=mcHoy())).sort((a,b)=>Number(!!b.fijado)-Number(!!a.fijado)||mcTs(b.ts)-mcTs(a.ts));}
function mcAvisoEstado(a){if(a.estado==='Archivado')return 'Archivado';if(a.vence&&a.vence<mcHoy())return 'Vencido';return a.fijado?'Destacado':'Vigente';}
function mcAlertas(){
  const list=[];
  if(currentRole==='residente'){
    for(const p of encomiendas.filter(e=>e.depto===profile.depto&&e.estado!=='Entregado'))list.push({titulo:'Encomienda por retirar',detalle:`${p.codigo||p.title} · recibida ${mcFecha(p.ts)}`,fn:'mcDetallePaquete',args:[p.id],nivel:'Normal'});
    for(const a of mcAvisosVigentes().filter(a=>a.confirmacion&&!mc.lecturas.has(a.id)))list.push({titulo:'Aviso por confirmar',detalle:a.title||a.titulo,fn:'mcDetalleAviso',args:[a.id],nivel:a.categoria==='Importante'?'Prioritario':'Normal'});
    for(const r of reservas.filter(r=>r.depto===profile.depto&&r.estado==='Confirmada'&&[0,1].includes(mcDiasEntre(r.fecha))))list.push({titulo:mcDiasEntre(r.fecha)===0?'Tu reserva es hoy':'Tu reserva es mañana',detalle:`${r.lugar} · ${r.hora}`,fn:'navigate',args:['reservas'],nivel:'Normal'});
    for(const i of incidencias.filter(i=>i.depto===profile.depto&&i.estado!=='Resuelto'&&i.compromiso&&i.compromiso<mcHoy()))list.push({titulo:'Solicitud con compromiso vencido',detalle:`${i.categoria} · ${i.compromiso}`,fn:'mcDetalleSolicitud',args:[i.id],nivel:'Prioritario'});
  }else if(mcStaff()){
    if(mc.turno?.estado==='Entregado')list.push({titulo:'Turno pendiente de recepción',detalle:mc.turno.autorNombre,fn:'mcModalTurno',args:['recibir'],nivel:'Prioritario'});
    for(const t of mc.tareas.filter(t=>t.prioridad==='Urgente'||(t.compromiso&&t.compromiso<=mcHoy())))list.push({titulo:t.titulo,detalle:`${t.prioridad} · ${t.responsable||'Equipo'}${t.compromiso?' · '+t.compromiso:''}`,fn:'mcAbrirOperacion',args:['pendientes'],nivel:'Prioritario'});
    for(const p of mc.planes.filter(p=>p.activo&&mcDiasEntre(p.proximaFecha)!==null&&mcDiasEntre(p.proximaFecha)<=7))list.push({titulo:p.proximaFecha<mcHoy()?'Mantención vencida':'Próxima mantención',detalle:`${p.titulo} · ${p.proximaFecha}`,fn:'mcDetallePlan',args:[p.id],nivel:p.proximaFecha<=mcHoy()?'Prioritario':'Normal'});
    for(const e of encomiendas.filter(e=>e.estado==='En proceso de entrega'&&mcTs(e.entregaHasta)<Date.now()))list.push({titulo:'Entrega de paquete interrumpida',detalle:e.codigo||e.title,fn:'mcDetallePaquete',args:[e.id],nivel:'Normal'});
    for(const i of incidencias.filter(i=>i.estado!=='Resuelto'&&i.compromiso&&i.compromiso<mcHoy()))list.push({titulo:'Solicitud con compromiso vencido',detalle:`Depto ${i.depto} · ${i.categoria} · ${i.responsable||'Sin responsable'}`,fn:'mcDetalleSolicitud',args:[i.id],nivel:'Prioritario'});
    for(const a of mcAvisosVigentes().filter(a=>a.confirmacion&&!mc.lecturas.has(a.id)))list.push({titulo:'Aviso por confirmar',detalle:a.title||a.titulo,fn:'mcDetalleAviso',args:[a.id],nivel:'Normal'});
  }
  return list.sort((a,b)=>Number(b.nivel==='Prioritario')-Number(a.nivel==='Prioritario'));
}
function mcRenderAgenda(){
  const list=mcAlertas();
  document.getElementById('content').innerHTML=`<div class="mc-hero"><div><div class="mc-kicker">Agenda de la comunidad</div><h2>Lo que necesita tu atención</h2><p>${list.length} recordatorio${list.length===1?'':'s'} según tus datos actuales.</p></div>${mcBoton('Actualizar vista','mcRenderAgenda')}</div><div class="mc-note">Estos recordatorios se muestran dentro de la app. Revisa que tus datos estén sincronizados; no son avisos enviados al teléfono con la aplicación cerrada.</div>${mcEstadoConexion()}<section class="mc-panel">${list.map(a=>mcFila(a.titulo,a.detalle,mcBoton('Revisar',a.fn,...a.args),`<span class="mc-tag ${a.nivel==='Prioritario'?'warn':''}">${a.nivel}</span>`)).join('')||mcVacio('No tienes recordatorios pendientes en este momento.')}</section>${mcFooter()}`;
}
const mcGestionHome=renderHome;
renderHome=function(){mcGestionHome();const n=mcAlertas().length;document.getElementById('content').insertAdjacentHTML('afterbegin',`<div class="mc-panel mc-agenda-shortcut"><div><strong>${n?n+' recordatorios para revisar':'Tu agenda está al día'}</strong><div class="mc-meta">Avisos, encomiendas, solicitudes y reservas.</div></div>${mcBoton('Abrir agenda','navigate','agenda')}</div>`);};
function mcRenderMantenciones(){if(!mcStaff())return;document.getElementById('content').innerHTML=`<div class="page-header"><div><div class="mc-kicker">Cuidado del edificio</div><h1>Mantenciones preventivas</h1><p>Programa, registra lo realizado y conserva sus respaldos.</p></div>${currentRole==='admin'?mcBoton('Nuevo plan','mcModalPlan'):''}</div>${mcEstadoConexion()}${mcVistaPlanes()}${mcFooter()}`;}
function mcVistaPlanes(){
  const list=mc.planes.filter(p=>mc.planesFiltro==='Todas'||(mc.planesFiltro==='Finalizadas'?p.finalizado:mc.planesFiltro==='Pausadas'?!p.activo&&!p.finalizado:p.activo));
  return `<div class="mc-toolbar">${['Activas','Pausadas','Finalizadas','Todas'].map(f=>`<button class="mc-chip ${mc.planesFiltro===f?'active':''}" ${mcAct('mcFiltrarPlanes',f)}>${f}</button>`).join('')}</div><section class="mc-panel">${list.map(p=>mcFila(p.titulo,`${p.equipo||'Edificio'} · ${p.proximaFecha} · ${p.periodicidad} · ${p.responsable||'Por asignar'}`,mcBoton('Ver plan','mcDetallePlan',p.id),`<span class="mc-tag ${p.activo&&p.proximaFecha<=mcHoy()?'warn':''}">${p.finalizado?'Finalizada':!p.activo?'Pausada':p.proximaFecha<mcHoy()?'Vencida':p.proximaFecha===mcHoy()?'Hoy':'Programada'}</span>`)).join('')||mcVacio('No hay planes de mantención en esta vista.')}</section>`;
}
function mcFiltrarPlanes(f){mc.planesFiltro=f;if(currentPage==='admin')renderAdmin();else mcRenderMantenciones();}
const mcProveedoresAnterior=renderAdminProveedores;
renderAdminProveedores=function(){return `<div class="page-header"><div><h3>Proveedores y prevención</h3><p>Equipos, responsables y revisiones periódicas.</p></div>${mcBoton('Nuevo plan','mcModalPlan')}</div>${mcVistaPlanes()}<section class="mc-panel"><div class="mc-actions" style="justify-content:space-between"><h3>Directorio de proveedores</h3>${mcBoton('Agregar proveedor','openProveedorModal')}</div>${proveedoresDirectorio.map(p=>mcFila(p.nombre,`${p.rubro} · ${p.telefono} · ${p.estado}`)).join('')||mcVacio('Todavía no hay proveedores registrados.')}${mcBoton('Consultar mantenciones anteriores','mcVerMantencionesAnteriores')}</section>`;};
function mcVerMantencionesAnteriores(){mcAbrirPanel('Mantenciones anteriores',mantenciones.map(m=>mcFila(m.tipo,`${m.fecha} · ${m.proveedor} · ${m.estado}`)).join('')||mcVacio('No hay registros anteriores.'));}
function mcModalPlan(id){
  if(currentRole!=='admin')return;
  const p=mc.planes.find(p=>p.id===id)||{};const solicitud=generarTokenAleatorio();
  mcAbrirPanel(id?'Editar plan preventivo':'Nuevo plan preventivo',`<div class="form-group"><label for="mcPlanTitulo">Trabajo o revisión</label><input id="mcPlanTitulo" class="form-control" maxlength="150" value="${mcEscape(p.titulo||'')}" placeholder="Ej: Revisión de portón automático"></div><div class="mc-form-grid"><div class="form-group"><label for="mcPlanEquipo">Equipo o instalación</label><input id="mcPlanEquipo" class="form-control" maxlength="100" value="${mcEscape(p.equipo||'')}"></div><div class="form-group"><label for="mcPlanResponsable">Responsable</label><input id="mcPlanResponsable" class="form-control" maxlength="100" value="${mcEscape(p.responsable||'')}"></div><div class="form-group"><label for="mcPlanFecha">Próxima revisión</label><input id="mcPlanFecha" class="form-control" type="date" value="${mcEscape(p.proximaFecha||mcHoy())}"></div><div class="form-group"><label for="mcPlanFrecuencia">Frecuencia</label><select id="mcPlanFrecuencia" class="form-control">${['Única','Semanal','Mensual','Trimestral','Semestral','Anual'].map(f=>`<option ${p.periodicidad===f?'selected':''}>${f}</option>`).join('')}</select></div></div><div class="form-group"><label for="mcPlanProveedor">Proveedor o contacto</label><input id="mcPlanProveedor" class="form-control" maxlength="150" value="${mcEscape(p.proveedor||'')}" list="mcProveedores"><datalist id="mcProveedores">${proveedoresDirectorio.map(x=>`<option value="${mcEscape(x.nombre)}"></option>`).join('')}</datalist></div><div class="form-group"><label for="mcPlanDetalle">Indicaciones</label><textarea id="mcPlanDetalle" class="form-control" maxlength="2000">${mcEscape(p.detalle||'')}</textarea></div><label class="mc-recordar"><input id="mcPlanActivo" type="checkbox" ${p.activo!==false?'checked':''}> Plan activo</label>${mcBoton('Guardar plan','mcGuardarPlan',id||null,p.version||0,solicitud)}`);
}
async function mcGuardarPlan(id,version,solicitud){
  const values={};for(const [key,field] of Object.entries({titulo:'Titulo',equipo:'Equipo',responsable:'Responsable',proximaFecha:'Fecha',periodicidad:'Frecuencia',proveedor:'Proveedor',detalle:'Detalle'}))values[key]=document.getElementById('mcPlan'+field).value.trim();
  await functions.httpsCallable('guardarPlanMantencionMiComunidad')({comunidadId:community.id,id,version,solicitud,...values,activo:document.getElementById('mcPlanActivo').checked});closeModal();showToast('Plan preventivo guardado.');navigate('mantenciones');
}
function mcDetallePlan(id){
  const p=mc.planes.find(p=>p.id===id);if(!p)return;
  mcAbrirPanel(p.titulo,`<span class="mc-tag">${p.finalizado?'Finalizado':p.activo?'Activo':'Pausado'}</span><p class="mc-note">${mcEscape(p.equipo)} · ${mcEscape(p.periodicidad)}<br>Próxima revisión: ${mcEscape(p.proximaFecha)}<br>Responsable: ${mcEscape(p.responsable||'Por asignar')}<br>Proveedor: ${mcEscape(p.proveedor||'Por definir')}</p><div class="mc-wrap">${mcEscape(p.detalle)}</div><div class="mc-actions" style="margin-top:15px">${p.activo?mcBoton('Registrar revisión realizada','mcModalRevision',id):''}${currentRole==='admin'?mcBoton('Editar plan','mcModalPlan',id):''}</div><h4 style="margin-top:20px">Últimas 40 revisiones</h4><div id="mcRevisiones">Cargando historial…</div>`);
  mc.detalleUnsub=refComunidadActual().collection('planesMantencion').doc(id).collection('revisiones').orderBy('ts','desc').limit(40).onSnapshot(s=>{const el=document.getElementById('mcRevisiones');if(!el)return;el.innerHTML=s.docs.map(d=>{const r=d.data();return `<div class="mc-message"><strong>${mcEscape(r.autorNombre)}</strong><div class="mc-meta">${mcFecha(r.ts)} · Programada para ${mcEscape(r.fechaProgramada)}</div><p>${mcEscape(r.observacion)}</p>${mcFoto(r.foto)}</div>`;}).join('')||mcVacio('Todavía no hay revisiones registradas.');},()=>{const el=document.getElementById('mcRevisiones');if(el)el.textContent='No se pudo cargar el historial.';});
}
function mcModalRevision(id){const p=mc.planes.find(p=>p.id===id);if(!p)return;const solicitud=generarTokenAleatorio();mcAbrirPanel('Registrar revisión',`<div class="mc-note">${mcEscape(p.titulo)}<br>Programada para ${mcEscape(p.proximaFecha)}. La realización se registrará con la fecha y hora actuales.</div><div class="form-group"><label for="mcRevisionNota">Trabajo realizado y resultado</label><textarea id="mcRevisionNota" class="form-control" maxlength="2000"></textarea></div>${mcCampoFoto()}${mcBoton('Confirmar revisión','mcGuardarRevision',id,p.version,solicitud)}`);}
async function mcGuardarRevision(id,version,solicitud){const observacion=document.getElementById('mcRevisionNota').value.trim();if(!observacion){showToast('Describe el trabajo realizado.');return;}await functions.httpsCallable('registrarRevisionMantencionMiComunidad')({comunidadId:community.id,id,version,solicitud,observacion,foto:await mcLeerFoto('mcFoto')});closeModal();showToast('Revisión registrada y calendario actualizado.');navigate('mantenciones');}
let mcAvisosFiltro='Vigentes';
renderAvisos=function(){
  const vigentes=mcAvisosVigentes();const list=mcAvisosFiltro==='Historial'?avisos.filter(a=>!vigentes.includes(a)):vigentes;
  document.getElementById('content').innerHTML=`<div class="page-header"><div><div class="mc-kicker">Comunicación del edificio</div><h1>Avisos de la comunidad</h1><p>Información vigente y confirmaciones de lectura.</p></div>${currentRole==='admin'?mcBoton('Publicar aviso','mcModalAviso'):''}</div><div class="mc-toolbar">${['Vigentes','Historial'].map(f=>`<button class="mc-chip ${mcAvisosFiltro===f?'active':''}" ${mcAct('mcFiltrarAvisos',f)}>${f}</button>`).join('')}</div><section class="mc-panel">${list.map(a=>mcFila(a.title||a.titulo,a.description||a.descripcion||'',mcBoton('Leer aviso','mcDetalleAviso',a.id),`<span class="mc-tag ${a.fijado?'warn':''}">${mcEscape(mcAvisoEstado(a))}${a.confirmacion?(mc.lecturas.has(a.id)?' · Lectura confirmada':' · Por confirmar'):''}</span>`)).join('')||mcVacio('No hay avisos en esta vista.')}</section>${mcFooter()}`;
};
function mcFiltrarAvisos(f){mcAvisosFiltro=f;renderAvisos();}
function mcDetalleAviso(id){
  const a=avisos.find(x=>x.id===id);if(!a)return;
  const vigente=mcAvisoEstado(a)!=='Vencido'&&mcAvisoEstado(a)!=='Archivado';
  mcAbrirPanel(a.title||a.titulo||'Aviso',`<span class="mc-tag ${a.fijado?'warn':''}">${mcEscape(a.categoria||'General')} · ${mcEscape(mcAvisoEstado(a))}</span><div class="mc-meta">Publicado: ${mcFecha(a.ts)}${a.vence?' · Vigente hasta '+mcEscape(a.vence):''}</div><div class="mc-message">${mcEscape(a.description||a.descripcion||'')}</div>${a.confirmacion?`<div class="mc-note">${mc.lecturas.has(id)?'Ya confirmaste que leíste este aviso.':'Administración solicita que confirmes su lectura.'}</div>${vigente&&!mc.lecturas.has(id)?mcBoton('Confirmar que lo leí','mcConfirmarAviso',id):''}`:''}${currentRole==='admin'?`<div class="mc-actions" style="margin-top:15px">${a.confirmacion?mcBoton('Ver confirmaciones','mcVerLecturas',id):''}${a.estado!=='Archivado'?mcBoton('Archivar aviso','mcModalArchivarAviso',id):''}</div>`:''}`);
}
async function mcConfirmarAviso(id){await functions.httpsCallable('confirmarAvisoMiComunidad')({comunidadId:community.id,id});mc.lecturas.add(id);showToast('Lectura confirmada.');mcDetalleAviso(id);}
function mcModalAviso(){
  if(currentRole!=='admin')return;
  const solicitud=generarTokenAleatorio();
  mcAbrirPanel('Publicar aviso',`<div class="form-group"><label for="mcAvisoTitulo">Título</label><input id="mcAvisoTitulo" class="form-control" maxlength="150"></div><div class="form-group"><label for="mcAvisoTexto">Mensaje</label><textarea id="mcAvisoTexto" class="form-control" maxlength="4000" rows="5"></textarea></div><div class="mc-form-grid"><div class="form-group"><label for="mcAvisoCategoria">Categoría</label><select id="mcAvisoCategoria" class="form-control"><option>General</option><option>Importante</option><option>Mantención</option></select></div><div class="form-group"><label for="mcAvisoVence">Vigente hasta (opcional)</label><input id="mcAvisoVence" class="form-control" type="date" min="${mcHoy()}"></div></div><label class="mc-recordar"><input id="mcAvisoFijado" type="checkbox"> Destacar al inicio</label><label class="mc-recordar"><input id="mcAvisoConfirmacion" type="checkbox"> Solicitar confirmación de lectura a cada cuenta</label><p class="mc-note">El aviso se publicará para toda la comunidad. La confirmación acredita una acción en la app, no la aceptación de un acuerdo.</p>${mcBoton('Publicar para la comunidad','mcPublicarAviso',solicitud)}`);
}
openAvisoModal=mcModalAviso;
async function mcPublicarAviso(solicitud){await functions.httpsCallable('gestionarAvisoMiComunidad')({comunidadId:community.id,accion:'publicar',solicitud,titulo:document.getElementById('mcAvisoTitulo').value.trim(),texto:document.getElementById('mcAvisoTexto').value.trim(),categoria:document.getElementById('mcAvisoCategoria').value,vence:document.getElementById('mcAvisoVence').value,fijado:document.getElementById('mcAvisoFijado').checked,confirmacion:document.getElementById('mcAvisoConfirmacion').checked});closeModal();showToast('Aviso publicado para la comunidad.');navigate('avisos');}
function mcModalArchivarAviso(id){mcAbrirPanel('Archivar aviso',`<p class="mc-note">Dejará de aparecer entre los avisos vigentes. El mensaje y las confirmaciones se conservarán en el historial.</p>${mcBoton('Confirmar archivo','mcArchivarAviso',id)}`);}
async function mcArchivarAviso(id){await functions.httpsCallable('gestionarAvisoMiComunidad')({comunidadId:community.id,accion:'archivar',id});closeModal();showToast('Aviso archivado.');navigate('avisos');}
async function mcVerLecturas(id){
  if(currentRole!=='admin')return;
  mcAbrirPanel('Confirmaciones de lectura','<div id="mcLecturasLista">Cargando confirmaciones…</div>');
  const snap=await refComunidadActual().collection('lecturasAvisos').where('avisoId','==',id).get();
  const el=document.getElementById('mcLecturasLista');if(!el)return;
  const cuentas=new Map([...residentesDirectorio,...conserjesDirectorio].map(p=>[p.uid,p]));
  const rows=snap.docs.map(d=>d.data()).sort((a,b)=>mcTs(b.ts)-mcTs(a.ts));
  el.innerHTML=`<p class="mc-note">${rows.length} cuentas confirmaron la lectura. Se cuenta por cuenta de usuario; no equivale a departamentos ni a personas que recibieron una notificación.</p>${rows.map(r=>mcFila(cuentas.get(r.uid)?.nombre||r.nombre||'Cuenta de la comunidad',`${r.depto?'Depto '+r.depto+' · ':''}${mcFecha(r.ts)}`)).join('')||mcVacio('Todavía no hay confirmaciones.')}`;
}
