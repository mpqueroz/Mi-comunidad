# Resolución segura de revisiones de pago

El superadministrador accede desde Licencias y pagos → Pagos por revisar → Revisar.
Se exige justificación de al menos veinte caracteres. Cada resolución consulta otra
vez pago y orden comercial en Mercado Pago y verifica vendedor, entorno, moneda,
monto, referencia, preferencia e identificador. Orden, licencia y auditoría se
actualizan en una misma transacción; repetir una resolución no agrega meses.

- **Aplicar pago retenido**: exclusivamente `approved_while_suspended` que continúa
  aprobado y sin reembolso, con suspensión administrativa ya regularizada. Registra
  saldo anterior y vigencia aplicada para futuros reversos.
- **Confirmar reverso total**: exige reverso total, correspondencia con el último
  pago de la licencia y snapshot previo verificable. Restituye exclusivamente saldo
  anterior; jamás conserva el año devuelto. Incrementa `checkoutRevision` en la
  misma transacción para que una nueva compra tenga una intención distinta.
- **Cerrar reverso histórico**: exige otro último pago; no modifica licencia posterior.
- **Cerrar segundo cobro devuelto**: exige devolución íntegra o contracargo verificado
  del segundo pago. Cierra su incidencia y conserva pago original y licencia. La
  bandera `additionalPaymentReview` continúa si hay otras incidencias abiertas.

El resumen consulta también órdenes pagadas con `additionalPaymentReview`: los cobros
adicionales no quedan ocultos por conservar el estado `paid` de la orden original.
Los incidentes ya resueltos no se vuelven a ofrecer. El historial marca revisiones
adicionales pendientes.

Reembolsos parciales, órdenes sin snapshot y vigencia modificada permanecen pendientes
para revisión contable especial. No se calcula un período arbitrario ni se concede
acceso gratuito. No se emiten notas de crédito ni otros documentos tributarios.

La cotización visible viene de `cotizarPlanMiComunidad`; sin monto CLP y plazo válidos
no se ofrece cobro. Un cambio administrativo de precio entre consulta y checkout se
muestra finalmente en Mercado Pago.

Despliegue requiere que cotización, checkout, webhook, conciliador y resolución usen
el mismo entorno comercial y los secretos correspondientes. La resolución declara
el mismo secreto de acceso que Mercado Pago. No basta reconectar dos endpoints.

Pruebas locales simulan Firestore/API y cubren permisos, repetición, devolución total,
saldo previo, ciclo de recompra, historial, cobro adicional, rechazo de parcial y
antecedentes insuficientes, visibilidad del segundo cobro y cotización. No equivalen
a una compra/reembolso/restablecimiento real ni a emisión tributaria.


## Reinicio administrativo de checkout fallido

El panel muestra también órdenes `pending`/`checkout_error`. El reinicio verifica
que el POST nunca comenzó (`not_started`) o tuvo rechazo inequívoco (`rejected`),
espera al menos quince minutos y exige búsquedas completas de preferencias y pagos
sin recursos asociados. Órdenes de más de noventa días y resultados inciertos se
mantienen para revisión especial: una búsqueda vacía no demuestra que no hubo cobro.
La transacción vuelve a comprobar estado, resultado del envío, comunidad y ausencia
de preferencia; cierra la orden como `checkout_cancelled`, incrementa el ciclo de
compra y deja auditoría. El envío original tiene una barrera transaccional para que
un proceso antiguo no pueda enviar después de la cancelación. El reinicio no crea
una preferencia ni cobra: la administración debe iniciar otra compra posteriormente.

Endpoint: `reiniciarCheckoutFallidoMiComunidad`, reservado a superadmin y configurado
con el mismo secreto de acceso del entorno comercial. Debe incluirse en el manifiesto
de despliegue comercial junto con la resolución de revisiones.
