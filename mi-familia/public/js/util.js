// Utilidades sin estado: escape de HTML, fechas, toasts, formularios en
// ventana (dialog) e imágenes.

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"})[c]);

export const pad = (n) => String(n).padStart(2, "0");

export const randomId = (len = 20, abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") => {
  const a = crypto.getRandomValues(new Uint32Array(len));
  return Array.from(a, (x) => abc[x % abc.length]).join("");
};

// ---------- fechas (siempre en hora local del teléfono) ----------

export const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
  "septiembre", "octubre", "noviembre", "diciembre"];

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const monthKey = (d = new Date()) => dayKey(d).slice(0, 7);
export const parseDay = (k) => {
  const [y, m, d] = String(k).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
// Días entre dos fechas (a - b), sin importar la hora.
export const diffDays = (a, b) => Math.round((parseDay(dayKey(a)) - parseDay(dayKey(b))) / 86400000);

export const fmtTime = (ts) => {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function fmtDay(k, {weekday = true} = {}) {
  const d = parseDay(k);
  const rel = diffDays(d, new Date());
  if (rel === 0) return "hoy";
  if (rel === 1) return "mañana";
  if (rel === -1) return "ayer";
  const base = `${d.getDate()} de ${MESES[d.getMonth()]}`;
  const year = d.getFullYear() !== new Date().getFullYear() ? ` de ${d.getFullYear()}` : "";
  return (weekday ? `${DIAS[d.getDay()]} ` : "") + base + year;
}

export function ago(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "recién";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  if (d === 1) return "ayer";
  if (d < 7) return `hace ${d} días`;
  return fmtDay(dayKey(new Date(ts)), {weekday: false});
}

export const fmtMoney = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-CL");

// "HH:MM" de hoy (o mañana si ya pasó por más de 2 h) → timestamp.
export function timeToTs(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d.getTime() < Date.now() - 2 * 3600e3) d.setDate(d.getDate() + 1);
  return d.getTime();
}

// Escapa y convierte enlaces y teléfonos (8+ dígitos) en links tocables.
export const linkify = (text) =>
  esc(text)
    .replace(/(https?:\/\/[^\s<]+)|(\+?\d[\d ]{7,}\d)/g, (m, url) =>
      url ? `<a href="${url}" target="_blank" rel="noopener">${url}</a>` : `<a href="tel:${m.replace(/ /g, "")}">${m}</a>`)
    .replace(/\n/g, "<br>");

// ---------- toasts ----------

export function toast(msg, kind = "") {
  let box = document.getElementById("toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "toasts";
    document.body.append(box);
  }
  const t = document.createElement("div");
  t.className = `toast ${kind}`;
  t.textContent = msg;
  box.append(t);
  setTimeout(() => t.classList.add("out"), 3200);
  setTimeout(() => t.remove(), 3700);
}

// ---------- ventanas ----------

// Abre un <dialog> con el HTML dado. Devuelve {el, close}. onClose se llama
// una sola vez, con lo que se haya pasado a close().
export function sheet(html, {onClose, cls = ""} = {}) {
  const dlg = document.createElement("dialog");
  dlg.className = `sheet ${cls}`;
  dlg.innerHTML = `<button class="sheet-x" type="button" aria-label="Cerrar">✕</button>${html}`;
  document.body.append(dlg);
  let done = false;
  const close = (val) => {
    if (done) return;
    done = true;
    dlg.close();
    dlg.remove();
    onClose?.(val);
  };
  dlg.querySelector(".sheet-x").onclick = () => close(null);
  dlg.addEventListener("cancel", (e) => {
    e.preventDefault();
    close(null);
  });
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) close(null); // click en el fondo
  });
  dlg.showModal();
  return {el: dlg, close};
}

export function confirmar(msg, {ok = "Sí", danger = false} = {}) {
  return new Promise((resolve) => {
    const {el, close} = sheet(
      `<p class="confirm-msg">${esc(msg)}</p>
       <div class="row end"><button class="btn ghost" data-v="0">Cancelar</button>
       <button class="btn ${danger ? "danger" : "primary"}" data-v="1">${esc(ok)}</button></div>`,
      {onClose: (v) => resolve(!!v), cls: "small"},
    );
    el.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => close(b.dataset.v === "1")));
  });
}

// Formulario genérico en ventana. fields: [{name, label, type, value,
// options, required, placeholder, hint, members}]. Resuelve con un objeto
// con los valores, o null si se cancela.
export function openForm({title, fields, submit = "Guardar", intro = ""}) {
  return new Promise((resolve) => {
    const body = fields.map(fieldHtml).join("");
    const {el, close} = sheet(
      `<h2>${esc(title)}</h2>${intro ? `<p class="muted">${intro}</p>` : ""}
       <form class="form" novalidate>${body}
       <div class="row end"><button type="button" class="btn ghost" data-cancel>Cancelar</button>
       <button class="btn primary">${esc(submit)}</button></div></form>`,
      {onClose: resolve},
    );
    const form = el.querySelector("form");
    el.querySelector("[data-cancel]").onclick = () => close(null);
    el.querySelectorAll(".chips-pick").forEach((g) => {
      const single = g.dataset.single === "1";
      g.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-v]");
        if (!b) return;
        e.preventDefault();
        if (single) g.querySelectorAll("button").forEach((x) => x !== b && x.classList.remove("on"));
        b.classList.toggle("on", single ? true : !b.classList.contains("on"));
        const inp = g.parentElement.querySelector(`input[name="${g.dataset.name}"]`);
        if (inp && g.dataset.fill) inp.value = b.dataset.v; // chips de sugerencia
      });
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const out = {};
      for (const f of fields) {
        if (f.type === "members" || f.type === "member") {
          const on = [...el.querySelectorAll(`.chips-pick[data-name="${f.name}"] button.on`)].map((b) => b.dataset.v);
          out[f.name] = f.type === "member" ? on[0] || "" : on;
        } else if (f.type === "checkbox") {
          out[f.name] = form.elements[f.name].checked;
        } else if (f.type === "lines") {
          out[f.name] = form.elements[f.name].value.split("\n").map((s) => s.trim()).filter(Boolean);
        } else if (f.type === "number") {
          const v = form.elements[f.name].value;
          out[f.name] = v === "" ? null : Number(v);
        } else {
          out[f.name] = form.elements[f.name].value.trim();
        }
        const empty = out[f.name] === "" || out[f.name] == null || (Array.isArray(out[f.name]) && !out[f.name].length);
        if (f.required && empty) {
          toast(`Falta: ${f.label}`, "err");
          return;
        }
      }
      close(out);
    });
    setTimeout(() => form.querySelector("input:not([type=hidden]),textarea,select")?.focus(), 50);
  });
}

function fieldHtml(f) {
  const id = "f_" + f.name;
  const v = f.value ?? "";
  const ph = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : "";
  const hint = f.hint ? `<small class="muted">${f.hint}</small>` : "";
  const lab = `<label for="${id}">${esc(f.label)}</label>`;
  switch (f.type) {
    case "textarea":
      return `<div class="field">${lab}<textarea id="${id}" name="${f.name}" rows="${f.rows || 3}"${ph}>${esc(v)}</textarea>${hint}</div>`;
    case "lines":
      return `<div class="field">${lab}<textarea id="${id}" name="${f.name}" rows="4"${ph}>${esc((v || []).join("\n"))}</textarea>${hint}</div>`;
    case "select":
      return `<div class="field">${lab}<select id="${id}" name="${f.name}">${f.options
        .map((o) => `<option value="${esc(o.value)}"${String(o.value) === String(v) ? " selected" : ""}>${esc(o.label)}</option>`)
        .join("")}</select>${hint}</div>`;
    case "checkbox":
      return `<div class="field check"><label><input type="checkbox" name="${f.name}"${v ? " checked" : ""}> ${esc(f.label)}</label>${hint}</div>`;
    case "members":
    case "member": {
      const sel = new Set(Array.isArray(v) ? v : [v]);
      return `<div class="field"><label>${esc(f.label)}</label><div class="chips-pick" data-name="${f.name}" data-single="${f.type === "member" ? 1 : 0}">${f.members
        .map((m) => `<button type="button" data-v="${esc(m.id)}" class="${sel.has(m.id) ? "on" : ""}">${esc(m.emoji || "")} ${esc(m.name)}</button>`)
        .join("")}</div>${hint}</div>`;
    }
    default: {
      const sugg = f.suggest
        ? `<div class="chips-pick" data-name="${f.name}" data-single="1" data-fill="1">${f.suggest
          .map((s) => `<button type="button" data-v="${esc(s)}">${esc(s)}</button>`).join("")}</div>`
        : "";
      const extra = f.type === "number" ? ' inputmode="decimal" step="any"' : "";
      return `<div class="field">${lab}<input id="${id}" name="${f.name}" type="${f.type || "text"}" value="${esc(v)}"${ph}${extra}${f.max ? ` maxlength="${f.max}"` : ""}>${sugg}${hint}</div>`;
    }
  }
}

// ---------- imágenes ----------

export async function compressImage(file, max = 1600, quality = 0.82) {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) throw new Error("No se pudo leer la imagen");
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, "image/jpeg", quality));
}

export const blobToDataURL = (blob) =>
  new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(blob);
  });

// Carga un script/CSS externo una sola vez.
const loaded = {};
export function loadScript(src) {
  return (loaded[src] ||= new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error("No se pudo cargar " + src));
    document.head.append(s);
  }));
}
export function loadCss(href) {
  if (loaded[href]) return;
  loaded[href] = true;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.append(l);
}

export function getPosition(timeout = 10000) {
  return new Promise((res) => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(
      (p) => res({lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy)}),
      () => res(null),
      {enableHighAccuracy: true, timeout, maximumAge: 30000},
    );
  });
}

export const mapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;
