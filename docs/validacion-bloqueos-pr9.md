# Validación de bloqueos del PR 9

El PR permanece en borrador. NO fusionar ni desplegar esta revisión.

## Correcciones

- Las operaciones de `profesional.js`, la comprobación común de cuentas y la tarea de vencimientos respetan la licencia además de la suspensión administrativa. Se conserva la excepción de comunidades antiguas sin licencia; no constituye una prueba gratuita renovable.
- Checkout rechaza comunidades administrativamente suspendidas. Una aprobación recibida después de suspender queda en `payment_review` sin activar la licencia.
- Los reembolsos parciales positivos no se aceptan como un nuevo pago aprobado. El webhook los deriva a revisión. La conciliación recorre también órdenes `paid` y consulta el recurso individual para detectar reversos cuyo webhook se perdió.
- Los reversos verifican también el vendedor cuando está registrado. Una reversión antigua no suspende una licencia cuyo último pago es otro; exige revisión contable.

## Evidencia y alcance

- Pruebas locales de Node: pagos y Firestore simulados; incluyen inicio simultáneo de confirmaciones, reverso parcial, contracargo antiguo, suspensión entre checkout y confirmación, recorrido de 65 órdenes, fallo intermedio y vuelta del cursor. No son pruebas contra Mercado Pago.
- Pruebas añadidas para Firestore Emulator: diez confirmaciones iniciales concurrentes, carrera entre conciliación y confirmación, reverso perdido, vigencia por rol y regresión básica de anuncios/almacén. Revisar el resultado del workflow del commit; la ejecución local requiere Java 21.
- HMAC conserva validación obligatoria y ventana de diez minutos. No se desactiva para eludir el 401. La prueba auténtica requiere verificar la clave de la aplicación emisora y una entrega comercial real.

## Bloqueos pendientes

1. Confirmar todos los nuevos tests del emulador y comparar reglas actualmente publicadas de las tres apps con el archivo candidato. Las regresiones básicas no equivalen a una prueba funcional completa de Mercado Ciudadano y Almacén Digital.
2. Compra nueva y renovación extremo a extremo en TEST con webhook auténtico, sin recuperación manual; confirmar vendedor, entorno, precio y secretos efectivos. Repetir avisos y contrastar licencia y orden.
3. Validar la API real para conciliación y reversos, incluidos reembolsos parciales y tópicos de disputa. Definir restitución, revisión de períodos históricos, alertas y reintentos.

Limitaciones conocidas: checkout sigue creando una orden por solicitud; no hay recuperación automática de `pending`/`checkout_error`, ni paginación de más de 20 pagos por referencia. El cursor comparte la ventana de 30 entre pendientes y pagados: su latencia crece con el historial. Las ejecuciones solapadas pueden repetir consultas; la transacción protege la aplicación del pago, pero falta controlar el cursor concurrente y el volumen con pruebas reales. No habilitar producción con estas limitaciones sin resolución explícita.
