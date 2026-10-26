# Configuración comercial de Mi Comunidad

Marcelo confirmó 800000 CLP por comunidad y 12 meses. El 25/10/2026 se comprobó
el pago ficticio con entrega automática HTTP 200 y renovación hasta 2029.

Las claves reales se guardan por separado en MC_MP_ACCESS_TOKEN_PRODUCTION y
MC_MP_WEBHOOK_SECRET_PRODUCTION; no están incluidas en el repositorio.

Ejecutar `bash scripts/habilitar-produccion.sh` desde una copia completa del
repositorio autenticada en Cloud Shell. Prueba el código y despliega únicamente
crearCheckoutMiComunidad y webhookMercadoPagoMiComunidad; después conecta las
versiones concretas de secretos productivos conservando los nombres de las
variables que lee el código. No publica Hosting, reglas ni otras funciones.

El script configura MC_PLAN_ANUAL_CLP_PRODUCTION=800000 y
MC_MP_ENVIRONMENT_PRODUCTION=production, concede acceso a los secretos únicamente
a las cuentas de ejecución correspondientes y verifica los enlaces resultantes.
No ejecuta compras ni valida las credenciales contra una transacción real.
La prueba técnica está bloqueada en producción antes de crear una orden.

IMPORTANTE: Firebase conoce los nombres lógicos originales de los secretos.
Un despliegue futuro convencional puede restaurar sus enlaces de prueba:
usar nuevamente habilitar-produccion.sh y verificar el resultado. No desplegar
conciliarPagosMiComunidad con su configuración de prueba durante esta etapa.
Si falla la conexión tras actualizar una función, no iniciar pagos hasta resolver
el estado parcial. Conservar las versiones anteriores para una reversión.

Pendiente después de conectar: comprobar la pantalla comercial con el monto real,
la compra y alta de una comunidad nueva y las condiciones de acceso. La prueba de
renovación no demuestra todavía el alta automática de un comprador nuevo.
