# Auditoría de seguridad — Mi Comunidad Digital

**Estado:** revisión preventiva; no desplegar este PR sin completar las verificaciones.

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
- [ ] Ejecutar pruebas con emuladores Firebase de roles, lectura/escritura entre comunidades, licencias ausentes, expiradas, suspendidas y renovadas.
- [ ] Ejecutar suite Node y comprobar estado de GitHub Actions.
- [ ] Revisar secretos e historial Git; rotar inmediatamente cualquier secreto real encontrado, sin publicarlo en informes.
- [ ] Comprobar App Check, restricciones de API y su compatibilidad con PWA/iPhone/Android antes de exigirlo.
- [ ] Revisar sinks `innerHTML` para XSS y planificar CSP sin `unsafe-inline`.
- [ ] Comparar reglas y funciones de Firebase desplegadas con las versiones de GitHub.
- [ ] Validar regresiones en las otras aplicaciones que comparten `mercado-ciudadano`.

## Política de cambios

No fusionar ni desplegar modificaciones de licencias, reglas o autenticación hasta superar pruebas en emulador y una revisión de compatibilidad. No modificar precios, órdenes, pagos ni producción como parte de esta auditoría.

## Evidencia de CI (16-11-2026)

- GitHub Actions `Security regression checks`: **success**.
- GitHub Actions `Validar licencias y pagos`: **success**.
- GitHub Actions `Firebase`: **failure** exclusivamente en el paso `npm audit --audit-level=moderate` del job de tests; las **208 pruebas del emulador pasaron**, sin fallos. Los jobs de despliegue quedaron `skipped`.
- Hallazgo específico: `tests/package.json` fija un override de `hono: 4.13.11`, versión incluida en los avisos de seguridad hasta `4.13.15` (GHSA-4m76-xfj5-7975, GHSA-h7mg-cq63-vhpq, GHSA-3gg2-335m-rxc6, GHSA-46wx-v44x-9hh2, GHSA-4h7h-rv7c-7m2v). Se notifican tres paquetes afectados en el árbol de dependencias: `hono`, `@hono/node-server` y `@modelcontextprotocol/sdk`.
- **Corrección segura pendiente:** actualizar el override a una versión corregida y compatible, regenerar `tests/package-lock.json` con npm, volver a ejecutar `npm ci`, `npm audit --audit-level=moderate` y las 208 pruebas de emulador. No editar el lockfile manualmente ni ignorar el fallo de auditoría. Evaluar si los paquetes afectados son solo herramientas de desarrollo antes de calificar exposición en producción.
