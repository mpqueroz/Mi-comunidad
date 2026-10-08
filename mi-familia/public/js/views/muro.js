// Muro: avisos para todos (con "Yo me encargo"), pedidos que llegan y
// datos fijados (WiFi, teléfonos útiles...).

import {esc, ago, dayKey, fmtDay, linkify, openForm, confirmar, toast} from "../util.js";
import {S, A, rerender, list, nameOf, avatar, add, upd, del, canDelete, isAdult, subnav, empty, findById} from "../state.js";
import {rango} from "../logic.js";

const PRIO = {
  normal: {label: "Normal", cls: ""},
  importante: {label: "Importante", cls: "warn"},
  urgente: {label: "Urgente", cls: "bad"},
};
const REACCIONES = ["👍", "❤️", "😂", "🙏"];
let verResueltos = false;

export function render(sub = "avisos") {
  const nav = subnav("muro", sub, [["avisos", "📣 Avisos"], ["pedidos", "📦 Pedidos"], ["fijados", "📌 Fijados"]]);
  if (sub === "pedidos") return nav + pedidos();
  if (sub === "fijados") return nav + fijados();
  return nav + avisos();
}

// ---------- avisos ----------

function avisoCard(a) {
  const uid = S.user.uid;
  const p = PRIO[a.prioridad] || PRIO.normal;
  const reac = Object.entries(a.reacciones || {});
  const counts = REACCIONES.map((r) => [r, reac.filter(([, v]) => v === r)]).filter(([, l]) => l.length);
  let encargo = "";
  if (a.necesita && !a.done) {
    encargo = a.encargado
      ? `<div class="encargo ok">✋ <b>${esc(a.encargado === uid ? "Tú te encargas" : nameOf(a.encargado) + " se encarga")}</b>
          ${a.encargado === uid ? `<button class="link" data-act="avisoSoltar" data-id="${a.id}">ya no puedo</button>` : ""}</div>`
      : `<button class="btn primary block" data-act="avisoEncargo" data-id="${a.id}">✋ Yo me encargo</button>`;
  }
  return `<article class="card aviso ${p.cls} ${a.done ? "done" : ""}">
    <div class="row">${avatar(a.by)}<div class="grow"><b>${esc(nameOf(a.by))}</b> <span class="muted small">· ${ago(a.createdAt)}</span></div>
      ${a.prioridad !== "normal" ? `<span class="tag ${p.cls}">${p.label}</span>` : ""}
      ${canDelete(a) ? `<button class="icon-btn" data-act="avisoBorrar" data-id="${a.id}" aria-label="Borrar">🗑️</button>` : ""}</div>
    <div class="aviso-t">${linkify(a.texto)}</div>
    ${a.fecha ? `<div class="small">📅 ${esc(fmtDay(a.fecha))}</div>` : ""}
    ${a.done ? `<div class="small muted">✓ Resuelto por ${esc(nameOf(a.doneBy))} ${ago(a.doneAt)}</div>` : encargo}
    <div class="row wrap reac">
      ${REACCIONES.map((r) => {
        const n = counts.find(([x]) => x === r)?.[1].length || 0;
        const mine = a.reacciones?.[uid] === r;
        return `<button class="chip ${mine ? "on" : ""}" data-act="avisoReac" data-id="${a.id}" data-r="${r}" title="${esc(reac.filter(([, v]) => v === r).map(([u]) => nameOf(u)).join(", "))}">${r}${n ? " " + n : ""}</button>`;
      }).join("")}
      <span class="sp"></span>
      ${!a.done ? `<button class="chip" data-act="avisoListo" data-id="${a.id}">✓ Listo</button>` : `<button class="chip" data-act="avisoReabrir" data-id="${a.id}">Reabrir</button>`}
    </div></article>`;
}

function avisos() {
  const all = list("avisos");
  const pend = all.filter((a) => !a.done);
  const done = all.filter((a) => a.done);
  const order = {urgente: 0, importante: 1, normal: 2};
  pend.sort((a, b) => (order[a.prioridad] ?? 2) - (order[b.prioridad] ?? 2) || b.createdAt - a.createdAt);
  return `<button class="btn primary block" data-act="nuevoAviso">📣 Nuevo aviso para todos</button>
    ${pend.length ? pend.map(avisoCard).join("") : empty("📭", "No hay avisos pendientes.")}
    ${done.length ? `<button class="btn ghost block" data-act="toggleResueltos">${verResueltos ? "Ocultar" : "Ver"} resueltos (${done.length})</button>` : ""}
    ${verResueltos ? done.slice(0, 40).map(avisoCard).join("") : ""}`;
}

A.toggleResueltos = () => {
  verResueltos = !verResueltos;
  rerender();
};

A.nuevoAviso = async () => {
  const d = await openForm({
    title: "Nuevo aviso",
    fields: [
      {name: "texto", label: "¿Qué quieres avisar?", type: "textarea", required: true,
        placeholder: "Ej: Hoy llega un pedido de Falabella entre 14 y 18 h, ¿alguien puede estar en casa?"},
      {name: "prioridad", label: "Importancia", type: "select", value: "normal",
        options: [{value: "normal", label: "Normal"}, {value: "importante", label: "🟠 Importante"}, {value: "urgente", label: "🔴 Urgente (suena aunque estén en “no molestar”)"}]},
      {name: "fecha", label: "¿Para qué día? (opcional)", type: "date"},
      {name: "necesita", label: "Necesito que alguien se encargue", type: "checkbox", value: true},
    ],
    submit: "Avisar a todos",
  });
  if (!d) return;
  await add("avisos", {...d, encargado: null, done: false, reacciones: {}});
  toast("Aviso enviado a la familia 📣");
};

A.avisoEncargo = (el) => upd("avisos", el.dataset.id, {encargado: S.user.uid, encargadoAt: Date.now()}).then(() => toast("¡Gracias! Quedaste a cargo ✋"));
A.avisoSoltar = (el) => upd("avisos", el.dataset.id, {encargado: null});
A.avisoListo = (el) => upd("avisos", el.dataset.id, {done: true, doneBy: S.user.uid, doneAt: Date.now()});
A.avisoReabrir = (el) => upd("avisos", el.dataset.id, {done: false});
A.avisoReac = (el) => {
  const a = findById("avisos", el.dataset.id);
  const mine = a?.reacciones?.[S.user.uid] === el.dataset.r;
  return upd("avisos", el.dataset.id, {[`reacciones.${S.user.uid}`]: mine ? S.store.del() : el.dataset.r});
};
A.avisoBorrar = async (el) => {
  if (await confirmar("¿Borrar este aviso?", {ok: "Borrar", danger: true})) await del("avisos", el.dataset.id);
};

// ---------- pedidos ----------

function pedidoCard(p) {
  const k = dayKey();
  const late = p.estado !== "recibido" && p.fecha && p.fecha < k;
  const uid = S.user.uid;
  return `<article class="card pedido ${late ? "warn" : ""} ${p.estado === "recibido" ? "done" : ""}">
    <div class="row"><span class="ic big-ic">📦</span><div class="grow">
      <b>${esc(p.descripcion || "Pedido")}</b><div class="small muted">${esc(p.tienda || "")}${p.by ? ` · lo pidió ${esc(nameOf(p.by))}` : ""}</div></div>
      ${canDelete(p) ? `<button class="icon-btn" data-act="pedidoBorrar" data-id="${p.id}" aria-label="Borrar">🗑️</button>` : ""}</div>
    <div class="row wrap small">
      ${p.fecha ? `<span class="tag ${late ? "warn" : p.fecha === k ? "info" : ""}">📅 ${late ? "debía llegar " : ""}${esc(fmtDay(p.fecha))}</span>` : ""}
      ${rango(p) ? `<span class="tag">🕑 ${esc(rango(p))}</span>` : ""}
      ${p.seguimiento ? `<button class="tag link-tag" data-act="copiar" data-t="${esc(p.seguimiento)}">🔎 ${esc(p.seguimiento)} ⧉</button>` : ""}
      ${p.url ? `<a class="tag link-tag" href="${esc(p.url)}" target="_blank" rel="noopener">Seguir envío ↗</a>` : ""}
    </div>
    ${p.estado === "recibido"
      ? `<div class="small muted">✓ Recibido por ${esc(nameOf(p.recibidoPor))} ${ago(p.recibidoAt)}</div>`
      : `<div class="row wrap">
          ${p.encargado
            ? `<div class="encargo ok grow">✋ ${p.encargado === uid ? "Tú lo recibes" : `Lo recibe ${esc(nameOf(p.encargado))}`}</div>`
            : `<button class="btn grow" data-act="pedidoEncargo" data-id="${p.id}">✋ Yo lo recibo</button>`}
          <button class="btn primary" data-act="pedidoRecibido" data-id="${p.id}">📦 Llegó</button></div>`}
  </article>`;
}

function pedidos() {
  const k = dayKey();
  const all = list("pedidos");
  const pend = all.filter((p) => p.estado !== "recibido").sort((a, b) => (a.fecha || "9").localeCompare(b.fecha || "9"));
  const rec = all.filter((p) => p.estado === "recibido").sort((a, b) => (b.recibidoAt || 0) - (a.recibidoAt || 0)).slice(0, 15);
  const groups = [
    ["Atrasados", pend.filter((p) => p.fecha && p.fecha < k)],
    ["Hoy", pend.filter((p) => p.fecha === k)],
    ["Próximos", pend.filter((p) => !p.fecha || p.fecha > k)],
  ].filter(([, l]) => l.length);
  return `<button class="btn primary block" data-act="nuevoPedido">📦 Registrar un pedido que viene</button>
    ${groups.length ? groups.map(([t, l]) => `<h3 class="sec">${t}</h3>${l.map(pedidoCard).join("")}`).join("") : empty("📭", "No hay pedidos en camino.")}
    ${rec.length ? `<h3 class="sec muted">Recibidos</h3>${rec.map(pedidoCard).join("")}` : ""}`;
}

A.nuevoPedido = async () => {
  const d = await openForm({
    title: "Pedido en camino",
    intro: "Todos verán el día y el horario, y alguien puede ofrecerse para recibirlo.",
    fields: [
      {name: "descripcion", label: "¿Qué es?", required: true, placeholder: "Ej: Zapatillas de Sofía"},
      {name: "tienda", label: "Tienda o empresa", placeholder: "Ej: Falabella, Mercado Libre, Starken",
        suggest: ["Mercado Libre", "Falabella", "Paris", "Ripley", "Lider", "AliExpress", "Amazon", "Starken", "Chilexpress"]},
      {name: "fecha", label: "Día de entrega", type: "date", value: dayKey(), required: true},
      {name: "desde", label: "Desde (hora)", type: "time"},
      {name: "hasta", label: "Hasta (hora)", type: "time"},
      {name: "seguimiento", label: "N° de seguimiento (opcional)"},
      {name: "url", label: "Link de seguimiento (opcional)", type: "url", placeholder: "https://..."},
    ],
    submit: "Guardar pedido",
  });
  if (!d) return;
  await add("pedidos", {...d, estado: "pendiente", encargado: null});
  toast("Pedido registrado 📦");
};

A.pedidoEncargo = (el) => upd("pedidos", el.dataset.id, {encargado: S.user.uid}).then(() => toast("Quedaste a cargo de recibirlo ✋"));
A.pedidoRecibido = (el) => upd("pedidos", el.dataset.id, {estado: "recibido", recibidoPor: S.user.uid, recibidoAt: Date.now()})
  .then(() => toast("¡Marcado como recibido! 📦"));
A.pedidoBorrar = async (el) => {
  if (await confirmar("¿Borrar este pedido?", {ok: "Borrar", danger: true})) await del("pedidos", el.dataset.id);
};
A.copiar = async (el) => {
  await navigator.clipboard?.writeText(el.dataset.t);
  toast("Copiado ⧉");
};

// ---------- fijados ----------

const TIPOS_FIJ = {wifi: "📶", telefono: "📞", salud: "🩺", casa: "🏠", clave: "🔐", otro: "📌"};

function fijados() {
  const all = list("fijados").sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  return `${isAdult() ? `<button class="btn primary block" data-act="nuevoFijado">📌 Fijar información útil</button>` : ""}
    <p class="small muted">WiFi, teléfonos del pediatra, gásfiter, días de la basura... todo a mano.</p>
    <div class="grid-cards">${all.length ? all.map((f) => `<article class="card fijado">
      <div class="row"><span class="big-ic">${TIPOS_FIJ[f.tipo] || "📌"}</span><b class="grow">${esc(f.titulo)}</b>
      ${isAdult() ? `<button class="icon-btn" data-act="editarFijado" data-id="${f.id}" aria-label="Editar">✏️</button>` : ""}</div>
      <div class="fij-c">${linkify(f.contenido || "")}</div>
      <button class="chip" data-act="copiar" data-t="${esc(f.contenido || "")}">Copiar ⧉</button></article>`).join("") : empty("📌", "Aún no hay nada fijado.")}</div>`;
}

const fijadoFields = (f = {}) => [
  {name: "titulo", label: "Título", required: true, value: f.titulo, placeholder: "Ej: WiFi de la casa"},
  {name: "tipo", label: "Tipo", type: "select", value: f.tipo || "otro",
    options: Object.entries(TIPOS_FIJ).map(([v, i]) => ({value: v, label: `${i} ${{wifi: "WiFi", telefono: "Teléfono", salud: "Salud", casa: "Casa", clave: "Clave/código", otro: "Otro"}[v]}`}))},
  {name: "contenido", label: "Contenido", type: "textarea", rows: 4, value: f.contenido, required: true, placeholder: "Ej: Red: Casa_5G / Clave: ..."},
];

A.nuevoFijado = async () => {
  const d = await openForm({title: "Fijar información", fields: fijadoFields()});
  if (d) await add("fijados", d);
};
A.editarFijado = async (el) => {
  const f = findById("fijados", el.dataset.id);
  const d = await openForm({title: "Editar", fields: [...fijadoFields(f), {name: "borrar", label: "Borrar esto", type: "checkbox"}]});
  if (!d) return;
  if (d.borrar) return del("fijados", f.id);
  delete d.borrar;
  await upd("fijados", f.id, d);
};
