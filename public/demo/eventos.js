'use strict';
// Acciones de la demo: argumentos como datos, destinos explícitos y backend simulado.
function mcEvento(tipo, nombre, ...args){
  if(!['click', 'input', 'change', 'keydown'].includes(tipo)) throw Error('Evento inválido.');
  return `data-mc-${tipo}="${esc(JSON.stringify([nombre, ...args]))}"`;
}

const mcAccionesPermitidas = Object.freeze({
  abrirBuscarEncomienda: (el, event, ...args) => abrirBuscarEncomienda(...args),
  abrirBuscarFicha: (el, event, ...args) => abrirBuscarFicha(...args),
  abrirCodigoEncomienda: (el, event, ...args) => abrirCodigoEncomienda(...args),
  abrirDetalleComunidad: (el, event, ...args) => abrirDetalleComunidad(...args),
  abrirEscanerRetiro: (el, event, ...args) => abrirEscanerRetiro(...args),
  abrirFichaDepto: (el, event, ...args) => abrirFichaDepto(...args),
  abrirInformarPago: (el, event, ...args) => abrirInformarPago(...args),
  abrirInvitadosReserva: (el, event, ...args) => abrirInvitadosReserva(...args),
  abrirModalAplicarMulta: (el, event, ...args) => abrirModalAplicarMulta(...args),
  abrirModalBloque: (el, event, ...args) => abrirModalBloque(...args),
  abrirModalFamiliar: (el, event, ...args) => abrirModalFamiliar(...args),
  abrirModalInvitado: (el, event, ...args) => abrirModalInvitado(...args),
  abrirModalPreguntaSecreta: (el, event, ...args) => abrirModalPreguntaSecreta(...args),
  abrirModalRestringido: (el, event, ...args) => abrirModalRestringido(...args),
  abrirModalTipoMulta: (el, event, ...args) => abrirModalTipoMulta(...args),
  abrirModalVehiculoRegistrado: (el, event, ...args) => abrirModalVehiculoRegistrado(...args),
  abrirModalVisitaProgramada: (el, event, ...args) => abrirModalVisitaProgramada(...args),
  abrirNotificaciones: (el, event, ...args) => abrirNotificaciones(...args),
  abrirVehiculoBuscado: (el, event, ...args) => abrirVehiculoBuscado(...args),
  actualizarBloquesReservaModal: (el, event, ...args) => actualizarBloquesReservaModal(...args),
  actualizarCampoRetiroOtro: (el, event, ...args) => actualizarCampoRetiroOtro(...args),
  actualizarDisponibilidadPanel: (el, event, ...args) => actualizarDisponibilidadPanel(...args),
  actualizarMontoSugeridoMulta: (el, event, ...args) => actualizarMontoSugeridoMulta(...args),
  avanzarEstadoIncidencia: (el, event, ...args) => avanzarEstadoIncidencia(...args),
  buscarEncomiendaPorCodigo: (el, event, ...args) => buscarEncomiendaPorCodigo(...args),
  chequearRestriccionAcceso: (el, event, ...args) => chequearRestriccionAcceso(...args),
  chequearRestriccionVisita: (el, event, ...args) => chequearRestriccionVisita(...args),
  closeModal: (el, event, ...args) => closeModal(...args),
  confirmarEntregaEncomienda: (el, event, ...args) => confirmarEntregaEncomienda(...args),
  confirmarRetiroDesdeItem: (el, event, ...args) => confirmarRetiroDesdeItem(...args),
  demoEntrar: (el, event, ...args) => demoEntrar(...args),
  descargarDocumento: (el, event, ...args) => descargarDocumento(...args),
  eliminarBloque: (el, event, ...args) => eliminarBloque(...args),
  eliminarTipoMulta: (el, event, ...args) => eliminarTipoMulta(...args),
  encomiendaParaDepto: (el, event, ...args) => encomiendaParaDepto(...args),
  exportarTabAdmin: (el, event, ...args) => exportarTabAdmin(...args),
  fichaTab: (el, event, ...args) => fichaTab(...args),
  generarNominaDelMes: (el, event, ...args) => generarNominaDelMes(...args),
  guardarDatosPropiedad: (el, event, ...args) => guardarDatosPropiedad(...args),
  guardarNotasSoporteComunidad: (el, event, ...args) => guardarNotasSoporteComunidad(...args),
  guardarPlanComunidad: (el, event, ...args) => guardarPlanComunidad(...args),
  irAtencion: (el, event, ...args) => irAtencion(...args),
  logout: (el, event, ...args) => logout(...args),
  marcarGastoPagado: (el, event, ...args) => marcarGastoPagado(...args),
  marcarIngresoVisitaProgramada: (el, event, ...args) => marcarIngresoVisitaProgramada(...args),
  marcarMantencionRealizada: (el, event, ...args) => marcarMantencionRealizada(...args),
  marcarMultaPagada: (el, event, ...args) => marcarMultaPagada(...args),
  mcCampo_onBuscarConserje: (el) => onBuscarConserje(el.value),
  mcDemoReiniciar: () => { if(confirm('¿Volver a los datos de ejemplo originales?')) demoReiniciarDatos(); },
  mcInvitar: () => abrirModalVisitaProgramada(profile.depto),
  mcNormalizarIdComunidad: (el) => { el.value = el.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'); },
  mcSeleccionarBloque: (el, event, id) => { reservaBloqueSeleccionado = id; },
  mcValidarRutAcceso: (el) => { validarRutEnVivo(el); chequearRestriccionAcceso(); },
  mcValidarRutCampo: (el) => validarRutEnVivo(el),
  mcValidarRutVisita: (el) => { validarRutEnVivo(el); chequearRestriccionVisita(); },
  mostrarFichaSinVerificar: (el, event, ...args) => mostrarFichaSinVerificar(...args),
  navigate: (el, event, ...args) => navigate(...args),
  openAccesoModal: (el, event, ...args) => openAccesoModal(...args),
  openAvisoModal: (el, event, ...args) => openAvisoModal(...args),
  openConserjeModal: (el, event, ...args) => openConserjeModal(...args),
  openContactoModal: (el, event, ...args) => openContactoModal(...args),
  openEncomiendaModal: (el, event, ...args) => openEncomiendaModal(...args),
  openGenerarCobroModal: (el, event, ...args) => openGenerarCobroModal(...args),
  openIncidenciaStaffModal: (el, event, ...args) => openIncidenciaStaffModal(...args),
  openMantencionModal: (el, event, ...args) => openMantencionModal(...args),
  openModal: (el, event, ...args) => openModal(...args),
  openMovimientoContableModal: (el, event, ...args) => openMovimientoContableModal(...args),
  openNovedadModal: (el, event, ...args) => openNovedadModal(...args),
  openProveedorModal: (el, event, ...args) => openProveedorModal(...args),
  openRequestModal: (el, event, ...args) => openRequestModal(...args),
  openReservaModal: (el, event, ...args) => openReservaModal(...args),
  openResidenteModal: (el, event, ...args) => openResidenteModal(...args),
  openVehiculoModal: (el, event, ...args) => openVehiculoModal(...args),
  openVisitaModal: (el, event, ...args) => openVisitaModal(...args),
  pagarRemuneracion: (el, event, ...args) => pagarRemuneracion(...args),
  quitarDocumento: (el, event, ...args) => quitarDocumento(...args),
  quitarFamiliar: (el, event, ...args) => quitarFamiliar(...args),
  quitarInvitadoReserva: (el, event, ...args) => quitarInvitadoReserva(...args),
  quitarRestringido: (el, event, ...args) => quitarRestringido(...args),
  quitarVehiculoRegistrado: (el, event, ...args) => quitarVehiculoRegistrado(...args),
  quitarVisitaProgramada: (el, event, ...args) => quitarVisitaProgramada(...args),
  rechazarPagoInformado: (el, event, ...args) => rechazarPagoInformado(...args),
  renderBuscarEncomienda: (el, event, ...args) => renderBuscarEncomienda(...args),
  renderBuscarFicha: (el, event, ...args) => renderBuscarFicha(...args),
  renderDirectorioContacto: (el, event, ...args) => renderDirectorioContacto(...args),
  restablecerClave: (el, event, ...args) => restablecerClave(...args),
  saveModal: (el, event, ...args) => saveModal(...args),
  saveProfile: (el, event, ...args) => saveProfile(...args),
  setAdminTab: (el, event, ...args) => setAdminTab(...args),
  setAvisoFiltro: (el, event, ...args) => setAvisoFiltro(...args),
  toggleActivoBloque: (el, event, ...args) => toggleActivoBloque(...args),
  toggleActivoTipoMulta: (el, event, ...args) => toggleActivoTipoMulta(...args),
  toggleEstadoComunidad: (el, event, ...args) => toggleEstadoComunidad(...args),
  toggleTemaOscuro: (el, event, ...args) => toggleTemaOscuro(...args),
  verDetalleResidente: (el, event, ...args) => verDetalleResidente(...args),
  verFichaDesdeBusqueda: (el, event, ...args) => verFichaDesdeBusqueda(...args),
  verificarIdentidadFicha: (el, event, ...args) => verificarIdentidadFicha(...args),
});
const mcEventosEnCurso = new WeakSet();
async function mcDespacharEvento(event, tipo){
  const selector = tipo === 'click' ? '[data-mc-click], [data-mc-action]' : `[data-mc-${tipo}]`;
  const b = event.target?.closest?.(selector);
  if(!b || b.disabled || mcEventosEnCurso.has(b)) return;
  let action;
  try {
    const raw = b.dataset['mc' + tipo[0].toUpperCase() + tipo.slice(1)] ?? (tipo === 'click' ? b.dataset.mcAction : undefined);
    if(typeof raw !== 'string' || raw.length > 4096) throw Error('Acción inválida.');
    action = JSON.parse(raw);
    if(!Array.isArray(action) || typeof action[0] !== 'string' ||
       !Object.hasOwn(mcAccionesPermitidas, action[0]) || action.length > 11 ||
       action.slice(1).some(v => v !== null && !['string', 'number', 'boolean'].includes(typeof v))) {
      throw Error('Acción inválida.');
    }
  } catch (_) { showToast('Esta acción no está disponible.'); return; }
  const [fn, ...args] = action;
  // No deshabilitar inputs durante input/change: preserva foco y selección de archivos.
  const bloquear = tipo === 'click';
  if(bloquear){ mcEventosEnCurso.add(b); b.disabled = true; }
  try { await mcAccionesPermitidas[fn](b, event, ...args); }
  catch(e){ console.error(e); showToast(e.message || 'No se pudo completar la acción. Revisa tu conexión.'); }
  finally { if(bloquear){ mcEventosEnCurso.delete(b); b.disabled = false; } }
}
for(const tipo of ['click', 'input', 'change', 'keydown']){
  document.addEventListener(tipo, event => mcDespacharEvento(event, tipo));
}
