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
      '<p class="mc-suscripcion-nota">La contratación en línea estará disponible próximamente. Puedes renovar tu suscripción con Mercado Pago.</p>' +
      '<button type="button" id="mc-pagar-licencia" class="btn btn-primary" style="margin-top:16px">Pagar suscripción anual</button>' +
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
      boton.addEventListener("click", async function () {
        boton.disabled = true;
        const estado = contenedor.querySelector("#mc-estado-pago");
        estado.textContent = "Preparando pago seguro…";
        try {
          const pago = await functions.httpsCallable("crearCheckoutMiComunidad")({});
          const url = pago.data && pago.data.checkoutUrl;
          const parsed = new URL(url);
          if (parsed.protocol !== "https:" || !/(^|\\.)mercadopago\\.(cl|com)$/.test(parsed.hostname) &&
              !/(^|\\.)mercadopago\\.com\\.(cl|ar|br|mx)$/.test(parsed.hostname)) {
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
