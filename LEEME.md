# Actualización profesional · octubre de 2026

Integra turnos, bitácora compartida, pendientes, visitas con salida, encomiendas transaccionales, conversación de solicitudes, cancelación de reservas, planes preventivos y avisos con confirmación. Conserva los paneles, fichas laterales, conciliación y verificación de identidad del repositorio vigente.

Administración configura los métodos de pago en Finanzas → Gastos comunes → Configurar métodos e instrucciones. Cada comunidad puede indicar sus métodos habilitados, banco, cuenta, titular, correo, instrucciones y enlace HTTPS. El residente informa el pago y administración lo confirma contra cartola; no se agrega una pasarela automática ni se guardan claves bancarias.

Los archivos `profesional.js`, `continuidad.js`, `gestion.js`, `cierre.js` y `profesional.css` son necesarios junto con `index.html`. El workflow despliega sitio, reglas compartidas y una lista explícita de funciones de Mi Comunidad. No se reemplazan las reglas de las otras apps.

Las preguntas secretas conservan su almacén y funciones existentes. La verificación manual se registra en auditoría. Las novedades locales antiguas no se importan como bitácora auditada; las mantenciones previas se consultan como historial y los nuevos planes se configuran por administración.

La agenda muestra recordatorios dentro de la aplicación; no envía push con la app cerrada. Las fotografías se guardan como JPEG comprimido y acotado. Para un volumen mayor, migrar las evidencias a Storage con permisos equivalentes.

Validación: 81 pruebas locales aprobadas, con emulador real de Firestore, concurrencia mediante Admin SDK contra un proyecto demo aislado, conciliación existente y DOM simulado. No se hizo validación visual con navegador real. Tras publicar, entrar con las cuentas existentes de cada rol y comprobar operación en dos dispositivos.

---

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
request y, cuando se aceptan cambios en `main`, despliega la página
(`public/` → sitio `mi-comunidad-md`), `firestore.rules` y las 19 Cloud
Functions de Mi Comunidad.

La carpeta `public/` del repositorio es la que se publica **completa**:
todo lo que no esté ahí (la demo, `jsQR.min.js`) desaparece del sitio al
desplegar. Por eso la app, la demo y el lector de QR viven en `public/`. Nombra cada función por su nombre,
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
   - Firebase Hosting Admin (para publicar la página)

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


## Comprobaciones de seguridad

Las reglas de Mi Comunidad consultan la ficha actual de residentes y conserjes.
Marcarla como `Inactivo` o eliminarla bloquea nuevas solicitudes, incluso si el
usuario conserva un token anterior. Un cambio de departamento también exige
renovar la sesión antes de usar los permisos del nuevo departamento. Los datos
ya vistos o descargados por una persona no se borran de sus dispositivos.
Las funciones de identidad, reservas y operación verifican estas restricciones
en el servidor, además de la separación entre comunidades.

El servidor usa Node.js 22, Firebase Admin 14.5.0 mediante APIs modulares y
Firebase Functions 7.4.0. Para validar dependencias de producción:

```sh
npm --prefix functions ci
npm --prefix functions audit --omit=dev --audit-level=moderate
npm --prefix tests ci
npm --prefix tests test
```

La integración continua ejecuta la auditoría de dependencias y las pruebas
antes del despliegue. La suite usa datos ficticios en proyectos `demo-*`;
no accede a datos de producción. Que estas pruebas pasen no verifica la
existencia ni la restauración de respaldos reales: esa comprobación se hace
por separado, restaurando una copia en una base aislada y sin sobrescribir
la base operativa. Los respaldos de Firestore no sustituyen un plan de
recuperación de cuentas de Authentication ni de archivos de Cloud Storage.

### Herramientas de pruebas y despliegue

Las herramientas se fijan con lockfile: Firebase CLI 15.34.0, SDK de pruebas
Firebase 13.0.0 y rules-unit-testing 6.0.0. Requieren Node.js 22 y Java 21
para ejecutar el emulador actual (GitHub Actions instala ambos).

Los overrides fijan gRPC 1.14.5, OpenTelemetry Core 2.12.0 y uuid 11.1.1
para evitar dependencias transitivas antiguas. Los dos últimos siguen el
criterio de overrides del propio Firebase CLI, que npm no hereda cuando
el CLI se instala como dependencia de otro proyecto.

Se actualiza el watcher del CLI a Chokidar 4.0.3, eliminando la dependencia
vulnerable braces. Chokidar 4 conserva CommonJS y la vigilancia de archivos y
directorios; ya no interpreta globs para vigilar o excluir rutas. En este
repositorio se valida su uso para Firestore y los despliegues. Si se amplía el
uso al emulador de Functions, deben revisarse los patrones de exclusión de
vigilancia; los patrones de empaquetado del despliegue son independientes.

Pruebas adicionales comprueban cambios reales de archivos y exclusiones por
expresión, un envío HTTP multipart a un servidor local con el cliente del CLI
y la propagación W3C del cliente PubSub con OpenTelemetry actualizado.

La auditoría bloquea desde severidad moderada tanto las dependencias de
producción como las herramientas. No hay excepciones ni avisos ocultados.
El despliegue usa el mismo CLI instalado y auditado desde el lockfile.
Las pruebas de pull requests no reciben credenciales de despliegue.

Después de desplegar, un script sin credenciales comprueba Hosting y cinco
operaciones sensibles mediante solicitudes vacías sin sesión. Estas deben
responder con UNAUTHENTICATED o PERMISSION_DENIED y nunca ejecutar escrituras.
