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
    const sinLicencia = !d.estado || d.estado === "sin_licencia" || d.estado === "sin_estado";
    const suspendida = d.estado === "suspended";
    const prueba = d.estado === "trial";
    const fecha = prueba ? d.trialEndsAt : d.paidUntil;
    const dias = diasRestantes(fecha, ahora);
    const titulo = sinLicencia ? "Suscripción pendiente de habilitación" : suspendida ? "Suscripción suspendida" : prueba ? "Prueba gratuita" : d.acceso ? "Suscripción vigente" : "Suscripción no vigente";
    const descripcion = sinLicencia ? "Esta comunidad necesita habilitación comercial antes de contratar. Contacta a Nodar." : suspendida ? "Contacta a Nodar para revisar el estado de la comunidad." : prueba ?
      "Tu comunidad dispone de 7 días de prueba gratuita." :
      d.acceso ? "Tu comunidad tiene una licencia activa." :
      "La operación está restringida hasta regularizar la suscripción.";
    return '<section class="mc-suscripcion" aria-label="Estado de suscripción">' +
      '<h2>' + titulo + '</h2>' +
      '<p>' + descripcion + '</p>' +
      (fecha ? '<p><strong>' + dias + '</strong> días restantes</p><p>Vencimiento: ' + textoSeguro(formatoFecha(fecha)) + '</p>' : '') +
      '<p style="margin-top:18px"><strong>$800.000 CLP por comunidad · 12 meses</strong></p>' +
      '<p class="mc-suscripcion-nota">Pago seguro con Mercado Pago. La vigencia se actualiza cuando el servidor confirma el pago aprobado.</p>' +
      (sinLicencia || suspendida ? '' : '<button type="button" id="mc-pagar-licencia" class="primary-btn" style="margin-top:16px">Pagar 12 meses · $800.000</button>') +
      '<button type="button" id="mc-actualizar-licencia" class="outline-btn" style="margin-top:12px">Actualizar estado</button>' +
      '<p id="mc-estado-pago" role="status" aria-live="polite"></p>' +
      '</section>';
  }

  async function mostrar(contenedor, functions, comunidadId) {
    if (!contenedor || !functions || !comunidadId) throw new Error("Faltan datos de la comunidad");
    contenedor.textContent = "Consultando suscripción…";
    try {
      const resultado = await functions.httpsCallable("consultarLicenciaMiComunidad")({comunidadId: comunidadId});
      contenedor.innerHTML = htmlLicencia(resultado.data);
      const boton = contenedor.querySelector("#mc-pagar-licencia");
      contenedor.querySelector("#mc-actualizar-licencia").addEventListener("click", function () {
        mostrar(contenedor, functions, comunidadId).catch(console.error);
      });
      if (!boton) return;
      boton.addEventListener("click", async function () {
        boton.disabled = true;
        const estado = contenedor.querySelector("#mc-estado-pago");
        estado.textContent = "Preparando pago seguro…";
        try {
          const pago = await functions.httpsCallable("crearCheckoutMiComunidad")({});
          const url = pago.data && pago.data.checkoutUrl;
          const parsed = new URL(url);
          if (parsed.protocol !== "https:" || !/(^|\.)mercadopago\.(cl|com)$/.test(parsed.hostname) &&
              !/(^|\.)mercadopago\.com\.(cl|ar|br|mx)$/.test(parsed.hostname)) {
            throw new Error("Destino de pago inválido");
          }
          window.location.assign(parsed.href);
        } catch (err) {
          estado.textContent = "No se pudo iniciar el pago. Intenta nuevamente.";
          boton.disabled = false;
          console.error(err);
        }
      });
    } catch (error) {
      contenedor.textContent = "No fue posible consultar la suscripción. Intenta nuevamente.";
      throw error;
    }
  }

  window.MiComunidadSuscripcion = {mostrar, htmlLicencia, diasRestantes};
}());

