// Service worker: deja la app abrir sin señal (caché) y recibe las
// notificaciones push de Firebase Cloud Messaging.

importScripts("js/config.js");

const CACHE = "mi-familia-v2";
const ASSETS = [
  "./", "index.html", "manifest.webmanifest", "css/app.css",
  "js/config.js", "js/app.js", "js/state.js", "js/logic.js", "js/util.js",
  "js/store-local.js", "js/store-firebase.js",
  "js/views/hoy.js", "js/views/muro.js", "js/views/casa.js", "js/views/cuidado.js",
  "js/views/momentos.js", "js/views/familia.js", "js/views/colegio.js",
  "icons/icon.svg", "icons/icon-192.png",
  "vendor/leaflet/leaflet.js", "vendor/leaflet/leaflet.css", "vendor/qrcode.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Primero la red (para recibir siempre la última versión) y, sin señal,
// lo guardado. Solo archivos propios: Firebase maneja su propia caché.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, {ignoreSearch: true}).then((r) => r || caches.match("index.html"))),
  );
});

// ---------- push (Firebase Cloud Messaging) ----------
// Los mensajes traen "notification", así que el SDK los muestra solo y
// abre el link (webpush.fcmOptions.link) al tocarlos.
const cfg = self.MI_FAMILIA_CONFIG;
if (cfg?.firebase?.apiKey) {
  importScripts(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js",
  );
  firebase.initializeApp(cfg.firebase);
  firebase.messaging();
}
