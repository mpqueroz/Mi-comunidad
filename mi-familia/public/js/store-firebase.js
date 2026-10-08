// Datos reales: Firebase Auth + Firestore + Storage + Cloud Messaging.
// Misma interfaz que store-local.js (modo demo).
//
// Estructura en Firestore. Todo lleva el prefijo "mi_familia_" porque el
// proyecto de Firebase se comparte con otras apps (ver LEEME):
//   mi_familia_users/{uid}                      {familias: {fid: nombre}, fcmTokens: []}  (solo el dueño)
//   mi_familia_invites/{codigo}                 {familyId, familyName, role, expiresAt}
//   mi_familia_families/{fid}                   {name, ownerUid, createdAt}
//   mi_familia_families/{fid}/members/{uid}     perfil, rol, ánimo, ficha médica
//   mi_familia_families/{fid}/ubicaciones/{uid} ubicación en vivo (solo la escribe su dueño)
//   mi_familia_families/{fid}/{coleccion}/{id}  avisos, pedidos, compras, ... (ver firestore.rules)

const SDK = "https://www.gstatic.com/firebasejs/10.13.2/";
const cfg = self.MI_FAMILIA_CONFIG;

const [appM, authM, fs, st] = await Promise.all([
  import(SDK + "firebase-app.js"),
  import(SDK + "firebase-auth.js"),
  import(SDK + "firebase-firestore.js"),
  import(SDK + "firebase-storage.js"),
]);

const app = appM.initializeApp(cfg.firebase);
const auth = authM.getAuth(app);
auth.languageCode = "es";
let db;
try {
  // Caché local: la app abre y muestra lo último aunque no haya señal.
  db = fs.initializeFirestore(app, {localCache: fs.persistentLocalCache({tabManager: fs.persistentMultipleTabManager()})});
} catch {
  db = fs.getFirestore(app);
}
const storage = st.getStorage(app);

export const isDemo = false;
export const del = () => fs.deleteField();
export const uid = () => auth.currentUser?.uid;

let onPushCb = null;
export const onPush = (cb) => (onPushCb = cb);

export async function init() {
  await authM.getRedirectResult(auth).catch(() => {});
}

export function onAuth(cb) {
  authM.onAuthStateChanged(auth, (u) => {
    cb(u ? {uid: u.uid, name: u.displayName || "", email: u.email || ""} : null);
    if (u && "Notification" in self && Notification.permission === "granted") enablePush().catch(() => {});
  });
}

export const signIn = (email, pass) => authM.signInWithEmailAndPassword(auth, email, pass);
export async function signUp(name, email, pass) {
  const {user} = await authM.createUserWithEmailAndPassword(auth, email, pass);
  await authM.updateProfile(user, {displayName: name});
}
export async function signInGoogle() {
  const provider = new authM.GoogleAuthProvider();
  try {
    await authM.signInWithPopup(auth, provider);
  } catch (e) {
    // En apps instaladas (PWA) los popups suelen estar bloqueados.
    if (/popup/.test(e.code || "")) return authM.signInWithRedirect(auth, provider);
    throw e;
  }
}
export const resetPassword = (email) => authM.sendPasswordResetEmail(auth, email);
export const signOut = () => authM.signOut(auth);

// ---------- familias ----------

const USERS = "mi_familia_users";
const FAMILIES = "mi_familia_families";
const INVITES = "mi_familia_invites";

const userRef = () => fs.doc(db, USERS, uid());

export async function myFamilies() {
  const snap = await fs.getDoc(userRef());
  const map = snap.exists() ? snap.data().familias || {} : {};
  return Object.entries(map).map(([id, name]) => ({id, name}));
}

export async function createFamily(name, me) {
  const ref = fs.doc(fs.collection(db, FAMILIES));
  await fs.setDoc(ref, {name, ownerUid: uid(), createdAt: Date.now()});
  await fs.setDoc(fs.doc(ref, "members", uid()), {...me, role: "admin", joinedAt: Date.now()});
  await fs.setDoc(userRef(), {familias: {[ref.id]: name}}, {merge: true});
  return ref.id;
}

const CODE_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export async function createInvite(fid, role) {
  const fam = await fs.getDoc(fs.doc(db, FAMILIES, fid));
  const code = Array.from(crypto.getRandomValues(new Uint32Array(6)), (x) => CODE_ABC[x % CODE_ABC.length]).join("");
  await fs.setDoc(fs.doc(db, INVITES, code), {
    familyId: fid, familyName: fam.data().name, role, by: uid(),
    createdAt: Date.now(), expiresAt: Date.now() + 7 * 864e5,
  });
  return code;
}

export async function joinFamily(code, me) {
  const snap = await fs.getDoc(fs.doc(db, INVITES, code.toUpperCase()));
  if (!snap.exists() || snap.data().expiresAt < Date.now()) throw new Error("El código no existe o ya venció.");
  const inv = snap.data();
  const mref = fs.doc(db, FAMILIES, inv.familyId, "members", uid());
  const ya = await fs.getDoc(mref).then((s) => s.exists()).catch(() => false);
  if (!ya) await fs.setDoc(mref, {...me, role: inv.role, invite: code.toUpperCase(), joinedAt: Date.now()});
  await fs.setDoc(userRef(), {familias: {[inv.familyId]: inv.familyName}}, {merge: true});
  return inv.familyId;
}

export async function leaveFamily(fid, who = uid()) {
  await fs.deleteDoc(fs.doc(db, FAMILIES, fid, "members", who));
  if (who === uid()) await fs.updateDoc(userRef(), {[`familias.${fid}`]: fs.deleteField()});
}

export function watchFamily(fid, cb) {
  return fs.onSnapshot(
    fs.doc(db, FAMILIES, fid),
    (s) => cb(s.exists() ? {id: s.id, ...s.data()} : null),
    () => cb(null),
  );
}

export async function updateFamily(fid, patch) {
  await fs.updateDoc(fs.doc(db, FAMILIES, fid), patch);
  if (patch.name) await fs.setDoc(userRef(), {familias: {[fid]: patch.name}}, {merge: true});
}

// ---------- colecciones ----------

const col = (fid, c) => fs.collection(db, FAMILIES, fid, c);

export function watch(fid, c, cb, {where, orderBy, limit} = {}) {
  const parts = [];
  if (where) parts.push(fs.where(...where));
  if (orderBy) parts.push(fs.orderBy(...orderBy));
  if (limit) parts.push(fs.limit(limit));
  return fs.onSnapshot(
    fs.query(col(fid, c), ...parts),
    (s) => cb(s.docs.map((d) => ({id: d.id, ...d.data()}))),
    (e) => console.warn("watch", c, e.code || e),
  );
}

export const add = (fid, c, data) => fs.addDoc(col(fid, c), data).then((r) => r.id);
export const set = (fid, c, id, data, {merge = false} = {}) => fs.setDoc(fs.doc(col(fid, c), id), data, {merge});
export const update = (fid, c, id, patch) => fs.updateDoc(fs.doc(col(fid, c), id), patch);
export const remove = (fid, c, id) => fs.deleteDoc(fs.doc(col(fid, c), id));

export async function uploadPhoto(fid, file) {
  const {compressImage, randomId} = await import("./util.js");
  const blob = await compressImage(file, 1600, 0.82);
  const path = `mi_familia/${fid}/fotos/${Date.now()}_${randomId(8)}.jpg`;
  const ref = st.ref(storage, path);
  await st.uploadBytes(ref, blob, {contentType: "image/jpeg"});
  return {url: await st.getDownloadURL(ref), path};
}

export async function deletePhotoFile(path) {
  if (path) await st.deleteObject(st.ref(storage, path)).catch(() => {});
}

// ---------- notificaciones push ----------

export function pushStatus() {
  if (!("Notification" in self) || !("serviceWorker" in navigator)) return "no-soportado";
  if (!cfg.vapidKey) return "sin-config";
  return Notification.permission; // "default" | "granted" | "denied"
}

export async function enablePush() {
  const status = pushStatus();
  if (status === "no-soportado" || status === "sin-config") return status;
  if ((await Notification.requestPermission()) !== "granted") return "denied";
  const msg = await import(SDK + "firebase-messaging.js");
  if (!(await msg.isSupported())) return "no-soportado";
  const messaging = msg.getMessaging(app);
  const reg = await navigator.serviceWorker.ready;
  const token = await msg.getToken(messaging, {vapidKey: cfg.vapidKey, serviceWorkerRegistration: reg});
  if (token) await fs.setDoc(userRef(), {fcmTokens: fs.arrayUnion(token)}, {merge: true});
  msg.onMessage(messaging, (p) => onPushCb?.(p));
  return "granted";
}
