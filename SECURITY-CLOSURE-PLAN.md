# Cierre pendiente de la auditoría del PR #18

Estado: preparado para revisión; no ejecutar cambios reales con la autorización actual. Se mantienen prohibidas la fusión y cualquier despliegue a Firebase.

## 1. Habilitar dos APIs para poder consultar la configuración

La lectura autenticada devolvió `SERVICE_DISABLED`, no solo un 403 genérico, para Firebase App Check API y API Keys API. No se habilitaron servicios ni se cambiaron permisos.

Cambio propuesto, pendiente de autorización expresa porque modifica la configuración del proyecto compartido:

```sh
gcloud services enable firebaseappcheck.googleapis.com apikeys.googleapis.com --project mercado-ciudadano
```

Alcance: habilitar únicamente esas dos APIs. No activar la exigencia de App Check, no cambiar restricciones de claves, no leer valores de claves, no crear credenciales y no agregar roles IAM. La habilitación no acredita que después existan todos los permisos de consulta; cualquier denegación adicional debe diagnosticarse sin ampliar permisos automáticamente.

Después: repetir `auditar-configuracion.cjs` en la rama de auditoría, consultar las configuraciones permitidas y registrar los resultados. Si hacen falta cambios de seguridad efectivos, proponerlos por separado y probar compatibilidad con los clientes.

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
