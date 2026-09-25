# Arquitectura de "Mi Comunidad"

Este documento describe cómo está construida la app **tal como está hoy**,
no como plan a futuro. Si algo de esto deja de ser cierto después de un
cambio, este archivo debería actualizarse en el mismo commit.

## Qué es

Una PWA de gestión de comunidad/edificio (residentes, conserjería,
administración), servida como un único archivo `index.html`
(HTML + CSS + JS vanilla, sin build step ni framework), desplegada en
Firebase Hosting.

## Roles

Definidos en `rolesConfig`: `residente`, `conserje`, `admin`,
`superadmin`. Cada uno tiene su propio menú, páginas permitidas y página
de inicio. El rol de un usuario no se elige a mano: viene de un
**custom claim** de Firebase Auth (`role`), asignado al crear la cuenta.

`superadmin` es el único rol sin `comunidadId` propio - no pertenece a
ningún edificio, administra la plataforma completa desde la página
"Comunidades" (ver sección siguiente).

## Panel de superadmin (plataforma)

La página "Comunidades" (`renderComunidades()`) es el panel de control de
Nodar Logic sobre todos los edificios que usan Mi Comunidad - pensado para
que no importe si hay 5 o 100: nada de esto consulta las subcolecciones de
cada edificio para armar el panel, todo sale de campos denormalizados en
el propio doc de la comunidad, así que el panel no se pone más lento a
medida que se suman comunidades.

Campos que vive en `mi_comunidad_comunidades/{comunidadId}` para esto:
`estado` (`"Activa"` | `"Suspendida"`), `plan`, `fechaContratacion`,
`notasSoporte`, `numResidentes`, `numConserjes`, `adminNombre`,
`adminUid`, `ultimoAcceso`. Se siembran al crear la comunidad
(`crearComunidadMiComunidad`); `numResidentes`/`numConserjes` se
incrementan solos cada vez que `crearCuentaMiComunidad` da de alta a
alguien (`FieldValue.increment(1)` - no hace falta un trigger de
Firestore aparte porque esa Cloud Function ya es el único punto por donde
se crean esos documentos).

**"Suspendida" corta el servicio de verdad, no es solo una etiqueta**: el
helper `esComunidadActiva()` en `firestore.rules` consulta ese campo antes
de autorizar cualquier lectura/escritura en las subcolecciones operativas
(ver más abajo). El doc de la propia comunidad es la única
excepción - sigue siendo legible aunque esté suspendida, para que la app
pueda leer `estado` y mostrarle al usuario un mensaje claro
("Esta comunidad tiene el servicio suspendido...") en `login()` **antes**
de intentar cargar nada, en vez de una cascada de `permission-denied` que
se leería como credenciales incorrectas.

`ultimoAcceso` es un "ping" de actividad: cada login exitoso hace
`comunidadRef.update({ultimoAcceso: Date.now()})`, con permiso acotado por
campo en las reglas (cualquier rol de una comunidad activa puede tocar
*solo* ese campo del doc de su comunidad, nada más).

Desde el detalle de una comunidad, el superadmin puede suspender/reactivar
el servicio, cambiar el plan y dejar notas de soporte de uso interno -
las tres son escrituras directas del cliente al doc de la comunidad
(el propio `esSuperAdmin()` ya lo permite en las reglas; no hizo falta
ninguna Cloud Function nueva para esto).

## Autenticación

Login con **RUT + contraseña**, no con correo real. El RUT se traduce a
un correo sintético (`rutToEmail()`, dominio `@mi-comunidad.app`) porque
Firebase Auth exige un identificador tipo email. Como no es un correo
real, Firebase no puede mandar un email de "olvidé mi contraseña"; en su
lugar, administración restablece la clave de cualquier residente o
conserje desde la propia app (botón "Restablecer clave" → función
`restablecerClave()` → Cloud Function `restablecerClaveMiComunidad`).

## Multi-tenant / namespacing

La app comparte el proyecto de Firebase **`mercado-ciudadano`** con otras
apps del mismo dueño. Para no pisarse entre ellas:

- Colección Firestore con prefijo propio: `mi_comunidad_comunidades`
  (no `comunidades` a secas).
- Dominio de email sintético propio: `@mi-comunidad.app`.
- Custom claim `app:"mi_comunidad"`, revisada primero en
  `firestore.rules` y en las Cloud Functions.
- Sitio de Hosting separado: `mi-comunidad-md`.

## Datos: qué vive dónde

**Todo el contenido operativo vive en Firestore, en tiempo real.** Bajo
`mi_comunidad_comunidades/{comunidadId}/`, hay 23 subcolecciones:
`residentes`, `conserjes`, `visitas`, `visitasProgramadas`, `vehiculos`,
`encomiendas`, `reservas`, `bloquesReserva`, `bloquesOcupados`,
`gastosComunes`, `tiposMulta`, `multas`, `contadores`, `avisos`,
`incidencias`, `documentos`, `movimientosContables`, `remuneraciones`,
`proveedoresDirectorio`, `mantenciones`, `vehiculosRegistrados`,
`accesos` y `notificaciones`.

Todas siguen el mismo patrón (`iniciarSesionComunidad()` en el archivo):
un `get()` inicial + un `onSnapshot()` en vivo, aplicado con la función
genérica `aplicarSnapshotModulo()`. Se ordenan por un campo `ts`
(`Date.now()` al escribir) en vez de `orderBy()` de Firestore, para no
depender de índices compuestos.

`notificaciones` es la excepción a ese patrón genérico: un residente
necesita ver las suyas (`paraTodos == true` O `depto == su depto`), y el
SDK de Firestore que usa esta app no arma un OR entre dos campos distintos
en una sola query. Por eso se piden como dos consultas separadas
(`aplicarSnapshotNotifParaTodos`/`aplicarSnapshotNotifDepto`) que se
combinan client-side en `combinarNotificaciones()`. Como una misma
notificación puede llegarle a varias personas a la vez, "leída" no es un
booleano sino un arreglo `leidaPor` con el uid de cada quien ya la vio
(`FieldValue.arrayUnion` al abrir el modal).

**Solo 2 cosas son locales al dispositivo, por diseño** (no porque falte
migrarlas): `novedades` y `profile`, guardadas con `loadData()`/`saveData()`
bajo la clave `mc_<LOCAL_STORAGE_COMUNIDAD_ID>_*`. Son datos de conveniencia
de la sesión actual, no información que otro rol - o el mismo usuario en
otro dispositivo - necesite ver. (`notificaciones` vivió acá hasta que se
detectó que rompía justo esa promesa: un aviso de administración nunca le
llegaba al residente en su propio celular - se migró a Firestore.)

Si en algún momento se agrega un módulo nuevo, la pregunta a hacerse es:
**¿otro rol, en otro dispositivo, necesita ver esto?** Si la respuesta es
sí, va en Firestore siguiendo el mismo patrón; si no, puede ir en
`loadData`/`saveData` como los tres anteriores.

## Reglas de seguridad (Firestore)

Permisos definidos por colección y por rol en `firestore.rules`. Antes de
cualquier otra cosa, todas las subcolecciones bajo una comunidad exigen
`esDeEstaComunidadActiva()`, que además de validar `comunidadId` contra el
token consulta el propio doc de la comunidad para confirmar que no está
`"Suspendida"` (ver "Panel de superadmin" más arriba) - el doc de la
comunidad en sí es la única excepción, sigue siendo legible aunque esté
suspendida.

Las 6 colecciones que dependen del propio departamento del residente
(`visitas`, `visitasProgramadas`, `vehiculos`, `encomiendas`, `reservas`,
`gastosComunes`) se consultan con `.where("depto", "==", profile.depto)`
cuando el rol es `residente`, porque Firestore rechaza una consulta de
colección completa si la regla podría negar alguno de los documentos
devueltos. Administración y conserjería consultan sin filtro porque sus
reglas les permiten leer todo (salvo `gastosComunes`, que conserjería no
ve por ser un dato financiero).

`bloquesOcupados` es la excepción deliberada al patrón de arriba: se lee
sin filtro por todos los roles, residente incluido - a propósito, es la
mitad "pública" de una reserva (ver "Reservas de espacios comunes" más
abajo). El detalle con nombre/depto/invitados sigue protegido en
`reservas`, filtrado por depto como cualquier otra colección personal.

`residentes` es un caso aparte: su regla depende del **uid del documento**
(`request.auth.uid == uid`), no de un campo de datos, así que un `.where()`
no sirve - un residente pide directamente `.doc(currentUid)` en vez de la
colección completa (ver `iniciarSesionComunidad()`). Pedir la colección
sin este caso especial es exactamente el bug que impedía loguearse a
cualquier residente hasta que se corrigió.

Varias colecciones restringen además **qué campos** se pueden tocar en un
`update`, no solo quién puede hacerlo - `resource.data.X == request.resource.data.X`
para cada campo que no debe cambiar:
- `residentes/{uid}`: un residente no puede tocar `depto`, `nombre`, `rut`,
  `telefono`, `estado` ni los datos de propiedad de su propia ficha.
- `gastosComunes/{id}`: un residente solo puede fijar `estado: "Pagado"` y
  completar `fechaPago`/`metodoPago` - no `monto`, `periodo` ni `vencimiento`.
- `reservas/{id}`: la creación es enteramente vía Cloud Function (ver
  abajo); el `update` de un residente queda acotado a `invitados` (no
  puede tocar `lugar`, `fecha`, `bloqueId` ni `estado`).
- `bloquesReserva/{id}`: solo administración escribe (crear/editar/
  eliminar bloques); el resto de la comunidad solo lee.
- `bloquesOcupados/{id}`: nadie escribe desde el cliente
  (`allow write: if false`) - solo la Cloud Function, dentro de la misma
  transacción que crea la reserva real.

## Cloud Functions

Todas usan Admin SDK y revalidan rol/comunidad contra el token del que
llama (nunca confían en lo que el cliente diga de sí mismo):

- **`crearCuentaMiComunidad`**: solo `admin`; crea la cuenta de Auth y la
  ficha de Firestore de un residente o conserje en un solo paso, e
  incrementa `numResidentes`/`numConserjes` en el doc de la comunidad
  (contador que alimenta el panel de superadmin - ver arriba).
- **`restablecerClaveMiComunidad`**: `admin` (solo de su propia comunidad)
  o `superadmin` (cualquiera); resetea la clave de un residente/conserje
  sin depender de un correo real.
- **`crearComunidadMiComunidad`**: solo `superadmin`; crea un edificio
  nuevo junto con la cuenta de su primer administrador, y siembra los
  campos comerciales del panel de superadmin (`estado: "Activa"`, `plan`,
  `fechaContratacion`, contadores en 0, `adminNombre`/`adminUid`).
- **`crearReservaMiComunidad`**: solo `residente`. Recibe un `bloqueId`
  (no una hora libre) y hace dos validaciones que `firestore.rules` no
  puede resolver de forma segura: (1) que el depto no tenga gastos
  comunes atrasados (consulta `gastosComunes`, otra colección), y (2) que
  ese bloque no esté ya tomado ese mismo día. Para lo segundo usa una
  **transacción** que lee un documento marcador con id determinístico
  (`bloquesOcupados/{fecha}_{bloqueId}` - un `get()` por id, no una
  query) y, si no existe, crea la reserva real Y ese marcador juntos, de
  forma atómica - dos residentes reservando el mismo bloque casi al mismo
  tiempo no pueden colarse los dos. El depto de la reserva se toma del
  token del residente, nunca del payload que mande el cliente.

## Renderizado

SPA de una sola página: `currentPage` + `navigate(page)` vuelven a
dibujar la página completa en cada cambio (no hay virtual DOM ni
diffing). Esto es intencional y simple, pero tiene una consecuencia: un
`onSnapshot` que llega mientras alguien está escribiendo en un formulario
inline le haría perder el foco y lo tipeado. Por eso, cualquier
formulario de búsqueda o edición que deba sobrevivir a un redibujo de
fondo (por ejemplo, el buscador de encomiendas) se implementa como
**modal**, no como campo inline en la página.

## Navegación con el botón atrás

`navigate(page, fromPopState)` registra cada cambio de página en el
historial del navegador (`history.pushState`). Un listener de
`popstate` cierra el modal abierto si lo hay, o vuelve a la página
anterior; si no queda página propia en el historial, se queda en Inicio
en vez de salir de la app.

## Seguridad de datos de residentes

- Validación real de RUT chileno (dígito verificador), no solo formato:
  `validarRut()` / `validarRutEnVivo()`.
- Fichas de departamento protegidas con una **pregunta secreta** que
  define cada residente; administración tiene bypass total. La respuesta
  **nunca** vive en la ficha ni se compara en el navegador: se guarda como
  hash scrypt (con sal) en `secretos/{uid}` - colección cerrada a todos
  los clientes en `firestore.rules` - y se define/verifica solo vía las
  Cloud Functions `definirPreguntaSecretaMiComunidad` y
  `verificarPreguntaSecretaMiComunidad` (5 intentos fallidos → bloqueo de
  15 minutos). Las respuestas antiguas en texto plano se migran solas
  (`migrarRespuestasSecretasMiComunidad`, que la app llama al entrar
  administración).
- **Escape de HTML obligatorio**: toda la UI se arma con `innerHTML`, así
  que cualquier dato de usuario dentro de un template string va envuelto
  en `esc()`, y dentro de un `onclick="f('...')"` en `escJs()`. Al agregar
  una pantalla nueva, la regla es: si el valor no es HTML armado por la
  propia app (como `icon()` o un `render*()`), va con `esc()`.
- **Fechas de registro**: visitas, vehículos, accesos, avisos y
  encomiendas guardan la fecha real (`hoyISO()`), nunca el texto "Hoy";
  "Hoy / Ayer / 12 sept" se calcula al mostrar con `fechaRegistro(item,
  campo)` a partir de `ts`.
- Catálogo de vehículos marcados como recurrentes o sospechosos, y lista
  de personas sin acceso autorizado por departamento, con alerta
  automática si alguno de los dos intenta ingresar.

## Integraciones automáticas hacia Contabilidad

`registrarMovimientoContable()` es el único punto de entrada al libro
contable. Cuatro flujos lo llaman automáticamente: pagar un gasto común
(Ingreso), pagar una multa interna (Ingreso), pagar una remuneración
(Egreso) y marcar una mantención como realizada (Egreso). Cualquier otro
movimiento se registra a mano desde el propio libro contable - eso es una
decisión permanente, no un módulo pendiente de construir.

## Encomiendas: código único, QR y bloqueo total al entregar

El registro de una encomienda dejó de ser "recibido / no recibido" con
un solo clic. Ahora es una máquina de 3 estados:

```
Recibido  →  En proceso de entrega  →  Entregado (inmutable)
```

**Por qué solo 3 y no más**: el diseño original consideraba 6 estados,
pero "Notificado" y "Pendiente de retiro" no tenían ninguna acción de
usuario distinta de "Recibido" - son la misma espera, así que se
fusionaron. "Entregado" y "Cerrado" también se fusionaron: la entrega
queda bloqueada en el mismo instante en que se confirma, sin una
ventana de gracia editable (una ventana de este tipo es viable, pero
necesitaría comparaciones de tiempo en `firestore.rules` que no se
justificaban sin pedirlo explícitamente).

**Dos identificadores, no uno**: `codigo` (`PAQ-2026-000458`, legible,
correlativo por año - se genera con una transacción sobre
`contadores/encomiendas_<año>` para que dos conserjes registrando al
mismo tiempo nunca choquen) y `qrToken` (un string aleatorio de 16
bytes, sin relación con el código). El QR contiene el token, no el
código - el código es adivinable por ser secuencial, el token no. La
confirmación acepta cualquiera de los dos.

**Por qué no hace falta que el QR expire o rote**: una vez que la
encomienda pasa a `Entregado`, la propia regla de Firestore bloquea
cualquier otra escritura sobre ese documento - reusar una captura de
pantalla del QR después de la entrega no sirve de nada, porque ya no
hay nada que confirmar.

**El paso intermedio (`En proceso de entrega`) no es decorativo**: es
lo que evita que dos conserjes confirmen el mismo paquete a la vez.
`buscarEncomiendaPorToken()`/`buscarEncomiendaPorCodigo()` solo
encuentran encomiendas en `Recibido`; apenas se encuentra una,
`iniciarProcesoEntrega()` la mueve a `En proceso de entrega` *antes*
de preguntar "¿quién retira?" - mientras un conserje completa esa
pregunta, ningún otro puede volver a encontrar el mismo paquete.
Si el conserje cierra el modal sin terminar, `closeModal()` la revierte
sola a `Recibido` para que no quede atascada.

**El residente nunca escribe directo sobre su encomienda** - ni
siquiera para "confirmar" que la retiró. Solo lee (para ver el estado y
mostrar su QR); quien confirma el retiro es siempre la persona de
conserjería que tiene al residente físicamente enfrente. Esto es
justo lo contrario del diseño anterior, donde el propio residente
podía cerrar el ciclo por su cuenta.

**Las dos librerías de QR se tratan distinto por su tamaño**:
`qrcode-generator` (generar, ~20KB) va embebida directo en `index.html`
porque cualquier residente la puede necesitar. `jsQR` (decodificar,
~130KB) vive aparte, en `jsQR.min.js`, servido desde el mismo Hosting
- `cargarJsQR()` la pide con un `<script>` recién cuando conserjería
abre el escáner, para no inflarle la descarga a todo el mundo por una
función que solo usa un rol.



## Diseño de los paneles

- **Tipografía**: Manrope (Google Fonts) para toda la interfaz, con cifras
  tabulares en montos. Si la fuente no carga, cae a la del sistema.
- **Dashboard de administración** (`renderAdminDashboard`): "Requiere tu
  atención" (`irAtencion`), recaudación del mes con barra por estado y
  tendencia de 6 meses (`graficoRecaudacionHtml`, SVG sin librerías), mapa
  del edificio (`mapaEdificioHtml`: deptos por piso según el número - 804
  es piso 8 - coloreados con `estadoFinancieroDepto`), caja y operación
  del día. "Con deuda" = cualquier gasto vencido sin pagar, de cualquier mes.
- **Ficha del departamento** (`fichaDeptoHtml`): se abre como panel lateral
  (`.modal-backdrop.is-drawer`) con pestañas Resumen / Habitantes / Pagos
  (solo admin) / Accesos. La pestaña activa vive en `fichaTabActual` y se
  conserva al redibujar la ficha del mismo depto. Para conserjería,
  Habitantes y Accesos muestran el bloqueo de pregunta secreta.
- **Pestañas de administración**: agrupadas en Comunidad / Finanzas /
  Operación, en una sola línea con scroll horizontal.
- **Conserjería** (`renderConserjeria`): buscador en vivo por depto, nombre,
  familiar, patente o código de encomienda (`resultadosBusquedaConserjeHtml`;
  la tecla "/" lo enfoca y conserva lo escrito aunque lleguen
  actualizaciones), 3 acciones principales, accesos secundarios, y listas
  de encomiendas por entregar (más antiguas primero), visitas avisadas y
  bitácora.
- **Inicio del propietario** (`renderHome`): gasto común del mes con fecha
  de vencimiento y botón "Informar pago", encomiendas con su QR a un toque,
  4 acciones frecuentes, avisos y "Lo que viene".
- Convención para el escape anti-XSS: las variables y funciones que
  devuelven HTML armado por la app terminan en `Html` (`celdasHtml`,
  `mapaEdificioHtml()`); todo lo demás va con `esc()`.

## Pagos: el residente informa, administración confirma

No hay pasarela de pago. El residente **informa** su pago de gasto común o
multa (método, fecha, N° de operación) y queda en estado `"Por confirmar"`
con un objeto `pagoInformado`. Administración lo ve arriba de la pestaña
"Gastos comunes" (`renderPagosPorConfirmar()`), lo contrasta con la cartola
y lo **confirma** (`marcarGastoPagado`/`marcarMultaPagada`, que recién ahí
crean el ingreso en `movimientosContables`) o lo **rechaza**
(`rechazarPagoInformado`, que deja `pagoRechazado.motivo` visible para el
residente). `firestore.rules` (`pagoInformadoValido()`) solo le permite al
residente pasar a `"Por confirmar"` con datos acotados; no puede marcar
nada como pagado ni crear movimientos contables. Un gasto vencido que está
`"Por confirmar"` sigue bloqueando las reservas hasta que se confirme.

## Vencimientos (tarea programada)

`actualizarVencimientosMiComunidad` corre todos los días a las 00:15 (hora
de Chile) y pasa a `"Atrasado"` los gastos comunes `"Pendiente"` vencidos
y a `"Atrasada"` las mantenciones `"Programada"` vencidas, en todas las
comunidades activas. El cliente solo lo refleja en pantalla
(`actualizarEstadosMorosidad`/`actualizarEstadosMantencion` ya no
escriben). Las fechas "de hoy" usan `hoyISO()` (hora local), nunca
`toISOString()` (UTC).

## Historial acotado y redibujo agrupado

Administración y conserjería descargan solo los últimos `DIAS_HISTORIAL`
(90) días de `visitas`, `vehiculos`, `accesos` y `notificaciones` (filtro
`ts >=`, de un solo campo, sin índice compuesto). `rerenderSiAppVisible()`
agrupa los snapshots que llegan casi juntos en un solo redibujo (60 ms).

## Exportar a Excel

`exportarTabAdmin()` descarga un CSV (separador `;`, BOM UTF-8) de la
pestaña actual de administración: residentes, gastos comunes, multas,
libro contable o remuneraciones. `celdaCSV()` antepone `'` a los textos
que empiezan con `= + - @` para evitar inyección de fórmulas en Excel.

## Conciliación bancaria (V1: cartola en Excel/CSV)

Pestaña **Finanzas → Conciliación** de administración
(`renderAdminConciliacion()`). Sin conexión al banco: el administrador sube
la cartola que descarga de su banco y la app hace el resto.

- **Lectura** (`leerArchivoCartola` → `detectarColumnasCartola` →
  `interpretarCartola`): CSV (`;` `,` o tabulador, UTF-8 o Windows-1252) o
  Excel (SheetJS, cargado desde su CDN recién al elegir un .xlsx). Encuentra
  sola la fila de encabezados en las primeras 40 filas y las columnas
  Fecha / Descripción / Cargo / Abono / Saldo, o una sola columna Monto con
  signo; el admin puede corregir el mapeo en el mismo modal. Montos en formato
  chileno (`85.000`, `$ 1.234.567`, `(650.000)`), fechas `dd/mm/aaaa`,
  `aaaa-mm-dd` o serie de Excel. Deja los movimientos en orden cronológico.
- **Sin duplicados**: cada movimiento se guarda en `movimientosBancarios` con
  un id determinístico (`idMovimientoBancario`: fecha + monto + glosa + saldo +
  n.º de repetición), así reimportar la misma cartola o una superpuesta no
  duplica nada.
- **Coincidencias** (`buscarCoincidencias`, se calculan en vivo, no se
  guardan): un abono se compara con gastos comunes y multas sin pagar (o
  "Por confirmar") y con ingresos ya registrados en Contabilidad; un cargo, con
  egresos de Contabilidad (±15 días). El depto se reconoce en la glosa
  ("DEPTO 305", "DPTO. 305", un número de depto suelto o el apellido del
  residente) y el N° de operación del pago informado también cuenta.
  - **Exacta**: monto igual y depto/operación/proveedor identificado, sin
    empate. Se concilia con un toque, o todas juntas con "Conciliar las N".
  - **Probable**: solo calza el monto, o el depto calza con un monto mayor, o
    hay dos deudas iguales (el admin elige el mes).
  - **Sin coincidencia**: se asigna a mano (buscador por depto o residente) o
    se registra como ingreso/egreso nuevo en Contabilidad.
  - Un abono **menor** que la deuda no se ofrece contra ella (no hay pagos
    parciales en V1).
- **Conciliar** una deuda la marca pagada con el flujo de siempre
  (`marcarGastoPagado`/`marcarMultaPagada`, con la fecha del banco), que crea el
  ingreso en Contabilidad. Si el abono supera la deuda, la diferencia se
  registra como "Abono al próximo período" o "Saldo a favor" (`saldosAFavor` +
  ingreso contable "Saldo a favor") o queda "por revisar".
- **Tablero**: saldo según banco (saldo del último movimiento) vs. saldo según
  sistema (saldo inicial del período según la cartola + ingresos − egresos de
  Contabilidad con fecha de ese período). Si difieren, alerta roja con el monto.
- **Auditoría**: cada conciliación y cada reversión agrega una entrada en
  `historialConciliacion` (quién, cuándo, qué, a qué se asoció). Las reglas la
  hacen de solo-agregar y a nombre de quien la crea. Revertir deja el movimiento
  pendiente pero no deshace el pago ya registrado en Gastos comunes/Contabilidad.
- **Reglas**: las 4 colecciones (`movimientosBancarios`,
  `importacionesBancarias`, `historialConciliacion`, `saldosAFavor`) son solo
  de administración; un movimiento bancario no se puede borrar ni cambiar su
  fecha, monto o glosa.
- **Tests**: `tests/conciliacion.test.js` prueba lectura y coincidencias
  tomando el bloque `CONCILIACION-PURAS` directo de `index.html`.

Pendiente para una V2: cierre mensual, pagos parciales, aplicar
automáticamente los saldos a favor al generar el cobro siguiente y conexión
directa con el banco.

## Multas internas

Administración configura un catálogo de tipos de multa (`tiposMulta` -
nombre + monto sugerido + activo/inactivo) y aplica una multa puntual a
un departamento (`multas`). Sigue el mismo patrón ya usado en
`gastosComunes` en todo:

- El residente solo puede marcar **la suya propia** como pagada (pago
  simulado, sin pasarela real) - no puede tocar el monto, el tipo ni la
  fecha (`firestore.rules`, igual que en `gastosComunes`).
- Pagarla dispara `registrarMovimientoContable()` con
  `categoria:"Multa"`, igual que un gasto común - por eso
  `movimientosContables` tuvo que aceptar esa categoría además de
  "Gasto común" en la regla de `create` para residente.
- Al aplicar la multa, `crearNotificacion()` la manda con
  `depto` puntual y `paraTodos:false` - eso ya alcanza para que le
  llegue tanto a conserjería (que lee todas las notificaciones sin
  filtro) como al residente de ese departamento, sin necesitar ningún
  cambio nuevo en el sistema de notificaciones.

Única diferencia real con `gastosComunes`: conserjería SÍ puede leer
`multas` (para estar al tanto de qué departamento tiene una activa),
cosa que no puede con los gastos comunes por ser dato financiero.

## Reservas de espacios comunes (bloques horarios)

Antes se reservaba a cualquier hora libre (un `<input type="time">` sin
restricción), sin control de choques: dos residentes podían reservar el
mismo espacio a la misma hora sin que nadie se enterara. Ahora:

- Administración define **bloques horarios por espacio** en
  `bloquesReserva` (ej. Quincho → "Mañana 10:00-14:00", "Tarde
  15:00-19:00"), con un nombre, hora de inicio/fin y si está activo.
- El residente elige un espacio, una fecha, y recién ahí ve los bloques
  de ESE espacio con su disponibilidad calculada en el momento
  (`calcularDisponibilidadBloques()`) - solo puede elegir uno que
  aparezca "Disponible".
- El choque real se evita en el servidor, no en el cliente: la Cloud
  Function `crearReservaMiComunidad` hace la creación dentro de una
  transacción de Firestore (ver "Cloud Functions" más abajo).
- Conserjería y administración tienen la misma vista de disponibilidad
  (elegir espacio + fecha) disponible desde la página "Reservas", para
  responder "¿hay disponible?" sin depender de que el residente les
  muestre su perfil - es la misma función de cálculo, solo que de solo
  lectura.
- Las fechas de una reserva se guardan en ISO (`"2026-09-15"`), no ya
  formateadas como texto, precisamente para poder compararlas al calcular
  disponibilidad; `formatFechaLarga()` las convierte a texto legible solo
  al mostrarlas.

**La disponibilidad y el detalle de una reserva viven separados, a
propósito.** "¿Está libre?" es información pública dentro de la
comunidad (`bloquesOcupados` - sin depto, sin nombre, sin invitados, solo
existe o no existe). "¿Quién reservó y con qué invitados?" es privado:
vive en `reservas`, filtrado por depto igual que cualquier otra colección
personal - solo lo ven administración, conserjería, y el propio
departamento. `calcularDisponibilidadBloques()` combina ambas: el
libre/ocupado sale siempre de `bloquesOcupados` (lo puede calcular
cualquiera), y el depto se agrega solo si el rol que pregunta además
puede leer esa reserva puntual - para cualquier otro residente, el
bloque se ve "Reservado" sin decir de quién.

La ficha de un departamento (`detalleResidente`, la que abre
administración/conserjería) muestra además sus reservas con acceso
directo a la lista de invitados de cada una - así conserjería tiene todo
a mano para el control de acceso cuando los invitados empiecen a llegar,
sin tener que buscar la reserva en otra pantalla.

## Fuera de alcance (a propósito)

- **Control de acceso con cámaras/OCR de patentes**: vive en un proyecto
  separado, "Control de Acceso Condominio". Este módulo aquí es
  deliberadamente liviano (registro manual + alertas), no un duplicado.
- **Recuperación de contraseña por correo real**: no aplica porque el
  login es con RUT/correo sintético; se resuelve con el reset manual de
  administración descrito arriba.

## Sistema de diseño (tokens CSS)

Todo vive en variables dentro de `:root`, al inicio del `<style>`: colores
(`--primary`, `--accent`, `--bg`, `--subtitle`, etc.) y 4 niveles de
elevación (`--shadow-sm/md/lg/modal`). Cualquier componente nuevo debería
usar estas variables en vez de sombras/colores sueltos, para que un
cambio de paleta futuro se haga en un solo lugar.

Dos animaciones dependen de un comportamiento del navegador, no de JS
extra: `.modal` se re-anima cada vez que `.modal-backdrop` pasa de
`display:none` a visible (los navegadores reinician las animaciones CSS
al volver a renderizar un elemento), y el fade-in de página
(`.page-header`, `.card`, `.stats`, etc.) corre solo porque esos nodos
se destruyen y se vuelven a crear en cada `navigate()` (ver
"Renderizado" más abajo) - un elemento nuevo en el DOM siempre dispara
sus animaciones de entrada.

Queda pendiente (no es CSS puro, necesita cambios de JS): conectar la
clase utilitaria `.skeleton` (ya lista, con su keyframe de shimmer) a los
momentos reales de carga en vez de pantallas en blanco.

## Íconos (Lucide, embebidos - no vía CDN)

Los ~110 emojis usados como ícono visual se reemplazaron por SVG de
[Lucide](https://lucide.dev) embebidos directo en el JS (objeto `ICONS`,
al principio del `<script>`), no cargados desde un CDN con
`data-lucide="..."`. La razón: esta app redibuja todo reemplazando
`innerHTML` en cada `navigate()`, así que usar el patrón de Lucide
obligaría a llamar `lucide.createIcons()` después de CADA función de
render nueva - fácil de olvidar, y el olvido es silencioso (el ícono
simplemente no aparece, sin error en consola). Con el SVG embebido en el
propio string HTML, aparece solo.

**Los datos siguen guardando el emoji tal cual** - `reserva.icon`,
`notificacion.icon`, `novedad.icon`, `categoriaAvisoConfig[...].icon`,
`LUGARES_RESERVABLES[...].icon`, etc. No se tocó el esquema de Firestore
ni ninguna Cloud Function para esto. La traducción emoji → ícono ocurre
solo al mostrarlo, vía `EMOJI_ICON_MAP` + la función `icon(nombreOEmoji)`:

```js
icon('🏠')   // busca en EMOJI_ICON_MAP, encuentra "home", devuelve su SVG
icon('home') // no está en EMOJI_ICON_MAP, usa "home" tal cual, mismo resultado
icon('🆕')   // no mapeado -> devuelve el emoji tal cual (no rompe nada)
```

Esto significa que un documento ya guardado en Firestore con un emoji
sigue funcionando exactamente igual sin ninguna migración.

**Dos excepciones a propósito** donde se dejó el emoji tal cual, sin pasar
por `icon()`:
- Los `<option>` de los `<select>` de espacio/lugar (`mDisponibilidadLugar`,
  `mBloqueLugar`): un `<option>` solo puede mostrar texto plano, no puede
  contener un `<svg>` - el emoji ahí es la opción visualmente correcta.
- El campo `mDocumentoIcon` (administración escribe a mano el emoji del
  documento que publica): cambiarlo requeriría construir un selector de
  íconos completo, fuera de alcance de esta pasada.

**Ojo con el nombre del parámetro `icon`**: como la función global se
llama `icon`, cualquier función que reciba un parámetro con ese mismo
nombre lo tapa dentro de su propio scope (`function foo(lugar, icon)` ya
no puede llamar a la función global `icon()` adentro de `foo`, porque
`icon` ahí es el string que le pasaron). Antes de agregar un nuevo ícono
dentro de una función así, hay que renombrar el parámetro primero (ver
`renderBloquesDeLugarAdmin`, que se renombró a `iconoEmoji` por esto
mismo).

## Patrones visuales de la experiencia del residente

Tres piezas de UI se armaron como componentes reutilizables reconocibles
(clases `.parcel-*`, `.invite-*`, `.notif-*`, `.restricted-card` en el
CSS), no como estilos sueltos por página:

- **Encomiendas** (`.parcel-card`): en vez de un badge de texto, un
  stepper de 2 puntos ("Recibido" → "Retirado") como el de un seguimiento
  de pedido - el estado se lee de un vistazo, sin leer texto.
- **Visitas programadas del residente** (`.invite-card`): tarjeta tipo
  entrada/ticket, con un bloque de fecha (día grande + mes abreviado,
  `formatFechaCorta()`) separado del nombre del invitado por un borde
  punteado. Solo se usa en la vista del propio residente («esto es gente
  que yo invito») - la vista operativa de conserjería sigue siendo una
  lista simple, porque ahí lo que importa es marcar el ingreso rápido,
  no la estética.
- **Personas sin acceso autorizado** (`.restricted-card`): a propósito
  usa un tono ámbar sobrio, no rojo de alarma - es información privada y
  sensible de un residente (a veces un conflicto familiar), no una
  amenaza externa que justifique tratamiento de "peligro".
- **Notificaciones** (`.notif-item`/`.notif-icon`/`notifTone()`): las no
  leídas llevan fondo resaltado + un punto de color; el ícono además
  toma un tono ámbar si es de tipo alerta/restricción (`notifTone()`
  mira el mismo `EMOJI_ICON_MAP` para decidir el tono, sin necesitar un
  campo de "tipo" nuevo en los datos).

Los mensajes de estado vacío (`.empty`, o el texto simple cuando una
lista no amerita ícono grande) se revisaron para sonar a alguien
hablándole a otra persona, no a un log de sistema - "Todavía no te ha
llegado ninguna encomienda" en vez de "No hay encomiendas registradas".

## Modo oscuro (conserjería, turno de noche)

Por ahora solo lo usa el rol `conserje` - el botón (sol/luna) en la
topbar solo se muestra para ese rol (`aplicarRolUI()`), y es el único
que recibe la sugerencia automática por hora. El resto de la app ya
funciona en base a variables CSS, así que si más adelante se quiere
ofrecer a otros roles, alcanza con sacar esa condición - no hace falta
tocar ninguna regla de estilo nueva.

Cómo decide qué tema mostrar, en orden:
1. Si el conserje ya lo cambió a mano alguna vez (`localStorage`, por
   dispositivo - conserjería suele compartir el mismo equipo entre
   turnos), se respeta esa elección siempre, sin importar la hora.
2. Si nunca lo tocó, se sugiere automáticamente oscuro fuera del horario
   07:00-20:00 (`sugerirTemaNocturno()`, llamada una sola vez al iniciar
   sesión, dentro de `aplicarRolUI()`).

Técnicamente es `html[data-theme="dark"]` redefiniendo las mismas
variables de `:root` (`--bg`, `--card`, `--text`, `--border`, los tonos
de badge, etc.) - **no** `prefers-color-scheme`, a propósito: es una
preferencia de turno, no algo que deba depender de la configuración del
sistema operativo de un equipo compartido.

**Ojo con hardcodear un color nuevo en el CSS** sin pasar por una
variable - así fue como aparecieron los dos bugs reales que hubo que
corregir al construir esto: varias reglas usaban `background:white` (la
palabra clave, no `#fff` ni `var(--card)` - un grep por hex no lo
encuentra) y quedaban con tarjetas blancas encima de un fondo oscuro;
y unas cuantas reglas de Fase 1/3 (`.notif-icon.is-warning`,
`.restricted-card`, `.close-btn`, `.secondary-btn`, `th`, etc.) tenían
grises de conveniencia escritos directo en hex. Ambos se corrigieron,
pero antes de agregar una regla con un color nuevo, conviene preguntarse
si ese color necesita una variable (o un override en el bloque
`html[data-theme="dark"]`) para no repetir el mismo problema.

## Convenciones de nombres

El código usa nombres de dominio en español de forma consistente
(`residentesDirectorio`, `gastosComunes`, `abrirModalFamiliar`, etc.).
La única excepción es la variable `profile` (en inglés, en vez de
`perfil`) y sus dos funciones asociadas (`saveProfile`,
`sincronizarProfileConResidente`) - quedó así desde una etapa temprana.
No se renombró en esta limpieza porque toca ~40 puntos del archivo y la
propia clave de `localStorage` con la que persiste en el dispositivo de
cada usuario, sin aportar ninguna mejora funcional; queda anotado acá
por si se decide abordar en una pasada dedicada solo a eso.
