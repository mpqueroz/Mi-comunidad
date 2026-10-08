// Mi perfil y la familia: datos personales, vista simple, notificaciones,
// miembros y roles, invitaciones (código + link + QR) y cuenta.

import {esc, openForm, confirmar, toast, sheet, loadScript} from "../util.js";
import {S, A, rerender, members, member, me, nameOf, avatar, isAdmin, isAdult, updMe, ROLES, upd} from "../state.js";

let installEvt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvt = e;
});

const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;

export function render() {
  const m = me();
  const push = S.store.pushStatus?.() || "no-soportado";
  const pushTxt = {
    granted: "✅ Activadas en este teléfono",
    denied: "🚫 Bloqueadas. Actívalas en los ajustes del navegador para este sitio.",
    default: "",
    "sin-config": "Falta configurar Cloud Messaging (vapidKey). Ver LEEME.",
    "no-soportado": "Este navegador no soporta notificaciones. En iPhone, primero instala la app en la pantalla de inicio.",
    demo: "En la demo los avisos se ven dentro de la app.",
  }[push];
  const ios = /iphone|ipad/i.test(navigator.userAgent);
  return `<div class="card profile">
      <div class="row">${avatar(S.user.uid, "xl")}<div class="grow"><h2>${esc(m.name)}</h2>
        <div class="small muted">${esc(ROLES[m.role] || "")}${S.user.email && !S.demo ? " · " + esc(S.user.email) : ""}</div></div>
        <button class="btn sm" data-act="editarPerfil">Editar</button></div>
    </div>

    <div class="card">
      <label class="switch-row"><span class="grow"><b>👓 Vista simple</b><br><span class="small muted">Letra grande y solo lo esencial. Ideal para abuelos.</span></span>
        <input type="checkbox" class="switch" data-act="toggleSimple" ${m.simple ? "checked" : ""}></label>
    </div>

    <div class="card">
      <h3>🔔 Notificaciones</h3>
      ${push === "default" ? `<button class="btn primary block" data-act="activarPush">Activar notificaciones</button>
        <p class="small muted">Para enterarte de avisos, pedidos, SOS y llegadas aunque la app esté cerrada.</p>` : `<p class="small">${pushTxt}</p>`}
    </div>

    ${!standalone() ? `<div class="card"><h3>📲 Instalar en el teléfono</h3>
      ${installEvt ? `<button class="btn block" data-act="instalar">Instalar Mi Familia</button>`
        : ios ? `<p class="small">En Safari toca <b>Compartir</b> <span class="kbd">⬆️</span> y luego <b>“Agregar a inicio”</b>.</p>`
          : `<p class="small">En el menú del navegador elige <b>“Instalar app”</b> o <b>“Agregar a la pantalla de inicio”</b>.</p>`}</div>` : ""}

    <div class="card">
      <div class="row"><h3 class="grow">👨‍👩‍👧‍👦 ${esc(S.family?.name || "")}</h3>${isAdmin() ? `<button class="icon-btn" data-act="renombrarFamilia" aria-label="Renombrar">✏️</button>` : ""}</div>
      ${members().map((x) => `<div class="li">${avatar(x.id, "lg")}<div class="grow"><b>${esc(x.name)}</b>${x.id === S.user.uid ? " (tú)" : ""}
        <div class="small muted">${esc(ROLES[x.role] || x.role)}${x.phone ? ` · <a href="tel:${esc(x.phone.replace(/\s/g, ""))}">${esc(x.phone)}</a>` : ""}</div></div>
        ${isAdmin() && x.id !== S.user.uid ? `<button class="icon-btn" data-act="gestionarMiembro" data-id="${x.id}" aria-label="Gestionar">⋯</button>` : ""}</div>`).join("")}
      ${isAdult() ? `<button class="btn primary block" data-act="invitar">➕ Invitar a alguien</button>` : ""}
    </div>

    <div class="card">
      <h3>Cuenta</h3>
      ${S.demo ? `<button class="btn block" data-act="demoSwitch">🔁 Cambiar de persona (demo)</button>
        <button class="btn block" data-act="resetDemo">♻️ Reiniciar datos de la demo</button>` : ""}
      <button class="btn block" data-act="switchFamily">🏡 Cambiar / crear otra familia</button>
      <button class="btn ghost block" data-act="salirFamilia">🚪 Salir de esta familia</button>
      <button class="btn ghost block" data-act="logout">Cerrar sesión</button>
    </div>
    <p class="small muted center">Mi Familia · tus datos solo los ve tu familia</p>`;
}

const COLORS = ["#e8590c", "#1971c2", "#c2255c", "#5f3dc4", "#2b8a3e", "#0c8599", "#e67700", "#862e9c", "#495057"];

A.editarPerfil = async () => {
  const m = me();
  const d = await openForm({
    title: "Mi perfil",
    fields: [
      {name: "name", label: "Nombre", required: true, value: m.name},
      {name: "emoji", label: "Ícono", value: m.emoji, max: 4, suggest: ["👩", "👨", "👧", "👦", "👵", "👴", "🧑", "👶", "🦸", "🐱"]},
      {name: "color", label: "Color", type: "select", value: m.color,
        options: COLORS.map((c, i) => ({value: c, label: ["Naranjo", "Azul", "Frambuesa", "Morado", "Verde", "Turquesa", "Ámbar", "Uva", "Gris"][i]}))},
      {name: "birthday", label: "Cumpleaños", type: "date", value: m.birthday},
      {name: "phone", label: "Teléfono", type: "tel", value: m.phone, placeholder: "+56 9 ..."},
    ],
  });
  if (d) await updMe(d);
};

A.toggleSimple = async (el) => {
  const simple = !me().simple;
  await updMe({simple});
  toast(simple ? "Vista simple activada 👓" : "Vista normal");
};

A.activarPush = async () => {
  const r = await S.store.enablePush();
  toast(r === "granted" ? "¡Listo! Te llegarán las notificaciones 🔔" : "No se pudieron activar las notificaciones", r === "granted" ? "" : "err");
  rerender();
};

A.instalar = async () => {
  if (!installEvt) return;
  installEvt.prompt();
  await installEvt.userChoice;
  installEvt = null;
  rerender();
};

A.invitar = async () => {
  const opts = [{value: "adulto", label: "Adulto (puede ver y gestionar cuentas, invitar)"}, {value: "nino", label: "Niño/a (sin cuentas ni ajustes)"}];
  if (isAdmin()) opts.push({value: "admin", label: "Administra (todo, incluido sacar miembros)"});
  const d = await openForm({title: "Invitar a la familia", fields: [{name: "role", label: "¿Como qué entra?", type: "select", value: "adulto", options: opts}], submit: "Crear invitación"});
  if (!d) return;
  const code = await S.store.createInvite(S.fid, d.role);
  const link = `${location.origin}${location.pathname}?codigo=${code}`;
  const {el} = sheet(`<div class="center"><h2>Invitación lista</h2>
    <p class="muted small">Válida por 7 días. Comparte el link o muestra el QR.</p>
    <div class="qr" id="qrBox"></div>
    <div class="code">${code}</div>
    <div class="row wrap center-row">
      <button class="btn primary" data-share>📤 Compartir</button>
      <a class="btn" href="https://wa.me/?text=${encodeURIComponent(`¡Únete a ${S.family?.name} en Mi Familia! ${link}`)}" target="_blank" rel="noopener">WhatsApp</a>
      <button class="btn" data-copy>Copiar link</button></div>
    ${S.demo ? `<p class="small muted">En la demo, el código funciona solo en este navegador.</p>` : ""}</div>`);
  el.querySelector("[data-share]").onclick = () =>
    navigator.share ? navigator.share({title: "Mi Familia", text: `Únete a ${S.family?.name} en Mi Familia`, url: link}).catch(() => {})
      : navigator.clipboard?.writeText(link).then(() => toast("Link copiado"));
  el.querySelector("[data-copy]").onclick = () => navigator.clipboard?.writeText(link).then(() => toast("Link copiado"));
  try {
    await loadScript("vendor/qrcode.js");
    const qr = window.qrcode(0, "M");
    qr.addData(link);
    qr.make();
    el.querySelector("#qrBox").innerHTML = qr.createSvgTag({cellSize: 5, margin: 2, scalable: true});
  } catch {
    el.querySelector("#qrBox").remove();
  }
};

A.gestionarMiembro = async (el) => {
  const m = member(el.dataset.id);
  const d = await openForm({
    title: m.name,
    fields: [
      {name: "role", label: "Rol", type: "select", value: m.role, options: Object.entries(ROLES).map(([v, l]) => ({value: v, label: l}))},
      {name: "simple", label: "Vista simple (letra grande)", type: "checkbox", value: !!m.simple},
      {name: "sacar", label: `Sacar a ${m.name} de la familia`, type: "checkbox"},
    ],
  });
  if (!d) return;
  if (d.sacar) {
    if (await confirmar(`¿Sacar a ${m.name} de la familia?`, {ok: "Sacar", danger: true})) await S.store.leaveFamily(S.fid, m.id);
    return;
  }
  await upd("members", m.id, {role: d.role, simple: d.simple});
};

A.renombrarFamilia = async () => {
  const d = await openForm({title: "Nombre de la familia", fields: [{name: "name", label: "Nombre", value: S.family?.name, required: true}]});
  if (d) await S.store.updateFamily(S.fid, {name: d.name});
};

A.salirFamilia = async () => {
  const admins = members().filter((x) => x.role === "admin");
  if (isAdmin() && admins.length === 1 && members().length > 1) {
    return toast("Eres la única persona que administra. Primero dale el rol “Administra” a otra persona.", "err");
  }
  if (!(await confirmar(`¿Salir de ${S.family?.name}? Dejarás de ver todo lo de esta familia.`, {ok: "Salir", danger: true}))) return;
  await S.store.leaveFamily(S.fid);
  S.families = S.families.filter((f) => f.id !== S.fid);
  S.openFamily(S.families[0]?.id || null);
};

A.resetDemo = async () => {
  if (await confirmar("¿Volver a los datos de ejemplo? Se borra lo que hayas hecho en la demo.")) {
    S.store.resetDemo();
    location.hash = "#/hoy";
  }
};
