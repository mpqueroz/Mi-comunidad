# Mi Comunidad: archivos para deploy

## Qué hay en este zip

```
firestore.rules              ← reglas de las 3 apps del proyecto (ver nota abajo)
public/
├── index.html               ← la app real (login por RUT), con tu firebaseConfig ya puesto
├── jsQR.min.js              ← lector de QR (sin cambios)
└── demo/index.html          ← demo para clientes: mi-comunidad-md.web.app/demo
functions/
├── index.js                 ← Cloud Functions de Mi Comunidad
├── crear-superadmin.js      ← crea/repara tu cuenta de dueño (uso local, una vez)
└── restablecer-clave.js     ← cambia la clave de cualquier cuenta (uso local)
ARCHITECTURE.md              ← documentación técnica
tests/                       ← tests de firestore.rules (emulador)
.gitignore
```

Tus archivos `firebase.json`, `.firebaserc` y `functions/package.json` no vienen aquí: se mantienen los que ya tienes.

## Cómo subirlo

Copia todo sobre tu carpeta `mi-comunidad-firebase` y ejecuta:

    firebase deploy --only functions,firestore:rules,hosting

Si Firebase pregunta si borrar funciones que "no existen en tu código local"
(onAnuncioAprobado, onContactoConfirmado, etc.), responde **N**: son de Mercado Ciudadano.

Para cambios solo del `index.html` o la demo, basta con:

    firebase deploy --only hosting

## Reglas de Firestore: IMPORTANTE

El proyecto `mercado-ciudadano` es compartido por 3 apps: Mercado Ciudadano,
Almacén Digital y Mi Comunidad. Firebase admite **un solo archivo de reglas**:
el deploy de reglas desde cualquier carpeta reemplaza las de las tres.
Copia este mismo `firestore.rules` a las carpetas de Mercado Ciudadano y
Almacén Digital, y si cambias reglas de una app, edítalas aquí y vuelve a copiarlo.

## Scripts locales (crear-superadmin.js y restablecer-clave.js)

1. Descarga la llave: Firebase Console → Configuración del proyecto →
   Cuentas de servicio → Generar nueva clave privada. Guárdala en
   `functions/` como `serviceAccountKey.json`.
2. Edita los datos al inicio del script (RUT y clave).
3. Ejecuta, en dos comandos separados:

       cd functions
       node crear-superadmin.js

4. **Borra `serviceAccountKey.json`** al terminar: da acceso total a las 3 apps
   y, si queda en `functions/`, se sube con cada deploy.

## Qué incluye esta versión

**Seguridad y bugs**
- Registrar encomiendas funcionaba mal (función mal ubicada): corregido.
- Pregunta secreta cifrada (hash) y verificada en el servidor, con bloqueo tras 5 intentos.
- Protección contra inyección de código (XSS) en toda la interfaz.
- Pagos: el residente informa su pago y administración lo confirma o rechaza.
- Fechas reales en vez del texto "Hoy", y fechas en hora de Chile.
- Vencimientos de gastos y mantenciones calculados en el servidor cada día.
- Reglas corregidas: ya no bloquean al superadmin ni a edificios sin campo "estado".

**Uso**
- Botón atrás: navega dentro de la app y, desde la primera página, ofrece cerrar sesión y volver a la pantalla del RUT.
- Si el ingreso falla, el mensaje muestra la causa y el paso exacto.
- Exportar a Excel en Residentes, Gastos comunes, Multas, Contabilidad y Remuneraciones.
- Historial acotado a 90 días para que la app cargue rápido.

**Diseño**
- Dashboard de administración con "Requiere tu atención", recaudación y mapa del edificio.
- Ficha del departamento como panel lateral con pestañas.
- Conserjería con buscador en vivo (tecla "/") y acciones grandes.
- Inicio del propietario con gasto común, encomiendas con QR y próximos eventos.
- Adaptado a celulares chicos, tablets y monitores.

## Tests de las reglas

`tests/` prueba `firestore.rules` contra el emulador de Firestore (necesita Java):

    cd tests
    npm install
    npm test

Córrelos antes de cada `firebase deploy --only firestore:rules`.

## Deploy automático desde GitHub

`.github/workflows/firebase.yml` corre los tests de reglas en cada pull
request y, cuando se aceptan cambios en `main`, despliega `firestore.rules`
y las 8 Cloud Functions de Mi Comunidad. Nombra cada función por su nombre,
así que nunca borra ni toca las de Mercado Ciudadano ni Almacén Digital.
También se puede lanzar a mano: pestaña **Actions → Firebase → Run workflow**.

Configuración (una sola vez):

1. Google Cloud Console → proyecto `mercado-ciudadano` → **IAM y administración
   → Cuentas de servicio → Crear cuenta de servicio** (ej. `github-deploy`).
2. Dale estos roles:
   - Firebase Rules Admin
   - Cloud Functions Admin
   - Service Account User
   - Cloud Scheduler Admin (por la tarea diaria de vencimientos)
   - Artifact Registry Writer y Cloud Build Editor (para compilar las functions)
   - Firebase Viewer (el deploy lee la configuración del proyecto)

   Si un deploy falla por un permiso, el error indica qué rol falta.
3. En esa cuenta: **Claves → Agregar clave → JSON**. Se descarga un archivo.
   Antes de usarlo, revisa que `"client_email"` sea el de esta cuenta (no el
   de `firebase-adminsdk` ni el de otra cuenta con nombre parecido).
4. GitHub → repositorio → **Settings → Secrets and variables → Actions →
   New repository secret**, nombre `FIREBASE_SERVICE_ACCOUNT`, y pega el
   contenido completo del JSON.
5. **Borra el JSON de tu computador.** Solo debe vivir en el secret de GitHub.

`firebase.json`, `.firebaserc` y `functions/package.json` ahora están en el
repositorio. Si los tuyos locales tienen otras versiones de `firebase-admin`
o `firebase-functions`, reemplaza `functions/package.json` por el tuyo y
regenera `functions/package-lock.json` con `npm install`.
