# Integración Mercado Pago — Mi Comunidad Digital (rama de desarrollo)

**NO desplegar ni fusionar todavía.** El proyecto Firebase comparte recursos con otras aplicaciones.

## Flujo implementado
1. Administrador autenticado llama `crearCheckoutMiComunidad`. El servidor fija precio anual en CLP y registra orden pendiente.
2. Servidor crea preferencia Checkout Pro con `external_reference` de la orden y devuelve URL.
3. Mercado Pago notifica a `webhookMercadoPagoMiComunidad`. Se valida HMAC `x-signature`, `x-request-id`, `data.id` y antigüedad de la firma.
4. Servidor consulta `GET /v1/payments/{id}` con credencial secreta. Solo procesa `approved` si coinciden ID, preferencia, referencia, moneda, monto y modo de credencial.
5. Transacción Firestore marca la orden pagada y extiende licencia. Una notificación duplicada no vuelve a extenderla.

## Secretos Firebase necesarios (NO introducirlos en GitHub)
- `MC_MP_ACCESS_TOKEN`: token privado de Mercado Pago (primero TEST).
- `MC_MP_WEBHOOK_SECRET`: clave de firma configurada en Webhooks.
- `MC_PLAN_ANUAL_CLP`: precio anual definitivo en pesos chilenos, número entero positivo.
- `MC_MP_WEBHOOK_URL`: URL HTTPS **real** de la función webhook de esta app.

Configurar desde CLI autorizada con `firebase functions:secrets:set NOMBRE`, seleccionando cuidadosamente el proyecto. No configurar URL ni token productivo durante pruebas.

## Pendientes antes de producción
- Ejecutar `node --test functions/tests/*.test.js`, análisis de sintaxis y pruebas Firebase Emulator.
- Verificar reglas Firestore de licencias y demás funciones que operan con Admin SDK.
- Prueba extremo a extremo con cuenta TEST, firma real, webhook duplicado, monto incorrecto, pago rechazado, pago demorado, cancelación y reembolso/contracargo.
- Confirmar precio anual, tratamiento de IVA/documentos tributarios, política de devoluciones, soporte y condiciones de servicio.
- Verificar con eventos reales los reversos: el webhook marca la orden en revisión y suspende la licencia cuando corresponde al último pago, pero no cubre todos los tipos de disputa ni reembolsos parciales.
- Validar con la API de pruebas la recuperación de compras mediante conciliación programada.
- Definir y probar flujo de retorno desde Checkout Pro. **La página de retorno no activa licencias.**
- Asegurar que el URL de pago devuelto coincida con los dominios admitidos por el navegador.
- Mantener `firestore.rules` de Mercado Ciudadano y Almacén Digital sin cambios ajenos a Mi Comunidad.
- Autorizar explícitamente despliegue solo después de pruebas.

Documentación: https://www.mercadopago.cl/developers/es/docs/checkout-pro-orders/resources/notifications/webhooks

## Conciliación programada (en desarrollo)
- Función `conciliarPagosMiComunidad`: revisión horaria de hasta 30 órdenes `checkout_ready` o `paid` por ejecución, con cursor persistente y vuelta al inicio, buscando pagos por `external_reference` y verificando el recurso individual antes de renovar.
- La conciliación comparte la transacción idempotente del Webhook: dos avisos del mismo pago no deben duplicar períodos.
- **Pendiente antes de publicar:** probar el cursor con más de 30 órdenes, fallos intermedios y ejecución concurrente; definir antigüedad máxima, alertas y reintentos para evitar órdenes abandonadas.
- Validar en entorno TEST la disponibilidad y formato de `GET /v1/payments/search?external_reference=...` y de `preference_id` en pagos Checkout Pro.
- Registrar y tratar reembolsos, contracargos y pagos aprobados para comunidades suspendidas, evitando habilitaciones indebidas.

## Reembolsos y contracargos (implementación preliminar)
- El Webhook de tipo `payment` consulta el pago directamente a Mercado Pago.
- Estados `refunded` y `charged_back`: solo si coinciden referencia, preferencia, moneda, monto, modo y pago ya registrado, la orden pasa a `payment_review`.
- Si la licencia conserva ese pago como `lastPaymentId`, se marca `suspended` con `suspensionReason=payment_reversed`. Requiere revisión del superadministrador.
- Una orden antigua revertida no suspende automáticamente una licencia renovada después con otro pago.
- **Antes de producción:** comprobar notificaciones reales de contracargos, que pueden usar otros tópicos/estados; validar reembolsos parciales, conciliación de pagos ya marcados `paid`, y un procedimiento seguro de restitución. La conciliación ahora consulta también pagos previamente aprobados para detectar reversos perdidos; falta validarlo contra la API TEST.
