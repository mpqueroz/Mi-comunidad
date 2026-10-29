# Invitaciones QR y entrega de turno

## Uso

1. Residente: Inicio → Mis invitaciones → Anunciar una nueva visita.
2. Guardar nombre, fecha y hora de inicio; indicar hora límite y generar pase.
3. Compartir la imagen desde el teléfono o descargarla. La visita no necesita cuenta.
4. Conserjería: Escanear pase → activar cámara (o pegar el contenido completo leído del QR).
5. Revisar nombre y departamento, comprobar identidad y confirmar ingreso.
6. Registrar salida desde Visitas y salidas. Las personas dentro pasan al resumen de turno.

Cada pase permite un ingreso dentro del mismo día, en horario de Chile. Emitir otro pase invalida el anterior. Cancelar conserva el registro e invalida el pase. El QR autoriza la recepción en portería; la apertura física corresponde al conserje.

Al generar una imagen nueva hay que guardarla o compartirla antes de cerrar el modal. El token original no queda almacenado: para recuperarlo se emite otro pase, invalidando el anterior.

## Seguridad y compatibilidad

- Se reutiliza `gestionarVisitaMiComunidad`. Emisión/cancelación: residente activo del departamento; revisión/ingreso/salida: administración y conserjería de la misma comunidad con licencia habilitada.
- Token aleatorio de 256 bits; Firestore guarda solo SHA-256. No contiene RUT ni otros datos personales en el QR. La imagen compartida incluye nombre, comunidad, departamento y horario para orientar al visitante.
- El ingreso vuelve a comprobar token, estado, horario del servidor, autor habilitado y restricciones. No basta con haber escaneado antes. La confirmación de identidad queda registrada junto al operador.
- El ingreso y el consumo de invitación son una transacción. Dos conserjes no pueden consumir el mismo pase. No hay acceso sin conexión.
- Cámara y códigos se detienen/descartan al cerrar el modal. Se descartan respuestas tardías tras cambiar de modal o cerrar sesión.
- Reglas compartidas, pagos y otras aplicaciones no se modifican. Los campos QR son escritos por Admin SDK: las reglas existentes impiden añadirlos o modificarlos desde el cliente.
- Las visitas anunciadas anteriormente siguen funcionando; las que tienen pase requieren ese pase para confirmar el ingreso desde la lista.

## Entrega de turno

La transacción de entrega conserva tareas pendientes y agrega `operacionSnapshot`: visitas dentro, visitas esperadas hoy, solicitudes Pendiente/En proceso, encomiendas Recibido/En proceso de entrega y mantenciones activas vencidas o hasta siete días más adelante. Se muestra al recibir, en el acta y en impresión/PDF.

El resumen histórico no cambia al resolverse los registros. Los turnos anteriores muestran que no cuentan con resumen automático. Cada categoría guarda hasta 50 elementos; si se alcanza el límite se marca selección parcial y se pide consultar el módulo. Las consultas filtran por un solo campo y no necesitan nuevos índices compuestos. No se copian RUT, fotografías ni tokens al acta.

## Validación y publicación

- Pruebas unitarias: emisión, renovación, cancelación, permisos, horario, identidad, autor desactivado, restricciones, concurrencia simulada y persistencia del acta.
- Pruebas de interfaz: carga de scripts, aislamiento/escape de contenido, limpieza del token, validación manual y decodificación del QR con jsQR.
- Integración añadida al emulador: dos ingresos concurrentes, un solo registro, cancelación e inmutabilidad del resumen tras salida y recepción.
- El entorno local tiene Java 17; Firebase CLI exige Java 21 para ejecutar el emulador. GitHub Actions ya configura Java 21 y ejecuta la integración y reglas en cada PR.
- Antes de activar: CI completo y prueba física de cámara, compartir/descargar imagen y dos cuentas de conserjería en TEST. Las pruebas de navegador simuladas no verifican permisos físicos de cámara ni el diálogo nativo de compartir.
- Mantener el cambio en una rama y PR independiente hasta validar. El push a `main` activa el despliegue de Firebase existente; no fusionar como parte de la preparación.
