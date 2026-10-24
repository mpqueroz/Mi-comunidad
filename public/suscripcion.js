/* Panel comercial Mi Comunidad: sin escrituras de licencia desde navegador. */
(function () {
  "use strict";
  const MS_DIA = 86400000;

  function textoSeguro(valor) {
    return String(valor == null ? "" : valor).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function formatoFecha(iso) {
    if (!iso) return "Sin fecha";
    const fecha = new Date(iso);
    return Number.isFinite(fecha.getTime()) ?
      new Intl.DateTimeFormat("es-CL", {day:"2-digit",month:"long",year:"numeric",timeZone:"America/Santiago"}).format(fecha) :
      "Fecha no disponible";
  }

  function diasRestantes(iso, ahora) {
    const vence = new Date(iso).getTime();
    if (!iso || !Number.isFinite(vence)) return 0;
    return Math.max(0, Math.ceil((vence - (ahora || Date.now())) / MS_DIA));
  }

  function htmlLicencia(datos, ahora) {
    const d = datos || {};
    const prueba = d.estado === "trial";
    const fecha = prueba ? d.trialEndsAt : d.paidUntil;
    const dias = diasRestantes(fecha, ahora);
    const titulo = prueba ? "Prueba gratuita" : d.acceso ? "Suscripción vigente" : "Suscripción no vigente";
    const descripcion = prueba ?
      "Tu comunidad dispone de 7 días de prueba gratuita." :
      d.acceso ? "Tu comunidad tiene una licencia activa." :
      "La operación está restringida hasta regularizar la suscripción.";
    return '<section class="mc-suscripcion" aria-label="Estado de suscripción">' +
      '<h2>' + titulo + '</h2>' +
      '<p>' + descripcion + '</p>' +
      '<p><strong>' + dias + '</strong> días restantes</p>' +
      '<p>Vencimiento: ' + textoSeguro(formatoFecha(fecha)) + '</p>' +
      '<p class="mc-suscripcion-nota">La contratación en línea estará disponible próximamente. Contacta a Nodar Logic para renovar.</p>' +
      '</section>';
  }

  async function mostrar(contenedor, functions, comunidadId) {
    if (!contenedor || !functions || !comunidadId) throw new Error("Faltan datos de la comunidad");
    contenedor.textContent = "Consultando suscripción…";
    try {
      const resultado = await functions.httpsCallable("consultarLicenciaMiComunidad")({comunidadId: comunidadId});
      contenedor.innerHTML = htmlLicencia(resultado.data);
    } catch (error) {
      contenedor.textContent = "No fue posible consultar la suscripción. Intenta nuevamente.";
      throw error;
    }
  }

  window.MiComunidadSuscripcion = {mostrar, htmlLicencia, diasRestantes};
}());
