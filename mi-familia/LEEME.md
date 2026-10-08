# Mi Familia

App para la familia, instalable en el teléfono (PWA). Sirve para avisarse
cosas, coordinar la casa, cuidarse y compartir momentos.

Se publica en el proyecto de Firebase **Rol de turnos**, compartido con la
app Rol de turnos. Para no pisarse:

| Qué | Cómo se separa de Rol de turnos |
|---|---|
| Sitio web | Sitio propio dentro del proyecto: `mi-familia-md.web.app` |
| Datos | Todo con prefijo `mi_familia_` (Rol de turnos usa `users`) |
| Reglas | Un solo `firestore.rules` para las dos apps, con un bloque para cada una |
| Fotos | Carpeta propia `mi_familia/` en Storage |
| Functions | Grupo propio (`codebase: mi-familia`) |

> **Importante:** nunca uses `firebase deploy` sin `--only`. Usa siempre el
> comando de esta guía, que solo publica lo de Mi Familia.

## Qué hace

| Sección | Funciones |
|---|---|
| **Hoy** | Resumen del día: quién está fuera, ánimo de cada uno, pedidos que llegan, eventos, cuentas vencidas, tareas que te tocan, cumpleaños, pregunta del día, "un día como hoy" |
| **Muro** | Avisos para todos con prioridad y **"✋ Yo me encargo"**; **pedidos** con día, horario, n° de seguimiento y quién lo recibe; **fijados** (WiFi, pediatra, gásfiter…) |
| **Casa** | **Colegio**: los adultos envían tareas, pruebas, materiales y recordatorios a cada hijo/a (le llega una notificación, se ve cuándo lo vio y cuándo lo terminó; el resumen diario recuerda lo de mañana); **lista de compras** en vivo, **tareas con turnos** que rotan solos, **calendario** (eventos repetidos, cumpleaños, cuentas, vacunas), **cuentas** del mes (solo adultos), **mascotas** (comida, vacunas, "¿quién le dio comida?") |
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

    cd public
    python3 -m http.server 8000
    # abre http://localhost:8000

## Ponerla en marcha en "Rol de turnos" (una sola vez)

Todo en [console.firebase.google.com](https://console.firebase.google.com) →
proyecto **Rol de turnos**:

1. **ID del proyecto**: ⚙️ *Configuración del proyecto* → copia el *ID del
   proyecto* y ponlo en `.firebaserc` (en vez de `ID-DEL-PROYECTO-ROL-DE-TURNOS`).
2. **Sitio nuevo**: *Hosting* → *Agregar otro sitio* → `mi-familia-md`. Si
   ese nombre está tomado, elige otro y cámbialo en `firebase.json`
   (`hosting.site`), en `.github/workflows/firebase.yml` y en `APP_URL` al
   inicio de `functions/index.js`.
3. **Plan Blaze** (pago por uso): lo piden las notificaciones. Para una
   familia queda dentro de la cuota gratis; pon una alerta de presupuesto
   de, por ejemplo, USD 5.
4. **Authentication → Método de acceso**: habilita **Correo/contraseña** y
   **Google** si no lo están. No cambia en nada cómo entran a Rol de turnos.
5. **Firestore**: usa la base de datos que ya existe (no crees otra). Mira
   su ubicación arriba (ej. `southamerica-west1`, `nam5`) y ponla en
   `REGION` al inicio de `functions/index.js` (`nam5` → `us-central1`,
   `eur3` → `europe-west1`).
6. **Storage** → *Comenzar* si no está activo.
7. **Configuración del proyecto → Tus apps → Agregar app → Web (`</>`)**:
   nombre "Mi Familia". Copia el `firebaseConfig` en `public/js/config.js`.
8. **Cloud Messaging → Certificados push web**: si ya hay un par de claves,
   **reutilízalo**; si no, genera uno. Copia la clave en `vapidKey` de
   `public/js/config.js`.
9. **Reglas**: `firestore.rules` ya trae las de Rol de turnos (sin cambios)
   más las de Mi Familia. Si alguna vez cambias las reglas de Rol de turnos,
   hazlo en este archivo y cópialo también a la carpeta de Rol de turnos:
   publicar desde cualquiera de las dos reemplaza las de ambas.
10. Publicar (con [Firebase CLI](https://firebase.google.com/docs/cli)):

        cd functions && npm install && cd ..
        cd tests && npm install && npm test && cd ..
        firebase deploy --only "hosting:mi-familia-md,firestore:rules,firestore:indexes,storage,functions:mi-familia"

11. Abre `https://mi-familia-md.web.app`, crea tu cuenta, crea la familia e
    invita a los demás desde tu perfil (➕ Invitar).

### Deploy automático desde GitHub (opcional)

`.github/workflows/firebase.yml` corre los tests de reglas en cada pull
request y, al aceptar cambios en `main`, publica con el mismo comando de
arriba. Para activarlo crea en el proyecto Rol de turnos una cuenta de
servicio con los roles *Firebase Hosting Admin*, *Firebase Rules Admin*,
*Cloud Datastore Index Admin*, *Firebase Storage Admin*, *Cloud Functions
Admin*, *Service Account User*, *Cloud Scheduler Admin*, *Artifact Registry
Writer*, *Cloud Build Editor* y *Firebase Viewer*, y guarda su JSON en el
secret `FIREBASE_SERVICE_ACCOUNT_FAMILIA` (Settings → Secrets and variables
→ Actions). Sin ese secret el deploy se salta.

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
.
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
