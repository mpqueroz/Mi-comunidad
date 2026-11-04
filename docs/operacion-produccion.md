# Operación y recuperación antes de abrir producción

## Publicaciones coordinadas

Mi Comunidad comparte `mercado-ciudadano` con otras aplicaciones. El workflow operativo publica una lista explícita de funciones y un único sitio Hosting. Las funciones comerciales tienen procedimiento separado; no ejecutar despliegues globales. La lista operativa incluye `registrarPagoOperativoMiComunidad`, `gestionarIntegrantesFichaMiComunidad`, `confirmarIngresoComunidad`, `conciliarMovimientoComunidad` y `desvincularConciliacionComunidad`; el smoke tras publicación exige su rechazo sin sesión. La conciliación banco/deuda y la confirmación de ingreso deben validarse también con cuentas autorizadas y concurrencia, porque ese smoke no acredita coherencia de saldos.

La preparación de reglas guarda nombre de versión y SHA-256 de las reglas vigentes. Inmediatamente antes de publicarlas, `--assert-unchanged` consulta otra vez y aborta si cualquiera cambió. Es necesario reconstruir la combinación y volver a probar; no se reintenta con la captura antigua. Después, `--verify` exige coincidencia exacta.

Firebase no ofrece CAS de releases: esta defensa detecta cambios durante validación y despliegue de funciones, pero queda un pequeño intervalo final entre lectura y publicación. Coordinar una ventana exclusiva entre las tres aplicaciones y consola. La concurrencia de GitHub de este repositorio no bloquea los demás. Si ocurre una carrera, detener nuevas publicaciones, comparar cambios y preparar una combinación nueva, sin restaurar capturas antiguas a ciegas.

## Reversión y evidencia

Registrar SHA aprobado, resultados CI, revisión previa de Functions/Hosting e identificador de reglas anterior. La captura de reglas del runner es temporal y no constituye respaldo durable: mantener el registro de cambio autorizado. Cualquier reversión de reglas debe conservar los cambios vigentes de las tres aplicaciones.

Una publicación parcial no se revierte automáticamente: funciones, reglas y Hosting se publican separadamente. Revisar las versiones efectivas antes de completar o revertir. El smoke público demuestra disponibilidad y rechazo sin sesión; no sustituye recorridos por rol.

## Comprobaciones externas pendientes

- Verificar PITR, copias programadas, retención y último resultado de Firestore. Ensayar restauración en base aislada; medir RPO/RTO y coherencia antes de prometer recuperación.
- Preparar recuperación de Authentication y custom claims. Firestore no respalda cuentas, contraseñas ni sesiones. Inventariar Storage si corresponde.
- Verificar alertas de errores, scheduler fallido o ausente, retraso de conciliación y revisiones de pago; definir responsable y atención.
- Verificar presupuesto/alertas del proyecto compartido, MFA, permisos y protección de main.
- Validar alta, renovación y reversos con API del entorno autorizado sin imprimir credenciales ni datos tributarios completos.
- Exigir TTL ACTIVE para `mi_comunidad_webhook_recibos.expiresAt` mediante el preflight comercial. Su habilitación específica está documentada en `pagos-produccion.md`; no se usa despliegue global de índices.

No se consultaron ni modificaron respaldos, IAM, secretos o datos productivos durante estas correcciones. Su estado requiere comprobación separada; las pruebas demo no acreditan restauración real.
