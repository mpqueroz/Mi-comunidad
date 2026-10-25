"use strict";
// Ejecutar solo desde Cloud Shell autorizado. Credenciales efímeras en memoria.
const {execFileSync} = require("node:child_process");
const crypto = require("node:crypto");
const {createRequire} = require("node:module");
const requireFunctions = createRequire(require("node:path").resolve(__dirname, "../functions/package.json"));
const {initializeApp} = requireFunctions("firebase-admin/app");
const {getAuth} = requireFunctions("firebase-admin/auth");
const {getFirestore} = requireFunctions("firebase-admin/firestore");
const {createTrial} = require("../functions/licencias");
const projectId = "mercado-ciudadano";
const comunidadId = "nodar-pagos-prueba-20261025";
const uid = "nodar-mp-prueba-20261025";
const email = "pagos-prueba-20261025@mi-comunidad.app";
async function main() {
  const environment = execFileSync("gcloud", ["secrets", "versions", "access", "latest", "--secret=MC_MP_ENVIRONMENT", "--project=" + projectId], {encoding:"utf8"});
  if (environment !== "test") throw new Error("Solo se prepara el acceso en entorno test");
  initializeApp({projectId, credential: {getAccessToken: async () => ({
    access_token: execFileSync("gcloud", ["auth", "print-access-token"], {encoding:"utf8"}).trim(),
    expires_in: 3000,
  })}});
  const auth = getAuth(), db = getFirestore();
  const communityRef = db.collection("mi_comunidad_comunidades").doc(comunidadId);
  const licenseRef = db.collection("mi_comunidad_licencias").doc(comunidadId);
  const existing = await communityRef.get();
  if (existing.exists && existing.get("mpTestFixture") !== true) throw new Error("El identificador no pertenece a la prueba técnica");
  let user;
  try { user = await auth.getUser(uid); }
  catch (error) { if (error.code !== "auth/user-not-found") throw error; }
  if (user && (user.email !== email || user.customClaims?.comunidadId !== comunidadId || user.customClaims?.app !== "mi_comunidad")) {
    throw new Error("La cuenta existente no pertenece a esta prueba técnica");
  }
  const password = crypto.randomBytes(15).toString("base64url");
  if (user) await auth.updateUser(uid, {password});
  else await auth.createUser({uid, email, password, displayName:"Administrador de prueba de pagos"});
  await auth.setCustomUserClaims(uid, {app:"mi_comunidad", role:"admin", comunidadId});
  await db.runTransaction(async tx => {
    const c = await tx.get(communityRef), l = await tx.get(licenseRef);
    if (c.exists && c.get("mpTestFixture") !== true) throw new Error("Comunidad ajena a la prueba");
    if (!c.exists) tx.create(communityRef, {name:"Prueba técnica Mercado Pago", estado:"Activa", mpTestFixture:true, adminUid:uid, numResidentes:0, numConserjes:0});
    if (!l.exists && c.exists) throw new Error("La licencia de prueba requiere revisión; no se reinicia automáticamente");
    if (!l.exists) tx.create(licenseRef, createTrial(new Date()));
  });
  console.log("\nACCESO TEMPORAL A LA PÁGINA DE PRUEBA");
  console.log("Correo: " + email);
  console.log("Contraseña temporal: " + password);
  console.log("Guarda estos dos datos. No son credenciales de Mercado Pago.\n");
}
module.exports = {main};
if (require.main === module) main().catch(error => {console.error(error.message); process.exitCode=1;});
