# Mi Familia

App para la familia, instalable en el teléfono (PWA). Sirve para avisarse
cosas, coordinar la casa, cuidarse y compartir momentos.

Es un proyecto **independiente de Mi Comunidad**: tiene su propio proyecto de
Firebase, sus reglas y sus functions. Vive en esta carpeta para partir
rápido; se puede mover a su propio repositorio cuando quieras.

## Qué hace

| Sección | Funciones |
|---|---|
| **Hoy** | Resumen del día: quién está fuera, ánimo de cada uno, pedidos que llegan, eventos, cuentas vencidas, tareas que te tocan, cumpleaños, pregunta del día, "un día como hoy" |
| **Muro** | Avisos para todos con prioridad y **"✋ Yo me encargo"**; **pedidos** con día, horario, n° de seguimiento y quién lo recibe; **fijados** (WiFi, pediatra, gásfiter…) |
| **Casa** | **Lista de compras** en vivo, **tareas con turnos** que rotan solos, **calendario** (eventos repetidos, cumpleaños, cuentas, vacunas), **cuentas** del mes (solo adultos), **mascotas** (comida, vacunas, "¿quién le dio comida?") |
| **Cuidado** | **Salí / Llegué** con **llegada segura** (alerta si no llegas a la hora), **ubicación en vivo temporal** y mapa, **SOS** con ubicación, **fichas médicas**, teléfonos de emergencia |
| **Momentos** | **Álbum privado**, **pregunta del día** (ves las respuestas al responder), **votaciones**, **planes** (quién va y qué lleva), **gracias**, **ánimo** y **no molestar** |
| **Perfil** | Invitar (código, link, QR y WhatsApp), roles, **vista simple** con letra grande para abuelos, notificaciones, varias familias |

**Roles:** *Administra* (todo), *Adulto* (todo menos sacar miembros) y
*Niño/a* (no ve cuentas ni fija información). Nadie puede subirse el rol
solo; lo garantizan las reglas de Firestore.

## Probarla ya (modo demo)

Con `public/js/config.js` sin configurar, la app funciona en **modo demo**:
una "Familia Pérez" de ejemplo guardada en el navegador. Abre dos pestañas
como personas distintas para ver cómo se sincroniza todo.

    cd mi-familia/public
    python3 -m http.server 8000
    # abre http://localhost:8000

## Ponerla en marcha de verdad (una sola vez)

1. **Crear el proyecto**: [console.firebase.google.com](https://console.firebase.google.com)
   → *Agregar proyecto* → por ejemplo `mi-familia-perez`. Pon ese ID en
   `mi-familia/.firebaserc` (en vez de `mi-familia-CAMBIAR`).
2. **Plan Blaze** (pago por uso). Lo piden las Cloud Functions (notificaciones).
   Para una familia el uso queda dentro de la cuota gratis; igual conviene
   poner una alerta de presupuesto de, por ejemplo, USD 5.
3. **Authentication** → *Comenzar* → habilita **Correo/contraseña** y **Google**.
4. **Firestore Database** → *Crear base de datos* → ubicación
   **`southamerica-west1` (Santiago)**. Si eliges otra, cambia `REGION` al
   inicio de `functions/index.js`.
5. **Storage** → *Comenzar* (misma ubicación).
6. **Configuración del proyecto → General → Tus apps → Web (`</>`)**: registra
   la app y copia el objeto `firebaseConfig` en `public/js/config.js`.
7. **Configuración del proyecto → Cloud Messaging → Certificados push web**
   → *Generar par de claves*. Copia la clave en `vapidKey` de `config.js`.
8. Deploy (con [Firebase CLI](https://firebase.google.com/docs/cli) instalado):

       cd mi-familia/functions && npm install && cd ..
       firebase deploy

9. Abre `https://TU-PROYECTO.web.app`, crea tu cuenta, crea la familia e
   invita a los demás desde tu perfil (➕ Invitar).

### Deploy automático desde GitHub (opcional)

`.github/workflows/mi-familia.yml` corre los tests de reglas en cada pull
request que toque `mi-familia/` y, al aceptar cambios en `main`, despliega.
Para activar el deploy crea una cuenta de servicio **en el proyecto de Mi
Familia** con los mismos roles que indica el `LEEME.md` de Mi Comunidad, más
*Firebase Storage Admin*, y guarda su JSON en el secret
`FIREBASE_SERVICE_ACCOUNT_FAMILIA`. Sin ese secret el deploy se salta.

## Instalar en el teléfono

- **Android (Chrome):** perfil → *Instalar Mi Familia*, o menú ⋮ → *Instalar app*.
- **iPhone (Safari):** Compartir ⬆️ → *Agregar a inicio*. En iPhone las
  notificaciones solo funcionan con la app instalada así (iOS 16.4+).

## Cosas a saber

- **Ubicación en vivo**: una app web solo puede enviar la ubicación
  **mientras está abierta** (en primer plano). Para seguimiento en segundo
  plano haría falta una app nativa. Por eso el foco está en "Salí / Llegué"
  con llegada segura, que funciona aunque el teléfono esté guardado: la
  alerta la manda el servidor.
- **Notificaciones**: respetan el "no molestar" de cada uno, salvo SOS,
  avisos urgentes y llegadas atrasadas.
- **Resumen diario**: todos los días a las 7:30 (hora de Chile) cada persona
  recibe lo que pasa hoy y las tareas que le tocan.
- **Fotos**: se comprimen en el teléfono antes de subirlas (máx. 1600 px).
  Solo los miembros pueden subir, ver y borrar.
- **Sin señal**: la app abre y muestra lo último que cargó; lo que escribas
  se guarda y se sube al volver la conexión.

## Estructura

```
mi-familia/
├── public/                 ← la app (HTML + CSS + JS sin build)
│   ├── index.html
│   ├── css/app.css
│   ├── js/
│   │   ├── config.js       ← configuración de Firebase (vacía = demo)
│   │   ├── app.js          ← arranque, login, navegación, alertas SOS
│   │   ├── state.js        ← estado y atajos compartidos
│   │   ├── logic.js        ← calendario, turnos, cuentas, pregunta del día
│   │   ├── store-firebase.js / store-local.js  ← datos reales / demo
│   │   └── views/          ← hoy, muro, casa, cuidado, momentos, familia
│   ├── vendor/             ← Leaflet (mapa) y qrcode-generator (MIT)
│   ├── sw.js               ← offline + notificaciones push
│   └── manifest.webmanifest
├── functions/index.js      ← notificaciones, llegada segura, resumen diario
├── firestore.rules         ← quién puede ver y hacer qué
├── storage.rules
└── tests/                  ← tests de las reglas (npm test, necesita Java)
```
