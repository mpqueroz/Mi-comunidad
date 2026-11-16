# Cierre pendiente de la auditoría del PR #18

Estado: PR en borrador. La autorización expresa del usuario permitió únicamente habilitar App Check API y API Keys API en `mercado-ciudadano`; no autoriza cambiar IAM, enforcement, restricciones de claves, fichas ni licencias. Se mantienen prohibidas la fusión y cualquier despliegue a Firebase.

## 1. Habilitación completada por el usuario; consultas disponibles
El usuario habilitó las dos APIs autorizadas desde Cloud Shell. [Firebase #173, intento 2](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43906272946/attempts/2) confirmó `complete=true`: ambas consultas ya responden a la credencial de auditoría. No repetir la habilitación ni agregar IAM.

App Check devolvió `services=[]` en la configuración base consultada; no equivale a enforcement verificado. API Keys: 1 clave con restricciones de aplicación y de APIs. No se leyó su valor ni se validó semánticamente cada patrón permitido. No exigir App Check ni cambiar restricciones sin preparar y probar la compatibilidad de los clientes y obtener autorización para esos cambios.

La habilitación ya no bloquea el cierre. Siguen pendientes las fichas descritas abajo, el alcance efectivo de configuración y la equivalencia del código desplegado.

## 2. Verificar y regularizar las dos fichas ausentes

Lectura real sin identificadores personales publicados:

- Dos cuentas Auth habilitadas mantienen `app=mi_comunidad`, rol `admin` y comunidad existente, pero no tienen ficha.
- Una coincide con `adminUid` del documento de comunidad.
- La otra pertenece a una comunidad sin `adminUid` registrado. Ese dato ausente no demuestra que la cuenta sea ilegítima, pero impide dar su titularidad por verificada solo mediante ese campo.
- Una de las dos cuentas pertenece a una comunidad activa con licencia vigente. Los conteos no identifican cuál; no asumir correlación entre grupos.

Procedimiento, pendiente de verificar las cuentas privadamente y de autorización para escribir:

1. Verificar que ambas sigan autorizadas por sus comunidades; no publicar UID, RUT, nombre ni correo en Actions o en el repositorio.
2. Para cada cuenta verificada, crear exclusivamente su documento `mi_comunidad_comunidades/<comunidadId>/administradores/<uid>` si aún no existe. Usar el nombre autorizado, estado acorde con la cuenta y fecha de creación del servidor, siguiendo el esquema del backend.
3. Releer Auth y comunidad antes de crear; abortar si cambió la identidad, rol, pertenencia, propietario registrado o estado. Preservar cuentas deshabilitadas y no sobrescribir fichas existentes. Realizar la intervención sin cambios administrativos concurrentes; Auth y Firestore no comparten una transacción atómica.
4. No crear usuarios, cambiar claims, contraseñas, licencias, vigencias ni estados de comunidad como parte de esta regularización. Si una cuenta antigua no está autorizada, detener su regularización y resolver expresamente su baja; no darle acceso para conseguir un informe verde.
5. Repetir el inventario. Mantener `readyForStrictAccess=false` ante cualquier inconsistencia. No publicar el acceso estricto mientras se deje fuera a una cuenta legítima sin haberla regularizado.

## 3. Regla exacta que se publicaría, solamente tras autorización separada

La composición conserva byte por byte las secciones publicadas de las otras aplicaciones y sustituye únicamente la sección Mi Comunidad por la del PR. Se prueba con datos ficticios en el emulador después de retirar ADC. Una consulta posterior compara versión y huella de la base para detectar cambios concurrentes. Si cambian las reglas publicadas, preparar y probar de nuevo.

El archivo compuesto se guarda solo en el runner; no se publica ni se adjunta el código desplegado a logs o artefactos. La evidencia de cada ejecución se conserva en `SECURITY-AUDIT.md`.

Ni el éxito del emulador ni la autorización para consultar/habilitar APIs autorizan fusionar o desplegar este PR.

## 4. Compatibilidad de datos históricos antes de publicar

Los casos administrativos de documentos, bloques y fichas laborales señalados en la evaluación se corrigieron en `cfe0f96`. Los validadores de bloques exigen el esquema completo también al actualizar; un bloque histórico sin campos requeridos o con tipos/tamaños fuera del contrato puede necesitar regularización antes de poder activar/desactivar. No se debe ampliar las reglas para aceptar datos arbitrarios ni modificar esos registros reales automáticamente. Completar un inventario agregado de compatibilidad y revisar cualquier migración por separado.

Resultado de la comprobación agregada en #173 (`5f1bb74`): cuatro comunidades, 0 bloques guardados y 0 incompatibles. No existe una migración de bloques pendiente con esa instantánea. La utilidad paginada de solo lectura se incorpora a la barrera de publicación para detectar incompatibilidades futuras.

## 5. Reparación puntual preparada, sin ejecución real

`scripts/regularizar-ficha-admin.cjs` exporta `repairAdminProfile`; no se agregó CLI ni workflow de escritura. El plan predeterminado solo lee y devuelve estado y necesidad de verificar titularidad, sin identificadores personales. Las pruebas usan datos ficticios y SDK simulado.

La aplicación exige simultáneamente proyecto `mercado-ciudadano` en argumento, Firestore y Auth; UID/comunidad verificados privadamente; nombre verificado; `approved=true`; `administrativeChangesPaused=true`; estado Auth esperado completo y propietario esperado. Si la comunidad no registra propietario, exige además `ownershipVerified=true`. Un propietario distinto, cuenta deshabilitada, otra app/rol/comunidad o comunidad suspendida abortan. Se relee Auth y después se usa una transacción Firestore con precondición de creación: no sobrescribe ni reactiva una ficha existente, incluso si aparece concurrentemente. Solo crea `nombre`, `estado=Activo` y `creadoEn` de servidor en la ficha puntual.

Antes de ejecutar se requiere revisión privada de ambas identidades y autorización específica para crear esas fichas. El nombre no debe adivinarse ni extraerse de un log público. La intervención debe excluir cambios administrativos concurrentes: Auth y Firestore no comparten una transacción atómica; la segunda lectura reduce la ventana pero no la elimina. No se cambian Auth, claims, contraseñas, licencias ni el propietario de comunidad. No se adjuntan datos privados o el plan por cuenta al repositorio público.

Ninguna prueba, aprobación del PR ni continuación de la auditoría ejecuta esta reparación. Mantener el PR en borrador y sin despliegue hasta cerrar la verificación y el inventario.

## 6. Decisiones pendientes tras la consulta ampliada de #178

- App Check: los cuatro servicios web consultados devolvieron configuración sin modos explícitos. Preparar proveedor y despliegue de cliente en entorno de pruebas, medir compatibilidad y solo entonces decidir enforcement por servicio. No activarlo dentro de esta auditoría sin autorización separada.
- Clave: objeto de restricción de navegador sin referrers listados; no dar por acreditada una limitación por dominio. Hay 27 APIs permitidas. Inventariar consumidores del proyecto compartido, confirmar el comportamiento efectivo de la política vacía y preparar una lista de orígenes/APIs que conserve las otras aplicaciones. No recortar la clave basándose únicamente en Mi Comunidad ni rotarla sin un plan de transición aprobado.
- Fichas: confirmar privadamente comunidad y personas que conservan administración, contrastar sus identidades reales y aplicar únicamente la reparación por cuenta autorizada. La función está preparada y probada con datos ficticios; no existe ejecución automática y no se crearon perfiles en producción.
- La autorización de habilitar las dos APIs no autoriza enforcement, cambios de restricciones, nuevas credenciales ni regularización de fichas. Las restricciones de no fusionar/no desplegar siguen vigentes.
