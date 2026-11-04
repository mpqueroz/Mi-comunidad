# Cierre técnico para producción

Fecha: 4 de noviembre de 2026. Propuesta: PR #17, rama `codex/cierre-produccion-integral`.

## Estado

Este cambio es un candidato de publicación, no una certificación del entorno productivo. No se fusionó ni desplegó durante su preparación. Incluye el PR #16 como base; no incorpora el QR del PR #14, que conserva su validación independiente.

## Correcciones

| Área | Comportamiento del candidato |
| --- | --- |
| Sueldos y mantenciones | Cierre y egreso dentro de una transacción, asiento determinista, reintentos sin duplicación y auditoría. |
| Gastos comunes y multas | Confirmación, ingreso, aviso y auditoría en una transacción. El residente informa el pago; no lo confirma. |
| Conciliación bancaria | Asociación, ingreso y eventual saldo a favor se confirman en servidor. La desvinculación conserva pagos y asientos; los saldos que requieren ajuste se derivan a revisión. |
| Familiares y restricciones | Cambios transaccionales por persona con validación; no reemplazan un arreglo obtenido en otra sesión. Datos históricos inválidos se muestran con tolerancia, pero no se eliminan silenciosamente. |
| Checkout | Cuenta vigente, cotización del servidor, intención estable por ciclo y comprobación de ese ciclo dentro de la selección y antes del POST. |
| Recuperación de cobros | Las creaciones inciertas se buscan y verifican mediante API; no se repite un POST de resultado desconocido. Paginación, cursor exclusivo y avance reanudable. |
| Webhook | HMAC obligatorio y registro de recepción con exclusión temporal; la renovación transaccional evita duplicar vigencia. |
| Reversos | Verificación actual por API, restitución solo del saldo anterior registrado y auditoría. Resolver un reverso total habilita una nueva intención de compra. |
| Cobros adicionales | Incidencia visible aunque la orden original siga pagada. El cierre exige devolución total verificada; no cambia el pago original ni su licencia. |
| Despliegue | Declaraciones productivas en copia temporal antes de publicar; verificación de secretos, entorno, scheduler y TTL. Lista explícita de funciones y conservación de reglas de las otras aplicaciones. |
| Tareas programadas | Lecturas paginadas; la depuración no borra un documento modificado después de consultar y los vencimientos no sobrescriben un pago concurrente. |
| Interfaz | Confirmación tras persistir; errores sin éxito falso; diálogo accesible con control y restauración de foco. |

## Validación

Resultado local final: **106/106 pruebas de Functions y 194/194 de la suite con emuladores; 300 aprobadas, cero fallos y cero omisiones**. Incluye diez conciliaciones concurrentes que producen un único saldo, rechazo de importes insuficientes, fallo de commit, reasociación segura y protección frente a dos bancos aplicados a una misma deuda.

Los resultados finales y el SHA validado deben coincidir con los checks del último commit del PR. No sumar como cobertura nueva las ejecuciones repetidas de una misma suite.

- `npm --prefix functions run check`: sintaxis y pruebas Node, incluidas regresiones de pagos, revisiones y transacciones simuladas.
- `npm --prefix tests test`: Firestore y Authentication emulados, con Node 22 y Java 21; integra pruebas de reglas, concurrencia y paginación.
- `npm --prefix functions audit --omit=dev --audit-level=moderate` y `npm --prefix tests audit --audit-level=moderate`: no se informaron vulnerabilidades en la consulta realizada durante este cierre.
- Navegador Chromium local, anchura de teléfono: ingreso y salida de administrador, residente y conserjería, llamadas autenticadas, egresos/ingresos concurrentes y cambios de restricciones. Datos ficticios y tráfico limitado a localhost.

La prueba de navegador utilizó Authentication/Firestore emulados y un servidor local que ejecutó los handlers HTTP de los callables del SDK. El worker estándar del emulador de Functions no pudo abrir su socket Unix en este entorno. No se presenta esta prueba como despliegue Cloud Run ni como compra de Mercado Pago auténtica. Las fuentes web externas se bloquearon deliberadamente en esta comprobación local.

## Condiciones antes de abrir ventas

1. Checks aprobados para el último SHA y revisión de la combinación final de reglas. Completar regresión funcional de Mercado Ciudadano y Almacén Digital, que comparten Firebase.
2. Ejecutar el preflight productivo de solo lectura y resolver cualquier bloqueo: siete funciones comerciales con sus secretos `_PRODUCTION`, entorno, importe, URL, scheduler y TTL `expiresAt` activos. No presumir existentes los nuevos secretos de URL/cuenta de prueba.
3. Probar en TEST auténtico: contratación asistida, trial vencido, compra y renovación, webhook real, aviso duplicado, webhook perdido y recuperación, reverso y resolución. Contrastar orden, vendedor, importe, entorno y licencia; conservar evidencia sin tokens ni datos tributarios completos.
4. Verificar la configuración efectiva de respaldos y ensayar restauración en un entorno aislado. Firestore no demuestra por sí solo recuperación de Authentication, claims o Storage.
5. Comprobar alertas, responsable de atención y procedimientos de revisión comercial/contable. Confirmar emisión manual de boleta/factura y seguimiento del envío; el comprobante del medio de pago no la sustituye.
6. Publicar durante una ventana coordinada del proyecto compartido y realizar recorridos autenticados posteriores. La comparación previa de versión de reglas detecta cambios anteriores, pero no ofrece un CAS global entre repositorios.

## Límites operativos explícitos

- Una orden antigua sin metadatos fiables, una creación incierta sin recuperación inequívoca o un reembolso parcial no generan vigencia automática: requieren revisión. No cancelar y volver a cobrar a ciegas.
- Registros históricos pagados sin vínculo contable no se reconfirman creando un segundo asiento. Revisar y migrar con trazabilidad.
- Desvincular cartola no equivale a deshacer el pago ni a borrar un saldo. Los ajustes contables son operaciones diferentes.
- La paginación limita memoria; el trabajo global de mantenimiento no tiene un checkpoint persistente entre ejecuciones. Un volumen que alcance el timeout debe repartirse y monitorizarse, no anunciarse como escalabilidad ilimitada.
- Cámara física, QR del PR #14, impresión y descarga en los dispositivos de los clientes conservan su comprobación específica.

No declarar la aplicación totalmente lista para producción hasta cerrar las condiciones anteriores con evidencia del entorno autorizado.
