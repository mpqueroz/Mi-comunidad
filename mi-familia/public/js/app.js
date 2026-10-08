// Arranque, inicio de sesión, elección de familia, suscripciones en tiempo
// real, navegación y alertas globales (SOS y llegadas atrasadas).

import {esc, toast, sheet, fmtTime, ago, mapsLink, local, session} from "./util.js";
import {S, A, F, C, setRender, members, me, member, nameOf, avatar, isAdult, upd, go, list} from "./state.js";
import {atrasadas, sosActivos} from "./logic.js";
import * as hoy from "./views/hoy.js";
import * as muro from "./views/muro.js";
import * as casa from "./views/casa.js";
import * as cuidado from "./views/cuidado.js";
import * as momentos from "./views/momentos.js";
import * as familia from "./views/familia.js";

const cfg = self.MI_FAMILIA_CONFIG || {firebase: {}};
S.demo = !cfg.firebase?.apiKey;
const root = document.getElementById("app");

try {
  S.store = S.demo ? await import("./store-local.js") : await import("./store-firebase.js");
  await S.store.init?.();
} catch (e) {
  console.error(e);
  root.innerHTML = `<div class="center-screen"><div class="big">📡</div><h2>No se pudo conectar</h2>
    <p class="muted">Revisa tu conexión a internet y vuelve a abrir la app.</p>
    <button class="btn primary" onclick="location.reload()">Reintentar</button></div>`;
  throw e;
}

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
S.store.onPush?.((p) => toast(`🔔 ${p.notification?.title || ""} ${p.notification?.body || ""}`));

// ---------- rutas ----------

const TABS = [
  ["hoy", "🏠", "Hoy", hoy],
  ["muro", "📌", "Muro", muro],
  ["casa", "🛒", "Casa", casa],
  ["cuidado", "🛡️", "Cuidado", cuidado],
  ["momentos", "📸", "Momentos", momentos],
];
const SIMPLE_TABS = new Set(["hoy", "muro", "cuidado"]);
const VIEWS = Object.fromEntries([...TABS.map((t) => [t[0], t[3]]), ["familia", familia]]);

function route() {
  const [tab, sub] = location.hash.replace(/^#\/?/, "").split("/");
  return {tab: VIEWS[tab] ? tab : "hoy", sub: sub || null};
}
window.addEventListener("hashchange", () => {
  render();
  window.scrollTo(0, 0);
});

// ---------- sesión y familia ----------

let unsubs = [];
const COLS = {
  members: {},
  avisos: {orderBy: ["createdAt", "desc"], limit: 150},
  pedidos: {orderBy: ["createdAt", "desc"], limit: 80},
  fijados: {},
  compras: {},
  tareas: {},
  colegio: {orderBy: ["createdAt", "desc"], limit: 300},
  eventos: {},
  cuentas: {},
  mascotas: {},
  fotos: {orderBy: ["takenAt", "desc"], limit: 400},
  votaciones: {orderBy: ["createdAt", "desc"], limit: 30},
  respuestas: {orderBy: ["createdAt", "desc"], limit: 200},
  planes: {orderBy: ["createdAt", "desc"], limit: 30},
  gracias: {orderBy: ["createdAt", "desc"], limit: 80},
  animos: {orderBy: ["at", "desc"], limit: 150},
  salidas: {orderBy: ["salioAt", "desc"], limit: 80},
  sos: {orderBy: ["at", "desc"], limit: 10},
  ubicaciones: {},
};

function stopFamily() {
  unsubs.forEach((u) => u());
  unsubs = [];
  S.data = {};
  S.loaded = new Set();
  S.family = null;
}

export function openFamily(fid) {
  stopFamily();
  S.fid = fid;
  if (fid) {
    local.setItem("mf_fid", fid);
    unsubs.push(S.store.watchFamily(fid, (f) => {
      S.family = f;
      schedule();
    }));
    for (const [col, opts] of Object.entries(COLS)) {
      unsubs.push(S.store.watch(fid, col, (items) => {
        S.data[col] = items;
        S.loaded.add(col);
        if (col === "sos") alertNewSos(items);
        schedule();
      }, opts));
    }
  }
  render();
}
S.openFamily = openFamily;


// ---------- render ----------

let raf = 0;
function schedule() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(render);
}
setRender(schedule);
setInterval(schedule, 60000); // "hace 5 min", atrasos, etc.

const loader = () => `<div class="center-screen"><div class="spinner"></div></div>`;

// Pantallas fijas (login, onboarding, cargando): solo se dibujan si
// cambian, para no borrar lo que la persona está escribiendo.
function screen(key, html) {
  if (root.dataset.screen === key) return;
  root.dataset.screen = key;
  root.innerHTML = html();
}

function render() {
  if (!S.user) return screen("login:" + (S.loginMode || ""), loginScreen);
  if (!S.fid || S.wantOnboarding) return screen("onboarding:" + S.families.length, onboardingScreen);
  if (!S.loaded.has("members")) return screen("loading", loader);
  if (!member(S.user.uid)) {
    // Me sacaron de la familia (o la familia ya no existe).
    S.families = S.families.filter((f) => f.id !== S.fid);
    openFamily(S.families[0]?.id || null);
    return;
  }

  const r = route();
  const simple = !!me().simple;
  document.documentElement.classList.toggle("simple", simple);

  // Conserva el foco (y lo escrito) del campo activo entre renders, y los
  // elementos marcados con data-keep (el mapa) para no recrearlos.
  const a = document.activeElement;
  const keep = a && root.contains(a) && a.id ? {id: a.id, s: a.selectionStart, e: a.selectionEnd, v: a.value} : null;
  const kept = {};
  root.querySelectorAll("[data-keep]").forEach((el) => (kept[el.dataset.keep] = el));

  const view = VIEWS[r.tab];
  let html;
  try {
    html = view.render(r.sub);
  } catch (e) {
    console.error(e);
    html = `<div class="card bad">Algo falló al mostrar esta página: ${esc(e.message)}</div>`;
  }
  const tabs = TABS.filter((t) => !simple || SIMPLE_TABS.has(t[0]));
  root.dataset.screen = "";

  root.innerHTML = `
    <header class="top">
      <button class="fam-btn" data-act="switchFamily" title="Cambiar de familia">
        <span class="logo">🏡</span><span class="fam-name">${esc(S.family?.name || "Mi Familia")}</span><span class="caret">▾</span>
      </button>
      <span class="sp"></span>
      <button class="sos-btn" data-act="sos" aria-label="Enviar alerta SOS">SOS</button>
      <a class="me-btn ${r.tab === "familia" ? "on" : ""}" href="#/familia" aria-label="Mi perfil y familia">${avatar(S.user.uid)}</a>
    </header>
    ${S.demo ? `<div class="demo-bar">Modo demo · eres <b>${esc(me().name)}</b> · <a href="#" data-act="demoSwitch">cambiar de persona</a></div>` : ""}
    ${alertsHtml()}
    <main id="view" class="view-${r.tab}">${html}</main>
    <nav class="tabs">${tabs
      .map(([k, icon, label]) => `<a href="#/${k}" class="${r.tab === k ? "on" : ""}"><span>${icon}</span>${label}</a>`)
      .join("")}</nav>`;

  root.querySelectorAll("[data-keep]").forEach((el) => {
    const old = kept[el.dataset.keep];
    if (old) el.replaceWith(old);
  });
  if (keep) {
    const el = document.getElementById(keep.id);
    if (el && "value" in el) {
      el.value = keep.v;
      el.focus();
      try {
        el.setSelectionRange(keep.s, keep.e);
      } catch {}
    }
  }
  view.after?.(r.sub);
}

// ---------- alertas globales ----------

function alertsHtml() {
  let out = "";
  for (const s of sosActivos()) {
    const mine = s.by === S.user.uid;
    const voy = Object.keys(s.voy || {});
    out += `<div class="alert sos">
      <div class="alert-t">🚨 ${mine ? "Enviaste una alerta SOS" : `${esc(nameOf(s.by))} necesita ayuda`} · ${fmtTime(s.at)}</div>
      ${s.mensaje ? `<div>“${esc(s.mensaje)}”</div>` : ""}
      ${voy.length ? `<div class="small">En camino: ${voy.map(nameOf).map(esc).join(", ")}</div>` : ""}
      <div class="row wrap">
        ${s.lat ? `<a class="btn light" href="${mapsLink(s.lat, s.lng)}" target="_blank" rel="noopener">📍 Ver ubicación</a>` : ""}
        ${!mine && member(s.by)?.phone ? `<a class="btn light" href="tel:${esc(member(s.by).phone.replace(/\s/g, ""))}">📞 Llamar</a>` : ""}
        ${!mine && !s.voy?.[S.user.uid] ? `<button class="btn light" data-act="sosVoy" data-id="${s.id}">🏃 Voy en camino</button>` : ""}
        ${mine || isAdult() ? `<button class="btn light" data-act="sosResolver" data-id="${s.id}">✅ Ya está bien</button>` : ""}
      </div></div>`;
  }
  for (const s of atrasadas()) {
    const p = member(s.quien);
    out += `<div class="alert warn">
      <div class="alert-t">⚠️ ${esc(nameOf(s.quien))} debía llegar a ${esc(s.destino)} a las ${fmtTime(s.esperaAt)}</div>
      <div class="small">Salió ${ago(s.salioAt)} y aún no marca “Llegué”.</div>
      <div class="row wrap">
        ${p?.phone && s.quien !== S.user.uid ? `<a class="btn light" href="tel:${esc(p.phone.replace(/\s/g, ""))}">📞 Llamar</a>` : ""}
        <button class="btn light" data-act="llegue" data-id="${s.id}">✅ ${s.quien === S.user.uid ? "Llegué" : "Ya llegó"}</button>
        ${s.quien === S.user.uid ? `<button class="btn light" data-act="demoro" data-id="${s.id}">⏱️ Me demoro 15 min</button>` : ""}
      </div></div>`;
  }
  return out;
}

const seenSos = new Set(JSON.parse(session.getItem("mf_sos_seen") || "[]"));
let firstSos = true;
function alertNewSos(items) {
  for (const s of items) {
    if (s.resuelto || seenSos.has(s.id)) continue;
    seenSos.add(s.id);
    if (!firstSos || Date.now() - s.at < 10 * 60e3) {
      if (s.by !== S.user?.uid) {
        navigator.vibrate?.([400, 150, 400, 150, 800]);
        toast(`🚨 ${nameOf(s.by)} envió una alerta SOS`, "err");
      }
    }
  }
  firstSos = false;
  session.setItem("mf_sos_seen", JSON.stringify([...seenSos]));
}

A.sosVoy = (el) => upd("sos", el.dataset.id, {[`voy.${S.user.uid}`]: Date.now()}).then(() => toast("Avisamos que vas en camino"));
A.sosResolver = (el) => upd("sos", el.dataset.id, {resuelto: true, resueltoBy: S.user.uid, resueltoAt: Date.now()});

// ---------- delegación de eventos ----------

function fail(e) {
  console.error(e);
  toast(errMsg(e), "err");
}

export function errMsg(e) {
  const code = e?.code || "";
  const M = {
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/invalid-email": "Ese correo no es válido.",
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Usa “Entrar”.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.",
    "auth/network-request-failed": "Sin conexión a internet.",
    "auth/popup-closed-by-user": "Se cerró la ventana de Google.",
    "permission-denied": "No tienes permiso para hacer eso.",
    "unavailable": "Sin conexión. Se guardará cuando vuelva la señal.",
  };
  return M[code] || e?.message || "Ocurrió un error.";
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el || !A[el.dataset.act]) return;
  e.preventDefault();
  if (el.dataset.busy) return;
  el.dataset.busy = "1";
  Promise.resolve()
    .then(() => A[el.dataset.act](el, e))
    .catch(fail)
    .finally(() => delete el.dataset.busy);
});

document.addEventListener("submit", (e) => {
  const f = e.target.closest("form[data-form]");
  if (!f || !F[f.dataset.form]) return;
  e.preventDefault();
  const btn = f.querySelector("button:not([type=button])");
  if (btn) btn.disabled = true;
  Promise.resolve()
    .then(() => F[f.dataset.form](Object.fromEntries(new FormData(f)), f))
    .catch(fail)
    .finally(() => btn && (btn.disabled = false));
});

document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-change]");
  if (el && C[el.dataset.change]) Promise.resolve().then(() => C[el.dataset.change](el, e)).catch(fail);
});

// ---------- pantallas de entrada ----------

const EMOJIS = ["👩", "👨", "👧", "👦", "👵", "👴", "🧑", "👶", "🧒", "👱‍♀️", "👱", "🧔"];

function loginScreen() {
  if (S.demo) {
    return `<div class="center-screen login">
      <div class="big">🏡</div><h1>Mi Familia</h1>
      <p class="muted">Avisos, compras, salidas seguras, calendario y momentos en común.</p>
      <div class="card">
        <h3>Probar la demo</h3>
        <p class="small muted">Entra como cualquier persona de la “Familia Pérez”. Abre otra pestaña como otra persona para ver cómo se sincroniza todo.</p>
        <div class="grid2">${S.store.demoPeople().map((p) =>
          `<button class="btn big-choice" data-act="demoLogin" data-id="${p.id}"><span class="big">${p.emoji}</span>${esc(p.name)}</button>`).join("")}</div>
      </div>
      <p class="small muted">Los datos de la demo quedan solo en este navegador. Para usarla de verdad con tu familia, configura Firebase (ver LEEME).</p>
    </div>`;
  }
  const mode = S.loginMode || "entrar";
  return `<div class="center-screen login">
    <div class="big">🏡</div><h1>Mi Familia</h1>
    <p class="muted">Todo lo de la casa, en un solo lugar.</p>
    <div class="card">
      <div class="seg"><button class="${mode === "entrar" ? "on" : ""}" data-act="loginMode" data-m="entrar">Entrar</button>
      <button class="${mode === "crear" ? "on" : ""}" data-act="loginMode" data-m="crear">Crear cuenta</button></div>
      <form data-form="login" class="form">
        ${mode === "crear" ? `<div class="field"><label>Tu nombre</label><input name="name" required autocomplete="name" placeholder="Ej: Carla"></div>` : ""}
        <div class="field"><label>Correo</label><input name="email" type="email" required autocomplete="email"></div>
        <div class="field"><label>Contraseña</label><input name="pass" type="password" required minlength="6" autocomplete="${mode === "crear" ? "new-password" : "current-password"}"></div>
        <button class="btn primary block">${mode === "crear" ? "Crear cuenta" : "Entrar"}</button>
      </form>
      <div class="or">o</div>
      <button class="btn block" data-act="google"><b>G</b>&nbsp; Continuar con Google</button>
      ${mode === "entrar" ? `<button class="btn ghost block small" data-act="forgot">Olvidé mi contraseña</button>` : ""}
    </div>
  </div>`;
}

A.demoLogin = (el) => S.store.signInAs(el.dataset.id);
A.demoSwitch = () => {
  const {el, close} = sheet(`<h2>¿Quién eres?</h2><p class="muted small">Cambia de persona para ver la app como la ve cada uno.</p>
    <div class="grid2">${S.store.demoPeople().map((p) =>
      `<button class="btn big-choice" data-id="${p.id}"><span class="big">${p.emoji}</span>${esc(p.name)}</button>`).join("")}</div>`);
  el.querySelectorAll("[data-id]").forEach((b) => (b.onclick = () => {
    close();
    S.store.signInAs(b.dataset.id);
  }));
};
A.loginMode = (el) => {
  S.loginMode = el.dataset.m;
  render();
};
A.google = () => S.store.signInGoogle();
A.forgot = async () => {
  const email = document.querySelector('form[data-form="login"] [name=email]')?.value.trim();
  if (!email) return toast("Escribe tu correo arriba y vuelve a tocar “Olvidé mi contraseña”.");
  await S.store.resetPassword(email);
  toast("Te enviamos un correo para crear una contraseña nueva.");
};
F.login = async (d) => {
  if (S.loginMode === "crear") await S.store.signUp(d.name, d.email, d.pass);
  else await S.store.signIn(d.email, d.pass);
};

function onboardingScreen() {
  const code = new URLSearchParams(location.search).get("codigo") || "";
  const name = esc(S.user.name || "");
  const emojiPick = (n) => `<div class="emoji-pick">${EMOJIS.map((e, i) =>
    `<label><input type="radio" name="${n}" value="${e}"${i === 0 ? " checked" : ""}><span>${e}</span></label>`).join("")}</div>`;
  return `<div class="center-screen onboarding">
    ${S.families.length ? `<button class="btn ghost back" data-act="cancelOnboarding">← Volver</button>` : ""}
    <div class="big">👨‍👩‍👧‍👦</div><h1>${S.families.length ? "Otra familia" : `¡Hola${name ? ", " + name : ""}!`}</h1>
    <p class="muted">Crea el espacio de tu familia o únete con el código que te mandaron.</p>
    <div class="card">
      <h3>🔑 Tengo un código</h3>
      <form data-form="join" class="form">
        <div class="field"><label>Código de invitación</label><input name="code" required value="${esc(code)}" placeholder="Ej: K7P2XM" maxlength="6" class="code-input" autocapitalize="characters"></div>
        <div class="field"><label>Tu nombre en la familia</label><input name="name" required value="${name}" placeholder="Ej: Mamá, Juan, Abuela Rosa"></div>
        <div class="field"><label>Tu ícono</label>${emojiPick("emoji")}</div>
        <button class="btn primary block">Unirme</button>
      </form>
    </div>
    <div class="card">
      <h3>🏡 Crear una familia nueva</h3>
      <form data-form="createFamily" class="form">
        <div class="field"><label>Nombre de la familia</label><input name="family" required placeholder="Ej: Familia Pérez González"></div>
        <div class="field"><label>Tu nombre en la familia</label><input name="name" required value="${name}" placeholder="Ej: Mamá"></div>
        <div class="field"><label>Tu ícono</label>${emojiPick("emoji2")}</div>
        <button class="btn block">Crear familia</button>
      </form>
    </div>
    <button class="btn ghost small" data-act="logout">Cerrar sesión</button>
  </div>`;
}

const COLORS = ["#e8590c", "#1971c2", "#c2255c", "#5f3dc4", "#2b8a3e", "#0c8599", "#e67700", "#862e9c"];
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

async function enterFamily(fid) {
  S.families = await S.store.myFamilies();
  S.wantOnboarding = false;
  history.replaceState(null, "", location.pathname + "#/hoy");
  openFamily(fid);
}

F.join = async (d) => {
  const fid = await S.store.joinFamily(d.code.trim(), {name: d.name, emoji: d.emoji || "🧑", color: randomColor()});
  toast("¡Bienvenido/a a la familia! 🎉");
  await enterFamily(fid);
};
F.createFamily = async (d) => {
  const fid = await S.store.createFamily(d.family, {name: d.name, emoji: d.emoji2 || "🧑", color: randomColor()});
  toast("Familia creada. Ahora invita a los demás desde tu perfil 👋");
  await enterFamily(fid);
};
A.cancelOnboarding = () => {
  S.wantOnboarding = false;
  render();
};
A.logout = () => S.store.signOut();

A.switchFamily = () => {
  const {el, close} = sheet(`<h2>Mis familias</h2>
    <div class="list">${S.families.map((f) => `<button class="list-item ${f.id === S.fid ? "on" : ""}" data-id="${f.id}">🏡 ${esc(f.name)} ${f.id === S.fid ? "✓" : ""}</button>`).join("")}</div>
    <button class="btn block" data-new>➕ Crear o unirme a otra familia</button>`);
  el.querySelectorAll("[data-id]").forEach((b) => (b.onclick = () => {
    close();
    if (b.dataset.id !== S.fid) openFamily(b.dataset.id);
  }));
  el.querySelector("[data-new]").onclick = () => {
    close();
    S.wantOnboarding = true;
    render();
  };
};

// Al final del módulo: si ya hay sesión, onAuth responde de inmediato y
// necesita que todo lo de arriba (pantallas, acciones) ya exista.
S.store.onAuth(async (user) => {
  S.user = user;
  stopFamily();
  S.fid = null;
  if (!user) return render();
  screen("loading", loader);
  try {
    S.families = await S.store.myFamilies();
  } catch (e) {
    console.error(e);
    S.families = [];
  }
  const saved = local.getItem("mf_fid");
  const pick = S.families.find((f) => f.id === saved) || S.families[0];
  openFamily(pick?.id || null);
});

