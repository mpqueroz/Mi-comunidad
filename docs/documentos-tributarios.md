# Boleta o factura en el checkout de Mi Comunidad

La compra requiere elegir boleta o factura antes de crear la preferencia de pago.
Boleta solicita correo. Factura solicita además RUT con dígito verificador válido,
razón social, giro, dirección y comuna. La validación de formato no acredita los
antecedentes ante el SII. El precio se mantiene definido en servidor.

Cada orden nueva conserva una copia de la solicitud en `documentoTributario`,
con estado `no_emitido` y modalidad `manual_sii`, fijados por el servidor.
El webhook confirma el pago y la licencia; no emite un DTE ni cambia ese estado.
Los datos tributarios no se envían como metadatos a Mercado Pago.
Las órdenes anteriores continúan funcionando sin ese campo.

El superadministrador puede consultar los datos en Licencias y pagos → Historial.
Tras pago confirmado se muestra «Por emitir manualmente en SII». La emisión y
el envío al correo se realizan manualmente fuera de esta aplicación; esta versión
no registra folio ni confirma envío. Los reversos exigen revisión contable.
No hay emisión automática, generación de PDF tributario ni integración con SII.

Antes de producción, Nodar debe confirmar su habilitación para emitir ambos DTE,
el tratamiento de IVA y el modelo de emisión declarado para sus pagos electrónicos,
y definir quién emite y envía cada documento. Un comprobante de pago no debe
marcarse automáticamente como boleta emitida. Esta captura de datos no resuelve
los bloqueos comerciales y de compatibilidad del PR #9.

Validación local: suite Node de functions con solicitudes ausentes o inválidas,
RUT incorrecto, límites de campos, conservación tras webhook y descarte de estados
tributarios falsificados por el cliente. APIs de pagos y Firestore simuladas.
No se ha emitido un DTE real ni ejecutado una compra real con este cambio.
