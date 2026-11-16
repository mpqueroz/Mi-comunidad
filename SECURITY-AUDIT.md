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
