# Prueba de Checkout Pro: 25 de octubre de 2026

El receptor `webhookMercadoPagoNodarSandbox` validó una simulación de Mercado Pago
con HTTP 200 tras vincular `MC_MP_WEBHOOK_SECRET` versión 5. No procesa cobros.

## Preparación del flujo de licencia

- `functions/mercadopago.js` consulta el pago y la orden comercial indicada por
  `payment.order.id`. Comprueba ID de orden, referencia externa y pertenencia del
  pago antes de utilizar `merchant.preference_id` para compararla con la preferencia
  almacenada. No depende de `preference_id` en la respuesta de Payments.
- Se conserva la verificación de firma, monto, moneda, estado y modo, así como la
  transacción de renovación idempotente y la comprobación de reversos.
- El webhook de pago tiene invocación pública para recibir los avisos de Mercado
  Pago; la firma sigue siendo obligatoria.
- `node --test functions/tests/*.test.js`: 32 pruebas locales correctas, incluidas
  las ocho pruebas nuevas del flujo con HTTP y Firestore simulados. No equivalen a
  una compra con la API real ni a una ejecución contra Firebase Emulator.

## Despliegue de prueba autorizado

Ejecutar `bash scripts/desplegar-pagos-prueba.sh` desde esta revisión.
El script verifica entorno `test`, monto 1000 CLP y URL de webhook comercial;
lee el token sin mostrarlo y, para tokens APP_USR, exige que `/users/me` identifique
la cuenta como `test_user`. Los tokens `TEST-` son credenciales de prueba.
Después instala dependencias, ejecuta las pruebas y despliega exclusivamente:

- `crearCheckoutMiComunidad`
- `webhookMercadoPagoMiComunidad`

No despliega Hosting, reglas, otras funciones ni el receptor Sandbox. La
conciliación programada queda fuera de este despliegue. Si alguna comprobación
falla, se detiene y no intenta un despliegue más amplio.

## Aún pendiente

Confirmar ambas funciones ACTIVE; configurar las notificaciones para el webhook
comercial; realizar una compra con comprador y tarjeta de prueba; comprobar en una
comunidad de prueba la orden pagada y los doce meses de licencia, y reenviar el
aviso para verificar que la vigencia no se duplica. No usar esta prueba como
autorización para publicar el cobro productivo de Nodar Store.

Referencias primarias:
- https://github.com/mercadopago/sdk-nodejs/blob/master/src/clients/payment/commonTypes.ts
- https://www.mercadopago.cl/developers/es/reference/online-payments/checkout-pro-preferences/merchant-orders/search-merchant-order/get
- https://firebase.google.com/docs/functions/config-env
