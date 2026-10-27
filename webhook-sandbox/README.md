# Sandbox de webhook Mercado Pago

Función aislada sin Firestore, Admin SDK, pagos ni licencias. Desplegar exclusivamente con `firebase deploy --only functions:mp-webhook-sandbox --project mercado-ciudadano` tras configurar `MC_MP_WEBHOOK_SECRET`. No desplegar todo el proyecto. La prueba de Mercado Pago debe usar la URL de `webhookMercadoPagoNodarSandbox` y una firma HMAC válida.
