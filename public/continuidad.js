/* Continuidad de sesión, búsqueda y gestión de visitas/reservas. */
'use strict';
let mcLoginManual=false;
let mcSesionCarga=0;
async function mcEntrarUsuario(user){
  const intento=++mcSesionCarga;
  const token=await user.getIdTokenResult(true);
  const c=token.claims;
  if(c.app!=='mi_comunidad'||!rolesConfig[c.role]||(c.role!=='superadmin'&&!c.comunidadId)){
    await auth.signOut();throw Error('Esta cuenta no pertenece a Mi Comunidad.');
  }
  if(intento!==mcSesionCarga)return;
  closeModal();detenerListenersComunidad();detenerListenerComunidades();
  residentesDirectorio.length=0;conserjesDirectorio.length=0;comunidadesDirectorio.length=0;
  profile.nombre=user.displayName||'';profile.depto='';profile.telefono='';
  currentUid=user.uid;currentRole=c.role;
  try{
    if(c.role==='superadmin')await iniciarSesionSuperAdmin();
    else await iniciarSesionComunidad(c.comunidadId);
    if(intento!==mcSesionCarga||auth.currentUser?.uid!==user.uid)return;
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('loginPassword').value='';
    aplicarRolUI();navigate(rolesConfig[currentRole].paginaInicial);
    actualizarContadorNotificaciones();
  }catch(err){
    detenerListenersComunidad();detenerListenerComunidades();currentRole=null;currentUid=null;
    throw err;
  }
}
const mcLoginAnterior=login;
login=async function(){
  if(mcLoginManual)return;
  mcLoginManual=true;
  try{
    if(typeof auth.setPersistence==='function'){
      await auth.setPersistence(document.getElementById('mcRecordar').checked?'local':'session');
    }
    await mcLoginAnterior();
  }catch(err){mostrarErrorLogin(err.message||'No se pudo preparar la sesión.');}
  finally{mcLoginManual=false;}
};
const mcLogoutAnterior=logout;
logout=async function(){mcSesionCarga++;closeModal();await mcLogoutAnterior();};
// El SDK conserva el token de sesión; nunca se guarda la contraseña.
if(typeof auth.onAuthStateChanged==='function'){
  auth.onAuthStateChanged(async user=>{
    if(mcLoginManual)return;
    if(!user){
      if(currentUid){
        mcSesionCarga++;closeModal();detenerListenersComunidad();detenerListenerComunidades();
        currentUid=null;currentRole=null;
        residentesDirectorio.length=0;conserjesDirectorio.length=0;comunidadesDirectorio.length=0;
        document.getElementById('app').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
      }
      return;
    }
    if(currentUid===user.uid&&currentRole)return;
    const btn=document.getElementById('loginBtn');btn.disabled=true;btn.textContent='Recuperando sesión…';
    try{await mcEntrarUsuario(user);}
    catch(err){mostrarErrorLogin(err.message||'No se pudo recuperar la sesión. Puedes volver a ingresar.');}
    finally{btn.disabled=false;btn.textContent='Ingresar';}
  });
}
function mcBuscarOperacion(){
  if(!mcStaff())return;
  mcAbrirPanel('Buscar en el edificio',`<div class="form-group"><label for="mcBuscaTodo">Departamento, persona, paquete o solicitud</label><input id="mcBuscaTodo" class="form-control" placeholder="Ej: 504, PAQ-2026 o portón" autocomplete="off"></div><div id="mcBuscaResultados" aria-live="polite"></div>`);
  document.getElementById('mcBuscaTodo').addEventListener('input',mcResultadosBusqueda);
  mcResultadosBusqueda();
}
function mcResultadosBusqueda(){
  const q=(document.getElementById('mcBuscaTodo')?.value||'').trim().toLocaleLowerCase('es-CL');
  const el=document.getElementById('mcBuscaResultados');if(!el)return;
  if(q.length<2){el.innerHTML=mcVacio('Escribe al menos dos caracteres para buscar.');return;}
  const match=(...values)=>values.some(v=>String(v||'').toLocaleLowerCase('es-CL').includes(q));
  const sections=[
    ['Departamentos',residentesDirectorio.filter(r=>match(r.depto,r.nombre,r.telefono)).map(r=>mcFila(`Depto ${r.depto} · ${r.nombre}`,r.telefono,mcBoton('Abrir ficha','verFichaDesdeBusqueda',r.depto)))],
    ['Encomiendas',encomiendas.filter(e=>match(e.codigo,e.depto,e.title,e.destinatario,e.ubicacion)).map(e=>mcFila(`${e.codigo||e.title} · Depto ${e.depto}`,`${e.estado} · ${e.ubicacion||'Sin ubicación'}`,mcBoton('Ver paquete','mcDetallePaquete',e.id)))],
    ['Solicitudes',incidencias.filter(i=>match(i.depto,i.categoria,i.descripcion,i.responsable,folioCorto(i.id))).map(i=>mcFila(`${i.categoria} · Depto ${i.depto}`,i.estado,mcBoton('Seguimiento','mcDetalleSolicitud',i.id)))],
    ['Pendientes abiertos',mc.tareas.filter(t=>match(t.titulo,t.detalle,t.responsable)).map(t=>mcFila(t.titulo,t.prioridad,mcBoton('Ver pendientes','mcIrDesdeBusqueda','pendientes')))]
  ];
  el.innerHTML=sections.filter(([,rows])=>rows.length).map(([title,rows])=>`<section class="mc-section"><h3>${mcEscape(title)} (${rows.length})</h3>${rows.slice(0,8).join('')}${rows.length>8?'<p class="mc-meta">Mostrando los primeros ocho. Afina la búsqueda para encontrar otro registro.</p>':''}</section>`).join('')||mcVacio('No hay coincidencias. Prueba otro nombre o departamento.');
}
function mcIrDesdeBusqueda(lista){closeModal();mcAbrirOperacion(lista);}
function mcVistaVisitas(){
  const dentro=visitas.filter(v=>v.estado==='Dentro');
  const hoy=visitas.filter(v=>mcFechaISO(v.ts)===mcHoy());
  const registros=mc.filtro==='Todos'?visitas:mc.filtro==='Resueltos'?hoy.filter(v=>v.estado==='Salió'):dentro;
  return `<section class="mc-panel"><div class="mc-actions" style="justify-content:space-between"><h3>Visitas del edificio</h3>${mcBoton('Registrar visita','openVisitaModal')}</div><div class="mc-toolbar">${[['Pendientes',`Dentro (${dentro.length})`],['Resueltos','Salidas de hoy'],['Todos','Historial']].map(([k,label])=>`<button class="mc-chip ${mc.filtro===k?'active':''}" ${mcAct('mcFiltro',k)}>${label}</button>`).join('')}</div>${registros.slice(0,100).map(v=>mcFila(`${v.nombre} · Depto ${v.depto}`,`${v.estado||'Registro anterior sin seguimiento'} · ${mcFecha(v.ts)}${v.salidaEn?' · Salida '+mcFecha(v.salidaEn):''}`,v.estado==='Dentro'?mcBoton('Registrar salida','mcConfirmarSalida',v.id):'',v.estado==='Denegado'?'<span class="mc-tag warn">Ingreso denegado</span>':'')).join('')||mcVacio('No hay visitas en esta vista.')}<p class="mc-note">Se muestran hasta 100 registros. Las visitas de versiones anteriores no se cuentan como personas dentro porque no tienen una salida verificable.</p></section>`;
}
function mcFechaISO(ts){if(!ts)return '';const d=ts.toDate?ts.toDate():new Date(ts);if(Number.isNaN(+d))return '';return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);}
registrarVisitaReal=async function(datos){
  try{
    const result=await functions.httpsCallable('gestionarVisitaMiComunidad')({comunidadId:community.id,accion:'ingresar',...datos});
    closeModal();showToast(result.data.denegado?'Ingreso denegado: la persona tiene una restricción para este departamento.':'Ingreso registrado.');
    mcAbrirOperacion('visitas');return true;
  }catch(err){showToast(err.message||'No se pudo registrar el ingreso.');return false;}
};
marcarIngresoVisitaProgramada=async function(id){
  try{
    const result=await functions.httpsCallable('gestionarVisitaMiComunidad')({comunidadId:community.id,accion:'ingresar',programadaId:id});
    showToast(result.data.denegado?'Ingreso denegado por restricción.':'Visita anunciada ingresó correctamente.');
    mcAbrirOperacion('visitas');
  }catch(err){showToast(err.message||'No se pudo registrar el ingreso.');}
};
function mcConfirmarSalida(id){const v=visitas.find(x=>x.id===id);if(!v)return;mcAbrirPanel('Registrar salida',`<p class="mc-message">${mcEscape(v.nombre)} · Depto ${mcEscape(v.depto)}</p><p class="mc-note">Confirma que la persona ya salió. El registro conservará el ingreso, la salida y quién los confirmó.</p>${mcBoton('Confirmar salida','mcGuardarSalida',id)}`);}
async function mcGuardarSalida(id){await functions.httpsCallable('gestionarVisitaMiComunidad')({comunidadId:community.id,accion:'salir',id});closeModal();showToast('Salida registrada.');mcAbrirOperacion('visitas');}
// Reservas: la cancelación conserva el registro y libera el marcador de ocupación.
renderReservasList=function(){
  const propias=reservas.filter(r=>currentRole!=='residente'||r.depto===profile.depto);
  const list=propias.slice().sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
  return `<div class="mc-toolbar">${[['proximas','Próximas'],['anteriores','Historial']].map(([key,label])=>`<button class="mc-chip ${(mc.reservaFiltro||'proximas')===key?'active':''}" ${mcAct('mcFiltrarReservas',key)}>${label}</button>`).join('')}</div>${list.filter(r=>(mc.reservaFiltro||'proximas')==='proximas'?r.estado==='Confirmada'&&r.fecha>=mcHoy():r.estado!=='Confirmada'||r.fecha<mcHoy()).map(r=>mcFila(r.lugar,`${currentRole==='residente'?'':'Depto '+r.depto+' · '}${r.fecha} · ${r.hora} · ${r.estado}`,`<div class="mc-actions">${r.estado==='Confirmada'?mcBoton('Invitados','abrirInvitadosReserva',r.id):''}${r.estado==='Confirmada'&&(r.fecha>mcHoy()||(currentRole==='admin'&&r.fecha===mcHoy()))&&(currentRole==='admin'||currentRole==='residente')?mcBoton('Cancelar reserva','mcModalCancelarReserva',r.id):''}</div>`)).join('')||mcVacio('No hay reservas en esta vista.')}`;
};
function mcFiltrarReservas(key){mc.reservaFiltro=key;renderReservas();}
function mcModalCancelarReserva(id){const r=reservas.find(x=>x.id===id);if(!r)return;mcAbrirPanel('Cancelar reserva',`<div class="mc-message">${mcEscape(r.lugar)} · ${mcEscape(r.fecha)} · ${mcEscape(r.hora)}</div><p class="mc-note">El horario quedará disponible para otro departamento. El registro de cancelación se conservará. Para cambios del mismo día, coordina con administración.</p><div class="form-group"><label for="mcReservaMotivo">Motivo de cancelación</label><textarea id="mcReservaMotivo" class="form-control" maxlength="500"></textarea></div>${mcBoton('Confirmar cancelación','mcCancelarReserva',id)}`);}
async function mcCancelarReserva(id){const motivo=document.getElementById('mcReservaMotivo').value.trim();if(!motivo){showToast('Escribe el motivo de la cancelación.');return;}await functions.httpsCallable('cancelarReservaMiComunidad')({comunidadId:community.id,id,motivo});closeModal();showToast('Reserva cancelada y horario liberado.');renderReservas();}
