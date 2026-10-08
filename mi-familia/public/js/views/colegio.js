// Colegio: tareas, pruebas, materiales y recordatorios para cada hijo/a.
// Los adultos los envían (le llega una notificación al hijo/a), la app
// marca "visto" cuando el hijo/a abre la sección y avisa a quien lo envió
// cuando lo termina. Los niños también pueden anotar sus propias tareas.

import {esc, ago, dayKey, fmtDay, addDays, openForm, confirmar, toast, linkify} from "../util.js";
import {S, A, rerender, list, members, nameOf, avatar, add, upd, del, isAdult, empty, findById} from "../state.js";

export const TIPOS_COLEGIO = {
  tarea: {icon: "📝", label: "Tarea"},
  prueba: {icon: "📚", label: "Prueba"},
  materiales: {icon: "✂️", label: "Materiales"},
  recordatorio: {icon: "📌", label: "Recordatorio"},
};

const ASIGNATURAS = ["Matemática", "Lenguaje", "Historia", "Ciencias", "Inglés", "Artes", "Música", "Ed. Física", "Tecnología", "Religión"];

let filtro = "todos"; // uid del hijo/a o "todos"
let verHechas = false;

// Hijos/as = miembros con rol niño. Si no hay, cualquiera puede recibir.
export const hijos = () => {
  const n = members().filter((m) => m.role === "nino");
  return n.length ? n : members();
};

export const pendientesDe = (uid) => list("colegio").filter((c) => c.para === uid && !c.hecho);

function grupo(c, k, manana) {
  if (!c.fecha) return "Sin fecha";
  if (c.fecha < k) return "Atrasado";
  if (c.fecha === k) return "Para hoy";
  if (c.fecha === manana) return "Para mañana";
  return "Próximos días";
}

function card(c) {
  const t = TIPOS_COLEGIO[c.tipo] || TIPOS_COLEGIO.tarea;
  const uid = S.user.uid;
  const paraMi = c.para === uid;
  const late = !c.hecho && c.fecha && c.fecha < dayKey();
  const enviado = c.by !== c.para;
  return `<article class="card colegio ${c.hecho ? "done" : ""} ${late ? "warn" : ""}">
    <div class="row"><span class="big-ic">${t.icon}</span>
      <div class="grow"><div class="small muted">${esc(t.label)}${c.asignatura ? " · " + esc(c.asignatura) : ""}</div>
        <b>${esc(c.titulo)}</b></div>
      ${!paraMi || isAdult() ? `<span title="${esc(nameOf(c.para))}">${avatar(c.para, "sm")}</span>` : ""}
      ${c.by === uid || isAdult() ? `<button class="icon-btn" data-act="colegioEditar" data-id="${c.id}" aria-label="Editar">✏️</button>` : ""}
    </div>
    ${c.notas ? `<div class="small">${linkify(c.notas)}</div>` : ""}
    <div class="row wrap small">
      ${c.fecha ? `<span class="tag ${late ? "warn" : c.fecha === dayKey() ? "info" : ""}">📅 ${late ? "era para " : "para "}${esc(fmtDay(c.fecha))}</span>` : ""}
      ${enviado ? `<span class="muted">de ${esc(nameOf(c.by))} · ${ago(c.createdAt)}</span>` : `<span class="muted">anotado por ${esc(paraMi ? "ti" : nameOf(c.by))}</span>`}
      ${enviado && !paraMi ? (c.vistoAt ? `<span class="tag ok">👀 visto ${ago(c.vistoAt)}</span>` : `<span class="tag">aún no lo ve</span>`) : ""}
    </div>
    ${c.hecho
      ? `<div class="row"><div class="encargo ok grow">✓ Listo ${ago(c.hechoAt)}${c.hechoBy !== c.para ? ` (marcó ${esc(nameOf(c.hechoBy))})` : ""}</div>
          <button class="chip" data-act="colegioDeshacer" data-id="${c.id}">Deshacer</button></div>`
      : `<button class="btn ${paraMi ? "primary" : ""} block" data-act="colegioListo" data-id="${c.id}">✓ ${paraMi ? "¡Listo, lo terminé!" : `Marcar listo por ${esc(nameOf(c.para))}`}</button>`}
  </article>`;
}

export function render() {
  const uid = S.user.uid;
  const adulto = isAdult();
  const k = dayKey();
  const manana = dayKey(addDays(new Date(), 1));
  const ninos = hijos();
  if (!adulto) filtro = uid;
  else if (filtro !== "todos" && !ninos.some((m) => m.id === filtro)) filtro = "todos";

  let all = list("colegio").filter((c) => filtro === "todos" || c.para === filtro);
  const pend = all.filter((c) => !c.hecho).sort((a, b) => (a.fecha || "9").localeCompare(b.fecha || "9"));
  const hechas = all.filter((c) => c.hecho).sort((a, b) => (b.hechoAt || 0) - (a.hechoAt || 0));
  const orden = ["Atrasado", "Para hoy", "Para mañana", "Próximos días", "Sin fecha"];
  const grupos = orden.map((g) => [g, pend.filter((c) => grupo(c, k, manana) === g)]).filter(([, l]) => l.length);

  const resumen = adulto ? `<div class="kids">${ninos.map((m) => {
    const p = pendientesDe(m.id);
    const urg = p.filter((c) => c.fecha && c.fecha <= manana).length;
    return `<button class="kid ${filtro === m.id ? "on" : ""}" data-act="colegioFiltro" data-id="${m.id}">${avatar(m.id, "lg")}
      <b>${esc(m.name)}</b><span class="small ${urg ? "bad-t" : "muted"}">${p.length ? `${p.length} pendiente${p.length > 1 ? "s" : ""}${urg ? ` · ${urg} urgente${urg > 1 ? "s" : ""}` : ""}` : "al día ✓"}</span></button>`;
  }).join("")}${ninos.length > 1 ? `<button class="kid ${filtro === "todos" ? "on" : ""}" data-act="colegioFiltro" data-id="todos"><span class="big-ic">👨‍👩‍👧‍👦</span><b>Todos</b></button>` : ""}</div>` : "";

  return `${resumen}
    <button class="btn primary block" data-act="colegioNuevo">${adulto ? "🎒 Enviar tarea, prueba o materiales" : "📝 Anotar una tarea o prueba"}</button>
    ${grupos.length ? grupos.map(([g, l]) => `<h3 class="sec ${g === "Atrasado" ? "bad-t" : ""}">${g}</h3>${l.map(card).join("")}`).join("")
      : empty("🎒", adulto ? "No hay nada pendiente del colegio. Envía tareas, pruebas o materiales y le llega una notificación a cada hijo/a." : "¡Estás al día! 🎉")}
    ${hechas.length ? `<button class="btn ghost block" data-act="colegioVerHechas">${verHechas ? "Ocultar" : "Ver"} terminadas (${hechas.length})</button>` : ""}
    ${verHechas ? hechas.slice(0, 30).map(card).join("") : ""}`;
}

// Al abrir la sección, el hijo/a deja "visto" lo que le enviaron.
const marcando = new Set();
export function after() {
  for (const c of list("colegio")) {
    if (c.para === S.user.uid && c.by !== c.para && !c.vistoAt && !marcando.has(c.id)) {
      marcando.add(c.id);
      upd("colegio", c.id, {vistoAt: Date.now()}).catch(() => marcando.delete(c.id));
    }
  }
}

A.colegioFiltro = (el) => {
  filtro = el.dataset.id;
  rerender();
};
A.colegioVerHechas = () => {
  verHechas = !verHechas;
  rerender();
};

const campos = (c = {}) => [
  {name: "tipo", label: "¿Qué es?", type: "select", value: c.tipo || "tarea",
    options: Object.entries(TIPOS_COLEGIO).map(([v, t]) => ({value: v, label: `${t.icon} ${t.label}`}))},
  {name: "titulo", label: "Detalle", required: true, value: c.titulo, placeholder: "Ej: Guía de fracciones págs. 12–14"},
  {name: "asignatura", label: "Asignatura", value: c.asignatura, suggest: ASIGNATURAS},
  {name: "fecha", label: "¿Para cuándo?", type: "date", value: c.fecha || dayKey(addDays(new Date(), 1))},
  {name: "notas", label: "Notas (opcional)", type: "textarea", rows: 2, value: c.notas, placeholder: "Ej: llevar en carpeta azul, estudiar unidad 3"},
];

A.colegioNuevo = async () => {
  const adulto = isAdult();
  const ninos = hijos();
  const d = await openForm({
    title: adulto ? "Enviar al colegio" : "Anotar para el colegio",
    intro: adulto ? "Le llega una notificación a cada hijo/a que elijas y verás cuándo lo vio y cuándo lo terminó." : "",
    fields: [
      ...(adulto ? [{name: "para", label: "¿Para quién?", type: "members", members: ninos, required: true,
        value: filtro !== "todos" ? [filtro] : ninos.length === 1 ? [ninos[0].id] : []}] : []),
      ...campos(),
    ],
    submit: adulto ? "Enviar 🎒" : "Anotar",
  });
  if (!d) return;
  const para = adulto ? d.para : [S.user.uid];
  delete d.para;
  for (const u of para) await add("colegio", {...d, para: u, hecho: false, vistoAt: u === S.user.uid ? Date.now() : null});
  toast(adulto ? `Enviado a ${para.map(nameOf).join(", ")} 🎒` : "Anotado 📝");
};

A.colegioListo = async (el) => {
  const c = findById("colegio", el.dataset.id);
  await upd("colegio", c.id, {hecho: true, hechoAt: Date.now(), hechoBy: S.user.uid});
  toast(c.para === S.user.uid ? "¡Bien hecho! 💪" : "Marcado como listo");
};
A.colegioDeshacer = (el) => upd("colegio", el.dataset.id, {hecho: false, hechoAt: null, hechoBy: null});

A.colegioEditar = async (el) => {
  const c = findById("colegio", el.dataset.id);
  const d = await openForm({title: "Editar", fields: [...campos(c), {name: "borrar", label: "Borrar", type: "checkbox"}]});
  if (!d) return;
  if (d.borrar) {
    if (await confirmar("¿Borrar esto?", {ok: "Borrar", danger: true})) await del("colegio", c.id);
    return;
  }
  delete d.borrar;
  await upd("colegio", c.id, d);
};
