# Prueba comercial aislada antes de producción

La compra TEST auténtica sigue pendiente. Esta preparación no despliega funciones,
no crea cuentas, no configura Mercado Pago, no lee credenciales y no modifica datos
remotos. Las pruebas automatizadas usan el handler del candidato y una API simulada;
no se presentan como compras reales.

## Procedimiento histórico bloqueado

`scripts/desplegar-pagos-prueba.sh` ahora aborta siempre. Su versión anterior
publicaba TEST bajo los nombres `crearCheckoutMiComunidad` y
`webhookMercadoPagoMiComunidad`, que actualmente atienden producción. No debe
reutilizarse ese procedimiento para probar el candidato. Los documentos históricos
que lo mencionan describen el ensayo del 25 de octubre, no una instrucción vigente.
Los scripts antiguos de acceso o Hosting tampoco preparan el nuevo espacio E2E.

## Candidato local

Desde el repositorio revisado:

```sh
node scripts/preparar-pagos-e2e.cjs /ruta/privada/nueva/mi-comunidad-e2e
```

El destino debe ser nuevo. El directorio se crea con permisos 0700 y contiene
solamente tres módulos comerciales, la entrada E2E y los lockfiles del candidato;
no copia claves, archivos locales, utilidades administrativas ni `node_modules`.
La configuración resultante contiene únicamente el codebase `mi-comunidad-e2e`.

| Elemento | Aislamiento E2E |
|---|---|
| Funciones | Seis nombres terminados en `MiComunidadE2E` |
| Claims de Authentication | `app: mi_comunidad_e2e`; los claims productivos se rechazan |
| Datos | Colecciones `mi_comunidad_e2e_*`, incluidas órdenes, licencias, comunidades, recibos y auditoría |
| Credenciales y configuración | Seis secretos independientes con sufijo `_E2E` |
| Importe permitido | Exactamente 1000 CLP |
| Entorno permitido | Únicamente `test` |
| Destino del webhook | Exclusivamente `https://us-central1-mercado-ciudadano.cloudfunctions.net/webhookMercadoPagoMiComunidadE2E` |
| Conciliación | Callable manual para superadministrador E2E; sin Scheduler exportado |
| Capacidad | Una instancia y concurrencia uno por función |

El código de renovación, firma, deduplicación, consulta al proveedor y revisiones
se toma del candidato. Las transformaciones cambian el espacio de datos y las
restricciones del ensayo; la conciliación conserva su implementación y sustituye
el disparador periódico por una llamada autenticada explícita. El generador
aborta si cambian los puntos críticos que debe transformar.

## Preparación remota necesaria, aún sin ejecutar

Antes de desplegar, revisar el manifiesto local `e2e-manifest.json` y obtener la
autorización de publicación limitada a este codebase. No desplegar el repositorio
completo ni los nombres productivos para preparar TEST.

Los parámetros exclusivos son:

- `MC_MP_ACCESS_TOKEN_E2E`: credencial de pruebas cuya procedencia se comprueba en
  la aplicación de Mercado Pago; no copiar el token productivo.
- `MC_MP_WEBHOOK_SECRET_E2E`: firma de las notificaciones de esa prueba.
- `MC_PLAN_ANUAL_CLP_E2E`: `1000`.
- `MC_MP_ENVIRONMENT_E2E`: `test`.
- `MC_MP_WEBHOOK_URL_E2E`: URL E2E exacta de la tabla.
- `MC_MP_TEST_ACCOUNT_E2E`: JSON con `collectorId` y `liveMode` verificados para el
  vendedor de pruebas; no inferir el entorno por el prefijo del token.

Los controles de código no sustituyen comprobar la procedencia de las credenciales
y usar comprador y tarjeta de prueba. Authentication y Firestore siguen siendo
servicios del proyecto compartido: se necesitan cuentas dedicadas nuevas, sin
alterar claims o estados de cuentas reales. Las reglas públicas actuales no se
amplían para acceder al namespace de prueba; el ensayo usa funciones y verificación
autorizada del operador.

Después de desplegar, crear fixtures únicamente en `mi_comunidad_e2e_*` con
`mpTestFixture: true`, licencia de prueba y administración E2E. Conservar sus
identificadores para retirar exclusivamente esos recursos al cerrar el ensayo.
El aislamiento es por funciones, credenciales, claims y colecciones; no constituye
un proyecto de Google Cloud separado ni una nueva frontera IAM.

## Evidencia exigida antes de aprobar ventas

Registrar SHA del candidato, parámetros no sensibles, revisiones desplegadas e
identificadores de órdenes y pagos. Ejecutar compra y renovación con comprador y
tarjeta TEST, retorno del checkout y webhook real; contrastar importe, vendedor,
referencia, moneda, entorno y licencia. Reenviar el aviso y demostrar que la
vigencia no aumenta otra vez; simular un aviso perdido y ejecutar conciliación
manual, además de revisar reversos disponibles y recuperación de errores.

No publicar tokens, firmas, códigos OAuth, contraseñas ni datos tributarios
completos en la evidencia. La activación comercial de producción conserva su
aprobación y verificaciones separadas. El éxito E2E no prueba Cloud Scheduler
productivo, reglas de otras aplicaciones, restauración de respaldos o dispositivos
físicos.

## Validación de esta preparación

`node --test tests/despliegue-e2e.test.js` comprueba aislamiento de escrituras con
checkout y webhook del candidato, renovación idempotente, rechazo de claims y
configuraciones productivas, bloqueo de consultas API si cambia el entorno,
selección de archivos y funciones, conciliación manual autorizada y bloqueo del
script histórico. La carga local del paquete preparado con el SDK real confirma
seis exports y secretos `_E2E`, sin un Scheduler exportado. Nada de ello acredita
una operación contra la API auténtica de Mercado Pago.
