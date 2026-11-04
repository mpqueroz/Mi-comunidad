# Publicación comercial de Mi Comunidad

Plan esperado: 800000 CLP por comunidad por 12 meses. La cotización se obtiene del servidor mediante `cotizarPlanMiComunidad`. Ningún procedimiento de este documento se ha ejecutado como parte de las correcciones.

## Secretos y cuentas de ejecución

Provisionar previamente versiones habilitadas y acceso mínimo de cada cuenta de ejecución a los secretos que declara:

| Nombre | Configuración |
|---|---|
| `MC_MP_ACCESS_TOKEN_PRODUCTION` | Token del vendedor productivo |
| `MC_MP_WEBHOOK_SECRET_PRODUCTION` | Firma de la misma aplicación |
| `MC_PLAN_ANUAL_CLP_PRODUCTION` | `800000` |
| `MC_MP_ENVIRONMENT_PRODUCTION` | `production` |
| `MC_MP_WEBHOOK_URL_PRODUCTION` | `https://us-central1-mercado-ciudadano.cloudfunctions.net/webhookMercadoPagoMiComunidad` |
| `MC_MP_TEST_ACCOUNT_PRODUCTION` | Configuración de fixture declarada por checkout, sin token ni clave privada; producción rechaza fixtures |

Los dos últimos nombres son requisitos nuevos; no se presume que existan porque antes se usaban nombres de prueba. El procedimiento no crea secretos, versiones ni permisos IAM. Solo verifica metadatos y configuración no sensible (precio, entorno y URL). Nunca lee ni imprime valores de token o firma. Verificar procedencia de las credenciales en la aplicación emisora y mediante E2E autorizado.

## TTL de recibos webhook

Los recibos tienen `expiresAt` como timestamp de depuración a 24 horas. Antes del release, habilitar expresamente solo esa política:

```sh
gcloud firestore fields ttls update expiresAt \
  --collection-group=mi_comunidad_webhook_recibos \
  --database='(default)' --enable-ttl --project=mercado-ciudadano
```

Consultar sin modificar:

```sh
gcloud firestore fields ttls list \
  --collection-group=mi_comunidad_webhook_recibos \
  --database='(default)' --project=mercado-ciudadano --format=json
```

El preflight exige `expiresAt` con `ttlConfig.state` igual a `ACTIVE` sin offset adicional; ausencia, `CREATING` o `NEEDS_REPAIR` bloquean publicación. No se hace un despliegue global de índices que afecte las aplicaciones compartidas. TTL es depuración asíncrona; no garantiza borrado exactamente a las 24 horas. La ventana de firma es una defensa independiente.

Sintaxis y estados verificados en documentación oficial: [update](https://docs.cloud.google.com/sdk/gcloud/reference/firestore/fields/ttls/update), [list](https://docs.cloud.google.com/sdk/gcloud/reference/firestore/fields/ttls/list), [TtlConfig](https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.databases.collectionGroups.fields#TtlConfig).

## Procedimiento y validación

Usar una copia revisada completa y una ventana coordinada para publicar primero las funciones operativas compatibles y después ejecutar `bash scripts/habilitar-produccion.sh`. El script:

1. Instala herramientas por lockfile sin scripts de instalación y prueba Functions antes de consultar credenciales.
2. Crea una copia temporal privada excluyendo archivos locales, credenciales y herramientas administrativas. Transforma las seis declaraciones de secretos a `*_PRODUCTION` antes del análisis de Firebase; aborta si una declaración falta o está duplicada.
3. Verifica TTL, metadatos de secretos habilitados y precio/entorno/URL esperados. No muestra tokens ni firmas.
4. Publica explícitamente `webhookMercadoPagoMiComunidad`, `conciliarPagosMiComunidad`, `consultarLicenciaMiComunidad`, `cotizarPlanMiComunidad`, `resolverRevisionPagoMiComunidad`, `reiniciarCheckoutFallidoMiComunidad` y `crearCheckoutMiComunidad` en codebase `mi-comunidad`. Conserva otras funciones, Hosting y reglas.
5. Comprueba ACTIVE, enlaces productivos y scheduler de conciliación ENABLED mediante `scripts/conectar-produccion.py`, ahora de solo lectura. Limpia la copia temporal al terminar.

Cada revisión publicada declara producción directamente; no necesita un parche posterior desde TEST. Los despliegues de múltiples funciones siguen sin ser una transacción: mantener ventana operativa y no abrir ventas hasta comprobar todo. Si falla, examinar cada revisión efectiva; no repetir compras a ciegas.

Antes de abrir ventas validar alta, renovación, webhook auténtico sin recuperación manual, duplicados/concurrencia, rescate por conciliación, devoluciones, contracargos y su revisión contable. Un HTTP 200 aislado y pruebas con simulaciones no acreditan estos flujos.

Registrar SHA aprobado y revisiones anteriores. Reversión comercial: copia completa del SHA compatible usando el mismo procedimiento productivo, nunca un despliegue global ni bindings TEST. Comprobar datos, scheduler y flujos tras revertir. No se automatiza restauración de datos o reembolsos.


## Recuperación de checkout fallido

`reiniciarCheckoutFallidoMiComunidad` requiere superadministración y token del mismo entorno comercial. Antes de permitir reintento, consulta la API y exige evidencia de ausencia de pagos, metadata íntegra de la orden y revisión transaccional de su generación. Si la consulta falla, está truncada, encuentra pagos o faltan metadatos, detener la recuperación y revisar con trazabilidad: no marcar una orden como vacía manualmente ni generar otra compra para eludirla. Conservar el identificador y la revisión de checkout en el registro operativo.

La comprobación pública `--commercial` se ejecuta después de publicar el grupo e incluye rechazo sin sesión de cotización, resolución y reinicio de checkout. Es un smoke de autorización; no prueba la recuperación autorizada con API real.
