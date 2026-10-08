// Cuidado: "Salí / Llegué" con llegada segura, ubicación en vivo temporal,
// mapa, botón SOS y fichas médicas.

import {esc, ago, fmtTime, timeToTs, openForm, confirmar, toast, sheet, getPosition, mapsLink, loadScript, loadCss, linkify} from "../util.js";
import {S, A, rerender, list, members, member, me, nameOf, avatar, add, upd, del, isAdult, isAdmin, subnav, empty, findById, setDoc} from "../state.js";
import {enCamino, miSalida} from "../logic.js";

export function render(sub = "salidas") {
  const nav = subnav("cuidado", sub, [["salidas", "🚶 Salidas"], ["mapa", "🗺️ Mapa"], ["fichas", "🩺 Fichas médicas"]]);
  if (sub === "mapa") return nav + mapa();
  if (sub === "fichas") return nav + fichas();
  return nav + salidas();
}

export function after(sub) {
  if (sub === "mapa") initMap().catch((e) => console.error(e));
}

// ---------- salidas ----------

function salidaCard(s) {
  const late = s.estado === "en_camino" && s.esperaAt && s.esperaAt < Date.now();
  const mine = s.quien === S.user.uid;
  return `<article class="card salida ${late ? "warn" : ""} ${s.estado === "llego" ? "done" : ""}">
    <div class="row">${avatar(s.quien, "lg")}<div class="grow">
      <b>${esc(mine ? "Tú" : nameOf(s.quien))}</b> ${s.estado === "llego" ? "llegó a" : "va hacia"} <b>${esc(s.destino)}</b>
      <div class="small muted">Salió ${fmtTime(s.salioAt)} (${ago(s.salioAt)})${s.by !== s.quien ? ` · lo anotó ${esc(nameOf(s.by))}` : ""}</div>
      ${s.estado === "llego" ? `<div class="small">✅ Llegó ${fmtTime(s.llegoAt)}</div>`
        : s.esperaAt ? `<div class="small ${late ? "bad-t" : ""}">${late ? "⚠️ Debía llegar" : "🕑 Llega aprox."} ${fmtTime(s.esperaAt)}</div>` : ""}
      ${s.lat ? `<a class="small" href="${mapsLink(s.lat, s.lng)}" target="_blank" rel="noopener">📍 desde dónde salió</a>` : ""}
    </div></div>
    ${s.estado === "en_camino" ? `<div class="row wrap">
      <button class="btn primary grow" data-act="llegue" data-id="${s.id}">✅ ${mine ? "Llegué" : "Ya llegó"}</button>
      ${mine && s.esperaAt ? `<button class="btn" data-act="demoro" data-id="${s.id}">⏱️ +15 min</button>` : ""}
      ${mine || isAdult() ? `<button class="btn ghost" data-act="salidaCancelar" data-id="${s.id}">Cancelar</button>` : ""}
    </div>` : ""}
  </article>`;
}

function salidas() {
  const mine = miSalida();
  const fuera = enCamino().filter((s) => s !== mine);
  const hist = list("salidas").filter((s) => s.estado === "llego").slice(0, 15);
  return `${mine ? salidaCard(mine) : `<button class="huge" data-act="sali">🚶 Salí</button>`}
    ${isAdult() ? `<button class="btn block" data-act="saliOtro">👧 Anotar la salida de otra persona</button>` : ""}
    <p class="small muted">Si indicas a qué hora llegas, la familia recibe una alerta cuando pasa esa hora y no has marcado “Llegué”.</p>
    <h3 class="sec">Fuera de casa ahora</h3>
    ${fuera.length ? fuera.map(salidaCard).join("") : `<p class="muted">Nadie más está en camino.</p>`}
    ${hist.length ? `<h3 class="sec muted">Últimas llegadas</h3>${hist.map(salidaCard).join("")}` : ""}
    ${emergencias()}`;
}

const DESTINOS = ["Colegio", "Trabajo", "Universidad", "Supermercado", "Casa de la abuela", "Donde un amigo/a", "Gimnasio", "Doctor"];

async function nuevaSalida(quien) {
  const forOther = quien !== S.user.uid;
  const d = await openForm({
    title: forOther ? "Anotar salida" : "Voy saliendo",
    fields: [
      ...(forOther ? [{name: "quien", label: "¿Quién sale?", type: "member", members: members().filter((m) => m.id !== S.user.uid), required: true}] : []),
      {name: "destino", label: "¿Hacia dónde?", required: true, suggest: DESTINOS},
      {name: "hora", label: "¿A qué hora llega? (llegada segura)", type: "time",
        hint: "Opcional. Si pasa esa hora sin marcar “Llegué”, avisamos a la familia."},
      {name: "ubicacion", label: "Guardar desde dónde sale (ubicación)", type: "checkbox", value: !forOther},
      ...(forOther ? [] : [{name: "envivo", label: "Compartir mi ubicación en vivo hasta que llegue", type: "checkbox"}]),
    ],
    submit: "Avisar",
  });
  if (!d) return;
  const who = forOther ? d.quien : S.user.uid;
  const pos = d.ubicacion ? await getPosition(8000) : null;
  const esperaAt = timeToTs(d.hora);
  await add("salidas", {quien: who, destino: d.destino, salioAt: Date.now(), esperaAt, estado: "en_camino",
    ...(pos ? {lat: pos.lat, lng: pos.lng} : {})});
  if (d.envivo) await startSharing(esperaAt ? esperaAt + 30 * 60e3 : Date.now() + 2 * 3600e3);
  toast(forOther ? "Salida anotada" : "¡Cuídate! Avisamos a la familia 🚶");
}

A.sali = () => nuevaSalida(S.user.uid);
A.saliOtro = () => nuevaSalida(null);
A.llegue = async (el) => {
  const s = findById("salidas", el.dataset.id);
  if (!s) return;
  await upd("salidas", s.id, {estado: "llego", llegoAt: Date.now(), llegoMarcadoPor: S.user.uid});
  if (s.quien === S.user.uid && myLocation()?.hasta > Date.now()) await stopSharing();
  toast(s.quien === S.user.uid ? "¡Qué bueno que llegaste! ✅" : `Marcamos que ${nameOf(s.quien)} llegó ✅`);
};
A.demoro = (el) => {
  const s = findById("salidas", el.dataset.id);
  return upd("salidas", s.id, {esperaAt: Math.max(s.esperaAt || 0, Date.now()) + 15 * 60e3, avisoAtraso: false}).then(() => toast("Avisamos que te demoras 15 min"));
};
A.salidaCancelar = async (el) => {
  if (await confirmar("¿Cancelar esta salida?")) await del("salidas", el.dataset.id);
};

function emergencias() {
  return `<div class="card"><h3>📞 Emergencias (Chile)</h3><div class="call-grid">
    <a class="call" href="tel:131"><span class="big">🚑</span><span>131 SAMU</span></a>
    <a class="call" href="tel:132"><span class="big">🚒</span><span>132 Bomberos</span></a>
    <a class="call" href="tel:133"><span class="big">🚓</span><span>133 Carabineros</span></a>
    <a class="call" href="tel:6003607777"><span class="big">☠️</span><span>CITUC Intoxicaciones</span></a>
  </div></div>`;
}

// ---------- SOS ----------

A.sos = () => {
  const {el, close} = sheet(`<div class="center"><div class="big">🚨</div><h2>¿Enviar alerta SOS?</h2>
    <p class="muted">Toda la familia recibe una alerta con tu ubicación, aunque tengan “no molestar”.</p></div>
    <div class="field"><input id="sosMsg" placeholder="Mensaje opcional (ej: me caí, estoy en el metro)"></div>
    <button class="huge sos" data-send>🚨 ENVIAR SOS</button>
    <button class="btn ghost block" data-cancel>Cancelar</button>`, {cls: "sos-sheet"});
  el.querySelector("[data-cancel]").onclick = () => close();
  el.querySelector("[data-send]").onclick = async (e) => {
    e.target.disabled = true;
    e.target.textContent = "Obteniendo ubicación…";
    const msg = el.querySelector("#sosMsg").value.trim();
    const pos = await getPosition(8000);
    await add("sos", {at: Date.now(), mensaje: msg, resuelto: false, voy: {}, ...(pos ? {lat: pos.lat, lng: pos.lng, acc: pos.acc} : {})});
    if (pos) await startSharing(Date.now() + 60 * 60e3);
    close();
    toast("Alerta enviada a toda la familia 🚨", "err");
    navigator.vibrate?.(300);
  };
};

// ---------- ubicación en vivo ----------

const myLocation = () => list("ubicaciones").find((u) => u.id === S.user?.uid);
let watchId = null;
let lastSent = {t: 0, lat: 0, lng: 0};

async function startSharing(hasta) {
  const pos = await getPosition(10000);
  if (!pos) return toast("No pudimos obtener tu ubicación. Revisa los permisos del navegador.", "err");
  await setDoc("ubicaciones", S.user.uid, {...pos, at: Date.now(), hasta}, false);
  lastSent = {t: Date.now(), ...pos};
  ensureWatch();
}

async function stopSharing() {
  if (watchId != null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  await setDoc("ubicaciones", S.user.uid, {hasta: Date.now()}, true);
}

function ensureWatch() {
  const loc = myLocation();
  const active = loc && loc.hasta > Date.now();
  if (active && watchId == null && navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition((p) => {
      const {latitude: lat, longitude: lng, accuracy} = p.coords;
      const moved = Math.hypot((lat - lastSent.lat) * 111000, (lng - lastSent.lng) * 111000 * Math.cos(lat * Math.PI / 180));
      if (Date.now() - lastSent.t < 20000 && moved < 30) return;
      lastSent = {t: Date.now(), lat, lng};
      setDoc("ubicaciones", S.user.uid, {lat, lng, acc: Math.round(accuracy), at: Date.now()}, true).catch(() => {});
    }, () => {}, {enableHighAccuracy: true, maximumAge: 15000});
  } else if (!active && watchId != null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}
// Retoma (o corta) la ubicación en vivo al abrir la app o cuando vence.
setInterval(() => S.fid && S.user && ensureWatch(), 15000);

A.compartir = async () => {
  const d = await openForm({
    title: "Compartir mi ubicación en vivo",
    intro: "La familia te verá en el mapa. Se actualiza mientras la app esté abierta en tu teléfono.",
    fields: [{name: "min", label: "¿Por cuánto tiempo?", type: "select", value: "60",
      options: [{value: "30", label: "30 minutos"}, {value: "60", label: "1 hora"}, {value: "120", label: "2 horas"}, {value: "480", label: "8 horas"}]}],
    submit: "Compartir",
  });
  if (d) await startSharing(Date.now() + Number(d.min) * 60e3);
};
A.dejarCompartir = () => stopSharing().then(() => toast("Dejaste de compartir tu ubicación"));

// ---------- mapa ----------

let map = null;
let layer = null;
let fitted = false;

function mapa() {
  const loc = myLocation();
  const sharing = loc && loc.hasta > Date.now();
  const activos = list("ubicaciones").filter((u) => u.hasta > Date.now());
  return `<div class="card">
      ${sharing ? `<div class="row"><div class="grow">📡 Estás compartiendo tu ubicación hasta las <b>${fmtTime(loc.hasta)}</b></div>
          <button class="btn sm" data-act="dejarCompartir">Dejar de compartir</button></div>`
        : `<button class="btn primary block" data-act="compartir">📡 Compartir mi ubicación en vivo</button>`}
    </div>
    <div id="map" data-keep="map" class="map"></div>
    ${activos.length ? activos.map((u) => `<div class="card li-card">${avatar(u.id, "lg")}<div class="grow"><b>${esc(nameOf(u.id))}</b>
      <div class="small muted">actualizado ${ago(u.at)} · hasta ${fmtTime(u.hasta)}${u.acc ? ` · ±${u.acc} m` : ""}</div></div>
      <a class="btn sm" href="${mapsLink(u.lat, u.lng)}" target="_blank" rel="noopener">Abrir en Maps</a></div>`).join("")
      : `<p class="muted center small">Nadie está compartiendo su ubicación ahora. En el mapa también aparecen los puntos de salida de hoy.</p>`}
    <p class="small muted">🔒 La ubicación solo se comparte cuando cada uno lo decide, por un tiempo limitado, y solo la ve esta familia.</p>`;
}

async function initMap() {
  loadCss("vendor/leaflet/leaflet.css");
  await loadScript("vendor/leaflet/leaflet.js");
  const el = document.getElementById("map");
  if (!el) return;
  const L = window.L;
  if (!map || map.getContainer() !== el) {
    map?.remove();
    map = L.map(el, {zoomControl: true}).setView([-33.45, -70.66], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19, attribution: "© OpenStreetMap"}).addTo(map);
    layer = L.layerGroup().addTo(map);
    fitted = false;
  }
  layer.clearLayers();
  const pts = [];
  const icon = (uid, extra = "") => L.divIcon({className: "map-pin " + extra, html: avatar(uid, "lg"), iconSize: [44, 44], iconAnchor: [22, 22]});
  for (const u of list("ubicaciones").filter((x) => x.hasta > Date.now())) {
    L.marker([u.lat, u.lng], {icon: icon(u.id, "live")}).addTo(layer).bindPopup(`<b>${esc(nameOf(u.id))}</b><br>${ago(u.at)}`);
    if (u.acc) L.circle([u.lat, u.lng], {radius: u.acc, weight: 1, fillOpacity: 0.08}).addTo(layer);
    pts.push([u.lat, u.lng]);
  }
  const hoy = Date.now() - 18 * 3600e3;
  for (const s of list("salidas").filter((x) => x.lat && x.salioAt > hoy)) {
    L.marker([s.lat, s.lng], {icon: icon(s.quien, "past"), opacity: 0.7}).addTo(layer)
      .bindPopup(`<b>${esc(nameOf(s.quien))}</b> salió hacia ${esc(s.destino)}<br>${fmtTime(s.salioAt)}`);
    pts.push([s.lat, s.lng]);
  }
  for (const s of list("sos").filter((x) => !x.resuelto && x.lat)) {
    L.marker([s.lat, s.lng], {icon: L.divIcon({className: "map-pin sos-pin", html: "🚨", iconSize: [44, 44], iconAnchor: [22, 22]})})
      .addTo(layer).bindPopup(`<b>SOS de ${esc(nameOf(s.by))}</b><br>${fmtTime(s.at)}`);
    pts.push([s.lat, s.lng]);
  }
  setTimeout(() => map.invalidateSize(), 50);
  if (!fitted && pts.length) {
    map.fitBounds(pts, {padding: [40, 40], maxZoom: 15});
    fitted = true;
  }
}

// ---------- fichas médicas ----------

const MED = [
  ["sangre", "Grupo sanguíneo"], ["alergias", "Alergias"], ["enfermedades", "Enfermedades / condiciones"],
  ["medicamentos", "Medicamentos"], ["prevision", "Previsión / seguro"], ["contacto", "Contacto de emergencia"], ["notas", "Otras notas"],
];

function fichas() {
  return `<p class="small muted">Para tener a mano en una urgencia. Solo la ve esta familia.</p>
    ${members().map((m) => {
      const md = m.medical || {};
      const has = MED.some(([k]) => md[k]);
      const canEdit = m.id === S.user.uid || isAdult();
      return `<article class="card ficha">
        <div class="row">${avatar(m.id, "lg")}<div class="grow"><h3>${esc(m.name)}</h3>
          ${md.sangre ? `<span class="tag bad">🩸 ${esc(md.sangre)}</span>` : ""}
          ${m.birthday ? `<span class="small muted">${edadPersona(m.birthday)}</span>` : ""}</div>
          ${canEdit ? `<button class="icon-btn" data-act="editarFicha" data-id="${m.id}" aria-label="Editar">✏️</button>` : ""}</div>
        ${md.alergias ? `<div class="alergia">⚠️ <b>Alergias:</b> ${esc(md.alergias)}</div>` : ""}
        ${has ? MED.filter(([k]) => k !== "sangre" && k !== "alergias" && md[k]).map(([k, l]) => `<div class="small"><b>${l}:</b> ${linkify(md[k])}</div>`).join("")
          : `<p class="small muted">Sin información todavía.</p>`}
      </article>`;
    }).join("")}
    ${emergencias()}`;
}

function edadPersona(b) {
  const d = new Date(b);
  if (isNaN(d)) return "";
  const n = new Date();
  let y = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) y--;
  return y > 0 && y < 120 ? `${y} años` : "";
}

A.editarFicha = async (el) => {
  const m = member(el.dataset.id);
  const md = m.medical || {};
  const d = await openForm({
    title: `Ficha médica de ${m.name}`,
    fields: MED.map(([k, l]) => (k === "sangre"
      ? {name: k, label: l, type: "select", value: md[k] || "", options: ["", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((v) => ({value: v, label: v || "No sé"}))}
      : {name: k, label: l, type: ["notas", "medicamentos", "enfermedades"].includes(k) ? "textarea" : "text", rows: 2, value: md[k] || ""})),
  });
  if (d) await upd("members", m.id, {medical: d});
};
