// "Hoy": el resumen diario de la familia. Quién está dónde, qué llega,
// qué hay que hacer y qué pasa hoy.

import {esc, fmtTime, ago, dayKey, fmtDay, addDays, diffDays, parseDay, linkify} from "../util.js";
import {S, list, members, me, member, nameOf, avatar, dndActive, empty, isAdult} from "../state.js";
import {itemsOn, agenda, turnoDe, tareaHecha, estadoCuenta, salidaDe, miSalida, preguntaDe, miRespuesta, respuestasDe, rango} from "../logic.js";

function saludo() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
}

function statusOf(m) {
  const s = salidaDe(m.id);
  if (s) return `🚶 hacia ${esc(s.destino)}`;
  if (dndActive(m)) return `🔕 ${esc(m.dndText || "No molestar")}`;
  if (m.moodNote && m.moodAt > Date.now() - 864e5) return esc(m.moodNote);
  return "";
}

export function familyStrip() {
  return `<div class="strip">${members().map((m) => `
    <a class="strip-m" href="#/momentos/animo">
      <div class="strip-av">${avatar(m.id, "lg")}${m.mood && m.moodAt > Date.now() - 2 * 864e5 ? `<span class="mood-badge">${esc(m.mood)}</span>` : ""}</div>
      <div class="strip-n">${esc(m.name)}</div>
      <div class="strip-s">${statusOf(m)}</div>
    </a>`).join("")}</div>`;
}

function quickActions() {
  const mine = miSalida();
  return `<div class="quick">
    ${mine
      ? `<button class="qa ok" data-act="llegue" data-id="${mine.id}"><span>✅</span>Llegué</button>`
      : `<button class="qa" data-act="sali"><span>🚶</span>Salí</button>`}
    <button class="qa" data-act="nuevoAviso"><span>📣</span>Aviso</button>
    <button class="qa" data-act="pickMood"><span>${esc(me().mood || "🙂")}</span>Mi ánimo</button>
    <a class="qa" href="#/casa/compras"><span>🛒</span>Compras</a>
  </div>`;
}

function todayList({sinAvisos = false} = {}) {
  const k = dayKey();
  const rows = [];
  const uid = S.user.uid;

  for (const p of list("pedidos")) {
    if (p.estado === "recibido") continue;
    if (p.fecha === k || (p.fecha && p.fecha < k)) {
      const late = p.fecha < k;
      rows.push(`<div class="li ${late ? "warn" : ""}"><span class="ic">📦</span><div class="grow">
        <b>${late ? "Atrasado: " : "Llega hoy: "}${esc(p.descripcion || p.tienda)}</b>
        <div class="small muted">${esc([p.tienda, rango(p)].filter(Boolean).join(" · "))}</div>
        <div class="small">${p.encargado ? `✋ Recibe ${esc(nameOf(p.encargado))}` : `<span class="tag warn">Nadie lo recibe aún</span>`}</div></div>
        ${!p.encargado ? `<button class="btn sm" data-act="pedidoEncargo" data-id="${p.id}">Yo ✋</button>`
          : `<button class="btn sm" data-act="pedidoRecibido" data-id="${p.id}">Llegó 📦</button>`}</div>`);
    }
  }

  for (const a of sinAvisos ? [] : list("avisos")) {
    if (a.done || a.prioridad === "normal") continue;
    if (a.createdAt < Date.now() - 4 * 864e5 && (!a.fecha || a.fecha < k)) continue;
    rows.push(`<a class="li ${a.prioridad === "urgente" ? "bad" : ""}" href="#/muro"><span class="ic">${a.prioridad === "urgente" ? "🔴" : "🟠"}</span>
      <div class="grow"><b>${esc(a.texto.length > 90 ? a.texto.slice(0, 90) + "…" : a.texto)}</b>
      <div class="small muted">${esc(nameOf(a.by))} · ${ago(a.createdAt)}${a.necesita ? (a.encargado ? ` · ✋ ${esc(nameOf(a.encargado))}` : " · <b>¿quién se encarga?</b>") : ""}</div></div></a>`);
  }

  for (const it of itemsOn(k)) {
    if (it.kind === "pedido") continue;
    rows.push(`<div class="li ${it.done ? "done" : ""}"><span class="ic">${it.icon}</span><div class="grow"><b>${esc(it.title)}</b>
      <div class="small muted">${[it.time, it.sub].filter(Boolean).map(esc).join(" · ")}${it.who?.length ? " · " + it.who.map((u) => avatar(u, "xs")).join("") : ""}</div></div></div>`);
  }

  for (const c of list("cuentas")) {
    const e = estadoCuenta(c);
    if (!e.paid && e.dd != null && e.dd < 0 && isAdult()) {
      rows.push(`<a class="li bad" href="#/casa/cuentas"><span class="ic">${esc(c.emoji || "🧾")}</span><div class="grow"><b>${esc(c.nombre)}: ${esc(e.label)}</b></div></a>`);
    }
  }

  for (const t of list("tareas")) {
    if (turnoDe(t) !== uid || tareaHecha(t)) continue;
    rows.push(`<div class="li"><span class="ic">${esc(t.emoji || "✅")}</span><div class="grow"><b>Te toca: ${esc(t.titulo)}</b>
      <div class="small muted">${t.frecuencia === "semanal" ? "esta semana" : "hoy"}</div></div>
      <button class="btn sm" data-act="tareaHecha" data-id="${t.id}">Hecho ✓</button></div>`);
  }

  for (const p of list("mascotas")) {
    if (!p.comio?.[k] && new Date().getHours() >= 9) {
      rows.push(`<div class="li"><span class="ic">${esc(p.emoji || "🐾")}</span><div class="grow"><b>¿Alguien le dio comida a ${esc(p.nombre)}?</b></div>
        <button class="btn sm" data-act="mascotaComio" data-id="${p.id}">Yo 🍖</button></div>`);
    }
  }

  return rows.length ? `<div class="card"><h3>Hoy en la familia</h3>${rows.join("")}</div>`
    : `<div class="card"><h3>Hoy en la familia</h3>${empty("☀️", "Nada pendiente por hoy. ¡A disfrutar!")}</div>`;
}

function proximos() {
  const ag = agenda(8, addDays(new Date(), 1)).slice(0, 5);
  if (!ag.length) return "";
  return `<div class="card"><div class="row"><h3 class="grow">Próximos días</h3><a href="#/casa/calendario" class="small">Calendario →</a></div>
    ${ag.map(({k, items}) => `<div class="ag-day"><div class="ag-k">${esc(fmtDay(k))}</div>${items.map((it) =>
      `<div class="ag-it"><span>${it.icon}</span> ${esc(it.title)}${it.time ? ` <span class="muted">· ${esc(it.time)}</span>` : ""}</div>`).join("")}</div>`).join("")}</div>`;
}

function preguntaCard() {
  const mine = miRespuesta();
  const n = respuestasDe().length;
  return `<a class="card pregunta" href="#/momentos/pregunta">
    <div class="small muted">💬 Pregunta del día</div>
    <div class="pq">${esc(preguntaDe())}</div>
    <div class="small">${mine ? `Ya respondiste · ${n} de ${members().length} respondieron →` : `Responde para ver lo que dijeron los demás (${n}) →`}</div></a>`;
}

function unDiaComoHoy() {
  const md = dayKey().slice(5);
  const year = new Date().getFullYear();
  const fotos = list("fotos").filter((f) => {
    const d = new Date(f.takenAt || f.createdAt);
    return dayKey(d).slice(5) === md && d.getFullYear() < year;
  });
  if (!fotos.length) return "";
  const f = fotos[0];
  const years = year - new Date(f.takenAt).getFullYear();
  return `<a class="card recuerdo" href="#/momentos/album">
    <img src="${esc(f.url)}" alt="" loading="lazy">
    <div class="rec-t">✨ Un día como hoy, hace ${years} año${years > 1 ? "s" : ""}${f.caption ? `<br><b>${esc(f.caption)}</b>` : ""}</div></a>`;
}

function votacionesPend() {
  const v = list("votaciones").filter((x) => !x.cerrada && x.votos?.[S.user.uid] == null);
  if (!v.length) return "";
  return `<a class="card" href="#/momentos/votaciones"><div class="small muted">🗳️ Votación pendiente</div><b>${esc(v[0].pregunta)}</b>
    ${v.length > 1 ? `<div class="small muted">y ${v.length - 1} más</div>` : ""}</a>`;
}

function graciasRecientes() {
  const g = list("gracias").filter((x) => x.para === S.user.uid && x.createdAt > Date.now() - 3 * 864e5);
  if (!g.length) return "";
  return `<a class="card gracias-card" href="#/momentos/gracias">💛 <b>${esc(nameOf(g[0].by))}</b> te dio las gracias: “${esc(g[0].texto)}”</a>`;
}

function cumpleProximo() {
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const k = dayKey(addDays(today, i));
    const m = members().find((x) => x.birthday?.slice(5) === k.slice(5));
    if (m) return `<div class="card cumple">🎂 En ${i} día${i > 1 ? "s" : ""} es el cumpleaños de <b>${esc(m.name)}</b> (${esc(fmtDay(k))})</div>`;
  }
  return "";
}

// Vista simple (abuelos): botones grandes y lo esencial.
function renderSimple() {
  const mine = miSalida();
  const urg = list("avisos").filter((a) => !a.done && a.createdAt > Date.now() - 3 * 864e5).slice(0, 4);
  return `<h1 class="hello">${saludo()}, ${esc(me().name)}</h1>
    <div class="simple-actions">
      ${mine ? `<button class="huge ok" data-act="llegue" data-id="${mine.id}">✅ Llegué</button>`
        : `<button class="huge" data-act="sali">🚶 Salí de casa</button>`}
      <button class="huge sos" data-act="sos">🚨 Pedir ayuda</button>
    </div>
    <div class="card"><h3>Llamar</h3><div class="call-grid">${members().filter((m) => m.phone && m.id !== S.user.uid).map((m) =>
      `<a class="call" href="tel:${esc(m.phone.replace(/\s/g, ""))}">${avatar(m.id, "lg")}<span>${esc(m.name)}</span></a>`).join("") || `<p class="muted">Nadie ha puesto su teléfono todavía.</p>`}</div></div>
    <div class="card"><h3>Avisos</h3>${urg.length ? urg.map((a) => `<div class="li"><span class="ic">${avatar(a.by)}</span><div class="grow">${linkify(a.texto)}</div></div>`).join("") : `<p class="muted">Sin avisos nuevos.</p>`}</div>
    ${todayList({sinAvisos: true})}`;
}

export function render() {
  if (me().simple) return renderSimple();
  const d = new Date();
  return `<div class="hello-row"><div><h1 class="hello">${saludo()}, ${esc(me().name)}</h1>
      <div class="muted cap">${esc(d.toLocaleDateString("es-CL", {weekday: "long", day: "numeric", month: "long"}))}</div></div></div>
    ${familyStrip()}
    ${quickActions()}
    ${graciasRecientes()}
    ${todayList()}
    ${cumpleProximo()}
    ${votacionesPend()}
    ${preguntaCard()}
    ${unDiaComoHoy()}
    ${proximos()}`;
}
