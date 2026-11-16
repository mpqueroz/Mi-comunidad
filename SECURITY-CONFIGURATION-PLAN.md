# Cambios de configuración pendientes de aprobación

La auditoría sigue abierta. Esta propuesta no autoriza fusión, despliegue, cambios de restricciones o enforcement. El titular habilitó las dos APIs administrativas y creó/registró el proveedor Enterprise de Mi Comunidad. No se modificaron enforcement ni restricciones de la clave compartida.

## Situación observada en #184 (`12a6cee`)

| Control | Evidencia | Consecuencia |
| --- | --- | --- |
| Asociación de clave | 3 apps web registradas, 1 clave asociada; Mi Comunidad coincide por identificador | Una modificación de esa clave afecta a clientes compartidos; el inventario no descubre todos los usos externos a los registros de Firebase |
| Hosting | 4 sitios registrados; 1 asociado a la app de Mi Comunidad; existe mi-comunidad-md.web.app | Inventariar también dominios personalizados y canales de uso real antes de proponer orígenes definitivos |
| Dominios Auth | 7 entradas; mercado-ciudadano.firebaseapp.com presente; los dos hosts mi-comunidad-md y nodar.cl/www ausentes | Esta lista no equivale a la política de API key ni prueba por sí sola un fallo del acceso por correo/contraseña; revisar los flujos realmente usados |
| Restricción de navegador | Objeto presente, 0 referrers | No acreditar protección por dominio por la mera existencia del objeto; contrastar política efectiva antes de cambiar |
| Restricción de API | 27 servicios admitidos, con métodos completos dentro de cada servicio; Auth y Secure Token incluidos | No eliminar servicios por intuición; mantener lo que requieran los consumidores compartidos |
| App Check | Sin modos explícitos en los cuatro servicios consultados; rama sin inicialización de App Check | Habilitar una API no registra proveedores ni incorpora tokens al cliente |
| Proveedores reCAPTCHA | Los recursos tienen nombre, pero v3 no acredita secreto establecido ni Enterprise site key pública; ambas señales son false | No hay configuración utilizable acreditada ni prueba de intercambio de token; preparar proveedor antes de exigir tokens |
| Acceso estricto | Dos cuentas administrativas habilitadas sin ficha; una en comunidad activa/licenciada | Verificar identidades y regularizar solo las fichas aprobadas antes de publicar |

## 1. Fichas, operación acotada preparada

Usar la revisión privada de `verificar-fichas-privadas.py` con la sesión existente de Cloud Shell. La salida muestra las identidades solo al titular, fuera de CI; compartir únicamente los códigos de las cuentas reconocidas. El código liga proyecto, Auth/claims/estado, comunidad, propietario y nombres. El usuario debe revisar el nombre propuesto y confirmar la titularidad, especialmente en el caso sin propietario registrado.

Tras autorización expresa por códigos y confirmación de ausencia de cambios administrativos concurrentes, el job manual puede crear exclusivamente `nombre` verificado, `estado=Activo` y `creadoEn` de servidor si la ficha sigue ausente. No modifica Auth, claims, propietarios, licencias o fichas existentes. Eso permite pasar la nueva comprobación de ficha cuando la licencia también autorice acceso. Resolver todos los códigos antes de la primera escritura y volver a comprobar cada cuenta. Si hay éxito parcial, informar los conteos sin borrar ni ocultar resultados. Auth y Firestore no comparten una transacción atómica.

## 2. Proveedor y cliente App Check, primero en pruebas

1. Revisar las señales de configuración del proveedor de la app. Para v3 basta consultar el booleano de secreto previamente establecido, sin leer el secreto. La señal de una site key pública de Enterprise tampoco acredita funcionamiento por sí sola.
2. Seleccionar y validar un proveedor para los dominios reales, manteniendo las otras apps compartidas. Preparar el SDK cliente, renovación de tokens y los permisos CSP exactos que requiera el proveedor. No volver a habilitar scripts inline ni abrir CSP globalmente.
3. Probar en un entorno aislado la generación/intercambio de token válido, los tres roles y suscripciones/checkout; un nombre de recurso, booleano o mock no sustituye esa prueba.
4. Autorizar por separado publicación y monitorización. Comprobar que los clientes reales envían tokens antes de exigirlos.
5. Si se decide enforcement, empezar por las callables concretas de Mi Comunidad. El webhook de Mercado Pago y procesos programados tienen otros mecanismos de autenticación y no deben recibir una exigencia de App Check indiscriminada.
6. Exigir App Check en Firestore/Storage/Realtime Database/Authentication del proyecto solo tras validar también los otros consumidores afectados. Registrar condiciones de reversión aprobadas; no activar esa exigencia durante esta auditoría.

## 3. Restricciones de clave, primero inventario y prueba de compatibilidad

Identificar qué orígenes reales usan la clave, incluidos los otros sitios/apps, dominios personalizados, vistas previas y desarrollo que deban seguir funcionando. Asociaciones de registro de Firebase no equivalen a un inventario completo de tráfico. Construir una propuesta explícita de referrers y APIs y probar que conserva los flujos legítimos. No tomar únicamente los dominios de Auth como lista de orígenes permitidos ni recortar la clave a Mi Comunidad. Mantener separada la autenticación de usuarios y la autorización de datos: las restricciones de clave no sustituyen Auth, reglas ni licencias.

Cualquier PATCH de restricciones, registro de proveedor, nueva credencial, despliegue o activación de enforcement requiere una aprobación concreta posterior. La rotación de una clave no está autorizada en esta etapa.

## 4. Cierre verificable

Repetir inventario de acceso, configuración y composición de reglas después de las intervenciones autorizadas. Resolver la equivalencia con el código desplegado o documentar la diferencia exacta: los cambios del PR no están en producción. Conservar PR en borrador y los despliegues omitidos mientras sigan vigentes las prohibiciones del usuario. No declarar todo perfecto por el conteo de pruebas o complete=true en una consulta.

## Confirmación del acceso principal

La revisión privada por RUT confirmó tipoPrincipal=superadmin y fichaComunitariaNecesaria=false para el titular. No se propone crear su ficha ni modificar Auth/claims. cuentasSinFicha=[] es un resultado filtrado al principal, no un inventario global sin hallazgos. Las dos cuentas comunitarias sin ficha fueron clasificadas como pruebas por el titular; su tratamiento sigue pendiente de decisión concreta, sin cambios automáticos ni excepciones al inventario. Se mantienen los pendientes de App Check, clave compartida y revisión del código desplegado. No se modificó producción.

## Estado actualizado tras integración y pruebas
El registro de Fraud Defense fue realizado por el titular. El cliente se integra en la revisión 9c2e9104e45288a3b0ca5c726770055862c85054, aún sin desplegar. Firebase #197 aprobó 403 casos, Chromium y auditorías; Verify App Check SDK verificó la copia local contra la URL oficial. La CSP mantiene scripts externos locales y solo añade las rutas concretas de reCAPTCHA. Las pruebas de atestación e intercambio son simuladas; falta un token real y su uso por los clientes. No activar enforcement antes de esa validación y la transición de otras apps compartidas.

Los cuadros de #184 son evidencia histórica previa al registro, no el estado actual del proveedor. La clave API compartida no se modificó. No se repararon perfiles, deshabilitaron pruebas, fusionó o desplegó este PR. Véase la sección 14 del plan de cierre para la evidencia y los límites.
