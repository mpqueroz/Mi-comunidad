/* Invitaciones QR y resumen automático para la continuidad del servicio. */
'use strict';
let mcPaseActual=null,mcPaseEpoch=0,mcPaseEmitiendo=false;
const mcCierraAccesos=closeModal;
closeModal=function(){mcPaseEpoch++;mcPaseActual=null;detenerEscaneoQR();return mcCierraAccesos();};

function mcInvitaciones(){
  if(currentRole!=='residente')return;
  const list=visitasProgramadas.filter(v=>v.depto===profile.depto&&v.estado==='Pendiente'&&v.fecha>=mcHoy()).sort((a,b)=>(a.fecha+(a.hora||'')).localeCompare(b.fecha+(b.hora||'')));
  mcAbrirPanel('Mis invitaciones',`<p class="mc-note">Comparte un pase con tu visita. Portería comprobará la autorización y confirmará su ingreso. Cada pase permite un solo ingreso.</p>${mcBoton('Anunciar una nueva visita','abrirModalVisitaProgramada',profile.depto)}${list.map(v=>mcFila(v.nombre,`${v.fecha} · ${v.hora||'Desde las 00:00'}${v.qrFin?' · Hasta '+v.qrFin.slice(11):''}`,`<div class="mc-actions">${mcBoton(v.qrHash?'Generar nuevo pase':'Crear pase QR','mcModalPase',v.id)}${mcBoton('Cancelar invitación','quitarVisitaProgramada',v.id)}</div>`)).join('')||mcVacio('No tienes invitaciones pendientes para hoy o los próximos días.')}`);
}
const mcHomeAccesos=renderHome;
renderHome=function(){mcHomeAccesos();if(currentRole==='residente')document.getElementById('content').insertAdjacentHTML('afterbegin',`<section class="mc-panel"><div class="mc-actions" style="justify-content:space-between"><div><h3>Recibe a tus visitas</h3><p class="mc-meta">Invitaciones con QR y confirmación en portería.</p></div>${mcBoton('Mis invitaciones','mcInvitaciones')}</div></section>`);};
const mcPerfilAccesos=renderPerfil;
renderPerfil=function(){mcPerfilAccesos();if(currentRole==='residente')document.getElementById('content').insertAdjacentHTML('afterbegin',`<section class="mc-panel">${mcBoton('Invitaciones y pases QR','mcInvitaciones')}</section>`);};

function mcModalPase(id){
  const v=visitasProgramadas.find(x=>x.id===id);
  if(currentRole!=='residente'||!v||v.depto!==profile.depto)return;
  mcAbrirPanel('Autorizar pase de visita',`<div class="mc-message"><strong>${mcEscape(v.nombre)}</strong><br>Depto ${mcEscape(v.depto)} · ${mcEscape(v.fecha)}<br>Desde ${mcEscape(v.hora||'00:00')} (hora de Chile)</div><div class="form-group"><label for="mcPaseHasta">Válido hasta (el mismo día)</label><input id="mcPaseHasta" type="time" class="form-control" required value="${mcEscape(v.qrFin?.slice(11)||'23:59')}"></div><p class="mc-note">${v.qrHash?'Generar un nuevo pase invalida inmediatamente el anterior. ':''}Compártelo solo con la persona invitada. Portería debe comprobar quién se presenta.</p>${mcBoton('Generar pase para compartir','mcEmitirPase',id)}`);
}
async function mcEmitirPase(id){
  if(mcPaseEmitiendo)return;
  const hasta=document.getElementById('mcPaseHasta')?.value;
  if(!hasta){showToast('Indica hasta qué hora podrá ingresar.');return;}
  const epoch=mcPaseEpoch;mcPaseEmitiendo=true;
  try{
    const {data:p}=await functions.httpsCallable('gestionarVisitaMiComunidad')({comunidadId:community.id,accion:'emitirPase',id,hasta});
    if(epoch!==mcPaseEpoch)return;
    mcMostrarPase(p);
  }catch(err){showToast(err.message||'No se pudo generar el pase.');}
  finally{mcPaseEmitiendo=false;}
}
function mcMostrarPase(p){
  const codigo=`MCVI1:${p.id}:${p.token}`;
  const qr=qrcode(0,'M');qr.addData(codigo);qr.make();
  mcAbrirPanel('Pase listo para tu visita',`<div style="text-align:center"><h3>${mcEscape(p.nombre)}</h3><p>${mcEscape(community.name)} · Depto ${mcEscape(p.depto)}</p><div style="display:inline-block;background:white;padding:20px;max-width:100%">${qr.createSvgTag({cellSize:4,margin:16,scalable:true,alt:'Pase QR de visita'})}</div><p class="mc-note">${mcEscape(p.inicio.slice(0,10))} · ${mcEscape(p.inicio.slice(11))} a ${mcEscape(p.fin.slice(11))}<br>Hora de Chile · Un ingreso · Confirmación en portería</p></div><div class="mc-actions">${mcBoton('Compartir pase','mcCompartirPase')}${mcBoton('Descargar imagen','mcDescargarPase')}</div><p class="mc-note">Guarda o comparte esta imagen antes de cerrar. Para volver a emitir el pase, genera uno nuevo desde Mis invitaciones.</p>`);
  mcPaseActual={...p,codigo,qr};
}
function mcImagenPase(){
  if(!mcPaseActual)throw Error('Vuelve a generar tu pase.');
  const p=mcPaseActual,canvas=document.createElement('canvas');canvas.width=800;canvas.height=1000;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,800,1000);ctx.fillStyle='#142e37';ctx.textAlign='center';
  ctx.font='bold 34px sans-serif';ctx.fillText('PASE DE VISITA',400,65);
  ctx.font='26px sans-serif';ctx.fillText(String(community.name||'Mi Comunidad').slice(0,45),400,110,740);ctx.fillText(p.nombre,400,160,740);ctx.fillText('Departamento '+p.depto,400,200,740);
  const size=p.qr.getModuleCount(),scale=Math.floor(530/size),width=size*scale;
  ctx.save();ctx.translate(Math.floor((800-width)/2),260);p.qr.renderTo2dContext(ctx,scale);ctx.restore();
  ctx.fillStyle='#142e37';ctx.font='24px sans-serif';ctx.fillText(p.inicio.slice(0,10)+' · '+p.inicio.slice(11)+' a '+p.fin.slice(11),400,845);ctx.fillText('Hora de Chile · Un solo ingreso',400,890);ctx.fillText('Presentar en portería para autorizar el ingreso',400,940,740);
  return canvas;
}
function mcDescargarPase(){const canvas=mcImagenPase(),a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download='pase-visita.png';a.click();}
async function mcCompartirPase(){
  try{
    const epoch=mcPaseEpoch,canvas=mcImagenPase();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(epoch!==mcPaseEpoch)return;
    if(!blob)throw Error('No se pudo preparar la imagen. Descarga el pase.');
    const file=new File([blob],'pase-visita.png',{type:'image/png'});
    if(navigator.canShare?.({files:[file]})&&navigator.share)await navigator.share({files:[file],title:'Pase de visita',text:'Presenta este pase en portería dentro del horario indicado.'});
    else{mcDescargarPase();showToast('Imagen descargada. Puedes enviarla a tu visita.');}
  }catch(err){if(err.name!=='AbortError')showToast(err.message||'Descarga la imagen para compartirla.');}
}
quitarVisitaProgramada=function(id){
  mcAbrirPanel('Cancelar invitación',`<p class="mc-note">El pase dejará de ser válido inmediatamente. Se conservará el registro de cancelación.</p>${mcBoton('Confirmar cancelación','mcRevocarPase',id)}`);
};
async function mcRevocarPase(id){await functions.httpsCallable('gestionarVisitaMiComunidad')({comunidadId:community.id,accion:'revocarPase',id});showToast('Invitación cancelada.');mcInvitaciones();}
// Al anunciar una visita, ofrecer el QR una vez confirmado el guardado.
const mcSaveAccesos=saveModal;
saveModal=async function(){
  if(modalMode!=='visitaProgramada')return mcSaveAccesos();
  const nombre=document.getElementById('mVisitaProgNombre').value.trim(),rut=document.getElementById('mVisitaProgRut').value.trim(),fecha=document.getElementById('mVisitaProgFecha').value,hora=document.getElementById('mVisitaProgHora').value,motivo=document.getElementById('mVisitaProgMotivo').value.trim();
  if(!nombre||!fecha||fecha<mcHoy()){showToast('Completa nombre y una fecha desde hoy.');return;}
  if(rut&&!validarRut(rut)){showToast('El RUT ingresado no es válido.');return;}
  const btn=document.getElementById('modalSaveBtn');if(btn.disabled)return;btn.disabled=true;
  const epoch=mcPaseEpoch,depto=profile.depto;
  try{
    const ref=await refComunidadActual().collection('visitasProgramadas').add({nombre,rut,fecha,hora,motivo,depto,estado:'Pendiente',ts:Date.now()});
    if(epoch!==mcPaseEpoch)return;
    // No depender de que el listener haya recibido ya el documento.
    if(!visitasProgramadas.some(v=>v.id===ref.id))visitasProgramadas.push({id:ref.id,nombre,rut,fecha,hora,motivo,depto,estado:'Pendiente'});
    mcModalPase(ref.id);showToast('Visita anunciada. Ahora puedes crear su pase QR.');
  }catch(err){showToast(err.message||'No se pudo anunciar la visita.');}
  finally{btn.disabled=false;}
};

function mcAbrirEscanerVisitas(){
  if(!mcStaff())return;
  mcAbrirPanel('Autorizar visita en portería',`<p class="mc-note">Escanea el pase de la visita. Antes del ingreso revisa el nombre y comprueba quién lo presenta.</p><video id="mcVisitaVideo" playsinline muted style="width:100%;max-height:280px;background:#101820;border-radius:16px"></video><p id="mcVisitaScanEstado" class="mc-meta" aria-live="polite">Puedes usar la cámara o pegar el código completo leído del QR.</p>${mcBoton('Activar cámara','mcCamaraVisitas')}<div class="form-group"><label for="mcVisitaCodigo">Código completo del pase</label><textarea id="mcVisitaCodigo" class="form-control" maxlength="300" rows="2" placeholder="MCVI1:..."></textarea></div>${mcBoton('Revisar autorización','mcLeerPaseManual')}`);
}
async function mcCamaraVisitas(){
  detenerEscaneoQR();const epoch=mcPaseEpoch,video=document.getElementById('mcVisitaVideo'),estado=document.getElementById('mcVisitaScanEstado');if(!video)return;
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw Error('Este navegador no dispone de cámara. Usa el código completo.');
    await cargarJsQR();if(epoch!==mcPaseEpoch)return;
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
    if(epoch!==mcPaseEpoch){stream.getTracks().forEach(t=>t.stop());return;}
    qrScanStream=stream;video.srcObject=stream;await video.play();
    if(epoch!==mcPaseEpoch)return;
    estado.textContent='Apunta al pase QR de la visita.';
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
    const frame=()=>{
      if(epoch!==mcPaseEpoch||!qrScanStream)return;
      if(video.readyState>=2){
        const factor=Math.min(1,800/video.videoWidth);canvas.width=Math.round(video.videoWidth*factor);canvas.height=Math.round(video.videoHeight*factor);ctx.drawImage(video,0,0,canvas.width,canvas.height);
        const data=ctx.getImageData(0,0,canvas.width,canvas.height),qr=jsQR(data.data,data.width,data.height);
        if(qr&&/^MCVI1:/.test(qr.data)){detenerEscaneoQR();document.getElementById('mcVisitaCodigo').value=qr.data;mcRevisarPase(qr.data);return;}
      }
      qrScanRafId=requestAnimationFrame(frame);
    };qrScanRafId=requestAnimationFrame(frame);
  }catch(err){if(epoch===mcPaseEpoch){detenerEscaneoQR();estado.textContent=err.message||'No se pudo abrir la cámara. Usa el código completo.';}}
}
function mcLeerPaseManual(){return mcRevisarPase(document.getElementById('mcVisitaCodigo')?.value.trim()||'');}
async function mcRevisarPase(codigo){
  if(!mcStaff())return;
  const match=/^MCVI1:([A-Za-z0-9_-]{1,200}):([a-f0-9]{64})$/.exec(codigo);
  if(!match){showToast('Este código no es un pase de visita válido.');return;}
  detenerEscaneoQR();const epoch=mcPaseEpoch;
  try{
    const {data:p}=await functions.httpsCallable('gestionarVisitaMiComunidad')({comunidadId:community.id,accion:'revisarPase',id:match[1],token:match[2]});
    if(epoch!==mcPaseEpoch)return;
    mcAbrirPanel('Confirmar ingreso de visita',`<span class="mc-tag">Pase vigente · Pendiente de ingreso</span><div class="mc-message"><h3>${mcEscape(p.nombre)}</h3><p>Departamento ${mcEscape(p.depto)}</p><p>${mcEscape(p.inicio.slice(0,10))} · ${mcEscape(p.inicio.slice(11))} a ${mcEscape(p.fin.slice(11))} · Hora de Chile</p></div><p class="mc-note">Comprueba que el nombre corresponda a quien se presenta. Al confirmar se volverán a validar el horario, las restricciones y que el pase no haya sido utilizado o cancelado.</p><label class="mc-recordar"><input id="mcVisitaIdentidad" type="checkbox"> Comprobé la identidad de la persona que se presenta</label>${mcBoton('Autorizar y registrar ingreso','mcIngresarConPase',p.id,match[2])}`);
  }catch(err){showToast(err.message||'No se pudo comprobar el pase. Revisa la conexión.');}
}
async function mcIngresarConPase(id,token){
  if(!document.getElementById('mcVisitaIdentidad')?.checked){showToast('Comprueba la identidad antes de confirmar el ingreso.');return;}
  await registrarVisitaReal({programadaId:id,token,identidadConfirmada:true});
}
const mcVisitasAccesos=mcVistaVisitas;
mcVistaVisitas=function(){return `<section class="mc-panel"><h3>Acceso con invitación</h3><p class="mc-meta">Revisa el pase y confirma el ingreso de la persona invitada.</p>${mcBoton('Escanear pase de visita','mcAbrirEscanerVisitas')}</section>`+mcVisitasAccesos();};
const mcPanelAccesos=mcPanelOperativo;
mcPanelOperativo=function(){return `<section class="mc-panel"><div class="mc-actions" style="justify-content:space-between"><div><h3>Visitas con pase QR</h3><p class="mc-meta">Validación y autorización en portería.</p></div>${mcBoton('Escanear pase','mcAbrirEscanerVisitas')}</div></section>`+mcPanelAccesos();};
const mcIngresoProgramado=marcarIngresoVisitaProgramada;
marcarIngresoVisitaProgramada=function(id){if(visitasProgramadas.find(v=>v.id===id)?.qrHash){mcAbrirEscanerVisitas();return;}return mcIngresoProgramado(id);};

const mcTitulosOperacion={visitasDentro:'Visitas dentro del edificio',visitasEsperadas:'Visitas esperadas hoy',solicitudes:'Solicitudes abiertas',encomiendas:'Encomiendas por entregar',mantenciones:'Mantenciones vencidas o en los próximos 7 días'};
function mcResumenAutoHtml(snapshot){
  if(!snapshot)return '<p class="mc-note">Este turno no cuenta con un resumen automático de operación.</p>';
  return `<h3 style="margin-top:20px">Resumen automático al entregar</h3><p class="mc-meta">Registrado ${mcFecha(snapshot.generadoEn)}. Conserva la situación de ese momento; consulta los módulos para conocer el estado actual.</p>${Object.entries(mcTitulosOperacion).map(([key,title])=>{const g=snapshot[key]||{items:[]};return `<details class="mc-panel" ${g.items.length?'open':''}><summary><strong>${title} (${g.items.length}${g.limitado?'+':''})</strong></summary>${g.items.map(i=>mcFila(i.titulo,i.detalle)).join('')||mcVacio('Sin registros en esta selección.')}${g.limitado?'<p class="mc-note">Selección parcial por volumen. Revisa el módulo para consultar todos los registros.</p>':''}</details>`;}).join('')}`;
}
// Ampliar las vistas existentes sin modificar las actas anteriores.
const mcTurnoModalAccesos=mcModalTurno;
mcModalTurno=function(accion){
  if(accion==='recibir'&&mc.turno?.autorUid===currentUid)return mcTurnoModalAccesos(accion);
  mcTurnoModalAccesos(accion);
  if(accion==='recibir')document.getElementById('mcTurnoNota')?.closest('.form-group').insertAdjacentHTML('beforebegin',mcResumenAutoHtml(mc.turno?.operacionSnapshot));
  if(accion==='entregar')document.getElementById('mcTurnoNota')?.closest('.form-group').insertAdjacentHTML('beforebegin','<p class="mc-note">Al confirmar se añadirá automáticamente la situación de visitas, encomiendas, solicitudes y mantenciones. El resumen escrito permite destacar coordinaciones o riesgos.</p>');
};
const mcActaAccesos=mcDetalleTurno;
mcDetalleTurno=function(id){mcActaAccesos(id);const t=mc.turnos.find(x=>x.id===id);if(t)document.getElementById('modalBody').insertAdjacentHTML('beforeend',mcResumenAutoHtml(t.operacionSnapshot));};
