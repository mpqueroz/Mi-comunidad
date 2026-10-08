// Casa: lista de compras, tareas con turnos, calendario, cuentas por
// pagar y mascotas.

import {esc, ago, dayKey, monthKey, fmtDay, fmtMoney, parseDay, addDays, MESES, DIAS, pad, openForm, confirmar, toast, linkify} from "../util.js";
import {S, A, F, C, rerender, list, members, nameOf, avatar, add, upd, del, canDelete, isAdult, subnav, empty, findById} from "../state.js";
import {itemsOn, TIPOS, turnoDe, tareaHecha, proximosTurnos, periodKey, estadoCuenta} from "../logic.js";

export function render(sub = "compras") {
  const items = [["compras", "🛒 Compras"], ["tareas", "🧹 Tareas"], ["calendario", "📅 Calendario"]];
  if (isAdult()) items.push(["cuentas", "🧾 Cuentas"]);
  items.push(["mascotas", "🐾 Mascotas"]);
  const nav = subnav("casa", sub, items);
  switch (sub) {
    case "tareas": return nav + tareas();
    case "calendario": return nav + calendario();
    case "cuentas": return nav + (isAdult() ? cuentas() : "");
    case "mascotas": return nav + mascotas();
    default: return nav + compras();
  }
}

// ---------- compras ----------

function compras() {
  const all = list("compras");
  const pend = all.filter((c) => !c.comprado).sort((a, b) => a.createdAt - b.createdAt);
  const done = all.filter((c) => c.comprado).sort((a, b) => (b.compradoAt || 0) - (a.compradoAt || 0));
  return `<form data-form="compra" class="add-row"><input id="compraInput" name="texto" placeholder="Agregar a la lista… (ej: leche x2)" autocomplete="off" required>
      <button class="btn primary">Agregar</button></form>
    <div class="card list-card">
      ${pend.length ? pend.map((c) => `<label class="check-item">
        <input type="checkbox" data-change="compraCheck" data-id="${c.id}">
        <span class="grow">${esc(c.texto)}</span><span class="small muted">${avatar(c.by, "xs")}</span>
        <button class="icon-btn sm" data-act="compraBorrar" data-id="${c.id}" aria-label="Quitar">✕</button></label>`).join("")
        : empty("🧺", "La lista está vacía.")}
    </div>
    ${pend.length ? `<button class="btn block" data-act="voyAlSuper">🛒 Voy a comprar (avisar a todos)</button>` : ""}
    ${done.length ? `<h3 class="sec muted">Comprado</h3><div class="card list-card">${done.slice(0, 30).map((c) => `<label class="check-item done">
        <input type="checkbox" checked data-change="compraCheck" data-id="${c.id}"><span class="grow">${esc(c.texto)}</span>
        <span class="small muted">${esc(nameOf(c.compradoBy))} · ${ago(c.compradoAt)}</span></label>`).join("")}</div>
      <button class="btn ghost block" data-act="limpiarComprados">Limpiar comprados</button>` : ""}`;
}

F.compra = async (d, form) => {
  const t = d.texto.trim();
  if (!t) return;
  form.reset();
  document.getElementById("compraInput").value = "";
  await add("compras", {texto: t, comprado: false});
};
C.compraCheck = (el) => upd("compras", el.dataset.id, el.checked
  ? {comprado: true, compradoBy: S.user.uid, compradoAt: Date.now()}
  : {comprado: false});
A.compraBorrar = (el) => del("compras", el.dataset.id);
A.limpiarComprados = async () => {
  for (const c of list("compras").filter((x) => x.comprado)) await del("compras", c.id);
};
A.voyAlSuper = async () => {
  const n = list("compras").filter((c) => !c.comprado).length;
  await add("avisos", {texto: `🛒 Voy a comprar. Si falta algo, agréguenlo a la lista ahora (van ${n} cosas).`,
    prioridad: "normal", necesita: false, done: false, reacciones: {}});
  toast("Avisamos a la familia");
};

// ---------- tareas ----------

function tareas() {
  const uid = S.user.uid;
  const all = list("tareas").sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const mias = all.filter((t) => turnoDe(t) === uid && !tareaHecha(t));
  return `<button class="btn primary block" data-act="nuevaTarea">➕ Nueva tarea con turnos</button>
    ${mias.length ? `<div class="card highlight"><b>Te toca:</b> ${mias.map((t) => esc(t.emoji + " " + t.titulo)).join(", ")}</div>` : ""}
    ${all.length ? all.map((t) => {
      const turno = turnoDe(t);
      const hecha = tareaHecha(t);
      return `<article class="card tarea ${hecha ? "done" : ""}">
        <div class="row"><span class="big-ic">${esc(t.emoji || "✅")}</span><div class="grow"><b>${esc(t.titulo)}</b>
          <div class="small muted">${t.frecuencia === "semanal" ? "Cada semana" : "Cada día"} · rotan ${(t.rotacion || []).map((u) => avatar(u, "xs")).join("")}</div></div>
          ${canDelete(t) ? `<button class="icon-btn" data-act="tareaBorrar" data-id="${t.id}" aria-label="Borrar">🗑️</button>` : ""}</div>
        <div class="row">
          <div class="grow">${t.frecuencia === "semanal" ? "Esta semana" : "Hoy"}: ${avatar(turno, "sm")} <b>${esc(turno === uid ? "Tú" : nameOf(turno))}</b>
            ${hecha ? `<span class="tag ok">✓ hecho${hecha !== turno ? " por " + esc(nameOf(hecha)) : ""}</span>` : ""}</div>
          ${hecha ? `<button class="chip" data-act="tareaDeshacer" data-id="${t.id}">Deshacer</button>`
            : `<button class="btn sm primary" data-act="tareaHecha" data-id="${t.id}">Hecho ✓</button>`}
        </div>
        <div class="small muted">Siguientes: ${proximosTurnos(t, 4).map(({d, uid: u}) => `${t.frecuencia === "semanal" ? "sem. " + d.getDate() + "/" + (d.getMonth() + 1) : DIAS[d.getDay()].slice(0, 3)} ${esc(nameOf(u))}`).join(" · ")}</div>
      </article>`;
    }).join("") : empty("🧹", "Crea tareas que se reparten solas: sacar la basura, pasear al perro, regar…")}`;
}

A.nuevaTarea = async () => {
  const d = await openForm({
    title: "Nueva tarea",
    intro: "Los turnos rotan solos cada día o semana en el orden que elijas.",
    fields: [
      {name: "titulo", label: "Tarea", required: true, placeholder: "Ej: Sacar la basura",
        suggest: ["Sacar la basura", "Pasear al perro", "Lavar la loza", "Regar las plantas", "Poner la mesa", "Ordenar el living"]},
      {name: "emoji", label: "Ícono", value: "🧹", max: 4},
      {name: "frecuencia", label: "Cada cuánto", type: "select", value: "diaria",
        options: [{value: "diaria", label: "Todos los días"}, {value: "semanal", label: "Cada semana"}]},
      {name: "rotacion", label: "¿Entre quiénes rota? (en este orden)", type: "members", members: members(), required: true},
    ],
    submit: "Crear tarea",
  });
  if (!d) return;
  await add("tareas", {...d, inicio: dayKey(), hechas: {}});
};
A.tareaHecha = async (el) => {
  const t = findById("tareas", el.dataset.id);
  await upd("tareas", t.id, {[`hechas.${periodKey(t)}`]: S.user.uid});
  toast("¡Bien hecho! 💪");
};
A.tareaDeshacer = (el) => {
  const t = findById("tareas", el.dataset.id);
  return upd("tareas", t.id, {[`hechas.${periodKey(t)}`]: S.store.del()});
};
A.tareaBorrar = async (el) => {
  if (await confirmar("¿Borrar esta tarea?", {ok: "Borrar", danger: true})) await del("tareas", el.dataset.id);
};

// ---------- calendario ----------

let calMonth = monthKey();
let calDay = dayKey();

function calendario() {
  const first = parseDay(calMonth + "-01");
  const startPad = (first.getDay() + 6) % 7; // semana parte el lunes
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const today = dayKey();
  let cells = "";
  for (let i = 0; i < startPad; i++) cells += `<div class="cal-c empty"></div>`;
  for (let d = 1; d <= daysIn; d++) {
    const k = `${calMonth}-${pad(d)}`;
    const its = itemsOn(k);
    cells += `<button class="cal-c ${k === today ? "today" : ""} ${k === calDay ? "sel" : ""}" data-act="calDay" data-k="${k}">
      <span>${d}</span><span class="dots">${its.slice(0, 4).map((i) => `<i>${i.icon}</i>`).join("")}</span></button>`;
  }
  const sel = itemsOn(calDay);
  return `<div class="card cal">
      <div class="row"><button class="icon-btn" data-act="calNav" data-d="-1" aria-label="Mes anterior">‹</button>
        <h3 class="grow center">${MESES[first.getMonth()]} ${first.getFullYear()}</h3>
        <button class="icon-btn" data-act="calNav" data-d="1" aria-label="Mes siguiente">›</button></div>
      <div class="cal-g head">${["L", "M", "M", "J", "V", "S", "D"].map((x) => `<div>${x}</div>`).join("")}</div>
      <div class="cal-g">${cells}</div>
    </div>
    <div class="row"><h3 class="grow sec">${esc(fmtDay(calDay))}</h3><button class="btn sm primary" data-act="nuevoEvento">➕ Evento</button></div>
    ${sel.length ? sel.map((it) => `<div class="card li-card ${it.done ? "done" : ""}"><span class="big-ic">${it.icon}</span><div class="grow">
      <b>${esc(it.title)}</b><div class="small muted">${[it.time, it.sub].filter(Boolean).map(esc).join(" · ")}
      ${it.ref?.repetir && it.ref.repetir !== "no" ? ` · 🔁 ${esc(it.ref.repetir)}` : ""}</div>
      ${it.who?.length ? `<div>${it.who.map((u) => avatar(u, "xs")).join("")}</div>` : ""}</div>
      ${it.kind === "evento" && canDelete(it.ref) ? `<button class="icon-btn" data-act="editarEvento" data-id="${it.ref.id}" aria-label="Editar">✏️</button>` : ""}</div>`).join("")
      : `<p class="muted center">Nada agendado este día.</p>`}`;
}

A.calNav = (el) => {
  const d = parseDay(calMonth + "-01");
  d.setMonth(d.getMonth() + Number(el.dataset.d));
  calMonth = monthKey(d);
  calDay = calMonth === monthKey() ? dayKey() : calMonth + "-01";
  rerender();
};
A.calDay = (el) => {
  calDay = el.dataset.k;
  rerender();
};

const eventoFields = (e = {}) => [
  {name: "titulo", label: "¿Qué es?", required: true, value: e.titulo, placeholder: "Ej: Reunión de apoderados"},
  {name: "fecha", label: "Día", type: "date", value: e.fecha || calDay, required: true},
  {name: "hora", label: "Hora (opcional)", type: "time", value: e.hora},
  {name: "tipo", label: "Tipo", type: "select", value: e.tipo || "familia",
    options: Object.entries(TIPOS).map(([v, t]) => ({value: v, label: `${t.icon} ${t.label}`}))},
  {name: "quienes", label: "¿Quiénes?", type: "members", members: members(), value: e.quienes || []},
  {name: "repetir", label: "Repetir", type: "select", value: e.repetir || "no",
    options: [{value: "no", label: "No se repite"}, {value: "semanal", label: "Cada semana"}, {value: "mensual", label: "Cada mes"}, {value: "anual", label: "Cada año (aniversarios)"}]},
  {name: "notas", label: "Notas", type: "textarea", value: e.notas, rows: 2},
];

A.nuevoEvento = async () => {
  const d = await openForm({title: "Nuevo evento", fields: eventoFields()});
  if (!d) return;
  await add("eventos", d);
  calDay = d.fecha;
  calMonth = d.fecha.slice(0, 7);
  toast("Agendado 📅");
};
A.editarEvento = async (el) => {
  const e = findById("eventos", el.dataset.id);
  const d = await openForm({title: "Editar evento", fields: [...eventoFields(e), {name: "borrar", label: "Borrar este evento", type: "checkbox"}]});
  if (!d) return;
  if (d.borrar) return del("eventos", e.id);
  delete d.borrar;
  await upd("eventos", e.id, d);
};

// ---------- cuentas ----------

function cuentas() {
  const mk = monthKey();
  const all = list("cuentas").map((c) => ({c, e: estadoCuenta(c)})).sort((a, b) => Number(a.e.paid) - Number(b.e.paid) || (a.e.dd ?? 99) - (b.e.dd ?? 99));
  const total = all.reduce((s, x) => s + (Number(x.c.monto) || 0), 0);
  const pagado = all.filter((x) => x.e.paid).reduce((s, x) => s + (Number(x.c.monto) || 0), 0);
  const pct = total ? Math.round((pagado / total) * 100) : 0;
  return `<div class="card">
      <div class="row"><div class="grow"><div class="small muted">${MESES[new Date().getMonth()]}</div><b class="big-num">${fmtMoney(pagado)}</b> <span class="muted">de ${fmtMoney(total)} pagado</span></div></div>
      <div class="bar"><i style="width:${pct}%"></i></div></div>
    <button class="btn primary block" data-act="nuevaCuenta">➕ Agregar cuenta mensual</button>
    ${all.length ? all.map(({c, e}) => `<article class="card li-card ${e.paid ? "done" : ""}">
      <span class="big-ic">${esc(c.emoji || "🧾")}</span>
      <div class="grow"><b>${esc(c.nombre)}</b> <span class="muted">${fmtMoney(c.monto)}</span>
        <div class="small"><span class="tag ${e.cls}">${esc(e.label)}</span>${e.paid ? ` <span class="muted">por ${esc(nameOf(e.pago.by))}</span>` : ""}</div>
        ${c.notas ? `<div class="small muted">${linkify(c.notas)}</div>` : ""}</div>
      <div class="col">
        ${e.paid ? `<button class="chip" data-act="cuentaDespagar" data-id="${c.id}">Deshacer</button>`
          : `<button class="btn sm primary" data-act="cuentaPagar" data-id="${c.id}">Pagada ✓</button>`}
        <button class="icon-btn" data-act="editarCuenta" data-id="${c.id}" aria-label="Editar">✏️</button></div>
    </article>`).join("") : empty("🧾", "Agrega luz, agua, internet, gasto común… y te avisamos antes de que venzan.")}
    <p class="small muted center">Solo los adultos ven esta sección. Se reinicia cada mes (${esc(mk)}).</p>`;
}

const cuentaFields = (c = {}) => [
  {name: "nombre", label: "Cuenta", required: true, value: c.nombre, placeholder: "Ej: Luz",
    suggest: ["Luz", "Agua", "Gas", "Internet", "Celular", "Gasto común", "Arriendo", "Dividendo", "Colegio", "Streaming"]},
  {name: "emoji", label: "Ícono", value: c.emoji || "🧾", max: 4},
  {name: "monto", label: "Monto aproximado ($)", type: "number", value: c.monto},
  {name: "dia", label: "Día del mes en que vence", type: "number", value: c.dia || 10, required: true},
  {name: "notas", label: "Notas (n° de cliente, link de pago…)", type: "textarea", rows: 2, value: c.notas},
];

A.nuevaCuenta = async () => {
  const d = await openForm({title: "Cuenta mensual", fields: cuentaFields()});
  if (d) await add("cuentas", {...d, dia: Math.min(31, Math.max(1, d.dia || 1)), pagado: {}});
};
A.editarCuenta = async (el) => {
  const c = findById("cuentas", el.dataset.id);
  const d = await openForm({title: "Editar cuenta", fields: [...cuentaFields(c), {name: "borrar", label: "Borrar esta cuenta", type: "checkbox"}]});
  if (!d) return;
  if (d.borrar) return del("cuentas", c.id);
  delete d.borrar;
  await upd("cuentas", c.id, {...d, dia: Math.min(31, Math.max(1, d.dia || 1))});
};
A.cuentaPagar = (el) => upd("cuentas", el.dataset.id, {[`pagado.${monthKey()}`]: {by: S.user.uid, at: Date.now()}}).then(() => toast("Marcada como pagada 💸"));
A.cuentaDespagar = (el) => upd("cuentas", el.dataset.id, {[`pagado.${monthKey()}`]: S.store.del()});

// ---------- mascotas ----------

function mascotas() {
  const k = dayKey();
  const all = list("mascotas");
  return `<button class="btn primary block" data-act="nuevaMascota">➕ Agregar mascota</button>
    ${all.length ? all.map((p) => {
      const comio = p.comio?.[k];
      const vac = (p.vacunas || []).slice().sort((a, b) => (a.proxima || "9").localeCompare(b.proxima || "9"));
      return `<article class="card mascota">
        <div class="row"><span class="pet-ic">${esc(p.emoji || "🐾")}</span><div class="grow"><h3>${esc(p.nombre)}</h3>
          <div class="small muted">${esc([p.especie, p.raza].filter(Boolean).join(" · "))}${p.nacimiento ? ` · ${edad(p.nacimiento)}` : ""}</div></div>
          <button class="icon-btn" data-act="editarMascota" data-id="${p.id}" aria-label="Editar">✏️</button></div>
        <div class="row">${comio ? `<div class="encargo ok grow">🍖 Comió hoy · le dio ${esc(nameOf(comio.by))} ${ago(comio.at)}</div>`
          : `<button class="btn block" data-act="mascotaComio" data-id="${p.id}">🍖 Le di comida</button>`}</div>
        ${p.comida ? `<div class="small"><b>Comida:</b> ${esc(p.comida)}</div>` : ""}
        ${p.vet ? `<div class="small"><b>Veterinario:</b> ${linkify(p.vet)}</div>` : ""}
        ${p.notas ? `<div class="small"><b>Ojo:</b> ${esc(p.notas)}</div>` : ""}
        <h4>Vacunas y controles</h4>
        ${vac.length ? vac.map((v, i) => {
          const dd = v.proxima ? Math.round((parseDay(v.proxima) - parseDay(k)) / 864e5) : null;
          return `<div class="li"><span class="ic">💉</span><div class="grow">${esc(v.nombre)}
            <div class="small muted">${v.fecha ? `última: ${esc(fmtDay(v.fecha, {weekday: false}))}` : ""}${v.proxima ? ` · próxima: ${esc(fmtDay(v.proxima, {weekday: false}))}` : ""}</div></div>
            ${dd != null && dd <= 14 ? `<span class="tag ${dd < 0 ? "bad" : "warn"}">${dd < 0 ? "atrasada" : dd === 0 ? "hoy" : `en ${dd} d`}</span>` : ""}
            <button class="icon-btn sm" data-act="vacunaBorrar" data-id="${p.id}" data-i="${(p.vacunas || []).indexOf(v)}" aria-label="Quitar">✕</button></div>`;
        }).join("") : `<p class="small muted">Sin registros.</p>`}
        <button class="chip" data-act="nuevaVacuna" data-id="${p.id}">➕ Vacuna / control</button>
      </article>`;
    }).join("") : empty("🐾", "Registra a las mascotas: comida, vacunas y quién les dio de comer hoy.")}`;
}

function edad(nac) {
  const m = Math.floor((Date.now() - parseDay(nac)) / (30.44 * 864e5));
  return m < 12 ? `${m} meses` : `${Math.floor(m / 12)} años`;
}

const mascotaFields = (p = {}) => [
  {name: "nombre", label: "Nombre", required: true, value: p.nombre},
  {name: "emoji", label: "Ícono", value: p.emoji || "🐕", max: 4, suggest: ["🐕", "🐈", "🐇", "🐦", "🐠", "🐹", "🐢"]},
  {name: "especie", label: "Especie", value: p.especie, placeholder: "Perro, gato…"},
  {name: "raza", label: "Raza", value: p.raza},
  {name: "nacimiento", label: "Fecha de nacimiento (aprox.)", type: "date", value: p.nacimiento},
  {name: "comida", label: "Comida y porción", value: p.comida, placeholder: "Ej: 1 taza mañana y noche"},
  {name: "vet", label: "Veterinario (nombre y teléfono)", value: p.vet},
  {name: "notas", label: "Cuidados especiales", type: "textarea", rows: 2, value: p.notas},
];

A.nuevaMascota = async () => {
  const d = await openForm({title: "Nueva mascota", fields: mascotaFields()});
  if (d) await add("mascotas", {...d, vacunas: [], comio: {}});
};
A.editarMascota = async (el) => {
  const p = findById("mascotas", el.dataset.id);
  const d = await openForm({title: `Editar a ${p.nombre}`, fields: [...mascotaFields(p), {name: "borrar", label: "Borrar mascota", type: "checkbox"}]});
  if (!d) return;
  if (d.borrar) {
    if (await confirmar(`¿Borrar a ${p.nombre} y todo su historial?`, {ok: "Borrar", danger: true})) await del("mascotas", p.id);
    return;
  }
  delete d.borrar;
  await upd("mascotas", p.id, d);
};
A.mascotaComio = (el) => upd("mascotas", el.dataset.id, {[`comio.${dayKey()}`]: {by: S.user.uid, at: Date.now()}}).then(() => toast("¡Anotado! 🍖"));
A.nuevaVacuna = async (el) => {
  const p = findById("mascotas", el.dataset.id);
  const d = await openForm({
    title: `Vacuna o control de ${p.nombre}`,
    fields: [
      {name: "nombre", label: "¿Qué fue?", required: true, suggest: ["Antirrábica", "Óctuple", "Triple felina", "Desparasitación", "Control anual"]},
      {name: "fecha", label: "Fecha", type: "date", value: dayKey()},
      {name: "proxima", label: "Próxima vez", type: "date", value: dayKey(addDays(new Date(), 365))},
    ],
  });
  if (d) await upd("mascotas", p.id, {vacunas: [...(p.vacunas || []), d]});
};
A.vacunaBorrar = async (el) => {
  const p = findById("mascotas", el.dataset.id);
  const v = (p.vacunas || []).slice();
  v.splice(Number(el.dataset.i), 1);
  await upd("mascotas", p.id, {vacunas: v});
};
