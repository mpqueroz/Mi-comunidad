# Recuperación de la compra técnica del 25/10/2026

Orden `bMD6LqqClo6nUQ2VETv3`, pago `186051318596`, comunidad técnica `nodar-pagos-prueba-20261025`.

La API devolvió pago approved y live_mode=true; el código anterior derivaba liveMode=false del entorno comercial test. Son controles diferentes: ahora `MC_MP_TEST_ACCOUNT` vincula el vendedor de prueba y el modo API esperado. Las preferencias nuevas deben pertenecer a ese vendedor; los cobros deben coincidir en vendedor, modo, referencia, preferencia, importe, moneda y período. Producción mantiene modo API true.

El webhook devuelve 401 antes de consultar el pago. El código admite ts de 10 dígitos (segundos) y 13 (milisegundos) sin modificar el manifest firmado, mantiene ventana de diez minutos y registra solo el motivo de rechazo. Esto corrige una limitación del validador; todavía no demuestra cuál fue el motivo de los avisos originales. Si persiste hmac_mismatch se debe revisar la clave correspondiente a la aplicación/cuenta que emitió el pago; no desactivar HMAC.

Desde Cloud Shell, ejecutar scripts/corregir-confirmacion-prueba.sh. Verifica por API el pago y la orden comercial y comprueba la comunidad técnica antes de crear MC_MP_TEST_ACCOUNT. El vendedor esperado 3791682940 procede del panel de credenciales de prueba; si la API devuelve otro, se detiene sin activar la licencia. Despliega solo Checkout y webhook de Mi Comunidad, sin Hosting, reglas ni Sandbox.

La recuperación exige entorno test, comunidad marcada mpTestFixture, administrador técnico, orden exacta, importe de 1000 CLP y 12 meses. Usa fetchCheckoutPayment y verifyPayment compartidos. Corrige el modo de esta orden y activa su licencia en un único Commit con precondiciones updateTime para cada documento. No usa el comprobante como autorización. No cambia credenciales de acceso ni restablece el trial. Se ejecuta dos veces: la segunda debe indicar ya aplicado y conservar vencimiento.

Esto recupera una compra que no procesó el webhook. No equivale a validar la recepción de una notificación auténtica: después de desplegar, comprobar una entrega desde Mercado Pago y su respuesta HTTP, más ausencia de cambio de vigencia al repetirla. No fusionar PR ni publicar producción hasta completar esa comprobación.
