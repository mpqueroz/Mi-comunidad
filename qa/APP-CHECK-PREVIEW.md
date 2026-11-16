# Diagnóstico temporal de App Check — PR #18

El workflow `App Check preview aislado` publica exclusivamente una página de diagnóstico, con Firebase App y App Check locales. No carga Auth, Firestore, Functions ni la aplicación comunitaria. El botón solicita atestación real a Google; solo muestra un estado, nunca el token.

Canal: `auditoria-appcheck`, sitio `mi-comunidad-md`, proyecto `mercado-ciudadano`, vencimiento un día desde cada actualización. La CLI usa `hosting:channel:deploy` y `--no-authorized-domains`: no publica el canal live ni sincroniza dominios de Firebase Authentication. Dependencias fijadas, instalación sin scripts antes de autenticar, acciones fijadas y ejecución limitada al PR #18 de la rama confiable del propio repositorio.

Primera publicación verificada: [workflow #1](https://github.com/mpqueroz/Mi-comunidad/actions/runs/43966033133), revisión `46c9eb6`, dos pruebas de aislamiento aprobadas. URL:
https://mi-comunidad-md--auditoria-appcheck-noq870xx.web.app

Para la prueba manual:
1. En Google Cloud > Fraud Defense > Claves > Mi Comunidad App Check > Editar clave, añadir **mi-comunidad-md--auditoria-appcheck-noq870xx.web.app** a la lista de dominios, conservando los existentes y la verificación de dominios.
2. Guardar; abrir el enlace temporal y pulsar **Comprobar App Check**.
3. Registrar el resultado o una captura. No copiar tokens ni credenciales. Un fallo requiere diagnóstico; no desactivar enforcement, restricciones ni verificación para obtener verde.
4. Retirar el dominio temporal de la clave al terminar la prueba.

El registro del proveedor y la publicación del diagnóstico no demuestran todavía un intercambio real exitoso. La comprobación tampoco sustituye pruebas de roles, licencias, pagos, el tratamiento de cuentas de prueba y la revisión de la clave API compartida. No se fusionó el PR ni se desplegaron reglas, funciones o Hosting live. No se activó Exigir App Check.
