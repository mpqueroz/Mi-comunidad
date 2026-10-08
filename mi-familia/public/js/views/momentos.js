// Momentos: álbum privado, votaciones, pregunta del día, planes, gracias
// y estado de ánimo / no molestar.

import {esc, ago, dayKey, fmtDay, fmtTime, addDays, MESES, openForm, confirmar, toast, sheet, linkify} from "../util.js";
import {S, A, F, C, rerender, list, members, member, me, nameOf, avatar, add, upd, del, updMe, canDelete, isAdmin, subnav, empty, findById, setDoc, dndActive} from "../state.js";
import {preguntaDe, respuestasDe, miRespuesta, MOODS} from "../logic.js";

export function render(sub = "album") {
  const nav = subnav("momentos", sub, [
    ["album", "📸 Álbum"], ["pregunta", "💬 Pregunta"], ["votaciones", "🗳️ Votar"],
    ["planes", "🎉 Planes"], ["gracias", "💛 Gracias"], ["animo", "🌤️ Ánimo"],
  ]);
  const v = {album, pregunta, votaciones, planes, gracias, animo}[sub] || album;
  return nav + v();
}

// ---------- álbum ----------

function album() {
  const fotos = list("fotos");
  const md = dayKey().slice(5);
  const year = new Date().getFullYear();
  const recuerdos = fotos.filter((f) => dayKey(new Date(f.takenAt)).slice(5) === md && new Date(f.takenAt).getFullYear() < year);
  const byMonth = {};
  for (const f of fotos) {
    const d = new Date(f.takenAt || f.createdAt);
    const k = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
    (byMonth[k] ||= []).push(f);
  }
  return `<label class="btn primary block upload">📷 Subir fotos<input type="file" accept="image/*" multiple data-change="subirFotos" hidden></label>
    ${S.uploading ? `<div class="card center">Subiendo ${S.uploading}… ⏳</div>` : ""}
    ${recuerdos.length ? `<div class="card recuerdos"><h3>✨ Un día como hoy</h3><div class="photo-grid">${recuerdos.map((f) => thumb(f, true)).join("")}</div></div>` : ""}
    ${fotos.length ? Object.entries(byMonth).map(([k, l]) => `<h3 class="sec">${esc(k)}</h3><div class="photo-grid">${l.map((f) => thumb(f)).join("")}</div>`).join("")
      : empty("📸", "El álbum privado de la familia. Solo lo ven ustedes, sin redes sociales.")}`;
}

function thumb(f, years = false) {
  const y = new Date().getFullYear() - new Date(f.takenAt).getFullYear();
  return `<button class="ph" data-act="verFoto" data-id="${f.id}"><img src="${esc(f.url)}" alt="${esc(f.caption || "")}" loading="lazy">
    ${years ? `<span class="ph-badge">hace ${y} año${y > 1 ? "s" : ""}</span>` : ""}</button>`;
}

C.subirFotos = async (el) => {
  const files = [...el.files];
  el.value = "";
  let ok = 0;
  for (const [i, file] of files.entries()) {
    S.uploading = `${i + 1} de ${files.length}`;
    rerender();
    try {
      const {url, path} = await S.store.uploadPhoto(S.fid, file);
      await add("fotos", {url, path, takenAt: file.lastModified || Date.now(), caption: ""});
      ok++;
    } catch (e) {
      console.error(e);
      toast(`No se pudo subir ${file.name}`, "err");
    }
  }
  S.uploading = null;
  rerender();
  if (ok) toast(`${ok} foto${ok > 1 ? "s" : ""} en el álbum 📸`);
};

A.verFoto = (el) => {
  const f = findById("fotos", el.dataset.id);
  const {el: dlg, close} = sheet(`<img class="full" src="${esc(f.url)}" alt="">
    <div class="row"><div class="grow small muted">${avatar(f.by, "xs")} ${esc(nameOf(f.by))} · ${esc(fmtDay(dayKey(new Date(f.takenAt)), {weekday: false}))}</div>
    <a class="btn sm" href="${esc(f.url)}" download="foto.jpg" target="_blank" rel="noopener">Descargar</a></div>
    <form class="add-row" data-cap><input name="cap" value="${esc(f.caption || "")}" placeholder="Escribe una descripción…"><button class="btn">Guardar</button></form>
    ${canDelete(f) ? `<button class="btn ghost danger-t block" data-del>Borrar foto</button>` : ""}`, {cls: "photo-sheet"});
  dlg.querySelector("[data-cap]").onsubmit = async (e) => {
    e.preventDefault();
    await upd("fotos", f.id, {caption: e.target.cap.value.trim()});
    close();
  };
  dlg.querySelector("[data-del]")?.addEventListener("click", async () => {
    if (!(await confirmar("¿Borrar esta foto para todos?", {ok: "Borrar", danger: true}))) return;
    await S.store.deletePhotoFile(f.path);
    await del("fotos", f.id);
    close();
  });
};

// ---------- pregunta del día ----------

function pregunta() {
  const k = dayKey();
  const mine = miRespuesta(k);
  const resp = respuestasDe(k);
  const prev = [];
  for (let i = 1; i <= 7; i++) {
    const pk = dayKey(addDays(new Date(), -i));
    const r = respuestasDe(pk);
    if (r.length) prev.push({k: pk, r});
  }
  const pend = members().filter((m) => !resp.some((r) => r.by === m.id));
  return `<div class="card pregunta big">
      <div class="small muted">💬 Pregunta de hoy</div><div class="pq">${esc(preguntaDe(k))}</div>
      ${mine ? "" : `<form data-form="responder" class="form"><textarea id="respInput" name="texto" rows="3" placeholder="Tu respuesta…" required></textarea>
        <button class="btn primary block">Responder y ver lo que dijeron</button></form>`}
    </div>
    ${mine ? resp.map(respCard).join("") + (pend.length ? `<p class="small muted center">Faltan: ${pend.map((m) => esc(m.name)).join(", ")}</p>` : "")
      : resp.length ? `<p class="center muted">🔒 ${resp.length} respuesta${resp.length > 1 ? "s" : ""} esperando. Responde para verlas.</p>` : ""}
    ${prev.length ? `<h3 class="sec">Días anteriores</h3>${prev.map(({k: pk, r}) => `<details class="card"><summary><b>${esc(fmtDay(pk))}:</b> ${esc(preguntaDe(pk))}</summary>
      ${r.map(respCard).join("")}</details>`).join("")}` : ""}`;
}

const respCard = (r) => `<div class="li">${avatar(r.by)}<div class="grow"><b>${esc(nameOf(r.by))}</b><div>${linkify(r.texto)}</div></div></div>`;

F.responder = async (d) => {
  const k = dayKey();
  await setDoc("respuestas", `${k}_${S.user.uid}`, {by: S.user.uid, fecha: k, texto: d.texto.trim(), createdAt: Date.now()}, false);
};

// ---------- votaciones ----------

function votaciones() {
  const all = list("votaciones");
  return `<button class="btn primary block" data-act="nuevaVotacion">🗳️ Nueva votación</button>
    ${all.length ? all.map((v) => {
      const votos = Object.entries(v.votos || {});
      const counts = v.opciones.map((_, i) => votos.filter(([, x]) => x === i));
      const max = Math.max(0, ...counts.map((c) => c.length));
      const mine = v.votos?.[S.user.uid];
      return `<article class="card votacion ${v.cerrada ? "done" : ""}">
        <div class="row">${avatar(v.by, "sm")}<b class="grow">${esc(v.pregunta)}</b>
          ${canDelete(v) ? `<button class="icon-btn" data-act="votoMenu" data-id="${v.id}" aria-label="Opciones">⋯</button>` : ""}</div>
        ${v.opciones.map((o, i) => {
          const n = counts[i].length;
          const pct = votos.length ? Math.round((n / votos.length) * 100) : 0;
          const win = v.cerrada && n === max && max > 0;
          return `<button class="opt ${mine === i ? "on" : ""} ${win ? "win" : ""}" data-act="votar" data-id="${v.id}" data-i="${i}" ${v.cerrada ? "disabled" : ""}>
            <i style="width:${pct}%"></i><span class="grow">${win ? "🏆 " : ""}${esc(o)}</span>
            <span class="voters">${counts[i].map(([u]) => avatar(u, "xs")).join("")}</span><b>${n}</b></button>`;
        }).join("")}
        <div class="small muted">${votos.length} de ${members().length} votaron · ${ago(v.createdAt)}${v.cerrada ? " · cerrada" : ""}</div>
      </article>`;
    }).join("") : empty("🗳️", "¿Qué cenamos? ¿Adónde vamos de vacaciones? ¡Decidan juntos!")}`;
}

A.nuevaVotacion = async () => {
  const d = await openForm({
    title: "Nueva votación",
    fields: [
      {name: "pregunta", label: "Pregunta", required: true, placeholder: "Ej: ¿Qué cenamos el viernes?"},
      {name: "opciones", label: "Opciones (una por línea)", type: "lines", required: true, value: ["", ""], placeholder: "Pizza\nSushi\nCompletos"},
    ],
    submit: "Crear",
  });
  if (!d) return;
  if (d.opciones.length < 2) return toast("Pon al menos 2 opciones", "err");
  await add("votaciones", {pregunta: d.pregunta, opciones: d.opciones.slice(0, 10), votos: {}, cerrada: false});
};
A.votar = (el) => {
  const v = findById("votaciones", el.dataset.id);
  const i = Number(el.dataset.i);
  return upd("votaciones", v.id, {[`votos.${S.user.uid}`]: v.votos?.[S.user.uid] === i ? S.store.del() : i});
};
A.votoMenu = async (el) => {
  const v = findById("votaciones", el.dataset.id);
  const {el: dlg, close} = sheet(`<h2>${esc(v.pregunta)}</h2>
    <button class="btn block" data-c>${v.cerrada ? "Reabrir votación" : "Cerrar votación y ver ganador"}</button>
    <button class="btn ghost danger-t block" data-d>Borrar</button>`, {cls: "small"});
  dlg.querySelector("[data-c]").onclick = () => {
    close();
    upd("votaciones", v.id, {cerrada: !v.cerrada});
  };
  dlg.querySelector("[data-d]").onclick = () => {
    close();
    del("votaciones", v.id);
  };
};

// ---------- planes ----------

const ASIST = [["si", "✅ Voy"], ["quizas", "🤔 Quizás"], ["no", "❌ No puedo"]];

function planes() {
  const k = dayKey();
  const all = list("planes").slice().sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
  const prox = all.filter((p) => !p.fecha || p.fecha >= k);
  const pas = all.filter((p) => p.fecha && p.fecha < k).reverse().slice(0, 10);
  return `<button class="btn primary block" data-act="nuevoPlan">🎉 Proponer un plan</button>
    ${prox.length ? prox.map(planCard).join("") : empty("🎉", "Asados, paseos, cumpleaños, una once… Propongan planes y vean quién va y qué lleva cada uno.")}
    ${pas.length ? `<h3 class="sec muted">Planes pasados</h3>${pas.map(planCard).join("")}` : ""}`;
}

function planCard(p) {
  const uid = S.user.uid;
  const as = p.asistencia || {};
  const mine = as[uid];
  return `<article class="card plan">
    <div class="row"><span class="big-ic">🎉</span><div class="grow"><h3>${esc(p.titulo)}</h3>
      <div class="small">📅 ${esc(p.fecha ? fmtDay(p.fecha) : "Fecha por definir")}${p.hora ? ` · ${esc(p.hora)}` : ""}${p.lugar ? ` · 📍 ${esc(p.lugar)}` : ""}</div>
      <div class="small muted">Propuso ${esc(nameOf(p.by))}</div></div>
      ${canDelete(p) ? `<button class="icon-btn" data-act="planBorrar" data-id="${p.id}" aria-label="Borrar">🗑️</button>` : ""}</div>
    ${p.notas ? `<div class="small">${linkify(p.notas)}</div>` : ""}
    <div class="seg">${ASIST.map(([v, l]) => `<button class="${mine === v ? "on" : ""}" data-act="planAsist" data-id="${p.id}" data-v="${v}">${l}</button>`).join("")}</div>
    <div class="small">${ASIST.map(([v, l]) => {
      const who = Object.entries(as).filter(([, x]) => x === v).map(([u]) => u);
      return who.length ? `<div>${l.split(" ")[0]} ${who.map((u) => avatar(u, "xs")).join("")} ${who.map(nameOf).map(esc).join(", ")}</div>` : "";
    }).join("")}</div>
    <h4>¿Quién lleva qué?</h4>
    ${Object.entries(p.lleva || {}).filter(([, t]) => t).map(([u, t]) => `<div class="li">${avatar(u, "xs")} <b>${esc(nameOf(u))}:</b>&nbsp;${esc(t)}</div>`).join("") || `<p class="small muted">Nadie ha dicho aún.</p>`}
    <form class="add-row" data-form="planLleva" data-id="${p.id}"><input id="lleva_${p.id}" name="t" value="" placeholder="${p.lleva?.[uid] ? "Cambiar: " + esc(p.lleva[uid]) : "Yo llevo…"}"><button class="btn sm">OK</button></form>
  </article>`;
}

A.nuevoPlan = async () => {
  const d = await openForm({
    title: "Proponer un plan",
    fields: [
      {name: "titulo", label: "¿Qué hacemos?", required: true, placeholder: "Ej: Asado donde la abuela"},
      {name: "fecha", label: "Día", type: "date", value: dayKey(addDays(new Date(), 3))},
      {name: "hora", label: "Hora", type: "time"},
      {name: "lugar", label: "Lugar"},
      {name: "notas", label: "Detalles", type: "textarea", rows: 2},
    ],
    submit: "Proponer",
  });
  if (d) await add("planes", {...d, asistencia: {[S.user.uid]: "si"}, lleva: {}});
};
A.planAsist = (el) => upd("planes", el.dataset.id, {[`asistencia.${S.user.uid}`]: el.dataset.v});
F.planLleva = async (d, form) => {
  form.reset();
  await upd("planes", form.dataset.id, {[`lleva.${S.user.uid}`]: d.t.trim()});
};
A.planBorrar = async (el) => {
  if (await confirmar("¿Borrar este plan?", {ok: "Borrar", danger: true})) await del("planes", el.dataset.id);
};

// ---------- gracias ----------

function gracias() {
  const all = list("gracias");
  return `<button class="btn primary block" data-act="nuevoGracias">💛 Dar las gracias a alguien</button>
    ${all.length ? all.map((g) => {
      const hearts = Object.keys(g.corazones || {});
      return `<article class="card gracias-card">
        <div class="row">${avatar(g.by)} <span>→</span> ${avatar(g.para)}<div class="grow small"><b>${esc(nameOf(g.by))}</b> a <b>${esc(nameOf(g.para))}</b> · ${ago(g.createdAt)}</div>
        ${canDelete(g) ? `<button class="icon-btn sm" data-act="graciasBorrar" data-id="${g.id}" aria-label="Borrar">✕</button>` : ""}</div>
        <div class="gr-t">“${esc(g.texto)}”</div>
        <button class="chip ${g.corazones?.[S.user.uid] ? "on" : ""}" data-act="graciasCorazon" data-id="${g.id}">❤️ ${hearts.length || ""}</button>
      </article>`;
    }).join("") : empty("💛", "Un lugar para agradecer las cosas buenas, grandes y chicas.")}`;
}

A.nuevoGracias = async () => {
  const d = await openForm({
    title: "Dar las gracias",
    fields: [
      {name: "para", label: "¿A quién?", type: "member", members: members().filter((m) => m.id !== S.user.uid), required: true},
      {name: "texto", label: "¿Por qué?", type: "textarea", required: true, placeholder: "Gracias por…"},
    ],
    submit: "Enviar 💛",
  });
  if (d) await add("gracias", {...d, corazones: {}});
};
A.graciasCorazon = (el) => {
  const g = findById("gracias", el.dataset.id);
  return upd("gracias", g.id, {[`corazones.${S.user.uid}`]: g.corazones?.[S.user.uid] ? S.store.del() : true});
};
A.graciasBorrar = (el) => del("gracias", el.dataset.id);

// ---------- ánimo y no molestar ----------

function animo() {
  const m = me();
  const week = Date.now() - 7 * 864e5;
  const hist = list("animos").filter((a) => a.at > week);
  return `<div class="card">
      <h3>¿Cómo estás hoy?</h3>
      <div class="mood-grid">${MOODS.map(([e, l]) => `<button class="mood ${m.mood === e && m.moodAt > Date.now() - 864e5 ? "on" : ""}" data-act="setMood" data-e="${e}"><span>${e}</span>${l}</button>`).join("")}</div>
    </div>
    <div class="card">
      <h3>🔕 No molestar</h3>
      ${dndActive(m) ? `<div class="row"><div class="grow">Activo hasta las <b>${fmtTime(m.dndUntil)}</b>${m.dndText ? ` · ${esc(m.dndText)}` : ""}</div>
          <button class="btn sm" data-act="dndOff">Desactivar</button></div>`
        : `<p class="small muted">La familia ve que estás ocupado/a y no te llegan notificaciones (salvo SOS y avisos urgentes).</p>
          <div class="row wrap">${[["30", "30 min"], ["60", "1 hora"], ["120", "2 horas"], ["noche", "Hasta mañana"]].map(([v, l]) =>
            `<button class="chip" data-act="dnd" data-v="${v}">${l}</button>`).join("")}</div>`}
    </div>
    <h3 class="sec">La familia esta semana</h3>
    ${members().map((x) => {
      const mine = hist.filter((a) => a.by === x.id).slice(0, 7).reverse();
      return `<div class="card li-card">${avatar(x.id, "lg")}<div class="grow"><b>${esc(x.name)}</b> ${x.mood && x.moodAt > Date.now() - 2 * 864e5 ? esc(x.mood) : ""}
        ${x.moodNote && x.moodAt > Date.now() - 864e5 ? `<div class="small">“${esc(x.moodNote)}”</div>` : ""}
        ${dndActive(x) ? `<div class="small">🔕 ${esc(x.dndText || "No molestar")} hasta ${fmtTime(x.dndUntil)}</div>` : ""}
        <div class="mood-hist">${mine.map((a) => `<span title="${esc(fmtDay(dayKey(new Date(a.at))))}${a.nota ? ": " + esc(a.nota) : ""}">${esc(a.mood)}</span>`).join("")}</div></div></div>`;
    }).join("")}
    <p class="small muted center">Si ves a alguien bajoneado/a varios días, quizás es buen momento para una conversación 💛</p>`;
}

async function setMood(e) {
  const d = await openForm({
    title: `${e} ${MOODS.find((x) => x[0] === e)?.[1] || ""}`,
    fields: [{name: "nota", label: "¿Quieres contar algo? (opcional)", placeholder: "Ej: prueba de mate mañana"}],
    submit: "Compartir",
  });
  if (!d) return;
  await updMe({mood: e, moodNote: d.nota, moodAt: Date.now()});
  await S.store.add(S.fid, "animos", {by: S.user.uid, at: Date.now(), mood: e, nota: d.nota, createdAt: Date.now()});
  toast("Gracias por contarnos " + e);
}
A.setMood = (el) => setMood(el.dataset.e);
A.pickMood = () => {
  const {el, close} = sheet(`<h2>¿Cómo estás hoy?</h2><div class="mood-grid">${MOODS.map(([e, l]) =>
    `<button class="mood" data-e="${e}"><span>${e}</span>${l}</button>`).join("")}</div>`);
  el.querySelectorAll("[data-e]").forEach((b) => (b.onclick = () => {
    close();
    setMood(b.dataset.e);
  }));
};

A.dnd = async (el) => {
  const v = el.dataset.v;
  let until;
  if (v === "noche") {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(7, 0, 0, 0);
    until = d.getTime();
  } else until = Date.now() + Number(v) * 60e3;
  const d = await openForm({title: "No molestar", fields: [{name: "t", label: "¿Qué estás haciendo? (opcional)", placeholder: "Ej: estudiando, en reunión, durmiendo siesta",
    suggest: ["Estudiando", "En reunión", "Durmiendo", "Manejando", "Descansando"]}], submit: "Activar"});
  if (!d) return;
  await updMe({dndUntil: until, dndText: d.t});
};
A.dndOff = () => updMe({dndUntil: 0, dndText: ""});
