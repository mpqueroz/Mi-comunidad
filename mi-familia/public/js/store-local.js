// MODO DEMO: misma interfaz que store-firebase.js, pero todo vive en el
// localStorage de este navegador. Varias pestañas se sincronizan entre sí
// (cada pestaña puede "ser" una persona distinta de la familia), lo que
// sirve para probar avisos, "yo me encargo", SOS, etc. sin servidor.

import {randomId, dayKey, addDays, compressImage, blobToDataURL, local, session} from "./util.js";

const KEY = "mi_familia_demo_v1";
const PERSONA = "mi_familia_demo_persona";
const DEL = {__del: true};

export const isDemo = true;
export const del = () => DEL;

let state;
const listeners = new Set();
const authCbs = [];

function load() {
  try {
    state = JSON.parse(local.getItem(KEY));
  } catch {
    state = null;
  }
  if (!state?.families) {
    state = seed();
    persist();
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // Lleno (fotos) o bloqueado: la demo sigue funcionando en memoria.
    if (e?.name === "QuotaExceededError") console.warn("Almacenamiento de la demo lleno");
  }
}

function changed() {
  persist();
  listeners.forEach((l) => l());
}

window.addEventListener("storage", (e) => {
  if (e.key !== KEY || !e.newValue) return;
  try {
    state = JSON.parse(e.newValue);
  } catch {
    return;
  }
  listeners.forEach((l) => l());
});

const persona = () => session.getItem(PERSONA) || local.getItem(PERSONA);
function currentUser() {
  const uid = persona();
  const u = uid && state.users[uid];
  return u ? {uid, name: u.name, email: u.email} : null;
}
const fireAuth = () => authCbs.forEach((cb) => cb(currentUser()));

export function init() {
  load();
}
export function onAuth(cb) {
  authCbs.push(cb);
  cb(currentUser());
}
export const uid = () => currentUser()?.uid;

export function demoPeople() {
  return Object.entries(state.users).map(([id, u]) => ({id, name: u.name, emoji: u.emoji}));
}
export function signInAs(id) {
  session.setItem(PERSONA, id);
  local.setItem(PERSONA, id);
  fireAuth();
}
export function signOut() {
  session.removeItem(PERSONA);
  local.removeItem(PERSONA);
  fireAuth();
}
export function resetDemo() {
  state = seed();
  changed();
}

// ---------- familias ----------

export async function myFamilies() {
  const u = state.users[uid()];
  return Object.keys(u?.familias || {})
    .filter((id) => state.families[id])
    .map((id) => ({id, name: state.families[id].name}));
}

export async function createFamily(name, me) {
  const fid = randomId();
  const u = uid();
  state.families[fid] = {name, ownerUid: u, createdAt: Date.now(), cols: {members: {}}};
  state.families[fid].cols.members[u] = {...me, role: "admin", joinedAt: Date.now()};
  state.users[u].familias = {...state.users[u].familias, [fid]: name};
  changed();
  return fid;
}

export async function createInvite(fid, role) {
  const code = randomId(6, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789");
  state.invites[code] = {familyId: fid, familyName: state.families[fid].name, role, by: uid(),
    createdAt: Date.now(), expiresAt: Date.now() + 7 * 864e5};
  changed();
  return code;
}

export async function joinFamily(code, me) {
  const inv = state.invites[code.toUpperCase()];
  if (!inv || inv.expiresAt < Date.now()) throw new Error("El código no existe o ya venció.");
  const fam = state.families[inv.familyId];
  const u = uid();
  if (!fam.cols.members[u]) fam.cols.members[u] = {...me, role: inv.role, joinedAt: Date.now()};
  state.users[u].familias = {...state.users[u].familias, [inv.familyId]: fam.name};
  changed();
  return inv.familyId;
}

export async function leaveFamily(fid, who = uid()) {
  delete state.families[fid]?.cols.members[who];
  if (state.users[who]?.familias) delete state.users[who].familias[fid];
  changed();
}

export function watchFamily(fid, cb) {
  const fire = () => {
    const f = state.families[fid];
    cb(f ? {id: fid, name: f.name, ownerUid: f.ownerUid} : null);
  };
  listeners.add(fire);
  fire();
  return () => listeners.delete(fire);
}

export async function updateFamily(fid, patch) {
  Object.assign(state.families[fid], patch);
  for (const u of Object.values(state.users)) if (u.familias?.[fid] && patch.name) u.familias[fid] = patch.name;
  changed();
}

// ---------- colecciones ----------

const colOf = (fid, col) => ((state.families[fid].cols[col] ||= {}));

function query(fid, col, {where, orderBy, limit} = {}) {
  if (!state.families[fid]) return [];
  let list = Object.entries(state.families[fid].cols[col] || {}).map(([id, d]) => ({id, ...structuredClone(d)}));
  if (where) {
    const [f, op, v] = where;
    list = list.filter((d) => (op === "==" ? d[f] === v : op === ">=" ? d[f] >= v : op === "<=" ? d[f] <= v : true));
  }
  if (orderBy) {
    const [f, dir] = orderBy;
    list = list.filter((d) => d[f] != null);
    list.sort((a, b) => (a[f] < b[f] ? -1 : a[f] > b[f] ? 1 : 0) * (dir === "desc" ? -1 : 1));
  }
  if (limit) list = list.slice(0, limit);
  return list;
}

export function watch(fid, col, cb, opts) {
  const fire = () => cb(query(fid, col, opts));
  listeners.add(fire);
  fire();
  return () => listeners.delete(fire);
}

const clean = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v === undefined ? null : v)));

export async function add(fid, col, data) {
  const id = randomId();
  colOf(fid, col)[id] = clean(data);
  changed();
  return id;
}

export async function set(fid, col, id, data, {merge = false} = {}) {
  const c = colOf(fid, col);
  c[id] = merge && c[id] ? deepMerge(c[id], clean(data)) : clean(data);
  changed();
}

function deepMerge(a, b) {
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === "object" && !Array.isArray(v) && !v.__del && a[k] && typeof a[k] === "object") deepMerge(a[k], v);
    else if (v?.__del) delete a[k];
    else a[k] = v;
  }
  return a;
}

// Igual que updateDoc de Firestore: acepta rutas con punto ("votos.uid").
export async function update(fid, col, id, patch) {
  const doc = colOf(fid, col)[id];
  if (!doc) throw new Error("Ese elemento ya no existe.");
  for (const [path, v] of Object.entries(patch)) {
    const parts = path.split(".");
    let o = doc;
    for (const p of parts.slice(0, -1)) o = o[p] && typeof o[p] === "object" ? o[p] : (o[p] = {});
    const last = parts.at(-1);
    if (v?.__del) delete o[last];
    else o[last] = v === undefined ? null : structuredClone(v);
  }
  changed();
}

export async function remove(fid, col, id) {
  delete colOf(fid, col)[id];
  changed();
}

export async function uploadPhoto(fid, file) {
  const blob = await compressImage(file, 900, 0.7);
  return {url: await blobToDataURL(blob), path: null};
}
export async function deletePhotoFile() {}

export async function enablePush() {
  return "demo";
}
export const pushStatus = () => "demo";

// ---------- datos de ejemplo ----------

function photo(emoji, from, to) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="600" height="450" fill="url(#g)"/><text x="300" y="270" font-size="170" text-anchor="middle">${emoji}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function seed() {
  const now = Date.now();
  const today = new Date();
  const d = (n) => dayKey(addDays(today, n));
  const h = (hours) => now + hours * 3600e3;
  const fid = "demo";
  const P = "u_carla", J = "u_juan", S = "u_sofia", R = "u_rosa";
  const lastYear = new Date(today);
  lastYear.setFullYear(today.getFullYear() - 1);
  const twoYears = new Date(today);
  twoYears.setFullYear(today.getFullYear() - 2);
  const cumple = (n) => d(n).slice(5);
  const mk = (arr) => Object.fromEntries(arr.map((x, i) => [x.id || "s" + i, (({id, ...r}) => r)(x)]));

  const members = {
    [P]: {name: "Carla", emoji: "👩", color: "#e8590c", role: "admin", joinedAt: 1, phone: "+56 9 1111 2222",
      birthday: "1985-" + cumple(9), mood: "🙂", moodNote: "Día largo de pega", moodAt: h(-2),
      medical: {sangre: "O+", alergias: "Penicilina", medicamentos: "", enfermedades: "", prevision: "Isapre Colmena",
        contacto: "Juan +56 9 3333 4444", notas: ""}},
    [J]: {name: "Juan", emoji: "👨", color: "#1971c2", role: "admin", joinedAt: 2, phone: "+56 9 3333 4444",
      birthday: "1983-03-14", mood: "😄", moodNote: "", moodAt: h(-5),
      medical: {sangre: "A+", alergias: "", medicamentos: "", enfermedades: "", prevision: "Fonasa B", contacto: "", notas: ""}},
    [S]: {name: "Sofía", emoji: "👧", color: "#c2255c", role: "nino", joinedAt: 3, phone: "+56 9 5555 6666",
      birthday: "2013-" + cumple(4), mood: "😴", moodNote: "Prueba de mate mañana", moodAt: h(-1),
      dndUntil: h(1.5), dndText: "Estudiando",
      medical: {sangre: "O+", alergias: "Maní (grave), polen", medicamentos: "Inhalador si hay crisis de asma",
        enfermedades: "Asma leve", prevision: "Isapre Colmena", contacto: "Carla +56 9 1111 2222", notas: "Colegio: 2° medio B"}},
    [R]: {name: "Abuela Rosa", emoji: "👵", color: "#5f3dc4", role: "adulto", joinedAt: 4, simple: true,
      phone: "+56 2 2222 3333", birthday: "1952-07-02", mood: "🙂", moodAt: h(-20),
      medical: {sangre: "B+", alergias: "", medicamentos: "Losartán 50 mg mañana", enfermedades: "Hipertensión",
        prevision: "Fonasa", contacto: "Carla +56 9 1111 2222", notas: ""}},
  };

  return {
    users: {
      [P]: {name: "Carla", emoji: "👩", email: "carla@demo", familias: {[fid]: "Familia Pérez"}},
      [J]: {name: "Juan", emoji: "👨", email: "juan@demo", familias: {[fid]: "Familia Pérez"}},
      [S]: {name: "Sofía", emoji: "👧", email: "sofia@demo", familias: {[fid]: "Familia Pérez"}},
      [R]: {name: "Abuela Rosa", emoji: "👵", email: "rosa@demo", familias: {[fid]: "Familia Pérez"}},
    },
    invites: {},
    families: {
      [fid]: {
        name: "Familia Pérez", ownerUid: P, createdAt: now,
        cols: {
          members,
          avisos: mk([
            {by: P, createdAt: h(-1), texto: "Hoy llega el pedido de Falabella (zapatillas de Sofía) entre 14:00 y 18:00. ¿Alguien puede estar en casa?",
              prioridad: "importante", fecha: d(0), necesita: true, encargado: R, reacciones: {[J]: "👍"}},
            {by: J, createdAt: h(-3), texto: "Mañana cortan el agua de 9:00 a 13:00. Llenen unos bidones hoy en la noche 💧",
              prioridad: "urgente", fecha: d(1), necesita: true, encargado: null},
            {by: R, createdAt: h(-26), texto: "Hice pan amasado, pasen a buscar 🍞", prioridad: "normal", reacciones: {[S]: "❤️", [P]: "❤️"}},
            {by: P, createdAt: h(-50), texto: "Recordar firmar la comunicación del colegio", prioridad: "normal", done: true, doneBy: J, doneAt: h(-40)},
          ]),
          pedidos: mk([
            {by: P, createdAt: h(-30), tienda: "Falabella", descripcion: "Zapatillas Sofía", fecha: d(0), desde: "14:00", hasta: "18:00",
              seguimiento: "FAL123456789", url: "", estado: "pendiente", encargado: R},
            {by: J, createdAt: h(-10), tienda: "Mercado Libre", descripcion: "Repuesto aspiradora", fecha: d(2), desde: "", hasta: "",
              seguimiento: "ML-998877", url: "", estado: "pendiente", encargado: null},
            {by: P, createdAt: h(-90), tienda: "Lider", descripcion: "Compra del mes", fecha: d(-3), estado: "recibido", recibidoPor: J, recibidoAt: h(-70)},
          ]),
          fijados: mk([
            {by: J, createdAt: 1, tipo: "wifi", titulo: "WiFi de la casa", contenido: "Red: Perez_5G\nClave: casita2024"},
            {by: P, createdAt: 2, tipo: "salud", titulo: "Pediatra Dra. Muñoz", contenido: "+56 2 2345 6789\nClínica Alemana, consulta 304"},
            {by: J, createdAt: 3, tipo: "telefono", titulo: "Gásfiter de confianza (Don Pedro)", contenido: "+56 9 8765 4321"},
            {by: P, createdAt: 4, tipo: "casa", titulo: "Basura", contenido: "Pasa el camión lunes, miércoles y viernes en la noche."},
          ]),
          compras: mk([
            {by: P, createdAt: h(-5), texto: "Leche descremada x6", comprado: false},
            {by: S, createdAt: h(-4), texto: "Cereal 🥣", comprado: false},
            {by: R, createdAt: h(-3), texto: "Paltas", comprado: false},
            {by: J, createdAt: h(-8), texto: "Detergente", comprado: true, compradoBy: J, compradoAt: h(-1)},
          ]),
          tareas: mk([
            {by: P, createdAt: 1, titulo: "Sacar la basura", emoji: "🗑️", frecuencia: "diaria", rotacion: [J, S], inicio: d(-10), hechas: {}},
            {by: P, createdAt: 2, titulo: "Pasear a Toby", emoji: "🐕", frecuencia: "diaria", rotacion: [S, P, J], inicio: d(-3),
              hechas: {[d(0)]: S}},
            {by: J, createdAt: 3, titulo: "Regar las plantas", emoji: "🪴", frecuencia: "semanal", rotacion: [R, S], inicio: d(-21), hechas: {}},
          ]),
          eventos: mk([
            {by: P, createdAt: 1, titulo: "Dentista Sofía", fecha: d(1), hora: "16:30", tipo: "salud", quienes: [S, P], repetir: "no", notas: ""},
            {by: J, createdAt: 2, titulo: "Reunión de apoderados", fecha: d(3), hora: "19:00", tipo: "colegio", quienes: [J], repetir: "no", notas: "Sala 2°B"},
            {by: P, createdAt: 3, titulo: "Taller de cerámica abuela", fecha: d(-2), hora: "10:00", tipo: "familia", quienes: [R], repetir: "semanal", notas: ""},
            {by: J, createdAt: 4, titulo: "Aniversario Carla y Juan 💍", fecha: "2009-" + d(12).slice(5), hora: "", tipo: "familia", quienes: [P, J], repetir: "anual", notas: ""},
          ]),
          cuentas: mk([
            {by: J, createdAt: 1, nombre: "Luz (Enel)", emoji: "💡", monto: 38500, dia: Number(d(2).slice(8)), notas: "N° cliente 1234567", pagado: {}},
            {by: J, createdAt: 2, nombre: "Agua (Aguas Andinas)", emoji: "💧", monto: 21900, dia: 20, notas: "", pagado: {}},
            {by: P, createdAt: 3, nombre: "Internet", emoji: "📶", monto: 24990, dia: 5, notas: "", pagado: {[dayKey().slice(0, 7)]: {by: P, at: h(-100)}}},
            {by: P, createdAt: 4, nombre: "Gasto común", emoji: "🏢", monto: 85000, dia: 10, notas: "", pagado: {}},
          ]),
          mascotas: mk([
            {by: P, createdAt: 1, nombre: "Toby", emoji: "🐕", especie: "Perro", raza: "Quiltro regalón", nacimiento: "2019-05-01",
              comida: "Pro Plan adulto, 1 taza mañana y noche", notas: "No darle huesos de pollo", vet: "Vet. San Francisco +56 2 2888 9999",
              vacunas: [{nombre: "Antirrábica", fecha: d(-355), proxima: d(10)}, {nombre: "Óctuple", fecha: d(-200), proxima: d(165)}],
              comio: {[d(0)]: {by: S, at: h(-4)}}},
          ]),
          fotos: mk([
            {by: P, createdAt: lastYear.getTime(), takenAt: lastYear.getTime(), url: photo("🏖️", "#4dabf7", "#ffd43b"), path: null, caption: "Vacaciones en la playa"},
            {by: J, createdAt: twoYears.getTime(), takenAt: twoYears.getTime(), url: photo("🎂", "#f783ac", "#ffe066"), path: null, caption: "Cumpleaños de la abuela"},
            {by: S, createdAt: h(-30), takenAt: h(-30), url: photo("🐕", "#69db7c", "#a5d8ff"), path: null, caption: "Toby en el parque"},
          ]),
          votaciones: mk([
            {by: S, createdAt: h(-6), pregunta: "¿Qué cenamos el viernes?", opciones: ["Pizza 🍕", "Sushi 🍣", "Completos 🌭"],
              votos: {[S]: 0, [J]: 2, [R]: 0}, cerrada: false},
          ]),
          planes: mk([
            {by: J, createdAt: h(-20), titulo: "Asado donde la abuela", fecha: d(4), hora: "13:30", lugar: "Casa abuela Rosa",
              notas: "Llevar sillas", asistencia: {[J]: "si", [R]: "si", [S]: "quizas"}, lleva: {[J]: "Carne y carbón", [R]: "Ensaladas"}},
          ]),
          gracias: mk([
            {by: P, createdAt: h(-7), para: S, texto: "Gracias por ordenar tu pieza sin que te lo pidiera 🥹", corazones: {[J]: true}},
            {by: S, createdAt: h(-28), para: R, texto: "Gracias abuela por ayudarme con historia", corazones: {}},
          ]),
          animos: mk([
            {by: S, at: h(-1), mood: "😴", nota: "Prueba de mate mañana"},
            {by: P, at: h(-2), mood: "🙂", nota: "Día largo de pega"},
            {by: J, at: h(-5), mood: "😄", nota: ""},
            {by: S, at: h(-26), mood: "😄", nota: ""},
          ]),
          respuestas: mk([
            {id: `${d(0)}_${R}`, by: R, fecha: d(0), createdAt: h(-2), texto: "Cuando nació Sofía y la tomé en brazos por primera vez."},
          ]),
          salidas: mk([
            {by: J, quien: J, destino: "Oficina", salioAt: h(-2.5), esperaAt: h(-1.9), estado: "llego", llegoAt: h(-2)},
            {by: P, quien: S, destino: "Clases de natación", salioAt: h(-0.4), esperaAt: h(0.5), estado: "en_camino"},
          ]),
          sos: {},
          ubicaciones: {},
        },
      },
    },
  };
}
