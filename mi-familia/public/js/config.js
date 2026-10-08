// Configuración de Mi Familia.
//
// Mientras firebase.apiKey esté vacío, la app funciona en MODO DEMO: una
// familia de ejemplo guardada solo en este navegador (sirve para probarla,
// pero no se comparte entre teléfonos).
//
// Para usarla de verdad, crea un proyecto de Firebase y pega aquí su
// configuración (ver mi-familia/LEEME.md). Este archivo es un script común
// (no un módulo) porque también lo lee el service worker de notificaciones.
self.MI_FAMILIA_CONFIG = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  },
  // Firebase Console → Configuración del proyecto → Cloud Messaging →
  // Certificados push web → "Par de claves". Sin ella no hay notificaciones.
  vapidKey: "",
};
