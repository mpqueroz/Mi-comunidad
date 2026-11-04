"use strict";
async function renderPanelComercial() {
  const root = document.getElementById("content");
  if (currentRole !== "superadmin") { root.textContent = "Acceso restringido"; return; }
  root.innerHTML = '<div class="page-header"><h1>Licencias y pagos</h1></div><div class="card" id="panel-comercial" style="padding:20px">Cargando…</div>';
  const panel = document.getElementById("panel-comercial");
  try {
    const result = await functions.httpsCallable("resumenComercialMiComunidad")({});
    if (currentPage !== "comercial" || currentRole !== "superadmin") return;
    const data = result.data || {};
    const fecha = value => value && Number.isFinite(Date.parse(value)) ?
      new Date(value).toLocaleDateString("es-CL") : "—";
    const communities = data.comunidades || [];
    const reviews = data.revisiones || [];
    const rows = communities.map(c => '<tr><td>' + esc(c.nombre) + '</td><td>' +
      esc(c.licencia) + '</td><td>' + esc(fecha(c.trialEndsAt)) + '</td><td>' +
      esc(fecha(c.paidUntil)) + '</td><td>' + esc(c.estadoAdministrativo) +
      '</td><td><button class="outline-btn historial-comercial" data-id="' +
      esc(c.id) + '">Historial</button></td></tr>').join("");
    const payments = reviews.map(p => '<tr><td>' + esc(p.comunidadId) +
      '</td><td>' + esc(p.id) + '</td><td>' + esc(p.paymentStatus) +
      '</td><td>$' + Number(p.amount || 0).toLocaleString("es-CL") + '</td><td><button class="outline-btn revisar-pago" data-id="' + esc(p.id) + '" data-payment="' + esc(p.paymentId) + '" data-additional="' + (p.additional ? 'true' : 'false') + '" data-restart="' + (p.restart ? 'true' : 'false') + '">Revisar</button></td></tr>').join("");
    panel.innerHTML = '<h2>Comunidades (' + communities.length +
      ')</h2><div style="overflow-x:auto"><table><thead><tr><th>Comunidad</th><th>Licencia</th><th>Fin prueba</th><th>Vence</th><th>Estado</th><th>Pagos</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6">Sin comunidades</td></tr>') +
      '</tbody></table></div><h2 style="margin-top:24px">Pagos por revisar (' +
      reviews.length + ')</h2><div style="overflow-x:auto"><table><thead><tr><th>Comunidad</th><th>Orden</th><th>Estado</th><th>Monto</th><th>Acción</th></tr></thead><tbody>' +
      (payments || '<tr><td colspan="5">Sin pagos por revisar</td></tr>') +
      '</tbody></table></div><div id="detalle-historial" style="margin-top:20px"></div>' +
      (data.limitado ? '<p>Vista parcial: límite de consulta alcanzado.</p>' : '');
    panel.querySelectorAll(".revisar-pago").forEach(button => {
      button.addEventListener("click", () => {
        const target = panel.querySelector("#detalle-historial");
        const options = button.dataset.restart === "true" ? '<option value="reiniciar_compra_fallida">Reiniciar sólo si se demuestra que no se creó compra ni pago</option>' : button.dataset.additional === "true" ? '<option value="cerrar_pago_adicional_reembolsado">Cerrar segundo cobro íntegramente devuelto</option>' :
          '<option value="aplicar_pago_verificado">Aplicar pago aprobado retenido por suspensión ya regularizada</option><option value="confirmar_reverso_total">Confirmar reverso total del último pago</option><option value="cerrar_revision_historica">Cerrar reverso histórico sin cambiar licencia posterior</option>';
        target.innerHTML = '<h2>Revisión: ' + esc(button.dataset.id) + '</h2><p>El servidor verificará nuevamente el pago. Los reversos parciales y antecedentes insuficientes conservan su revisión pendiente.</p>' +
          '<form id="resolver-pago-form"><label for="resolver-pago-accion">Acción</label><select id="resolver-pago-accion" class="form-control" required>' + options + '</select>' +
          '<label for="resolver-pago-motivo">Justificación y referencia contable</label><textarea id="resolver-pago-motivo" class="form-control" minlength="20" maxlength="1000" required></textarea><button class="primary-btn" type="submit">Verificar y registrar resolución</button><p role="status" id="resolver-pago-estado"></p></form>';
        const form = target.querySelector("#resolver-pago-form");
        form.addEventListener("submit", async event => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const submit = form.querySelector("button");
          if (submit.disabled) return;
          submit.disabled = true;
          const status = form.querySelector("#resolver-pago-estado");
          status.textContent = "Verificando pago y vigencia…";
          try {
            await functions.httpsCallable(button.dataset.restart === "true" ? "reiniciarCheckoutFallidoMiComunidad" : "resolverRevisionPagoMiComunidad")({orderId:button.dataset.id,paymentId:button.dataset.payment,
              accion:form.querySelector("#resolver-pago-accion").value,motivo:form.querySelector("#resolver-pago-motivo").value});
            if (currentPage === "comercial" && currentRole === "superadmin") await renderPanelComercial();
          } catch (error) { status.textContent = error.message || "La revisión sigue pendiente."; submit.disabled = false; }
        });
      });
    });
    panel.querySelectorAll(".historial-comercial").forEach(button => {
      button.addEventListener("click", async () => {
        const target = panel.querySelector("#detalle-historial");
        button.disabled = true;
        target.textContent = "Cargando historial…";
        try {
          const response = await functions.httpsCallable("historialPagosMiComunidad")({
            comunidadId: button.dataset.id,
          });
          if (currentPage !== "comercial" || currentRole !== "superadmin") return;
          const history = response.data || {};
          const items = (history.pagos || []).map(p => '<tr><td>' + esc(p.id) +
            '</td><td>' + esc(p.estado) + (p.additionalPaymentReview ? ' · Cobro adicional pendiente de revisión' : '') + '</td><td>$' +
            Number(p.monto || 0).toLocaleString("es-CL") + '</td><td>' +
            esc(fecha(p.creado)) + '</td><td>' + esc(fecha(p.pagado)) + '</td><td>' + detalleDocumentoTributario(p) + '</td></tr>').join("");
          target.innerHTML = '<h2>Historial: ' + esc(button.dataset.id) +
            '</h2><div style="overflow-x:auto"><table><thead><tr><th>Orden</th><th>Estado</th><th>Monto</th><th>Creada</th><th>Pagada</th><th>Documento tributario</th></tr></thead><tbody>' +
            (items || '<tr><td colspan="6">Sin pagos</td></tr>') + '</tbody></table></div>';
        } catch (err) { console.error(err); target.textContent = "Error al consultar historial."; }
        finally { button.disabled = false; }
      });
    });
  } catch (err) {
    console.error(err);
    panel.textContent = "No fue posible consultar los datos comerciales.";
  }
}

// Los datos provienen de la orden protegida; todo texto se escapa antes de mostrarlo.
function detalleDocumentoTributario(pago) {
  const d = pago.documentoTributario;
  if (!d) return "Sin solicitud registrada";
  const estado = pago.estado === "paid" ? "Por emitir manualmente en SII" :
    pago.estado === "payment_review" ? "Revisión de pago y documento tributario" : "Pendiente de pago";
  const datos = [d.tipo === "factura" ? "Factura electrónica" : "Boleta electrónica", estado, d.correo];
  if (d.tipo === "factura") datos.push(d.rut, d.razonSocial, d.giro, d.direccion, d.comuna);
  return datos.map(v => esc(v || "")).join("<br>");
}
