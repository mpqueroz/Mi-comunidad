# Cierre pendiente de la auditoría del PR #18

Estado: PR en borrador. La autorización expresa del usuario permitió únicamente habilitar App Check API y API Keys API en `mercado-ciudadano`; no autoriza cambiar IAM, enforcement, restricciones de claves, fichas ni licencias. Se mantienen prohibidas la fusión y cualquier despliegue a Firebase.

## 1. Habilitación autorizada, bloqueada en ejecución

[Firebase #167](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43866375618), commit `a4528d3`: el job manual se ejecutó con la opción de habilitación activada después de aprobar las pruebas. Terminó con HTTP 403, sin confirmar la habilitación de ninguna API. La consulta posterior autenticada confirmó `SERVICE_DISABLED` para ambas. El error de habilitación no aportó una razón permitida ni identifica si falló la lectura del estado o el POST; no atribuir un permiso IAM concreto sin evidencia.

La consola de Google Cloud devolvió «Site Unavailable» en este navegador durante el intento de continuación. La alternativa pendiente es que una sesión con permisos existentes suficientes habilite exclusivamente:

```sh
gcloud services enable firebaseappcheck.googleapis.com apikeys.googleapis.com --project mercado-ciudadano
```

No se necesita repetir la autorización para ese alcance. No agregar roles IAM automáticamente, no activar la exigencia de App Check, no cambiar restricciones de claves ni consultar sus valores. Después se debe repetir `auditar-configuracion.cjs` y registrar la configuración efectiva. La autorización para habilitar APIs no autoriza cambios adicionales de seguridad.

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
