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

`scripts/regularizar-ficha-admin.cjs` exporta `repairAdminProfile`; la aplicación se preparó en `ejecutar-reparacion-fichas.cjs` y en un job manual de la rama de auditoría, desactivado por defecto. El plan predeterminado solo lee y devuelve estado y necesidad de verificar titularidad, sin identificadores personales. Las pruebas usan datos ficticios y SDK simulado.

La aplicación exige simultáneamente proyecto `mercado-ciudadano` en argumento, Firestore y Auth; UID/comunidad verificados privadamente; nombre verificado; `approved=true`; `administrativeChangesPaused=true`; estado Auth esperado completo y propietario esperado. Si la comunidad no registra propietario, exige además `ownershipVerified=true`. Un propietario distinto, cuenta deshabilitada, otra app/rol/comunidad o comunidad suspendida abortan. Se relee Auth y después se usa una transacción Firestore con precondición de creación: no sobrescribe ni reactiva una ficha existente, incluso si aparece concurrentemente. Solo crea `nombre`, `estado=Activo` y `creadoEn` de servidor en la ficha puntual.

Antes de ejecutar se requiere revisión privada de ambas identidades y autorización específica para crear esas fichas. El nombre no debe adivinarse ni extraerse de un log público. La intervención debe excluir cambios administrativos concurrentes: Auth y Firestore no comparten una transacción atómica; la segunda lectura reduce la ventana pero no la elimina. No se cambian Auth, claims, contraseñas, licencias ni el propietario de comunidad. No se adjuntan datos privados o el plan por cuenta al repositorio público.

Ninguna prueba, aprobación del PR ni continuación de la auditoría ejecuta esta reparación. Mantener el PR en borrador y sin despliegue hasta cerrar la verificación y el inventario.

## 6. Decisiones pendientes tras la consulta ampliada de #178

- App Check: los cuatro servicios web consultados devolvieron configuración sin modos explícitos. Preparar proveedor y despliegue de cliente en entorno de pruebas, medir compatibilidad y solo entonces decidir enforcement por servicio. No activarlo dentro de esta auditoría sin autorización separada.
- Clave: objeto de restricción de navegador sin referrers listados; no dar por acreditada una limitación por dominio. Hay 27 APIs permitidas. Inventariar consumidores del proyecto compartido, confirmar el comportamiento efectivo de la política vacía y preparar una lista de orígenes/APIs que conserve las otras aplicaciones. No recortar la clave basándose únicamente en Mi Comunidad ni rotarla sin un plan de transición aprobado.
- Fichas: confirmar privadamente comunidad y personas que conservan administración, contrastar sus identidades reales y aplicar únicamente la reparación por cuenta autorizada. La función está preparada y probada con datos ficticios; no se crearon perfiles en producción; el job manual solo puede ejecutarse con aprobación expresa, códigos y pausa de cambios administrativos.
- La autorización de habilitar las dos APIs no autoriza enforcement, cambios de restricciones, nuevas credenciales ni regularización de fichas. Las restricciones de no fusionar/no desplegar siguen vigentes.

## 7. Revisión privada y aprobación puntual por códigos

`scripts/verificar-fichas-privadas.py --project mercado-ciudadano` usa la sesión existente de gcloud y solo peticiones GET a Auth y Firestore. Se ejecuta privadamente en Cloud Shell; su entrada principal rechaza CI antes de solicitar un token. Pide únicamente los campos necesarios, excluye correos/contraseñas/hashes de autenticación y nunca imprime el token de sesión. Muestra al titular las cuentas administrativas habilitadas sin ficha, comunidad, UID, nombres, caso de titularidad, nombre propuesto y un código SHA256 por cuenta. No escribe ni crea fichas. No publicar la salida completa; compartir solo los códigos de las identidades realmente verificadas.

La huella liga proyecto, identidad/claims/estado de Auth, comunidad, propietario y nombres. El ejecutor resuelve todas las huellas aprobadas antes de la primera escritura; admite uno o dos códigos únicos. Un cambio de estado, propietario o nombres invalida el código. Las huellas no son credenciales ni una autorización de escritura por sí solas: el usuario debe autorizar explícitamente crear las fichas de esos códigos y verificar la titularidad cuando falte propietario registrado.

El job `repair-admin-profiles` solo admite workflow_dispatch en la rama y repositorio exactos, tras aprobar pruebas. Requiere `repair_admin_profiles=true`, `admin_changes_paused=true` y códigos no vacíos; por defecto no ejecuta. Los códigos van por variable de entorno, sin interpolación en shell. Instala SDK sin scripts antes de autenticar y solo llama a la reparación puntual. Después repite el inventario incluso si hubo fallo. Ambos despliegues mantienen sus condiciones exclusivas de main.

Operación propuesta por cuenta: crear únicamente `nombre` verificado, `estado=Activo` y `creadoEn` del servidor si la ficha sigue ausente. Esto permite a esa cuenta superar la comprobación de ficha del acceso estricto cuando también cumpla la licencia. No sobrescribir fichas existentes; una segunda ejecución conserva cualquier ficha que ya exista, incluso inactiva. Las cuentas Auth, roles, claims, licencias y propietarios no se modifican. Excluir cambios administrativos concurrentes durante la intervención: no se ofrece atomicidad conjunta Auth/Firestore ni atomicidad de las dos reparaciones como lote. Si la segunda falla tras la primera, informar los conteos de avance, no ocultar el éxito parcial ni borrar automáticamente la ficha creada.

La verificación privada con datos reales y la aprobación del usuario siguen pendientes. Una cuenta no reconocida no se regulariza ni se da de baja automáticamente. La verificación de credenciales de clientes, App Check y restricciones de claves permanece separada de esta operación; no se autoriza fusión ni despliegue.

## 8. Comando privado reproducible, sin escrituras

En Cloud Shell del titular, descargar la revisión inmutable y comprobarla antes de ejecutarla:

```bash
curl -fsSL https://raw.githubusercontent.com/mpqueroz/Mi-comunidad/cb9d5499eca70225ff84fea029a69b217d45b480/scripts/verificar-fichas-privadas.py -o /tmp/verificar-fichas.py
echo '02e90db402ad06f4a7da23b10d411af4370b78a2a3358316708e26cb686d5e76  /tmp/verificar-fichas.py' | sha256sum -c - && python3 -B /tmp/verificar-fichas.py --project mercado-ciudadano
```

El segundo comando solo ejecuta el archivo si coincide con la huella revisada. No compartir tokens ni la salida completa. Revisar privadamente comunidad, UID, nombre propuesto y titularidad, especialmente la comunidad sin propietario registrado. Si una cuenta no se reconoce o el nombre propuesto no es correcto, no aprobar su código.

Solicitud concreta, únicamente después de esa revisión: «Autorizo crear únicamente las fichas de estos códigos: …; confirmo sus identidades, comunidades y nombres propuestos, y que no habrá cambios administrativos concurrentes durante la reparación». Esto autoriza la creación puntual descrita en las secciones 5 y 7, no licencias, propietarios, Auth/claims, restricciones, enforcement, fusión o despliegue. La creación habilita la comprobación de ficha y solo permite acceso cuando se cumplan también las demás condiciones de licencia/comunidad. No interpretar la mera ejecución del comando ni un código aislado como autorización.

## 9. Consulta privada fallida: diagnóstico sin identidades

La captura del usuario confirma que la descarga y SHA256 de la revisión anterior aprobaron, pero la consulta no terminó. No identifica la causa: no asumir sesión caducada, permisos o error HTTP concreto. No se recibieron códigos ni autorización por cuenta, y no se ejecutó regularización.

La versión actual añade `--diagnostico`, que solo muestra conteo si termina y, ante error, fase fija (`sesion_gcloud`, `auth_listar_cuentas`, `firestore_leer_ficha`, `firestore_leer_comunidad`), código fijo y estado HTTP cuando exista. Nunca imprime token, URL privada, cuerpo/mensaje externo ni identidad. Ocho pruebas Python con datos ficticios verifican lectura, privacidad, huellas, CI y errores seguros; están incluidas en el caso Node, no son casos adicionales al total Node.

La huella SHA256 de este script es `d52acdb6ae4cd10e2b36185ee3952eb833244fb51614c64bc59dde6da8a518d5`. Descargar el archivo de la revisión inmutable que introduce esta sección y comprobar la huella antes de ejecutar `python3 -B /tmp/verificar-fichas.py --project mercado-ciudadano --diagnostico`. Compartir solo la línea de diagnóstico. Si termina con OK, ejecutar después sin `--diagnostico` para revisar identidades privadamente; mantener las condiciones de autorización puntual anteriores. No cambiar IAM ni habilitar servicios por conjetura.

## 10. 403 confirmado en Authentication y proyecto de cuota explícito

La siguiente captura del usuario confirma `auth_listar_cuentas / HTTP_ERROR / 403`. No acredita por sí sola falta de IAM ni sesión caducada. La petición ahora incluye `x-goog-user-project: mercado-ciudadano`, limitado al mismo proyecto consultado, conforme a https://docs.cloud.google.com/docs/authentication/rest. No cambia configuración de gcloud/ADC, IAM, APIs habilitadas o datos Firebase. Designar el proyecto de cuota usa los permisos existentes; no los concede. Que esta cabecera resuelva el 403 sigue pendiente de la prueba real del titular.

Si persiste, la salida solo puede añadir un motivo de ErrorInfo en una lista cerrada de códigos conocidos; se omiten mensajes, metadata, consumidores, URLs y cuerpos externos. Se cierra la respuesta HTTP incluso ante errores/404. Esto corrige además la advertencia de recurso abierto que provocó una regresión del test bajo Python 3.14 en Actions: la revisión 78fddc8 no aprobó CI y no se debe describir como validada remotamente. Nueve casos Python (también con ResourceWarning tratado como error) y 154 casos Node de funciones aprobaron localmente en la corrección; siguen sin aportar prueba de funcionamiento con la cuenta real del usuario.

Nueva huella de script: `41cef6039632e11806e219c22fd03e2d21f90604084a1b60fad9135efdcf0918`. Usar el archivo de la revisión que introduce esta sección, verificar SHA256 y ejecutar con `--project mercado-ciudadano --diagnostico`. Si aparece OK, continuar la revisión privada sin ese flag. No ampliar permisos ni habilitar servicios automáticamente para resolver un 403.
