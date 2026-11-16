# Cierre pendiente de la auditoría del PR #18

Estado: PR en borrador. El usuario habilitó App Check API y API Keys API en `mercado-ciudadano` y después creó/registró el proveedor Enterprise de Mi Comunidad; no autoriza cambiar IAM, enforcement, restricciones de claves, fichas ni licencias. Se mantienen prohibidas la fusión y cualquier despliegue a Firebase.

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

## 11. Único administrador real confirmado por el titular

El titular aclaró que únicamente su cuenta principal es administrativa real; las demás son de prueba. No crear fichas para esas cuentas por defecto ni borrar/deshabilitar usuarios como consecuencia automática de esta clasificación. El correo real no se almacena en el repositorio. Las capturas posteriores confirmaron diagnóstico completado/OK y dos fichas ausentes; el 403 de la consulta privada quedó resuelto después de fijar proyecto de cuota. La revisión privada anterior mostraba nombres pero no verificaba correo.

Se prepara `verificar-admin-principal.cjs`: usa el SHA256 del correo normalizado como entrada manual, recorre Auth paginado, exige coincidencia única y cuenta habilitada admin de Mi Comunidad, comprueba comunidad/ficha y devuelve exclusivamente booleanos, relación de propietario y huella de reparación. No devuelve nombre, correo, UID, comunidad ni credenciales. Es de solo lectura, con proyecto fijo y ADC ya configurado. Su integración opcional en el inventario solo admite la rama/repositorio de auditoría; no activa reparación ni modifica el inventario para ocultar cuentas de prueba.

La selección privada alternativa `--correo-principal` muestra únicamente la cuenta que coincida. La nueva huella liga también el correo normalizado. El ejecutor acepta esa huella y vuelve a verificar el correo en las dos lecturas Auth previas a crear. Si el correo cambia, aborta. El job de reparación continúa desactivado y exige aprobación concreta por cuenta y exclusión de cambios administrativos concurrentes. Una comunidad sin adminUid sigue requiriendo confirmación de titularidad; no se crea ese campo.

Secuencia de cierre: verificar principal por huella en modo lectura; revisar resultado; autorizar únicamente su ficha y pausa administrativa; ejecutar creación de nombre/estado Activo/creadoEn si sigue ausente; repetir inventario. La cuenta de prueba sin ficha puede mantener el inventario no apto: no debilitar esa barrera. Resolver expresamente con el titular su baja/revocación o tratamiento antes de publicación, sin otorgarle ficha para obtener verde. Permanecen pendientes proveedor/cliente App Check, compatibilidad de clave compartida y comparación del código desplegado. No se autorizan fusión ni despliegue en esta etapa.

## 12. Resultado real y diferencia entre correo de contacto y cuenta de acceso

La consulta manual #191 sobre b5a6cf8 encontró de forma única el correo indicado por el titular, pero su cuenta Auth no tiene `app=mi_comunidad` (`PRINCIPAL_OTHER_APP`). No se publican correo, UID, otros claims ni nombres. Eso impide ligarla a las fichas ausentes; no autoriza cambiar sus claims, trasladarla a esta aplicación ni crearle una ficha. El inventario de ese job se detuvo antes del recuento final, así que no atribuir a #191 los conteos históricos de #184. La consulta de configuración sí terminó.

El login de esta rama valida RUT y lo convierte a un correo sintético bajo mi-comunidad.app; el backend y el script de alta de superadministradores usan la misma conversión. Un correo de contacto no identifica necesariamente esa cuenta. El usuario debe verificar privadamente la cuenta con la que entra, sin enviarnos RUT ni contraseña.

Se añade `--rut-principal`: pide el RUT sin eco, verifica dígito y forma localmente, y consulta únicamente en modo GET usando la sesión gcloud existente. La entrada se usa como selector local; no se envía como parámetro de URL ni se imprime correo sintético/RUT. Rechaza CI antes de pedirlo. Si la cuenta tiene app correcta y rol superadmin, devuelve tipoPrincipal=superadmin y fichaComunitariaNecesaria=false, sin proponer reparación. Si tiene rol admin, limita el plan a esa cuenta. Si pertenece a otra app, está deshabilitada, no es única o no tiene rol esperado, aborta. No se piden contraseñas.

La huella del script actual es `83fe3a83a7eba2b55a46b26609c93178e0ce6e1273a9c7760c914dc7a20b504c`. Descargarlo de la revisión que introduce esta sección y comprobar SHA256 antes de ejecutar `python3 -B /tmp/verificar-fichas.py --project mercado-ciudadano --rut-principal`. Compartir únicamente resultado sin identidades/códigos seleccionados; nunca el RUT ni toda la salida privada.

Validación remota de b5a6cf8: Firebase #190 del PR aprobó 158 funciones y 239 emulador = 397 casos, sin fallos ni omitidos; Chromium y auditorías npm aprobaron (0 vulnerabilidades en árboles auditados). Los otros tres workflows aprobaron. #191 repitió las mismas 239 pruebas con composición real, preservó otras apps y confirmó base publicada sin cambios. Ambos despliegues, reparación y habilitación de APIs omitidos. El fallo global de #191 corresponde a la identidad principal no vinculada a la app, no a las pruebas. La nueva opción privada requiere su propia ejecución y no demuestra por sí sola correspondencia con la cuenta real.

Estado final de preparación: pendiente identificar el acceso real; no crear fichas de prueba ni desactivar cuentas automáticamente. App Check/proveedores, clave compartida y diferencias del código desplegado siguen abiertos. Preparación del PR no equivale a aprobación de producción; se mantienen prohibidas fusión y despliegue.

## 13. Identidad resuelta: superadministrador sin ficha comunitaria

La captura del titular de la comprobación privada de la revisión 88402da muestra soloLectura=true, principalVerificadoPorCorreo=true, tipoPrincipal=superadmin, fichaComunitariaNecesaria=false y cuentasSinFicha=[] para el selector de su RUT de acceso. No se recibió ni publicó el RUT, contraseña, correo sintético o UID.

Queda resuelto el bloqueo de identificación del acceso real. No crear ficha comunitaria para el superadministrador, no cambiar sus claims ni convertir el correo de contacto en cuenta de Mi Comunidad. El resultado vacío corresponde únicamente al principal seleccionado: no elimina las dos fichas ausentes del inventario general anterior. El titular ya clasificó las otras cuentas como pruebas; no se autorizaron por ello altas, bajas, eliminación ni cambios de permisos.

La revisión ejecutable 88402da tiene los cuatro workflows del PR aprobados, con 158 funciones + 239 emulador = 397 pruebas, sin fallos ni omitidas, Chromium y auditorías npm aprobados. Esta actualización es documental y no modifica ejecutables ni producción. Las pruebas reales de composición de #191 siguen siendo la última evidencia de preservación de otras apps y base publicada sin cambios.

Siguen abiertos: tratamiento explícito de cuentas de prueba que mantiene el inventario general no apto, proveedor/cliente App Check y pruebas de tokens, compatibilidad efectiva de la clave compartida y comparación del código desplegado. Mantener PR en borrador, sin fusión ni despliegue. Esta confirmación no autoriza escrituras en Firebase.


## 14. Proveedor registrado e integración cliente preparada

El titular creó en Google Cloud la clave Web de Fraud Defense para Mi Comunidad y registró la app en Firebase App Check; la captura confirma proveedor Fraud Defense y estado Registrada. Entregó exclusivamente la clave pública de sitio. Son cambios reales de configuración realizados por el titular, adicionales a las dos APIs habilitadas anteriormente. No se solicitó secreto, se activó enforcement ni se cambió la clave API compartida.

Revisión ejecutable 9c2e9104e45288a3b0ca5c726770055862c85054: [Firebase #197](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43964093979) aprobó **163 funciones + 240 emulador = 403 pruebas**, sin fallos ni omitidas. Chromium aprobó app/demo, bloqueo de scripts/handlers inline y el escenario App Check. Las auditorías npm devolvieron 0 vulnerabilidades en los árboles auditados. Aprobaron los cinco workflows del commit, incluida la verificación de SDK. Despliegues, reparación y habilitación de APIs quedaron omitidos. No se repitieron inventario/composición reales en ese evento de PR; su evidencia anterior no se convierte en verificación de esta configuración recién registrada.

El SDK App Check 10.13.2 se sirve localmente, sin modificación, y CI compara sus bytes con la URL oficial fijada. SHA256: ab1b63a9da4d418fee727518b6487c6021d1404bc2b58eac1499323334e17f83. La inicialización usa ReCaptchaEnterpriseProvider y renovación explícita antes de Auth/Firestore/Functions. CSP solo amplía rutas de reCAPTCHA de Google; no permite scripts inline, eval ni orígenes genéricos de Google. La demo no activa App Check. Los emuladores locales exactos no activan atestación ni habilitan debug de producción.

El diagnóstico mcVerificarAppCheck devuelve solo estado y nunca el token. Chromium cargó el SDK real local, pero simuló reCAPTCHA y el intercambio Enterprise: sus resultados no prueban atestación real, validez de la clave registrada, permisos efectivos de API key, compatibilidad de roles o acceso a producción. La simulación reproduce endpoint y devolución de llamada del SDK fijado. Falta prueba real en origen permitido, distribución autorizada del cliente y observación de métricas antes de enforcement.

El principal del titular ya está verificado como superadmin y no requiere ficha comunitaria. No crear fichas de prueba ni debilitar la barrera de publicación. Siguen pendientes tratamiento de cuentas de prueba, compatibilidad efectiva de clave compartida y comparación con el código desplegado. Se mantiene PR en borrador, sin fusión ni despliegue. Las secciones anteriores de proveedor ausente/integración inexistente son evidencia histórica previa al registro y a este commit.


## 15. Intercambio real confirmado por captura del titular — 16 de noviembre de 2026

El titular abrió el diagnóstico en `mi-comunidad-md--auditoria-appcheck-noq870xx.web.app` y aportó una captura con el resultado: «Comprobación correcta: Google entregó un token de App Check». Se registra como evidencia manual aportada por el titular, no como una ejecución automatizada o inspección del token por el auditor. No se recibió token ni credencial.

La captura acredita el resultado satisfactorio del diagnóstico en ese origen y navegador. Resuelve la prueba manual pendiente de obtención de token en el preview; no acredita envío de tokens por la aplicación principal, validación de roles/checkout, renovación sostenida, enforcement ni equivalencia del código desplegado. No repetir esta misma prueba como si siguiera pendiente.

Revisión consultada: `6998a7c14b02e39507b9d64391777467e0e87275`. [Firebase #201](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43966289724) muestra Tests de reglas y Comprobación pública sin credenciales aprobados; inventarios/composición reales, reparación, habilitación de APIs y ambos despliegues omitidos. Esta actualización es documental y no aporta nuevas pruebas de ejecutables.

Secuencia pendiente, sin modificar la barrera de publicación:
1. Resolver expresamente el tratamiento de las dos cuentas de prueba identificadas por el titular. La propuesta conservadora es deshabilitar únicamente las dos cuentas que una revisión privada actual confirme como pruebas y sin ficha, conservando datos, claims, licencias y la cuenta principal. Esta propuesta NO se ejecuta ni autoriza por registrar el plan. No seleccionar cuentas solo por correo o por falta de ficha; verificar identidad y revalidar estado inmediatamente antes de cualquier intervención aprobada.
2. Repetir inventario agregado y composición de reglas con la configuración actual. No sustituir el inventario global por el resultado filtrado del superadmin.
3. Validar la aplicación completa en un origen autorizado: token, inicio de sesión del titular, roles con identidades verificadas, licencias y checkout. La página aislada no carga estos componentes.
4. Revisar diferencias exactas respecto de Hosting/funciones publicados y compatibilidad de consumidores de la clave compartida. No reducir restricciones ni exigir App Check globalmente para cerrar el informe.
5. Tras la distribución autorizada del cliente, observar métricas antes de decidir enforcement. Retirar el dominio temporal de Fraud Defense al terminar su uso; no consta todavía su retirada.

El PR permanece en borrador. No se fusionó, publicó Hosting live, modificaron reglas/funciones ni cambiaron cuentas o configuración de producción en esta actualización.

## 16. Dos cuentas de prueba deshabilitadas; resultado real aportado por el titular

El titular autorizó deshabilitar únicamente las dos cuentas de prueba conservando datos y el principal. Aclaró que su cuenta de acceso por RUT es superadmin y que las otras son de prueba. No repetir la identificación principal ya resuelta.

La primera ejecución privada se detuvo antes de escribir (intentos=0) por frase distinta de la requerida. La ejecución posterior del script de `75a4e234a4fc62939b60496e174dccbb8fc3ce09` terminó según la captura con resultado=OK, intentos=2, deshabilitadasVerificadas=2, datosEliminados=false y produccionPublicada=false. Evidencia manual del titular, no una operación ejecutada directamente por el asistente. No publicar identidades de la tabla privada. El script excluye superadmin, revalida Auth y ausencia de fichas, y solo escribe disableUser=true en las dos cuentas identificadas.

Se da por completada la operación autorizada de deshabilitación, sin borrar datos ni crear fichas. No repetirla ni solicitar otra autorización para la misma operación. No se acredita revocación inmediata de tokens existentes, un inventario global apto ni publicación de los cambios de aplicación.

La revisión actual habilita exclusivamente los jobs de inventario de solo lectura y composición/prueba de reglas publicadas en eventos del PR #18 del repositorio/rama exactos. Conserva los modos manuales; no amplía ejecución de reparación, habilitación de APIs, deploy ni grupo comercial. Usa la credencial existente, no modifica IAM. Solo resultados agregados del inventario, sin identidades, y la composición queda temporal en el runner.

Pendiente verificar el nuevo resultado real de inventario/composición. El inventario actual todavía marca ficha ausente para cuentas Auth deshabilitadas: no afirmar que esta operación elimina automáticamente el bloqueo, no ocultar hallazgos ni modificar licencias para obtener verde. Las demás pruebas de aplicación completa/roles/pagos, equivalencia desplegada, consumidores de clave y transición de App Check siguen pendientes conforme a la sección 15.
