# Seguridad de Mi Comunidad

Resumen del modelo de permisos, de lo que se verifica automáticamente y de
los pasos que solo puede hacer la persona dueña del proyecto en las consolas
de Firebase, Google Cloud y GitHub.

## Quién puede ver y hacer qué

| Rol | Ve | Puede escribir |
|---|---|---|
| Residente | Su propia ficha, lo de su departamento y lo común (avisos, documentos, bloques de reserva) | Familiares y personas sin acceso de su ficha; visitas anunciadas; informar pagos; solicitudes y mensajes; invitados de sus reservas |
| Conserjería | Directorio reducido (sin RUT, sin motivos, sin datos de propiedad); bitácoras; encomiendas; solicitudes | Bitácoras de vehículos y accesos; novedades y tareas de turno; gestión de solicitudes. Encomiendas, visitas y turnos solo mediante funciones del servidor |
| Administración | Todo lo de su comunidad | Lo operativo y financiero de su comunidad; nunca el plan, el estado, los contadores ni la configuración de pagos sin pasar por el servidor |
| Superadmin | Todas las comunidades | Estado y plan de cada comunidad; cuentas de administración |

Reglas generales:

- Toda lectura y escritura revisa en el momento que la comunidad no esté
  suspendida y que la cuenta siga habilitada (ficha activa, mismo
  departamento, administración no dada de baja). Un token antiguo no basta.
- Los datos sensibles de una ficha (RUT del residente y de sus familiares,
  motivo de cada restricción, propietario y arrendatario) solo se entregan a
  conserjería después de verificar la identidad en el servidor. Cada consulta
  queda en `auditoria`, que administración puede revisar.
- Las respuestas secretas se guardan como hash scrypt con sal y nunca salen
  del servidor. 5 fallos bloquean la ficha 15 minutos; 15 fallos en un día la
  bloquean 24 horas.
- Contraseñas de 8 a 128 caracteres. Restablecer una clave cierra las
  sesiones abiertas de esa cuenta.

## Verificación automática

En cada pull request y antes de cada despliegue (`.github/workflows/firebase.yml`):

- `npm test` en `tests/`: reglas de Firestore, funciones contra los
  emuladores de Firestore y Auth, interfaz y cabeceras del sitio.
- `npm audit` sin excepciones en `functions/` y `tests/`.
- Las acciones de GitHub están fijadas por commit y el token del flujo solo
  tiene permiso de lectura.

## Pasos pendientes en las consolas (no se pueden hacer desde el código)

1. **Firebase Authentication → Configuración**
   - Activar la *protección contra la enumeración de correos*.
   - Si el proyecto usa Identity Platform, fijar una política de contraseñas
     de mínimo 8 caracteres (el servidor ya lo exige; esto cubre también los
     scripts locales).
2. **App Check** (reCAPTCHA Enterprise) para el sitio `mi-comunidad-md` y,
   una vez que se vean solicitudes válidas en las métricas, activar su
   cumplimiento en Firestore y Cloud Functions. Esto necesita una clave de
   sitio que se crea en la consola; con ella se agrega la inicialización de
   App Check en `public/index.html`.
3. **Cuenta de servicio del despliegue** (`FIREBASE_SERVICE_ACCOUNT`):
   rotar la llave si alguna vez se compartió fuera de GitHub, y de
   preferencia reemplazarla por *Workload Identity Federation*. Borrar las
   copias de `serviceAccountKey.json` que queden en computadores.
4. **GitHub → Settings → Branches**: proteger `main`, exigir que el flujo
   "Firebase" esté verde y una revisión antes de fusionar.
5. **Google Cloud → Facturación**: alertas de presupuesto para el proyecto.
6. **Cuenta de Google dueña del proyecto**: verificación en dos pasos.
7. **SheetJS** (lectura de cartolas en conciliación) todavía se carga desde
   `cdn.sheetjs.com`. Para fijarlo, descargar
   `https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js` en un
   equipo con internet, copiarlo a `public/vendor/` y cambiar la ruta en
   `public/index.html` (o agregar su `integrity` con
   `openssl dgst -sha384 -binary xlsx.full.min.js | openssl base64 -A`).

## Las otras aplicaciones del proyecto compartido

Firestore y Storage admiten **un solo archivo de reglas** para todo el
proyecto `mercado-ciudadano`. Para que ninguna app pise a otra, cada
despliegue publica solo su propia sección encima de las reglas vigentes y
verifica después lo publicado:

| App | Sección que publica | Cómo |
|---|---|---|
| Mi Comunidad | De `function mcEsMiComunidad` al final del bloque `mi_comunidad_comunidades` | `scripts/preparar-reglas-compartidas.cjs` (este repositorio) |
| Mercado Ciudadano | De `function login()` hasta el comentario `// ALMACÉN DIGITAL Y MI COMUNIDAD` | `scripts/preparar-reglas-compartidas.cjs` (repositorio `mercado-ciudadano`) |
| Almacén Digital | Sin publicación automática conocida | Ver pendiente abajo |

Si un script no encuentra exactamente los límites de su sección, se detiene
sin publicar nada. Storage lo publica solo Mercado Ciudadano, y se detiene si
las reglas vigentes tienen rutas de otra app.

Las copias de `firestore.rules` de Mi Comunidad y de Mercado Ciudadano se
mantienen idénticas, para que las pruebas de cada repositorio corran contra
el archivo completo.

Pendiente de **Almacén Digital** (su código no está en los repositorios
revisados): en `userStores/{uid}` el propio dueño puede crear y modificar su
documento, incluido el estado de aprobación, y `esAdminAlmacen()` no exige
`email_verified == true`. Además, si esa app se publica con `firebase deploy
--only firestore:rules` desde una carpeta propia, reemplazaría las reglas de
las otras dos: debe adoptar el mismo script por secciones.

## Datos existentes al desplegar

- Las cuentas de administración actuales siguen habilitadas: la lista de
  bajas solo actúa cuando el superadmin desactiva una cuenta.
- Las fichas con pregunta pero sin respuesta guardada se muestran como "sin
  pregunta de seguridad" (verificación manual registrada) hasta que el
  residente defina una en *Mi perfil*.
- Conserjería necesita recargar la página una vez tras el despliegue para
  usar el nuevo directorio.
