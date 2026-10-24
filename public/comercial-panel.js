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
      '</td><td>$' + Number(p.amount || 0).toLocaleString("es-CL") + '</td></tr>').join("");
    panel.innerHTML = '<h2>Comunidades (' + communities.length +
      ')</h2><div style="overflow-x:auto"><table><thead><tr><th>Comunidad</th><th>Licencia</th><th>Fin prueba</th><th>Vence</th><th>Estado</th><th>Pagos</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6">Sin comunidades</td></tr>') +
      '</tbody></table></div><h2 style="margin-top:24px">Pagos por revisar (' +
      reviews.length + ')</h2><div style="overflow-x:auto"><table><thead><tr><th>Comunidad</th><th>Orden</th><th>Estado</th><th>Monto</th></tr></thead><tbody>' +
      (payments || '<tr><td colspan="4">Sin pagos por revisar</td></tr>') +
      '</tbody></table></div><div id="detalle-historial" style="margin-top:20px"></div>' +
      (data.limitado ? '<p>Vista parcial: límite de consulta alcanzado.</p>' : '');
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
            '</td><td>' + esc(p.estado) + '</td><td>$' +
            Number(p.monto || 0).toLocaleString("es-CL") + '</td><td>' +
            esc(fecha(p.creado)) + '</td><td>' + esc(fecha(p.pagado)) + '</td></tr>').join("");
          target.innerHTML = '<h2>Historial: ' + esc(button.dataset.id) +
            '</h2><div style="overflow-x:auto"><table><thead><tr><th>Orden</th><th>Estado</th><th>Monto</th><th>Creada</th><th>Pagada</th></tr></thead><tbody>' +
            (items || '<tr><td colspan="5">Sin pagos</td></tr>') + '</tbody></table></div>';
        } catch (err) { console.error(err); target.textContent = "Error al consultar historial."; }
        finally { button.disabled = false; }
      });
    });
  } catch (err) {
    console.error(err);
    panel.textContent = "No fue posible consultar los datos comerciales.";
  }
}
