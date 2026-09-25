/**
 * Crea (o repara) la cuenta de SUPERADMIN de Mi Comunidad: la del dueño de
 * la plataforma, que entra con su RUT y ve el panel "Comunidades" para
 * crear edificios y sus administradores.
 *
 * Por qué hace falta un script: por seguridad, la app NO permite crear un
 * superadmin desde adentro (si se pudiera, cualquiera podría hacerse dueño
 * de la plataforma). Solo se puede con la llave de administrador del
 * proyecto, desde tu computador.
 *
 * Qué hace:
 *   1. Te muestra si ya existe algún superadmin (y su RUT).
 *   2. Si el RUT que pusiste no tiene cuenta, la crea como superadmin.
 *   3. Si ya existe y es superadmin, solo le pone la clave nueva.
 *   4. Si ya existe pero es de OTRO rol (por ejemplo, un administrador de
 *      edificio) se detiene sin tocarla: un mismo RUT no puede ser las dos
 *      cosas. Usa otro RUT (por ejemplo, el tuyo personal).
 *
 * ⚠️ Necesita serviceAccountKey.json en esta misma carpeta (la misma llave
 * que usa restablecer-clave.js). Da acceso TOTAL a tu proyecto: bórrala
 * cuando termines.
 *
 * ============================================================
 * CÓMO USARLO
 * ============================================================
 * 1) Completa los 3 datos de más abajo.
 * 2) En la terminal, desde la carpeta functions/ (dos comandos separados):
 *
 *      cd functions
 *      node crear-superadmin.js
 *
 * 3) Entra a la app con ese RUT y esa clave.
 */

const admin = require("firebase-admin");

// ------------------------------------------------------------------
// EDITA ESTOS DATOS ANTES DE CORRER EL SCRIPT
// ------------------------------------------------------------------

const RUTA_SERVICE_ACCOUNT = "./serviceAccountKey.json";

const RUT_SUPERADMIN = "11.111.111-1"; // TU RUT (distinto al de los administradores)
const CLAVE = "cambia-esta-clave";     // mínimo 6 caracteres
const NOMBRE = "Marcelo";              // cómo aparece en la app

// ------------------------------------------------------------------

const APP_ID = "mi_comunidad";

function limpiarRut(rut) {
  return String(rut || "").replace(/[^0-9kK]/g, "").toUpperCase();
}

async function superadminsExistentes() {
  const encontrados = [];
  let pageToken;
  do {
    const pagina = await admin.auth().listUsers(1000, pageToken);
    pagina.users.forEach((u) => {
      const c = u.customClaims || {};
      if (c.app === APP_ID && c.role === "superadmin") {
        encontrados.push(u);
      }
    });
    pageToken = pagina.pageToken;
  } while (pageToken);
  return encontrados;
}

async function main() {
  if (CLAVE.length < 6 || CLAVE === "cambia-esta-clave") {
    console.log("❌ Pon una clave propia de al menos 6 caracteres en CLAVE.");
    process.exit(1);
  }
  if (limpiarRut(RUT_SUPERADMIN) === "111111111") {
    console.log("❌ Pon tu RUT en RUT_SUPERADMIN.");
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(require(RUTA_SERVICE_ACCOUNT)),
  });

  const existentes = await superadminsExistentes();
  if (existentes.length) {
    console.log("ℹ️ Superadmins que ya existen:");
    existentes.forEach((u) => console.log(`   - RUT ${u.email.split("@")[0]} (${u.displayName || "sin nombre"})`));
  } else {
    console.log("ℹ️ Todavía no existe ningún superadmin.");
  }

  const email = limpiarRut(RUT_SUPERADMIN).toLowerCase() + "@mi-comunidad.app";
  const claims = {app: APP_ID, role: "superadmin"};

  let user = null;
  try {
    user = await admin.auth().getUserByEmail(email);
  } catch (err) {
    if (!err || err.code !== "auth/user-not-found") {
      throw err;
    }
  }

  if (!user) {
    user = await admin.auth().createUser({email, password: CLAVE, displayName: NOMBRE});
    await admin.auth().setCustomUserClaims(user.uid, claims);
    console.log("\n✔ Cuenta de superadmin CREADA.");
  } else {
    const c = user.customClaims || {};
    if (c.app === APP_ID && c.role === "superadmin") {
      await admin.auth().updateUser(user.uid, {password: CLAVE, displayName: NOMBRE});
      console.log("\n✔ Esa cuenta ya era superadmin: le puse la clave nueva.");
    } else {
      console.log(`\n⚠️ Ese RUT ya tiene una cuenta con rol "${c.role || "ninguno"}"` +
        (c.comunidadId ? ` en el edificio ${c.comunidadId}` : "") + ".");
      console.log("   No la modifico, para no dejar ese edificio sin su cuenta.");
      console.log("   Usa otro RUT para el superadmin (por ejemplo, el tuyo personal).");
      process.exit(1);
    }
  }

  console.log("\nYa puedes entrar a la app con:");
  console.log(`   RUT: ${RUT_SUPERADMIN}`);
  console.log(`   Contraseña: ${CLAVE}`);
  console.log("\nRecuerda borrar serviceAccountKey.json de esta carpeta.");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Ocurrió un error:", err.message || err);
  process.exit(1);
});
