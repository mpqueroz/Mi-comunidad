# Auditoría de seguridad — Mi Comunidad Digital

**Estado:** revisión preventiva; no desplegar este PR sin completar las verificaciones.

## Estado actualizado — segunda revisión, 15 de noviembre de 2026 (Chile)

El PR #18 sigue **en borrador y sin autorización de fusión o despliegue**. Las correcciones de esta revisión están en `8301d0c` y `6590ffc`; no se cambiaron reglas, licencias, cuentas ni precios de producción.

### Correcciones y evidencia nuevas

- Se actualizó por npm `fast-xml-parser` a `5.12.1` y sus dependencias compatibles del lockfile de funciones. `npm audit --omit=dev --audit-level=low`: **0 vulnerabilidades**; queda resuelto el aviso bajo de la revisión anterior.
- El job de reglas y las herramientas Firebase usan Node 24; la carga y pruebas de Cloud Functions siguen verificándose en Node 22, igual que su runtime declarado. No se cambió el runtime de producción. El registro de CI ya no muestra `EBADENGINE`.
- Las acciones con `data-mc-action` ya no pueden invocar cualquier función de `window`: usan una lista cerrada de acciones de la aplicación. JSON inválido, acciones como `eval`, `fetch`, `constructor`, `__proto__` y argumentos estructurados no permitidos se rechazan; los argumentos de texto siguen viajando como datos.
- Se fijaron las acciones nuevas de CI a SHA; la regeneración del lockfile exige que el resultado coincida con el archivo versionado, para no ocultar otra desincronización.
- [Firebase #141](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43793310961), commit `6590ffc`: **119 pruebas de funciones y 210 pruebas de emulador aprobadas**, 0 fallos, 0 omitidas; auditorías de dependencias de funciones y herramientas: **0 vulnerabilidades**. Comprobación pública: **success**. Ambos jobs de despliegue: **skipped**.
- [Firebase #140](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43793082208), commit `8301d0c`, también completó correctamente las pruebas.

### Inventario real preparado, todavía sin ejecutar

`scripts/auditar-accesos.cjs` consulta únicamente las colecciones de Mi Comunidad y las cuentas Auth de esta aplicación. Pagina Firestore y Auth; detecta licencias ausentes, fichas ausentes, cuentas sin comunidad, departamentos y estados incoherentes, y fichas de administradores sin una cuenta válida. Tiene seis pruebas con datos ficticios y sin métodos de escritura permitidos.

Comando de consulta, con ADC ya configurado:

```sh
node scripts/auditar-accesos.cjs --project mercado-ciudadano --require-clean
```

Por defecto emite solo conteos, sin nombres, correos, RUT, teléfonos ni credenciales. `--details` agrega identificadores técnicos y no debe publicarse en logs públicos sin revisión. No crea licencias ni concede vigencia automáticamente. `readyForStrictAccess` solo comprueba las inconsistencias cubiertas por este inventario; no acredita el blindaje completo.

- El entorno local no tiene ADC configurado. Se preparó el job `Inventario de accesos (solo lectura)` en el workflow Firebase existente, con autenticación mediante la credencial ya utilizada por CI. Solo puede ejecutarse manualmente desde esta rama y este repositorio. No habilita despliegues en la rama de auditoría.
- En #141 el job de inventario quedó **skipped**, porque esa ejecución fue disparada por el PR; las pruebas sí pasaron.
- Se preparó la ejecución manual en GitHub seleccionando la rama correcta. La revisión automática de acciones rechazó iniciarla por considerarla una ejecución adicional con credenciales. Tras verificar que el inventario anterior estaba omitido, el bloqueo se mantuvo. **No se ejecutó el inventario contra datos reales ni se intentó otra vía para eludir el bloqueo.** Está pendiente autorización explícita para esa ejecución adicional.

### Pendientes que impiden cerrar la auditoría completa

1. Ejecutar el inventario real autorizado y revisar sus resultados. Migrar fichas y licencias históricas con decisiones comerciales explícitas; después eliminar coordinadamente las excepciones de acceso en reglas, funciones e interfaz. No otorgar meses ni habilitar cuentas a ciegas.
2. Verificar configuración efectiva de App Check, restricciones de API y versiones desplegadas de reglas/funciones con acceso de consulta.
3. Completar la revisión de los renderizados de la interfaz y migrar el script y manejadores inline antes de retirar `unsafe-inline` de CSP. La lista de acciones cerrada agrega protección, pero no reemplaza esa migración.
4. Mantener la comprobación de compatibilidad de las reglas compartidas y preparar una ventana de publicación separada, únicamente cuando se autorice.

## Modelo de amenazas

1. Un tercero descarga el frontend o clona el repositorio público.
2. Un usuario autenticado intenta leer o modificar datos de otra comunidad.
3. Un administrador manipula una licencia, un precio o un comprobante de pago.
4. Una comunidad sin documento de licencia utiliza la excepción heredada.
5. Una cuenta de administrador antigua, sin ficha, conserva acceso no deseado.
6. Una credencial aparece en el historial Git, logs o archivos de despliegue.
7. Una modificación de reglas compartidas afecta Mercado Ciudadano o Almacén Digital.

## Hallazgos confirmados en el código

- `firestore.rules`: la colección `mi_comunidad_licencias` deniega create/update/delete del cliente.
- `firestore.rules`: `mcEsComunidadActiva` permite operar si **no existe** el documento de licencia. Se documentó como compatibilidad histórica; requiere inventario y migración.
- `firestore.rules`: `mcCuentaHabilitada` permite a administradores antiguos sin documento en `administradores` conservar acceso. Requiere inventario y migración.
- `functions/index.js`: `exigirCuentaActiva` también comprueba vigencia solo cuando la licencia existe; la excepción no es exclusivamente de la interfaz.
- `functions/mercadopago.js`: secretos declarados mediante Firebase Secret Manager; firma del webhook y verificación remota del pago.
- `public/index.html`: frontend legible y configuración Firebase pública (la API key web no es por sí misma un secreto).
- `firebase.json`: reglas compartidas y cabeceras CSP; la CSP incluye `'unsafe-inline'` para scripts, que reduce protección frente a XSS.
- No se observó `enforceAppCheck` en las declaraciones de Cloud Functions inspeccionadas; confirmar la configuración efectiva antes de activarlo.
- El repositorio fue observado como público; privatizarlo no evita que el JavaScript publicado sea inspeccionable.

## Bloqueadores para declarar blindaje final

- [ ] Inventariar licencias ausentes en todas las comunidades y distinguir clientes históricos de altas nuevas.
- [ ] Migrar comunidades heredadas y cambiar comprobación a **denegar por defecto** cuando falte licencia, en reglas y funciones, de forma coordinada.
- [ ] Inventariar administradores sin ficha y eliminar compatibilidad solo después de migración.
- [x] Ejecutar la suite de emulador de roles, aislamiento, licencias y pagos (210 pruebas; la excepción de licencia ausente sigue pendiente de migración).
- [x] Ejecutar suite Node y comprobar estado de GitHub Actions (commit `0870edd`; evidencia abajo).
- [ ] Revisar secretos e historial Git; rotar inmediatamente cualquier secreto real encontrado, sin publicarlo en informes.
- [ ] Comprobar App Check, restricciones de API y su compatibilidad con PWA/iPhone/Android antes de exigirlo.
- [ ] Revisar sinks `innerHTML` para XSS y planificar CSP sin `unsafe-inline`.
- [ ] Comparar reglas y funciones de Firebase desplegadas con las versiones de GitHub.
- [x] Validar regresiones de reglas en emulador para las otras aplicaciones que comparten `mercado-ciudadano` (queda pendiente comparar la configuración desplegada).

## Política de cambios

No fusionar ni desplegar modificaciones de licencias, reglas o autenticación hasta superar pruebas en emulador y una revisión de compatibilidad. No modificar precios, órdenes, pagos ni producción como parte de esta auditoría.

## Evidencia histórica de CI, anterior a la sincronización del lockfile

- GitHub Actions `Security regression checks`: **success**.
- GitHub Actions `Validar licencias y pagos`: **success**.
- GitHub Actions `Firebase`: **failure** exclusivamente en el paso `npm audit --audit-level=moderate` del job de tests; las **208 pruebas del emulador pasaron**, sin fallos. Los jobs de despliegue quedaron `skipped`.
- Hallazgo específico: `tests/package.json` fija un override de `hono: 4.13.11`, versión incluida en los avisos de seguridad hasta `4.13.15` (GHSA-4m76-xfj5-7975, GHSA-h7mg-cq63-vhpq, GHSA-3gg2-335m-rxc6, GHSA-46wx-v44x-9hh2, GHSA-4h7h-rv7c-7m2v). Se notifican tres paquetes afectados en el árbol de dependencias: `hono`, `@hono/node-server` y `@modelcontextprotocol/sdk`.
- **Corrección segura pendiente:** actualizar el override a una versión corregida y compatible, regenerar `tests/package-lock.json` con npm, volver a ejecutar `npm ci`, `npm audit --audit-level=moderate` y las 208 pruebas de emulador. No editar el lockfile manualmente ni ignorar el fallo de auditoría. Evaluar si los paquetes afectados son solo herramientas de desarrollo antes de calificar exposición en producción.


## Primera revisión — 15 de noviembre de 2026 (Chile)

### Corrección aplicada solamente en la rama del PR #18

- Actions devolvió `This workflow does not exist` para `.github/workflows/apply-test-lockfile.yml`. El archivo existe en la rama de auditoría, pero no está disponible para ejecución manual en la interfaz. **No se ejecutó** `Apply verified test lockfile` y no se modificó `main` para registrarlo.
- Se realizó la operación equivalente en un checkout aislado: `npm install --package-lock-only --ignore-scripts --no-audit`, `npm ci --ignore-scripts` y `npm audit --audit-level=moderate` en `tests`. Auditoría: **0 vulnerabilidades**.
- El commit `0870eddb32b6aaae692509818b908a4c016370d0` sincronizó exclusivamente `tests/package-lock.json`: Hono `4.13.11` → `4.13.18`, URL e integridad generadas por npm. No se alteraron precios, pagos, autenticación ni reglas.

### Pruebas posteriores a la corrección

- [Firebase #138](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43791632953): pruebas de reglas **success**; **208 pruebas del emulador aprobadas, 0 fallos, 0 omitidas**; **113 pruebas de funciones aprobadas, 0 fallos, 0 omitidas**. Auditoría de herramientas: **0 vulnerabilidades**. Comprobación pública sin credenciales: **success**. `Deploy a Firebase` y `Publicar grupo comercial de producción`: **skipped**.
- [Security regression checks #8](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43791632960): **success**.
- [Validar licencias y pagos #83](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43791632869): **success**.
- [Regenerate test dependency lockfile #3](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43791632931): **success**.
- La ejecución local de funciones también aprobó las 113 pruebas. El emulador local no pudo descargar su JAR desde Google; la validación de emuladores anterior corresponde a GitHub Actions, donde sí se completó.

### Revisión adicional y límites

- Se revisó el historial alcanzable de la rama clonada (143 commits) con patrones de claves privadas, tokens GitHub, secretos OAuth de Google y tokens de acceso Mercado Pago. No hubo coincidencias. Es un barrido acotado por patrones; no acredita ausencia absoluta de secretos ni cubre ramas no descargadas, logs externos o credenciales efectivas de Firebase.
- Confirmado en reglas y funciones: licencia ausente permite operar; administrador sin ficha conserva acceso. Se mantienen como bloqueadores de migración, sin cambiar la compatibilidad durante esta revisión.
- No se encontró `enforceAppCheck` ni `initializeAppCheck` en el código propio revisado. La configuración desplegada sigue sin verificarse.
- La CSP mantiene scripts inline y hay uso extendido de `innerHTML`. Existen helpers de escape; el uso de `innerHTML` por sí solo no demuestra una vulnerabilidad explotable. Falta revisión completa de origen y destino de datos.
- El job de reglas usa Node 22, mientras varias herramientas fijadas en `tests` declaran Node `>=24.12.0`; CI emite `EBADENGINE`. Las pruebas pasaron, pero se debe separar el runtime de herramientas del runtime Node 22 de Cloud Functions y validar ambos.
- La auditoría de dependencias de funciones reporta **1 vulnerabilidad baja** de `fast-xml-parser` (GHSA-474x-hrwr-fgx4). No impide el umbral moderado actual; requiere rastrear dependencia y exposición antes de una actualización compatible. No se declara el árbol de producción libre de vulnerabilidades.
- Las pruebas de compatibilidad de reglas con Mercado Ciudadano y Almacén Digital están incluidas en el emulador; esto no sustituye comparar las reglas efectivamente desplegadas.

**Estado final de esta revisión:** PR en borrador, sin fusión ni despliegue. CI corregida y aprobada para el commit indicado; el blindaje completo continúa condicionado a los bloqueadores pendientes de este documento.
