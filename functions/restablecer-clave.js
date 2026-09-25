/**
 * Busca una cuenta de Mi Comunidad por RUT (cualquier rol: superadmin,
 * administrador, conserje o residente) y le asigna una contraseña nueva
 * a la fuerza, usando la llave de administrador del proyecto.
 *
 * Por qué hace falta esto: estas cuentas usan un email "inventado"
 * ({rut}@mi-comunidad.app), así que Firebase no puede mandar un correo
 * real de "olvidé mi contraseña" a nadie. Este script hace ese cambio
 * directamente, sin depender de ningún correo.
 *
 * También sirve para DIAGNOSTICAR: si el RUT que buscas no existe,
 * te lo dice de inmediato - eso confirma que la cuenta nunca se llegó
 * a crear (en vez de que la contraseña esté mal).
 *
 * ⚠️ Este script necesita serviceAccountKey.json en esta misma carpeta.
 * Esa llave da acceso TOTAL a tu proyecto de Firebase (a Mi Comunidad y a
 * tus otras apps). No la subas a ningún repositorio ni la incluyas en un
 * zip que compartas - bórrala de este computador cuando termines de usarla.
 *
 * ============================================================
 * CÓMO USARLO
 * ============================================================
 * 1) Completa RUT_A_BUSCAR y NUEVA_CLAVE más abajo.
 * 2) Corre, desde la carpeta functions/ (donde ya tienes
 *    serviceAccountKey.json de antes):
 *
 *      node restablecer-clave.js
 *
 * 3) Lee el resultado: te dice qué cuenta encontró (rol, a qué edificio
 *    pertenece) antes de cambiarle la clave, para que confirmes que es
 *    la cuenta correcta.
 */

const admin = require("firebase-admin");

// ------------------------------------------------------------------
// EDITA ESTOS DATOS ANTES DE CORRER EL SCRIPT
// ------------------------------------------------------------------

const RUTA_SERVICE_ACCOUNT = "./serviceAccountKey.json";

const RUT_A_BUSCAR = "11.111.111-1"; // el RUT de la cuenta que no deja entrar
const NUEVA_CLAVE = "cambia-esta-clave"; // mínimo 6 caracteres

// ------------------------------------------------------------------

function limpiarRut(rut) {
  return String(rut || "").replace(/[^0-9kK]/g, "").toUpperCase();
}

async function main() {
  const serviceAccount = require(RUTA_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const email = limpiarRut(RUT_A_BUSCAR).toLowerCase() + "@mi-comunidad.app";
  console.log(`Buscando cuenta con email: ${email} ...`);

  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
  } catch (err) {
    if (err && err.code === "auth/user-not-found") {
      console.log("\n❌ No existe ninguna cuenta con ese RUT.");
      console.log("   Eso significa que la creación de esa cuenta nunca se completó");
      console.log("   (revisa si te salió un mensaje de error al crearla, o vuelve a");
      console.log("   crearla desde la app).");
      process.exit(1);
    }
    throw err;
  }

  const claims = user.customClaims || {};
  console.log("\n✔ Cuenta encontrada:");
  console.log(`   Nombre: ${user.displayName || "(sin nombre)"}`);
  console.log(`   App: ${claims.app || "(ninguna - no es de Mi Comunidad)"}`);
  console.log(`   Rol: ${claims.role || "(sin rol asignado)"}`);
  if (claims.comunidadId) {
    console.log(`   Edificio (comunidadId): ${claims.comunidadId}`);
  }

  if (claims.app !== "mi_comunidad") {
    console.log("\n⚠️ Esta cuenta NO pertenece a Mi Comunidad (es de otra de tus apps");
    console.log("   en este mismo proyecto de Firebase). Este script se detiene sin");
    console.log("   tocarla, por seguridad.");
    process.exit(1);
  }

  await admin.auth().updateUser(user.uid, {password: NUEVA_CLAVE});

  console.log("\n✔ Listo. Contraseña actualizada. Ya puedes entrar con:");
  console.log(`   RUT: ${RUT_A_BUSCAR}`);
  console.log(`   Contraseña: ${NUEVA_CLAVE}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Ocurrió un error:", err.message || err);
  process.exit(1);
});