# Auditoría de seguridad — Mi Comunidad Digital

**Estado:** revisión preventiva; no desplegar este PR sin completar las verificaciones.

## Seguimiento actual — principal real y verificación por correo sin exposición

El titular confirmó un único administrador real; las demás cuentas son de prueba. Las capturas confirmaron que el script corregido terminó con OK y dos cuentas sin ficha. No confundir una ejecución privada exitosa con autorización de escritura. Se prepara consulta opcional de solo lectura por SHA256 de correo, sin publicar correo ni UID; devuelve una huella de reparación ligada al correo, revalidado antes de la eventual creación. La selección privada puede limitarse también por correo. No se crearon fichas, ni se deshabilitaron cuentas de prueba. El inventario y la barrera de publicación permanecen estrictos. Ver sección 11 de SECURITY-CLOSURE-PLAN.md.

## Seguimiento más reciente — 403 Auth, cuota y cierre de respuestas

La captura confirma 403 en `auth_listar_cuentas`; no identifica aún el motivo. Se añade cabecera explícita de cuota limitada a mercado-ciudadano para las consultas REST, sin cambiar configuración, IAM o datos. La recomendación oficial de cuotas con credenciales personales no demuestra que fuera esta la causa concreta. Un ErrorInfo fallido puede emitir exclusivamente un motivo de lista cerrada, nunca mensaje, metadata o cuerpo. La sesión y las identidades siguen sin compartirse; no se autorizaron ni crearon fichas.

La revisión 78fddc8 falló remotamente por la prueba Python de diagnóstico: una respuesta HTTP ficticia sin cerrar produjo salida adicional bajo Python 3.14. Se cierra ahora la respuesta en finally; nueve pruebas Python con ResourceWarning como error y las 154 pruebas Node aprobaron localmente. No atribuir a 78fddc8 las 392 pruebas remotas de 12a6cee. La corrección requiere su nueva validación remota. Procedimiento actualizado en sección 10 del plan de cierre.

## Seguimiento — fallo de consulta privada sin causa identificada

La captura enviada por el usuario confirma SHA256 OK del script privado, seguido del error genérico. No permite atribuir la causa a permisos o sesión. Se añade diagnóstico de fase/HTTP con mensajes predefinidos, sin cuerpo externo, token, URL ni identidades, y modo de solo conteos. Ocho casos Python simulados y las 154 pruebas Node de funciones aprobaron localmente; el wrapper sigue siendo un solo caso Node. No se obtuvieron huellas de cuentas ni se ejecutó reparación. La evidencia remota de 392 casos de la revisión anterior sigue abajo; no atribuirla automáticamente a esta nueva revisión. Instrucciones en sección 9 del plan de cierre.

## Última comprobación — consumidores compartidos y reparación por huella, sin ejecutar

Revisión ejecutable `12a6cee0b32bff896601a74e2e5deacc4b9ff22a`: [Firebase #183 (PR)](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43919443966) aprobó **154 pruebas de funciones + 238 del emulador = 392**, sin fallos ni omitidas. Chromium app/demo y auditorías npm aprobaron, con 0 vulnerabilidades en los árboles auditados. Los cuatro workflows asociados al PR aprobaron. La ejecución manual [Firebase #184](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43920189328) también aprobó esas pruebas, Chromium y auditorías npm. Repitió las mismas 238 pruebas sobre la composición real preservando las otras apps byte por byte y confirmó después que la base publicada no había cambiado. No sumar esa repetición al total. Ambos despliegues, la habilitación de APIs y la reparación quedaron omitidos. Su estado global es failure únicamente por las dos fichas ausentes en el inventario.

### Configuración real de #184

- `complete=true`: terminaron las consultas incluidas, no certifica producción. Tres apps web registradas comparten una única clave por asociación de identificadores; una es Mi Comunidad. Son asociaciones de registro, no un inventario exhaustivo del tráfico o consumidores externos. Cuatro sitios de Hosting registrados, uno asociado a la app de Mi Comunidad. No se publican identificadores ni dominios particulares de las otras apps.
- Siete dominios Auth: `mercado-ciudadano.firebaseapp.com` está presente; `mi-comunidad-md.web.app`, `mi-comunidad-md.firebaseapp.com`, `nodar.cl` y `www.nodar.cl` no figuran. No inferir de ello un fallo del acceso por correo/contraseña. Esa lista no sustituye la política de referrers de una clave.
- La clave conserva objeto de restricción de navegador con **0 referrers listados** y 27 APIs admitidas; Authentication y Secure Token incluidos. No se leyó su valor. La mera presencia del objeto no acredita protección por dominio; antes de cambiarlo se necesitan pruebas del comportamiento efectivo y compatibilidad de los consumidores compartidos.
- Las consultas de los cuatro servicios App Check continúan sin modos explícitos (`UNSPECIFIED`); 0 políticas de recursos OAuth iOS. Para la app de Mi Comunidad, los GET de reCAPTCHA v3 y Enterprise devuelven un recurso con nombre, pero **ninguna señal de configuración**: `siteSecretSet` no es true y no hay site key pública de Enterprise. Solo se emite presencia booleana; no se consulta el secreto v3 ni se publica una clave. No existe aún una prueba satisfactoria de intercambio de token. Los rótulos anteriores basados solo en el nombre del recurso se sustituyeron por `resourcePresent` y `configurationSignalPresent`; no considerar el nombre prueba de proveedor utilizable.
- Persisten dos cuentas habilitadas sin ficha, `readyForStrictAccess=false` y 0 bloques de reserva. El inventario sale con código 2 por sus hallazgos; las consultas de configuración aprobaron. No crear ni dar de baja cuentas para obtener un informe verde.

### Operación exacta preparada y aún no autorizada por cuenta

La revisión privada `verificar-fichas-privadas.py` solo usa GET, excluye correo/contraseñas/hashes de Auth y rechaza CI antes de pedir token. Muestra al titular identidades y nombre propuesto; únicamente sus huellas de confirmación se comparten. Cinco casos Python con datos ficticios están incluidos en el caso Node correspondiente; no sumarlos de nuevo al total.

`ejecutar-reparacion-fichas.cjs` y el job manual de regularización están desactivados por defecto. Requieren aprobación expresa de uno o dos códigos y exclusión de cambios administrativos concurrentes. Los códigos ligan proyecto, identidad/claims/estado, comunidad, propietario y nombres; todos se resuelven antes de la primera escritura. La función revalida Auth y crea transaccionalmente solo `nombre`, `estado=Activo` y `creadoEn` si la ficha sigue ausente. No sobrescribe ni reactiva fichas existentes; no cambia Auth, claims, propietarios o licencias. Auth/Firestore y las dos reparaciones no forman una transacción conjunta; informar cualquier avance parcial.

La verificación privada y la autorización concreta por códigos siguen pendientes. La propuesta detallada de App Check/clave compartida está en `SECURITY-CONFIGURATION-PLAN.md`; el comando privado fijado y comprobado por SHA256 está en `SECURITY-CLOSURE-PLAN.md`. La equivalencia del código desplegado sigue pendiente: las pruebas del PR no acreditan que sus cambios estén en producción. La única modificación productiva de configuración autorizada hasta aquí fue la habilitación de las dos APIs por el usuario; no hay otras escrituras, fusión ni despliegue.

Las secciones siguientes son evidencia histórica subordinada a esta actualización.

## Evidencia histórica — inspección explícita y reparación preparada

[Firebase #177 (PR)](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43911337909) y [#178 (manual)](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43911377835), commit `73681e7`: **147 pruebas de funciones + 237 emulador = 384 aprobadas**, 0 fallos y 0 omitidas. Chromium app/demo y auditorías npm aprobaron (0 vulnerabilidades). Los cuatro workflows del PR aprobaron; #178 repitió con éxito las mismas 237 pruebas sobre las reglas compuestas reales, preservando las otras aplicaciones. Ambos despliegues y la habilitación de servicios se omitieron. La repetición no añade casos nuevos al total.

### Resultado de las consultas ampliadas

- `complete=true` significa que las consultas incluidas terminaron, no aprobación de producción. Las consultas GET individuales de Authentication, Firestore, Storage y Realtime Database respondieron sin `enforcementMode` ni `replayProtection`; la herramienta representa esa ausencia como `UNSPECIFIED`. No es una respuesta explícita `ENFORCED`. El listado general continúa vacío y la consulta de políticas de recursos OAuth iOS devolvió 0. La API documenta actualmente políticas por recurso para OAuth iOS, por eso no se inventaron consultas de overrides de Firestore.
- [La documentación de EnforcementMode](https://firebase.google.com/docs/reference/appcheck/rest/v1/EnforcementMode) indica OFF para protección sin configurar. Interpretar la ausencia observada como protección no configurada es una inferencia apoyada en ese valor predeterminado, no una prueba de tráfico real. No se encontró inicialización `firebase.appCheck`/`initializeAppCheck` ni `enforceAppCheck` en el código de aplicación/funciones revisado de la rama. No activar enforcement antes de integrar proveedor, probar clientes y preparar su transición; el proyecto es compartido.
- La clave consultada presenta `browserKeyRestrictions` pero **0 referrers listados**. El conteo anterior de 1 clave con restricción solo acreditaba la presencia del objeto, no una política efectiva por dominio. No describirla como restringida a los dominios de Nodar ni asumir sin otra prueba si el objeto vacío permite o deniega tráfico. No se solicitaron valores de claves ni se publicaron identificadores de claves o patrones.
- La misma clave permite **27 APIs**, todas sin límites por método dentro de cada API. Authentication y Secure Token figuran en la lista. Este número por sí solo no demuestra un exceso explotable; inventariar los clientes y dependencias del proyecto compartido antes de reducirla. Esta consulta no vincula por identificador la clave con cada app cliente ni prueba llamadas reales por origen.
- Las dos fichas ausentes siguen presentes en el inventario como hallazgo y `readyForStrictAccess=false`; continúa sin haber bloques de reserva guardados. El failure de #178 es el inventario con hallazgos, no las pruebas o las consultas.

### Regularización preparada, aún sin ejecutar

`scripts/regularizar-ficha-admin.cjs` contiene una función importable; no tiene CLI ni workflow que la ejecute contra Firebase. Su modo predeterminado solo lee. La aplicación exige aprobación booleana explícita, exclusión de cambios administrativos concurrentes, nombre verificado, identidad esperada y propietario esperado, además del proyecto exacto tanto en argumento como en SDK de Firestore y Auth. Una comunidad sin propietario registrado requiere verificación privada adicional. Se relee Auth y se usa creación transaccional de Firestore; nunca se sobrescribe una ficha existente ni se modifican cuentas, claims, contraseñas, licencias o propietarios.

Las pruebas de esta utilidad usan SDK simulado y datos ficticios; no acreditan una reparación real ni una transacción atómica entre Auth y Firestore. Antes de ejecutarla faltan la identificación privada y verificación de las dos cuentas y autorización para las escrituras puntuales. Para completar la revisión de claves/App Check faltan decisiones de configuración, compatibilidad de clientes y autorización independiente; la equivalencia del código desplegado también sigue pendiente. Se mantiene la prohibición de fusión y despliegue.

La nueva utilidad clasifica presencia y amplitud de patrones sin emitirlos; no ofrece una certificación integral de la política de claves. Las secciones siguientes son evidencia histórica y quedan subordinadas a esta actualización.

## Actualización vigente — APIs habilitadas y consultas desbloqueadas
El usuario ejecutó en Cloud Shell la habilitación expresamente autorizada de `firebaseappcheck.googleapis.com` y `apikeys.googleapis.com` en `mercado-ciudadano`; su captura mostró la operación completada. La repetición de solo el job de inventario de [Firebase #173, intento 2](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43906272946/attempts/2) confirmó ambas consultas exitosas el 16 de noviembre a las 13:26 (Chile). Es un cambio real y limitado de servicios habilitados, realizado por el usuario; las APIs ya no están bloqueadas.

- `complete=true` acredita que terminaron las consultas incluidas, no que la auditoría o producción estén aprobadas.
- App Check: consulta `service-baseline-only` exitosa, `services=[]`. No acredita protección obligatoria, registro de aplicaciones/proveedores ni excepciones por recurso; no se activó enforcement.
- API Keys: 1 clave, 1 con restricción de aplicación y 1 con restricción de APIs. Son conteos de presencia, no validación semántica de todos los patrones permitidos. No se solicitó ni mostró el valor de la clave.
- El job volvió a detectar `ficha_ausente_admin=2`, 0 bloques existentes y `readyForStrictAccess=false`. El estado failure corresponde al inventario; el paso de consulta de configuración ahora aprueba.
- Repetir ese job no vuelve a ejecutar los 374 casos ya aprobados de `5f1bb74`. Se conservan los resultados de las pruebas y composición real. No hubo fusión, despliegue ni cambios de cuentas, documentos, claims, licencias, claves, restricciones o IAM.
- Antes de cerrar: verificar privadamente y regularizar las fichas legítimas con autorización de escritura, revisar alcance efectivo de App Check/restricciones y completar la equivalencia del código desplegado. No declarar lista producción.

Esta actualización prevalece sobre los bloqueos históricos de APIs de las secciones siguientes.

## Evidencia más reciente — cierre de código de esta etapa

[Firebase #172 (PR)](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43906053490) y [Firebase #173 (manual)](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43906272946), commit `5f1bb74`: **137 pruebas de funciones + 237 del emulador = 374 aprobadas**, sin fallos ni omitidas. Chromium app/demo y auditorías npm aprobaron; 0 vulnerabilidades en los árboles auditados. Los cuatro workflows del PR aprobaron. #173 volvió a aprobar las mismas 237 pruebas sobre la composición real; ambos despliegues y la habilitación de APIs se omitieron. No se repitió la solicitud rechazada de habilitación.

El inventario de #173 confirmó 0 bloques guardados y 0 incompatibles en cuatro comunidades. Las dos fichas administrativas ausentes y las consultas de APIs aún bloqueadas impiden declarar terminada la auditoría de producción. El diagnóstico de #171 sitúa el 403 exactamente en el POST para habilitar App Check. Las correcciones de código de esta etapa quedan validadas en `5f1bb74`; las actualizaciones posteriores de este informe documentan esa evidencia.

## Actualización final de esta etapa — 16 de noviembre de 2026 (Chile)

Código validado en commit `cfe0f96`, todavía sin aprobación de producción:

- [Firebase #170 (PR)](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43904138261) y [Firebase #171 (manual)](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43905015078): **135 pruebas de funciones + 237 del emulador = 372 aprobadas**, 0 fallos y 0 omitidas. Chromium aprobó app y demo; auditorías npm: 0 vulnerabilidades. Los cuatro workflows del PR aprobaron. Ambos despliegues quedaron omitidos.
- #171 repitió las mismas **237 pruebas** sobre la composición con las reglas realmente publicadas, sin ADC durante las pruebas. Todas aprobaron. `otherApplicationsPreserved=true` y `miComunidadMatchesRepository=true`; la verificación final de versión y huella publicada aprobó. No sumar esta repetición como casos nuevos.
- Base publicada SHA256 `a30ee4f1cab7575e0fcc19c6c466647e568dc9f2e13da609bb5af56ae8cc62a3`; composición probada `2f9fb71fde526ce2e3935c2f57a3f9ca1e28f1b3f4aa77021e46fb8fc6c4abc4`; reglas de la rama `38dd75e688f771fa2502f27f59a3f793e74c766d7e0f712dbe2431dfa85a0c81`.

### Correcciones de los tres casos administrativos señalados

- Documentos: esquema cerrado con cinco campos requeridos; icono hasta 40 caracteres, título hasta 150, descripción hasta 2000 y contenido hasta 50000; `ts` entero positivo. Solo administración habilitada de la comunidad puede publicar o eliminar; las actualizaciones siguen cerradas.
- Bloques de reserva: esquema cerrado con seis campos requeridos; lugar de la lista de cuatro espacios que usa la interfaz, nombre hasta 100 caracteres, horarios HH:mm válidos, booleano `activo` y `ts` entero positivo. El mismo validador protege altas y actualizaciones; estas solo pueden cambiar `activo`, preservando horario, lugar y fecha de creación. No se impuso un orden de horas que pudiera eliminar bloques nocturnos existentes. Borrado administrativo conservado.
- Fichas laborales: cerrada toda escritura directa de `conserjes`. La interfaz ya realiza altas y cambios de estado por las callables de cuentas; esas operaciones de servidor se mantienen. No se migraron ni borraron fichas históricas. Las nuevas restricciones de bloques rechazan registros que incumplan el esquema; el inventario adicional de esta etapa no encontró bloques existentes, como se detalla abajo.
- La interfaz limita los largos y muestra un aviso antes de enviar documentos o nombres de bloque excesivos. Las reglas propuestas son un prototipo revisable, validado contra los casos indicados; requieren revisión antes de publicación amplia. No equivalen a una garantía absoluta de seguridad de toda la aplicación.

### Inventario adicional de compatibilidad

Commit `5f1bb74` añade una comprobación paginada, de solo lectura, del contrato de bloques de reserva. La salida contiene únicamente conteos; cualquier bloque incompatible bloquea la publicación. Dos pruebas nuevas verifican tipos, campos obligatorios, límites, datos hostiles y ausencia de identificadores en la salida. Los bloques nocturnos válidos siguen siendo compatibles.

[Firebase #173](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43906272946), inventario de las cuatro comunidades: **0 bloques examinados, 0 incompatibles**. No existen bloques actuales que regularizar por este cambio; no se escribieron datos ni se infiere de este conteo que la función de reservas ya esté configurada para usuarios reales. Las dos fichas ausentes mantienen `readyForStrictAccess=false`.

### Bloqueos que permanecen

- El nuevo diagnóstico de habilitación identifica etiquetas constantes de fase/servicio, sin emitir errores remotos ni credenciales. #171 devolvió **HTTP 403 en `enable-service` para `firebaseappcheck.googleapis.com`**: la consulta previa de estado se completó y el POST de habilitación fue rechazado. La segunda API no llegó a intentarse. No atribuir el rechazo a un rol específico: el error no incluyó una razón permitida. No ampliar IAM automáticamente.
- La consulta posterior confirmó **SERVICE_DISABLED para ambas APIs**. La autorización para habilitar esas dos APIs sigue vigente; falta una sesión que pueda realizar esa operación. No se activó enforcement ni se consultaron valores de claves.
- El inventario volvió a confirmar **2 administradores sin ficha**, ambos habilitados; uno coincide con propietario registrado y en la otra comunidad no consta ese campo. Una cuenta afectada pertenece a una comunidad activa/licenciada, sin correlacionar los conteos. `readyForStrictAccess=false`; las licencias sin acceso no se activaron.
- Antes de publicar: completar las consultas bloqueadas, verificar privadamente las cuentas y regularizar únicamente las autorizadas con permiso de escritura, repetir los controles de compatibilidad si cambian los datos y acreditar lo pendiente del código fuente desplegado. Sigue prohibido fusionar o desplegar.

El estado global manual **failure** corresponde a inventario e intento de habilitación; las pruebas y composición aprobaron. No hubo fusión, despliegue ni cambios de usuarios, claims, documentos, licencias, precios, pagos o IAM. Las APIs no quedaron habilitadas según la consulta posterior.

## Actualización — APIs e invitados, 16 de noviembre de 2026 (Chile)

- [Firebase #167](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43866375618), commit `a4528d3`: **134 pruebas de funciones + 228 del emulador = 362 aprobadas**, 0 fallos y 0 omitidas. Chromium y auditorías npm aprobaron (0 vulnerabilidades). La composición real también aprobó; ambos despliegues se omitieron.
- El usuario autorizó explícitamente habilitar solo `firebaseappcheck.googleapis.com` y `apikeys.googleapis.com`. El job restringido a esas dos APIs terminó con **HTTP 403**, sin confirmar una habilitación. Su consulta posterior devolvió **SERVICE_DISABLED para ambas**. No se modificó IAM para superar el rechazo; no se conoce un permiso concreto faltante. La consola de Google Cloud tampoco estuvo accesible en este navegador.
- Continúan **2 fichas administrativas ausentes** y `readyForStrictAccess=false`. Una cuenta afectada pertenece a una comunidad activa y licenciada; no publicar acceso estricto antes de verificarla y regularizarla con autorización de escritura.
- Mejora de código posterior a #167: `guardarInvitadosReservaMiComunidad` valida lista de hasta 100 personas, nombre string no vacío de hasta 150 caracteres, RUT string de hasta 20 caracteres, formato/dígito verificador si no está vacío y ausencia de campos adicionales. Solo admite residentes habilitados del departamento de la reserva confirmada. Revalida comunidad, licencia y ficha en la misma transacción. `revisionInvitados` impide sobrescribir cambios concurrentes; reservas antiguas sin revisión comienzan en 0.
- Las reglas propuestas cierran toda escritura directa de invitados; la interfaz usa la callable y actualiza la vista únicamente tras confirmación. La nueva función se incluye en la lista de publicación futura de Mi Comunidad; no se ejecutó un despliegue. Esta parte es un prototipo validado por las pruebas indicadas abajo; todavía requiere revisión antes de cualquier publicación amplia.
- Pruebas locales del cambio: **62 casos dirigidos y 134 de funciones aprobados**. La ejecución local del emulador se bloqueó al descargar su JAR; [Firebase #168](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43901613099), commit `4b528ad`, validó **134 funciones + 234 emulador = 368 pruebas**, 0 fallos y 0 omitidas, ambas comprobaciones Chromium y auditorías npm con 0 vulnerabilidades. Los otros tres workflows aprobaron y ambos despliegues se omitieron. No sumar los casos dirigidos a los de CI, porque hay solapamiento. La composición real de #167 corresponde a la versión previa de reglas y no certifica esta nueva versión.
- El informe estructurado conserva el hallazgo menor de esquemas/tamaños de escrituras administrativas. No se declara cerrado el PR ni lista la producción. No hubo fusión, despliegue, cambios de cuentas, licencias, claves, enforcement ni permisos.

Las secciones siguientes conservan evidencia histórica; el estado más reciente prevalece.

## Evidencia anterior — validación real del cierre, 16 de noviembre de 2026 (Chile)

**No declarar lista para producción ni fusionar este PR todavía.** Se mantiene la prohibición de despliegue. Se completó una comprobación con las reglas efectivamente publicadas, sin modificar ningún recurso de Firebase.

### Compatibilidad real verificada

- [Firebase #164](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43851565002), commit `99a7145`: **129 pruebas de funciones + 228 del emulador = 357 aprobadas**, sin fallos ni omitidas. Ambas comprobaciones Chromium aprobaron; auditorías npm: **0 vulnerabilidades**. Los dos jobs de despliegue quedaron **skipped**.
- En un job separado se leyeron las reglas publicadas, se sustituyó únicamente Mi Comunidad y se ejecutaron nuevamente las **228 pruebas** contra ese archivo compuesto. Todas aprobaron. Es una segunda ejecución del mismo conjunto bajo otra composición, no 228 casos nuevos que deban sumarse a los 357 anteriores.
- El manifiesto confirmó `otherApplicationsPreserved=true` y `miComunidadMatchesRepository=true`: las secciones de las otras apps se conservaron byte por byte.
- SHA-256 de las reglas publicadas: `a30ee4f1cab7575e0fcc19c6c466647e568dc9f2e13da609bb5af56ae8cc62a3`; composición probada: `fd0e01fdd46d1b8ca1b01797eadb21ec6b8a12b30e452be8fe34e4b703e68ff1`; archivo de la rama: `bd456e8d493492dc694c5149083e5e4ecad54260ec514f9b1e61d7e05e1728b5`.
- La credencial ADC se retiró antes de ejecutar las pruebas; las pruebas usaron Auth/Firestore emulados y datos ficticios. Después se volvió a autenticar solo para comprobar que la versión y huella publicadas seguían intactas. Se confirmó que no cambiaron durante la ejecución.
- #158/#159/#162 señalaron tres fallos de Almacén. Los datos ficticios omitían el espejo comercial que sus reglas publicadas ya exigen (`almacen_commercial_access`: `version`, `storeId`, `status=active`, `expiresAt`). Se completaron los fixtures, sin relajar ninguna regla ni aserción. #164 acredita el resultado sobre la composición efectiva.

### Configuración y cuentas: bloqueo real confirmado

- Firebase App Check API y API Keys API devolvieron **403 / `SERVICE_DISABLED`**. No es correcto seguir describiéndolo solo como una supuesta falta de permisos. Deben habilitarse las APIs para continuar esas consultas; todavía no se puede afirmar cómo están configuradas las restricciones ni el enforcement. La utilidad solo expone razones permitidas, nunca mensajes o metadatos arbitrarios de errores.
- Se mantienen **2 administradores sin ficha**, ambos habilitados en Auth. Uno coincide con el `adminUid` de su comunidad y el otro pertenece a una comunidad sin ese campo registrado. Ninguno tiene un propietario registrado distinto según esta comprobación.
- **Una de esas dos cuentas está en una comunidad activa y con licencia vigente**. No correlacionar este conteo con la coincidencia de propietario: los grupos no identifican cuál es cuál. Publicar ahora la denegación por defecto dejaría esa cuenta sin acceso.
- `readyForStrictAccess=false`. El estado global de #164 es **failure por el inventario con hallazgos**; las pruebas de código y las de composición real aprobaron. Las 3 licencias existentes sin acceso siguen sin activarse.
- El informe estructurado de reglas propuestas (`SECURITY-RULES-ASSESSMENT.json`) registra dos mejoras menores de validación de datos todavía pendientes. Es una revisión acotada, no una certificación de ausencia de vulnerabilidades.

### Acción necesaria para cerrar

El plan concreto está en `SECURITY-CLOSURE-PLAN.md`. Habilitar las dos APIs de consulta cambia la configuración del proyecto compartido y requiere levantar expresamente esa parte de la restricción actual. No equivale a exigir App Check ni a desplegar código. Las fichas deben verificarse privadamente y regularizarse solo con autorización para esas escrituras, preservando las cuentas deshabilitadas y las licencias.

La compatibilidad de la composición está verificada para la base indicada; repetirla si cambia la versión publicada. La equivalencia del código fuente de las funciones desplegadas y las consultas bloqueadas siguen pendientes. No se fusionó ni se desplegó; no se modificaron usuarios, claims, documentos, licencias, precios, pagos ni permisos de producción.

## Evidencia histórica de etapas anteriores

## Estado vigente — demo y renderizados, 16 de noviembre de 2026 (Chile)

El PR #18 continúa en borrador. Esta sección actualiza la etapa de CSP; las secciones siguientes conservan la evidencia anterior y sus límites. No hubo fusión ni despliegue.

### Correcciones de esta etapa

- Commit `c749481`: se migraron los **141 manejadores inline de la demo** a 97 destinos explícitos con datos JSON escapados. Sus tres scripts originales se extrajeron a `demo/backend.js`, `demo/qr.js` y `demo/app.js`; `demo/eventos.js` registra las acciones. Se conserva el código del decodificador de QR que ya estaba embebido, sin cambiar su algoritmo.
- Las dos entradas HTML de `public/` usan scripts externos. La política HTTP común ya **no permite `unsafe-inline` en `script-src`**. La demo añade `script-src 'self'; script-src-attr 'none'; connect-src 'none'; frame-src 'none'`, ya que trabaja con datos simulados locales. Los estilos siguen permitiendo inline; no se afirma haber eliminado todas las apariciones de esa palabra en CSP.
- Los archivos de la demo exigen revalidación de caché. El orden de carga sigue siendo backend simulado, lector QR, acciones y aplicación.
- Se corrigió un borrado demasiado amplio: el reinicio de la demo ya no elimina todas las claves `mc_`. Ahora cancela su escritura local pendiente y elimina solo su base `mc_demo_db_v4` y preferencias `mc_demo_los-robles_*`. El almacenamiento de preferencias de la demo usa ese espacio propio. Las pruebas preservan expresamente claves ajenas y antiguas; no se tocaron datos reales.

### Revisión de renderizados adicionales

| Área | Tratamiento revisado | Evidencia y límite |
| --- | --- | --- |
| Datos bancarios e instrucciones | `mcEscape` antes de HTML; enlace limitado a prefijo HTTPS y texto escapado | Regresión con comillas, etiquetas y `javascript:`; no verifica legitimidad comercial de un enlace configurado por administración |
| Documento tributario | `esc` en cada campo antes de unir líneas | Regresión de correo, RUT, razón social, giro, dirección y comuna con texto hostil; sin cambiar operaciones de pago |
| Suscripción | Texto escapado, títulos constantes, importes numéricos validados y dominio/protocolo de checkout restringidos | Revisión del código existente; no se ejecutaron compras ni modificaciones comerciales |
| Demo | Atributos de acciones serializados y destinos cerrados; scripts externos | Recorrido de vistas de administración, conserjería y propietario en Chromium; no acredita cada combinación de datos, modales o dispositivo |
| App autenticada | Se conserva la prueba real de clic, Enter, input y argumentos hostiles | Se comprueba también bajo la cabecera HTTP sin scripts inline |

La revisión y los payloads probados no encontraron inyección en esos campos. No se declara ausencia absoluta de XSS ni protección contra copia del JavaScript publicado.

### Verificación

- [Firebase #154](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43845266545), commit `c749481`: **126 pruebas de funciones + 225 de emulador = 351 aprobadas**, sin fallos ni omitidas. Las dos comprobaciones de Chromium aprobaron app y demo. Se recorrieron los tres roles de la demo, se probó su reinicio y el bloqueo CSP, y no hubo consultas de backend durante el recorrido. Auditorías npm: **0 vulnerabilidades**; comprobación pública y otros tres workflows aprobados. Ambos despliegues: **skipped**.
- [Firebase #155](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43845795442), commit `aa52283`: **126 pruebas de funciones + 226 de emulador = 352 aprobadas**, sin fallos ni omitidas, incluida la regresión adicional de datos bancarios/tributarios. Las dos comprobaciones Chromium y las auditorías npm aprobaron nuevamente; comprobación pública y otros tres workflows aprobados. Ambos despliegues: **skipped**.

### Barrido ampliado de secretos en el historial disponible

Se recorrieron **159 commits y 451 blobs de texto únicos** (22.237.963 bytes) alcanzables por las referencias locales, con una referencia remota descargada. No hubo coincidencias en los ocho grupos buscados: claves privadas, tokens GitHub clásicos y de alcance fino, secretos OAuth de Google, tokens productivos de Mercado Pago, refresh tokens de Google, tokens Slack e identificadores de acceso AWS. Se omitieron 6 blobs binarios; ninguno superó el límite de 2 MiB. La salida contenía solo conteos, nunca coincidencias ni valores. No se trató la configuración web pública de Firebase como credencial privada.

Es un barrido por patrones sobre el historial descargado, no una validación de credenciales ni una garantía de ausencia de secretos. No cubre otras ramas no descargadas, logs/artifacts de Actions, archivos binarios, secretos cifrados o sistemas externos. No se rotaron credenciales ni se reescribió el historial.

### Límites y bloqueos que permanecen

Las dos fichas de administrador ausentes y las consultas de App Check/restricciones de API con HTTP 403 siguen pendientes, según la lectura real anterior. No se cambiaron permisos para consultar ni se regularizaron usuarios en producción. Las reglas compartidas deben integrarse sobre las versiones efectivamente publicadas y volver a probarse; la equivalencia del código desplegado tampoco está acreditada. La eliminación de scripts inline está preparada y probada en la rama, todavía sin publicar.

## Continuación — interfaz y política de scripts, 16 de noviembre de 2026 (Chile)

Commit `42f3d37`, preparado en la rama del PR #18, sin fusión ni despliegue:

- Se migraron **164 manejadores inline** de `public/index.html`: clic, cambio, entrada y teclado. Los argumentos se serializan como JSON escapado en atributos de datos y se ejecutan únicamente mediante una lista explícita de funciones; no se usa `eval`, `Function` ni búsqueda dinámica en `window`.
- La lógica principal se trasladó a `public/app.js`, conservando el orden de carga y los contratos globales de los módulos. La cabecera de caché del nuevo archivo exige revalidación. El verificador posterior al despliegue consulta ahora ese archivo externo; no se ejecutó ningún despliegue.
- La app autenticada añade una política CSP en el inicio de `<head>`: `script-src 'self' https://cdn.sheetjs.com; script-src-attr 'none'`. Interseca la cabecera HTTP existente y bloquea los scripts y manejadores inline en esa página. La carga de SheetJS conserva su huella SRI.
- La cabecera HTTP compartida todavía contiene `unsafe-inline` y la demo conserva 3 scripts inline y 141 manejadores heredados (inventario de código; usa un backend simulado local). No se declara eliminado `unsafe-inline` de todo el sitio ni auditada por completo la demo. Esta política adicional protege la página autenticada; no sustituye la revisión de los destinos `innerHTML` ni el aislamiento del origen compartido.
- Se conservan las funciones financieras verificadas por hashes de referencia, sin modificar importes ni operaciones de pago. La suite se adaptó para leer el archivo externo real; no se copiaron funciones de producción a los tests.
- Validación local: **126 pruebas de funciones**, y **57 comprobaciones dirigidas** de interfaz, conciliación y cabeceras aprobadas. Estos grupos tienen tres comprobaciones en común y no deben sumarse como si fueran distintos. Auditoría npm de herramientas: **0 vulnerabilidades**.
- El entorno local impide iniciar Chromium (`socket: Operation not permitted`). Se incorporó una prueba reproducible en Actions con Playwright fijado a `1.62.1` y Chromium: levanta un servidor local, bloquea la red externa, comprueba clic/Enter/input y que CSP impida scripts y manejadores inyectados. El resultado ejecutado en CI figura a continuación; la validación no se limita a comprobaciones estáticas.

### Resultado verificado en GitHub Actions

[Firebase #152](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43840454942), commit `ff4f53b`: **126 pruebas de funciones y 222 de emulador = 348 aprobadas**, sin fallos ni omitidas. La prueba adicional de Chromium aprobó carga externa, clic/Enter/input, conservación literal de datos hostiles y rechazo por CSP tanto de scripts inline como de manejadores HTML. Auditorías npm de funciones y herramientas: **0 vulnerabilidades**. Comprobación pública y los otros tres workflows aprobados. Ambos jobs de despliegue: **skipped**.

Las ejecuciones #150 y #151 detectaron problemas del montaje de la prueba de navegador: el aviso fijo del emulador interceptaba el control de prueba y los reportes CSP llegan como eventos asíncronos. Se movió el control y se esperaron ambos reportes; no se relajaron los controles ni las aserciones de seguridad. #152 valida el resultado completo. No se afirma cobertura exhaustiva de toda la interfaz por esta prueba.

Los bloqueos reales anteriores (dos fichas ausentes, permisos de consulta 403 y diferencias de reglas compartidas) siguen vigentes. No se modificaron usuarios, claims, licencias, pagos ni recursos de producción.

## Acceso estricto y consulta real — evidencia previa, 16 de noviembre de 2026 (UTC)

El PR #18 permanece en borrador, sin fusión ni despliegue. Esta sección conserva los resultados de acceso estricto y lectura real; la continuación de interfaz figura arriba. Las secciones históricas describen el código y las pruebas de su fecha.

### Acceso estricto preparado y probado en la rama

Los commits `f735962`, `50c4739` y `dd0234d` eliminan la compatibilidad que permitía operar sin licencia o sin ficha de administrador. Se aplica en reglas Firestore, funciones, interfaz, integridad contable, consulta de suscripción, cotización/checkout y tarea de vencimientos. No se cambiaron importes, períodos, estados comerciales ni webhooks. El acceso operativo exige licencia vigente y perfil habilitado; la consulta comercial conserva su finalidad de renovación y exige una ficha válida.

Las 13 operaciones transaccionales del módulo profesional vuelven a comprobar comunidad, licencia y perfil dentro de la transacción. Las pruebas incluyen la eliminación o inhabilitación de una cuenta y cambios de departamento entre la comprobación inicial y la escritura, sin permitir escrituras parciales. Las reglas de las otras aplicaciones no se modificaron en estos commits.

Antes de preparar cualquier despliegue, CI ejecutará `auditar-accesos.cjs --require-clean` con las credenciales de despliegue. El guard impide publicar el acceso estricto mientras existan fichas ausentes. No sustituye las restantes revisiones de seguridad.

### Evidencia final de esta etapa

- [Firebase #147](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43796302377), commit `dd0234d`: **126 pruebas de funciones + 217 del emulador = 343 aprobadas**, sin fallos ni omitidas; auditorías npm: **0 vulnerabilidades**. Comprobación pública sin credenciales aprobada; ambos despliegues omitidos. Los otros tres workflows del mismo commit finalizaron correctamente.
- #146 detectó una expectativa antigua del fixture E2E: se esperaba un número fijo de documentos antes de agregar la ficha válida del administrador. Se corrigió para comparar el contenido completo antes y después de solicitudes rechazadas. Las comprobaciones de acceso permanecieron estrictas; #147 verifica la corrección.
- [Firebase #148](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43796430403): ejecución manual de solo lectura sobre `dd0234d`. Pruebas aprobadas; ambos despliegues **skipped**. Estado global **failure** porque el inventario conserva hallazgos y sale con código 2.
- Inventario actualizado: **4 comunidades, 9 cuentas, 2 administradores sin ficha, 3 licencias existentes sin acceso vigente**; ninguna licencia ausente. `readyForStrictAccess=false`. Las licencias sin acceso no se activaron ni se consideran automáticamente un error.

### Configuración real consultada sin modificaciones

El nuevo script `scripts/auditar-configuracion.cjs` usa exclusivamente consultas de lectura, no solicita valores de claves y emite información limitada. Tiene cuatro pruebas que cubren sanitización, permisos insuficientes, resultados parciales y proyecto incorrecto.

- Proyecto confirmado: `mercado-ciudadano`.
- Reglas publicadas SHA-256: `a30ee4f1cab7575e0fcc19c6c466647e568dc9f2e13da609bb5af56ae8cc62a3`; archivo de la rama: `bd456e8d493492dc694c5149083e5e4ecad54260ec514f9b1e61d7e05e1728b5`.
- `sameMiComunidad=false` y `sameOtherApps=false`: también hay diferencias en las secciones compartidas de otras aplicaciones. Esto no demuestra por sí solo una vulnerabilidad. No sobrescribir las reglas compartidas con el archivo completo de la rama: conservar las secciones publicadas de las otras apps, integrar solo Mi Comunidad y ejecutar nuevamente las pruebas de compatibilidad antes de publicar.
- **37 funciones** cuyo nombre termina en MiComunidad figuran `ACTIVE`, runtime `nodejs22`. Solo se verificaron metadatos; no se ha acreditado igualdad del código fuente desplegado con el PR.
- App Check y restricciones de API devolvieron **HTTP 403**: no verificados. No implica que estén desactivados. No se ampliaron permisos. El reporte declara `complete=false`; el paso permite continuar únicamente para recoger también el inventario, no para declarar aprobada la auditoría.

### Pendientes reales

1. Verificar privadamente las dos cuentas sin ficha y regularizar únicamente las que correspondan, en una intervención de producción separadamente autorizada; conservar cuentas deshabilitadas. Repetir el inventario antes de publicar. No conceder licencias para hacer pasar el control.
2. Obtener una consulta autorizada de App Check y restricciones de API, y verificar la equivalencia del código desplegado. Los metadatos de funciones no resuelven estas comprobaciones.
3. Completar la revisión de renderizados y la demo. La app autenticada ya migró sus scripts/manejadores y añade una CSP restrictiva propia; la cabecera compartida y la demo mantienen `unsafe-inline` (véase continuación arriba).
4. Integrar reglas de Mi Comunidad preservando las reglas efectivas de las otras aplicaciones, probar ese resultado y preparar una publicación separada únicamente cuando se autorice.

No se modificaron datos, usuarios, claims, licencias, pagos, precios, reglas, funciones ni hosting de producción. La auditoría completa continúa abierta; las correcciones de acceso están preparadas y probadas en el PR.

## Registro histórico de revisiones anteriores

## Segunda revisión — 15 de noviembre de 2026 (Chile)

El PR #18 sigue **en borrador y sin autorización de fusión o despliegue**. Las correcciones de esta revisión están en `8301d0c` y `6590ffc`; no se cambiaron reglas, licencias, cuentas ni precios de producción.

### Correcciones y evidencia nuevas

- Se actualizó por npm `fast-xml-parser` a `5.12.1` y sus dependencias compatibles del lockfile de funciones. `npm audit --omit=dev --audit-level=low`: **0 vulnerabilidades**; queda resuelto el aviso bajo de la revisión anterior.
- El job de reglas y las herramientas Firebase usan Node 24; la carga y pruebas de Cloud Functions siguen verificándose en Node 22, igual que su runtime declarado. No se cambió el runtime de producción. El registro de CI ya no muestra `EBADENGINE`.
- Las acciones con `data-mc-action` ya no pueden invocar cualquier función de `window`: usan una lista cerrada de acciones de la aplicación. JSON inválido, acciones como `eval`, `fetch`, `constructor`, `__proto__` y argumentos estructurados no permitidos se rechazan; los argumentos de texto siguen viajando como datos.
- Se fijaron las acciones nuevas de CI a SHA; la regeneración del lockfile exige que el resultado coincida con el archivo versionado, para no ocultar otra desincronización.
- [Firebase #141](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43793310961), commit `6590ffc`: **119 pruebas de funciones y 210 pruebas de emulador aprobadas**, 0 fallos, 0 omitidas; auditorías de dependencias de funciones y herramientas: **0 vulnerabilidades**. Comprobación pública: **success**. Ambos jobs de despliegue: **skipped**.
- [Firebase #140](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43793082208), commit `8301d0c`, también completó correctamente las pruebas.

### Inventario real ejecutado y verificado

`scripts/auditar-accesos.cjs` consulta únicamente las colecciones de Mi Comunidad y las cuentas Auth de esta aplicación. Pagina Firestore y Auth; detecta licencias ausentes, fichas ausentes, cuentas sin comunidad, departamentos y estados incoherentes, y fichas de administradores sin una cuenta válida. Tiene seis pruebas con datos ficticios y sin métodos de escritura permitidos.

Comando de consulta, con ADC ya configurado:

```sh
node scripts/auditar-accesos.cjs --project mercado-ciudadano --require-clean
```

Por defecto emite solo conteos, sin nombres, correos, RUT, teléfonos ni credenciales. `--details` agrega identificadores técnicos y no debe publicarse en logs públicos sin revisión. No crea licencias ni concede vigencia automáticamente. `readyForStrictAccess` solo comprueba las inconsistencias cubiertas por este inventario; no acredita el blindaje completo.

- El entorno local no tiene ADC configurado. Se preparó el job `Inventario de accesos (solo lectura)` en el workflow Firebase existente, con autenticación mediante la credencial ya utilizada por CI. Solo puede ejecutarse manualmente desde esta rama y este repositorio. No habilita despliegues en la rama de auditoría.
- En #141 el job de inventario quedó **skipped**, porque esa ejecución fue disparada por el PR; las pruebas sí pasaron.
- El usuario autorizó explícitamente la ejecución adicional. Se ejecutó [Firebase #143](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43794563008) sobre `acd8dec`, en la rama de auditoría, sin desplegar.
- El inventario real terminó su lectura el **15 de noviembre de 2026, 23:50 (Chile)**: **4 comunidades**, **9 cuentas de esta aplicación**, **2 administradores sin ficha** y **3 licencias existentes sin acceso vigente**. No se detectaron licencias ausentes ni las otras inconsistencias cubiertas por el inventario. La ausencia de otras categorías se refiere solo a estas comprobaciones, no acredita ausencia absoluta de problemas.
- `readyForStrictAccess: false`; el job terminó con **código 2**, que indica hallazgos pendientes, no fallo de autenticación ni de lectura. El bloqueo para migrar a acceso estricto son las **2 fichas de administrador ausentes**. Las 3 licencias sin acceso requieren revisar su situación comercial, pero no son automáticamente un error ni deben activarse para hacer pasar la auditoría.
- En la misma ejecución pasaron **119 pruebas de funciones y 210 del emulador**, sin fallos ni omitidas. Auditorías npm de funciones y herramientas: **0 vulnerabilidades**. Ambos jobs de despliegue: **skipped**. El estado global de #143 es `failure` exclusivamente por la comprobación del inventario.
- No se modificaron documentos, licencias, cuentas Auth, claims, reglas ni funciones desplegadas. Los logs contienen conteos y no identificadores personales.

### Plan de regularización, pendiente de autorización para cambios reales

1. Identificar las dos cuentas en un entorno privado de consulta; verificar UID, claims `app=mi_comunidad`, rol `admin`, comunidad asignada, estado de Auth y si siguen autorizadas por su comunidad. No publicar nombres, correos, RUT ni credenciales en GitHub.
2. Preparar únicamente las fichas que correspondan a esas cuentas verificadas. Preservar cuentas deshabilitadas como inactivas. Usar creación con precondición de inexistencia, sin sobrescribir fichas que se hayan creado desde el inventario y sin cambiar claims ni contraseñas.
3. Revisar las tres licencias con el responsable comercial. Mantener su estado y vigencia; no otorgar meses, reiniciar trials ni reconocer pagos sin evidencia.
4. Repetir el inventario tras la regularización autorizada. La denegación por defecto ya está preparada y probada en la rama (véase el estado vigente); publicar únicamente después de resolver los bloqueadores y volver a comprobar compatibilidad.
5. Publicar únicamente en una ventana expresamente autorizada. Esta revisión conserva la prohibición de fusionar o desplegar.

### Pendientes que impiden cerrar la auditoría completa

1. Regularizar las 2 fichas de administrador ausentes y revisar las 3 licencias sin acceso. El inventario real ya se ejecutó; los cambios reales y la posterior eliminación de excepciones todavía están pendientes.
2. Verificar configuración efectiva de App Check, restricciones de API y versiones desplegadas de reglas/funciones con acceso de consulta.
3. Completar la revisión de los renderizados de la interfaz y migrar el script y manejadores inline antes de retirar `unsafe-inline` de CSP. La lista de acciones cerrada agrega protección, pero no reemplaza esa migración.
4. Mantener la comprobación de compatibilidad de las reglas compartidas y preparar una ventana de publicación separada, únicamente cuando se autorice.

## Modelo de amenazas

1. Un tercero descarga el frontend o clona el repositorio público.
2. Un usuario autenticado intenta leer o modificar datos de otra comunidad.
3. Un administrador manipula una licencia, un precio o un comprobante de pago.
4. Una comunidad sin documento de licencia utiliza la excepción heredada.
5. Una cuenta de administrador antigua, sin ficha, conserva acceso no deseado.
6. Una credencial aparece en el historial Git, logs o archivos de despliegue.
7. Una modificación de reglas compartidas afecta Mercado Ciudadano o Almacén Digital.

## Hallazgos confirmados en el código

- `firestore.rules`: la colección `mi_comunidad_licencias` deniega create/update/delete del cliente.
- `firestore.rules`: `mcEsComunidadActiva` permite operar si **no existe** el documento de licencia. Se documentó como compatibilidad histórica; requiere inventario y migración.
- `firestore.rules`: `mcCuentaHabilitada` permite a administradores antiguos sin documento en `administradores` conservar acceso. Requiere inventario y migración.
- `functions/index.js`: `exigirCuentaActiva` también comprueba vigencia solo cuando la licencia existe; la excepción no es exclusivamente de la interfaz.
- `functions/mercadopago.js`: secretos declarados mediante Firebase Secret Manager; firma del webhook y verificación remota del pago.
- `public/index.html`: frontend legible y configuración Firebase pública (la API key web no es por sí misma un secreto).
- `firebase.json`: reglas compartidas y cabeceras CSP; la CSP incluye `'unsafe-inline'` para scripts, que reduce protección frente a XSS.
- No se observó `enforceAppCheck` en las declaraciones de Cloud Functions inspeccionadas; confirmar la configuración efectiva antes de activarlo.
- El repositorio fue observado como público; privatizarlo no evita que el JavaScript publicado sea inspeccionable.

## Bloqueadores para declarar blindaje final

- [x] Inventariar licencias de las comunidades existentes: 4 revisadas, ninguna ausente; 3 sin acceso vigente (situación comercial pendiente de revisión).
- [ ] Migrar comunidades heredadas y cambiar comprobación a **denegar por defecto** cuando falte licencia, en reglas y funciones, de forma coordinada.
- [ ] Regularizar los 2 administradores sin ficha detectados por el inventario real y eliminar compatibilidad solo después de migración.
- [x] Ejecutar la suite de emulador de roles, aislamiento, licencias y pagos (210 pruebas; la excepción de licencia ausente sigue pendiente de migración).
- [x] Ejecutar suite Node y comprobar estado de GitHub Actions (commit `0870edd`; evidencia abajo).
- [ ] Revisar secretos e historial Git; rotar inmediatamente cualquier secreto real encontrado, sin publicarlo en informes.
- [ ] Comprobar App Check, restricciones de API y su compatibilidad con PWA/iPhone/Android antes de exigirlo.
- [ ] Revisar sinks `innerHTML` para XSS y planificar CSP sin `unsafe-inline`.
- [ ] Comparar reglas y funciones de Firebase desplegadas con las versiones de GitHub.
- [x] Validar regresiones de reglas en emulador para las otras aplicaciones que comparten `mercado-ciudadano` (queda pendiente comparar la configuración desplegada).

## Política de cambios

No fusionar ni desplegar modificaciones de licencias, reglas o autenticación hasta superar pruebas en emulador y una revisión de compatibilidad. No modificar precios, órdenes, pagos ni producción como parte de esta auditoría.

## Evidencia histórica de CI, anterior a la sincronización del lockfile

- GitHub Actions `Security regression checks`: **success**.
- GitHub Actions `Validar licencias y pagos`: **success**.
- GitHub Actions `Firebase`: **failure** exclusivamente en el paso `npm audit --audit-level=moderate` del job de tests; las **208 pruebas del emulador pasaron**, sin fallos. Los jobs de despliegue quedaron `skipped`.
- Hallazgo específico: `tests/package.json` fija un override de `hono: 4.13.11`, versión incluida en los avisos de seguridad hasta `4.13.15` (GHSA-4m76-xfj5-7975, GHSA-h7mg-cq63-vhpq, GHSA-3gg2-335m-rxc6, GHSA-46wx-v44x-9hh2, GHSA-4h7h-rv7c-7m2v). Se notifican tres paquetes afectados en el árbol de dependencias: `hono`, `@hono/node-server` y `@modelcontextprotocol/sdk`.
- **Corrección segura pendiente:** actualizar el override a una versión corregida y compatible, regenerar `tests/package-lock.json` con npm, volver a ejecutar `npm ci`, `npm audit --audit-level=moderate` y las 208 pruebas de emulador. No editar el lockfile manualmente ni ignorar el fallo de auditoría. Evaluar si los paquetes afectados son solo herramientas de desarrollo antes de calificar exposición en producción.


## Primera revisión — 15 de noviembre de 2026 (Chile)

### Corrección aplicada solamente en la rama del PR #18

- Actions devolvió `This workflow does not exist` para `.github/workflows/apply-test-lockfile.yml`. El archivo existe en la rama de auditoría, pero no está disponible para ejecución manual en la interfaz. **No se ejecutó** `Apply verified test lockfile` y no se modificó `main` para registrarlo.
- Se realizó la operación equivalente en un checkout aislado: `npm install --package-lock-only --ignore-scripts --no-audit`, `npm ci --ignore-scripts` y `npm audit --audit-level=moderate` en `tests`. Auditoría: **0 vulnerabilidades**.
- El commit `0870eddb32b6aaae692509818b908a4c016370d0` sincronizó exclusivamente `tests/package-lock.json`: Hono `4.13.11` → `4.13.18`, URL e integridad generadas por npm. No se alteraron precios, pagos, autenticación ni reglas.

### Pruebas posteriores a la corrección

- [Firebase #138](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43791632953): pruebas de reglas **success**; **208 pruebas del emulador aprobadas, 0 fallos, 0 omitidas**; **113 pruebas de funciones aprobadas, 0 fallos, 0 omitidas**. Auditoría de herramientas: **0 vulnerabilidades**. Comprobación pública sin credenciales: **success**. `Deploy a Firebase` y `Publicar grupo comercial de producción`: **skipped**.
- [Security regression checks #8](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43791632960): **success**.
- [Validar licencias y pagos #83](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43791632869): **success**.
- [Regenerate test dependency lockfile #3](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43791632931): **success**.
- La ejecución local de funciones también aprobó las 113 pruebas. El emulador local no pudo descargar su JAR desde Google; la validación de emuladores anterior corresponde a GitHub Actions, donde sí se completó.

### Revisión adicional y límites

- Se revisó el historial alcanzable de la rama clonada (143 commits) con patrones de claves privadas, tokens GitHub, secretos OAuth de Google y tokens de acceso Mercado Pago. No hubo coincidencias. Es un barrido acotado por patrones; no acredita ausencia absoluta de secretos ni cubre ramas no descargadas, logs externos o credenciales efectivas de Firebase.
- Confirmado en reglas y funciones: licencia ausente permite operar; administrador sin ficha conserva acceso. Se mantienen como bloqueadores de migración, sin cambiar la compatibilidad durante esta revisión.
- No se encontró `enforceAppCheck` ni `initializeAppCheck` en el código propio revisado. La configuración desplegada sigue sin verificarse.
- La CSP mantiene scripts inline y hay uso extendido de `innerHTML`. Existen helpers de escape; el uso de `innerHTML` por sí solo no demuestra una vulnerabilidad explotable. Falta revisión completa de origen y destino de datos.
- El job de reglas usa Node 22, mientras varias herramientas fijadas en `tests` declaran Node `>=24.12.0`; CI emite `EBADENGINE`. Las pruebas pasaron, pero se debe separar el runtime de herramientas del runtime Node 22 de Cloud Functions y validar ambos.
- La auditoría de dependencias de funciones reporta **1 vulnerabilidad baja** de `fast-xml-parser` (GHSA-474x-hrwr-fgx4). No impide el umbral moderado actual; requiere rastrear dependencia y exposición antes de una actualización compatible. No se declara el árbol de producción libre de vulnerabilidades.
- Las pruebas de compatibilidad de reglas con Mercado Ciudadano y Almacén Digital están incluidas en el emulador; esto no sustituye comparar las reglas efectivamente desplegadas.

**Estado final de esta revisión:** PR en borrador, sin fusión ni despliegue. CI corregida y aprobada para el commit indicado; el blindaje completo continúa condicionado a los bloqueadores pendientes de este documento.
