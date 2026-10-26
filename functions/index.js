/**
 * Cloud Functions — Mi Comunidad
 *
 * Este proyecto de Firebase es compartido con otras apps de Marcelo, así que
 * TODO acá está namespaced con el prefijo "mi_comunidad" / "mi-comunidad.app"
 * para no pisar cuentas, datos ni funciones de esas otras apps:
 *   - Colección Firestore: mi_comunidad_comunidades/...
 *   - Dominio de emails sintéticos de Auth: {rut}@mi-comunidad.app
 *   - Custom claim "app": "mi_comunidad" (se revisa primero en cada función
 *     y en firestore.rules)
 *
 * crearCuentaMiComunidad:
 *   Solo puede ser llamada por un usuario ya autenticado con claim
 *   role == "admin" de esta misma app/comunidad. Crea la cuenta de Auth
 *   (email sintético a partir del RUT) y el documento de Firestore del
 *   residente o conserje, todo en un solo paso atómico del lado servidor.
 *
 *   Se hace desde una Cloud Function (Admin SDK) y no desde el cliente
 *   porque crear un usuario con createUserWithEmailAndPassword() en el
 *   cliente deja la sesión activa como el usuario recién creado, cerrando
 *   la sesión del administrador que lo estaba creando.
 */

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore, FieldValue, Timestamp} = require("firebase-admin/firestore");
const crypto = require("crypto");

initializeApp();

const APP_ID = "mi_comunidad";
const EMAIL_DOMAIN = "mi-comunidad.app";
const COMUNIDADES_COLLECTION = "mi_comunidad_comunidades";

// Debe coincidir EXACTO con limpiarRut() del index.html del front-end,
// para que el mismo RUT siempre produzca el mismo email sintético.
function limpiarRut(rut) {
  return String(rut || "").replace(/[^0-9kK]/g, "").toUpperCase();
}

function validarRut(rutSucio) {
  const rut = limpiarRut(rutSucio);
  if (!/^[0-9]{7,8}[0-9K]$/.test(rut)) return false;

  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const resto = 11 - (suma % 11);
  let dvEsperado;
  if (resto === 11) dvEsperado = "0";
  else if (resto === 10) dvEsperado = "K";
  else dvEsperado = String(resto);

  return dv === dvEsperado;
}

function rutToEmail(rut) {
  return `${limpiarRut(rut).toLowerCase()}@${EMAIL_DOMAIN}`;
}

// Mínimo 8 caracteres en todas las vías de alta o cambio de clave.
const MIN_CLAVE = 8;
function exigirClaveValida(clave, mensaje = "La contraseña") {
  if (typeof clave !== "string" || clave.length < MIN_CLAVE || clave.length > 128) {
    throw new HttpsError(
        "invalid-argument",
        `${mensaje} debe tener entre ${MIN_CLAVE} y 128 caracteres.`,
    );
  }
}

const ESTADOS_CUENTA = ["Activo", "Pendiente", "Inactivo", "En turno", "Fuera de turno"];

exports.crearCuentaMiComunidad = onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const token = auth.token || {};
  if (token.app !== APP_ID || token.role !== "admin") {
    throw new HttpsError(
        "permission-denied",
        "Solo administración puede crear cuentas nuevas.",
    );
  }

  const data = request.data || {};
  const comunidadId = String(data.comunidadId || "").trim();
  const rolNuevo = data.rol; // "residente" | "conserje"
  const rut = data.rut;
  const password = data.password;
  const nombre = String(data.nombre || "").trim();

  if (comunidadId !== token.comunidadId) {
    throw new HttpsError(
        "permission-denied",
        "No puedes crear cuentas fuera de tu propia comunidad.",
    );
  }

  if (rolNuevo !== "residente" && rolNuevo !== "conserje") {
    throw new HttpsError("invalid-argument", "Rol inválido.");
  }

  if (!rut || !validarRut(rut)) {
    throw new HttpsError("invalid-argument", "El RUT ingresado no es válido.");
  }

  exigirClaveValida(password);

  if (!nombre || nombre.length > 150) {
    throw new HttpsError("invalid-argument", "Falta el nombre.");
  }

  if (data.estado !== undefined && !ESTADOS_CUENTA.includes(data.estado)) {
    throw new HttpsError("invalid-argument", "Estado de cuenta inválido.");
  }

  // Un residente sin depto quedaría con claim depto:"" y ninguna regla
  // por depto le funcionaría (ni vería su propio gasto común).
  const depto = String(data.depto || "").trim();
  if (rolNuevo === "residente" && (!depto || depto.length > 20 || depto.includes("/"))) {
    throw new HttpsError("invalid-argument", "Falta un departamento válido.");
  }

  const db = getFirestore();
  const comunidadRef = db.collection(COMUNIDADES_COLLECTION).doc(comunidadId);

  // Una comunidad suspendida no puede seguir dando de alta cuentas
  // (las reglas ya le cortan todo lo demás).
  const comunidadSnap = await comunidadRef.get();
  if (!comunidadSnap.exists || comunidadSnap.get("estado") === "Suspendida") {
    throw new HttpsError(
        "failed-precondition",
        "Esta comunidad no está activa.",
    );
  }
  await exigirCuentaActiva(request, comunidadId);

  const email = rutToEmail(rut);
  let userRecord;

  try {
    userRecord = await getAuth().createUser({
      email,
      password,
      displayName: nombre,
    });
  } catch (err) {
    if (err && err.code === "auth/email-already-exists") {
      throw new HttpsError(
          "already-exists",
          "Ya existe una cuenta creada con ese RUT.",
      );
    }
    throw new HttpsError("internal", "No se pudo crear la cuenta: " + (err && err.message ? err.message : err));
  }

  const claims = {
    app: APP_ID,
    role: rolNuevo,
    comunidadId: comunidadId,
  };
  if (rolNuevo === "residente") {
    claims.depto = depto;
  }

  // Si algo falla después de crear el usuario de Auth, se borra: si no,
  // quedaba una cuenta sin rol ni ficha, y ese RUT ya no se podía volver
  // a crear ("Ya existe una cuenta creada con ese RUT").
  try {
    await getAuth().setCustomUserClaims(userRecord.uid, claims);
    await escribirFichaNuevaCuenta(comunidadRef, userRecord.uid, rolNuevo, {...data, depto}, nombre, rut);
  } catch (err) {
    await getAuth().deleteUser(userRecord.uid).catch((e) =>
      console.error("No se pudo borrar la cuenta a medio crear:", userRecord.uid, e));
    await comunidadRef.collection(rolNuevo === "residente" ? "residentes" : "conserjes")
        .doc(userRecord.uid).delete().catch(() => {});
    await comunidadRef.collection("secretos").doc(userRecord.uid).delete().catch(() => {});
    console.error("crearCuentaMiComunidad falló, cuenta revertida:", err);
    throw new HttpsError("internal", "No se pudo crear la cuenta. Intenta de nuevo.");
  }

  // Mantiene al día el contador denormalizado que usa el panel de
  // superadmin (columna "Usuarios") - se guarda en el propio doc de la
  // comunidad para no tener que sumar las subcolecciones de cada edificio
  // cada vez que el superadmin abre el panel.
  await comunidadRef.update({
    [rolNuevo === "residente" ? "numResidentes" : "numConserjes"]:
        FieldValue.increment(1),
  });

  return {uid: userRecord.uid, email};
});

// Ficha de Firestore de una cuenta recién creada (residente o conserje).
async function escribirFichaNuevaCuenta(comunidadRef, uid, rolNuevo, data, nombre, rut) {
  if (rolNuevo === "residente") {
    await comunidadRef.collection("residentes").doc(uid).set({
      depto: data.depto,
      nombre,
      rut: limpiarRut(rut),
      telefono: String(data.telefono || "").trim().slice(0, 40),
      estado: data.estado || "Activo",
      familiares: [],
      restringidos: [],
      // La pregunta solo se guarda si viene con su respuesta: una pregunta
      // sin respuesta dejaba la ficha sin forma de verificarse.
      preguntaSecreta: String(data.respuestaSecreta || "").trim() ?
        String(data.preguntaSecreta || "").trim().slice(0, 200) : "",
    });

    const respuestaInicial = String(data.respuestaSecreta || "").trim().slice(0, 100);
    if (respuestaInicial) {
      await comunidadRef.collection("secretos").doc(uid)
          .set(await docSecretoNuevo(respuestaInicial));
    }
  } else {
    await comunidadRef.collection("conserjes").doc(uid).set({
      nombre,
      turno: String(data.turno || "").trim().slice(0, 100),
      telefono: String(data.telefono || "").trim().slice(0, 40),
      estado: data.estado || "Activo",
      sueldo: parseInt(data.sueldo, 10) || 0,
    });
  }
}

/**
 * restablecerClaveMiComunidad:
 *   Como las cuentas usan un email sintético (no uno real), Firebase no
 *   tiene forma de mandarle un correo de "olvidé mi contraseña" a nadie.
 *   Esta función deja que administración le asigne una nueva contraseña
 *   a un residente o conserje puntual, verificando primero que esa cuenta
 *   sea realmente de Mi Comunidad y de la misma comunidad del admin que
 *   hace el cambio (para no tocar cuentas de otra comunidad ni de otra
 *   app que comparta este mismo proyecto de Firebase).
 */
exports.restablecerClaveMiComunidad = onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const token = auth.token || {};
  const esSuperAdmin = token.app === APP_ID && token.role === "superadmin";
  const esAdminDeComunidad = token.app === APP_ID && token.role === "admin";

  if (!esSuperAdmin && !esAdminDeComunidad) {
    throw new HttpsError(
        "permission-denied",
        "Solo administración puede restablecer contraseñas.",
    );
  }

  const data = request.data || {};
  const comunidadId = String(data.comunidadId || "").trim();
  const uid = String(data.uid || "").trim();
  const nuevaClave = data.nuevaClave;

  // Un admin de comunidad solo puede tocar cuentas de SU comunidad; el
  // superadmin (que no tiene comunidadId propio) puede tocar cualquiera.
  if (!esSuperAdmin && comunidadId !== token.comunidadId) {
    throw new HttpsError(
        "permission-denied",
        "No puedes modificar cuentas fuera de tu propia comunidad.",
    );
  }

  if (!uid) {
    throw new HttpsError("invalid-argument", "Falta el uid de la cuenta.");
  }

  exigirClaveValida(nuevaClave, "La nueva contraseña");

  if (!esSuperAdmin) await exigirCuentaActiva(request, comunidadId);

  let cuentaObjetivo;
  try {
    cuentaObjetivo = await getAuth().getUser(uid);
  } catch (err) {
    throw new HttpsError("not-found", "No se encontró esa cuenta.");
  }

  const claimsObjetivo = cuentaObjetivo.customClaims || {};
  if (claimsObjetivo.app !== APP_ID) {
    throw new HttpsError(
        "permission-denied",
        "Esa cuenta no pertenece a Mi Comunidad.",
    );
  }
  if (!esSuperAdmin && claimsObjetivo.comunidadId !== comunidadId) {
    throw new HttpsError(
        "permission-denied",
        "Esa cuenta no pertenece a tu comunidad.",
    );
  }
  // Administración solo restablece residentes y conserjes; las cuentas de
  // administración las gestiona el superadmin, y la del superadmin solo el
  // script con la llave del proyecto.
  const rolesPermitidos = esSuperAdmin ? ["admin", "conserje", "residente"] : ["conserje", "residente"];
  if (!rolesPermitidos.includes(claimsObjetivo.role)) {
    throw new HttpsError(
        "permission-denied",
        "No puedes cambiar la contraseña de esa cuenta.",
    );
  }

  await getAuth().updateUser(uid, {password: nuevaClave});
  // Cierra las sesiones abiertas con la clave anterior.
  await getAuth().revokeRefreshTokens(uid);

  return {ok: true};
});

/**
 * crearComunidadMiComunidad:
 *   Solo puede ser llamada por el superadmin de la plataforma (rol de
 *   Marcelo, no ligado a ningún edificio). Crea un edificio nuevo
 *   (documento en mi_comunidad_comunidades) y, de una vez, la cuenta de
 *   su primer administrador - así el superadmin no depende de un script
 *   manual para dar de alta cada edificio nuevo.
 *
 *   También siembra los campos que alimentan el panel "Nodar Logic → Mi
 *   Comunidad" (estado del servicio, plan, fecha de contratación,
 *   contadores de usuarios): al vivir en el propio documento de la
 *   comunidad, el superadmin los lee sin tener que consultar las
 *   subcolecciones de cada edificio uno por uno - así el panel no se
 *   vuelve más lento a medida que se suman comunidades.
 */
const PLANES_VALIDOS = ["Básico", "Profesional", "Enterprise"];

exports.crearComunidadMiComunidad = onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const token = auth.token || {};
  if (token.app !== APP_ID || token.role !== "superadmin") {
    throw new HttpsError(
        "permission-denied",
        "Solo el superadministrador puede crear comunidades nuevas.",
    );
  }

  const data = request.data || {};
  const comunidadId = String(data.comunidadId || "").trim();
  const name = String(data.name || "").trim();
  const adminNombre = String(data.adminNombre || "").trim();
  const adminRut = data.adminRut;
  const adminPassword = data.adminPassword;
  const plan = PLANES_VALIDOS.includes(data.plan) ? data.plan : "Básico";

  if (!comunidadId || !/^[a-z0-9-]+$/.test(comunidadId)) {
    throw new HttpsError(
        "invalid-argument",
        "El identificador de la comunidad solo puede tener minúsculas, números y guiones.",
    );
  }

  if (!name || name.length > 150) {
    throw new HttpsError("invalid-argument", "Falta el nombre del edificio.");
  }

  if (!adminNombre || adminNombre.length > 150) {
    throw new HttpsError("invalid-argument", "Falta el nombre del administrador.");
  }

  if (!adminRut || !validarRut(adminRut)) {
    throw new HttpsError("invalid-argument", "El RUT del administrador no es válido.");
  }

  exigirClaveValida(adminPassword, "La contraseña del administrador");

  const db = getFirestore();
  const comunidadRef = db.collection(COMUNIDADES_COLLECTION).doc(comunidadId);

  const comunidadExistente = await comunidadRef.get();
  if (comunidadExistente.exists) {
    throw new HttpsError(
        "already-exists",
        "Ya existe una comunidad con ese identificador.",
    );
  }

  const email = rutToEmail(adminRut);
  let userRecord;

  try {
    userRecord = await getAuth().createUser({
      email,
      password: adminPassword,
      displayName: adminNombre,
    });
  } catch (err) {
    if (err && err.code === "auth/email-already-exists") {
      throw new HttpsError(
          "already-exists",
          "Ya existe una cuenta creada con ese RUT.",
      );
    }
    throw new HttpsError("internal", "No se pudo crear la cuenta del administrador: " + (err && err.message ? err.message : err));
  }

  try {
    await getAuth().setCustomUserClaims(userRecord.uid, {
      app: APP_ID,
      role: "admin",
      comunidadId: comunidadId,
    });

    const batch = db.batch();
    batch.create(comunidadRef, {
      name,
      address: String(data.address || "").trim().slice(0, 300),
      apartments: parseInt(data.apartments, 10) || 0,
      residents: 0,
      telefonoAdministracion: String(data.telefonoAdministracion || "").trim().slice(0, 40),
      // Campos del panel de superadmin (Nodar Logic → Mi Comunidad):
      estado: "Activa",
      plan: plan,
      fechaContratacion: new Date().toISOString().slice(0, 10),
      notasSoporte: "",
      numResidentes: 0,
      numConserjes: 0,
      adminNombre: adminNombre,
      adminUid: userRecord.uid,
      ultimoAcceso: null,
    });
    batch.set(comunidadRef.collection("administradores").doc(userRecord.uid), {
      nombre: adminNombre,
      estado: "Activo",
      creadoEn: FieldValue.serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    // Sin esto quedaba una cuenta de administración sin edificio.
    await getAuth().deleteUser(userRecord.uid).catch((e) =>
      console.error("No se pudo borrar la cuenta a medio crear:", userRecord.uid, e));
    console.error("crearComunidadMiComunidad falló, cuenta revertida:", err);
    throw new HttpsError("internal", "No se pudo crear la comunidad. Intenta de nuevo.");
  }

  return {comunidadId, adminUid: userRecord.uid, adminEmail: email};
});

/**
 * crearReservaMiComunidad:
 *   Crea una reserva de espacio común (quincho, centro de eventos, piscina,
 *   gimnasio) para el departamento del residente que llama, sobre uno de
 *   los bloques horarios que definió administración (colección
 *   bloquesReserva) - ya no se reserva a cualquier hora libre.
 *
 *   Se movió a Cloud Function por dos razones que firestore.rules no puede
 *   resolver de forma segura:
 *     1) el chequeo de morosidad (no reservar con gastos comunes
 *        atrasados) necesita consultar OTRA colección (gastosComunes);
 *     2) evitar que dos residentes reserven el mismo bloque el mismo día
 *        necesita leer y escribir de forma atómica (una transacción) -
 *        dos solicitudes casi simultáneas deben resolverse una sí y una
 *        no, nunca las dos.
 *
 *   El depto de la reserva se toma del propio token del residente, nunca
 *   de lo que mande el cliente - así nadie puede reservar "a nombre" de
 *   otro departamento aunque manipule el payload.
 */
const LUGARES_RESERVABLES = ["Quincho", "Centro de eventos", "Piscina", "Gimnasio"];

exports.crearReservaMiComunidad = onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const token = auth.token || {};
  if (token.app !== APP_ID || token.role !== "residente") {
    throw new HttpsError(
        "permission-denied",
        "Solo un residente puede reservar un espacio común.",
    );
  }

  const data = request.data || {};
  const comunidadId = String(data.comunidadId || "").trim();

  if (comunidadId !== token.comunidadId) {
    throw new HttpsError(
        "permission-denied",
        "No puedes reservar espacios fuera de tu propia comunidad.",
    );
  }

  const lugar = String(data.lugar || "").trim();
  if (!LUGARES_RESERVABLES.includes(lugar)) {
    throw new HttpsError("invalid-argument", "Espacio no válido.");
  }

  const icon = String(data.icon || "").trim().slice(0, 40);
  const fecha = String(data.fecha || "").trim();
  const bloqueId = String(data.bloqueId || "").trim();

  if (!fecha) {
    throw new HttpsError("invalid-argument", "Falta la fecha.");
  }

  // La fecha va dentro del id del marcador (bloquesOcupados/{fecha}_{bloque}):
  // sin validar, un "/" rompía la ruta y se podían reservar días pasados.
  const fechaParseada = new Date(fecha + "T00:00:00Z");
  // La vuelta por toISOString() descarta fechas como 2026-02-31, que
  // Date acepta en silencio (las pasa al 3 de marzo).
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || isNaN(fechaParseada) ||
      fechaParseada.toISOString().slice(0, 10) !== fecha) {
    throw new HttpsError("invalid-argument", "La fecha no es válida.");
  }
  if (fecha < hoyChile()) {
    throw new HttpsError("invalid-argument", "No puedes reservar una fecha pasada.");
  }

  if (!bloqueId || bloqueId.includes("/")) {
    throw new HttpsError("invalid-argument", "Falta elegir un bloque horario.");
  }

  const depto = token.depto;
  const db = getFirestore();
  const comunidadRef = db.collection(COMUNIDADES_COLLECTION).doc(comunidadId);

  const comunidadSnap = await comunidadRef.get();
  if (!comunidadSnap.exists || comunidadSnap.get("estado") === "Suspendida") {
    throw new HttpsError("failed-precondition", "Esta comunidad no está activa.");
  }

  await exigirCuentaActiva(request, comunidadId);

  // Cuenta como deuda: "Atrasado", o cualquier gasto no pagado ya vencido
  // (incluye "Por confirmar": informar un pago no desbloquea las reservas
  // hasta que administración lo confirme).
  const hoy = hoyChile();
  const gastosDepto = await comunidadRef.collection("gastosComunes")
      .where("depto", "==", depto)
      .get();
  const tieneDeuda = gastosDepto.docs.some((d) => {
    const g = d.data();
    return g.estado === "Atrasado" || (g.estado !== "Pagado" && String(g.vencimiento || "") < hoy);
  });

  if (tieneDeuda) {
    throw new HttpsError(
        "failed-precondition",
        "No puedes reservar espacios comunes con gastos comunes atrasados.",
    );
  }

  const bloqueRef = comunidadRef.collection("bloquesReserva").doc(bloqueId);
  const bloqueSnap = await bloqueRef.get();

  if (!bloqueSnap.exists) {
    throw new HttpsError("not-found", "Ese bloque horario ya no existe.");
  }

  const bloque = bloqueSnap.data();

  if (bloque.lugar !== lugar) {
    throw new HttpsError("invalid-argument", "Ese bloque no corresponde a este espacio.");
  }

  if (bloque.activo === false) {
    throw new HttpsError("failed-precondition", "Ese bloque horario ya no está disponible.");
  }

  const reservasRef = comunidadRef.collection("reservas");

  // El id del marcador es determinístico (fecha + bloque) a propósito: así
  // "¿está ocupado?" es un get() de un solo documento por su id dentro de
  // la transacción, no una query - más simple y más rápido que buscar por
  // igualdad de campos. Este documento no lleva depto ni ningún otro dato
  // personal (ver el porqué en firestore.rules): solo existe o no existe.
  const ocupadoId = `${fecha}_${bloqueId}`;
  const ocupadoRef = comunidadRef.collection("bloquesOcupados").doc(ocupadoId);

  // Transacción: leer si el marcador de ese bloque+fecha ya existe y, si
  // no existe, crear la reserva Y el marcador juntos, todo de forma
  // atómica - así dos residentes reservando el mismo bloque casi al mismo
  // tiempo no pueden "colarse" los dos.
  const reservaId = await db.runTransaction(async (t) => {
    const ocupadoSnap = await t.get(ocupadoRef);

    if (ocupadoSnap.exists) {
      throw new HttpsError(
          "already-exists",
          "Ese bloque ya fue reservado por otro departamento. Elige otro horario.",
      );
    }

    const nuevaReservaRef = reservasRef.doc();
    t.set(nuevaReservaRef, {
      lugar,
      icon,
      depto,
      fecha,
      bloqueId,
      bloqueNombre: bloque.nombre || "",
      hora: `${bloque.horaInicio} - ${bloque.horaFin}`,
      estado: "Confirmada",
      invitados: [],
      ts: Date.now(),
    });
    t.set(ocupadoRef, {ts: Date.now(), reservaId: nuevaReservaRef.id});

    return nuevaReservaRef.id;
  });

  return {id: reservaId};
});


/* =====================================================================
 * PREGUNTA SECRETA (verificación de identidad para ver una ficha)
 *
 * Antes la respuesta se guardaba en texto plano dentro de la ficha del
 * residente y se comparaba en el navegador - y como conserjería descarga
 * todas las fichas, cualquier conserje podía leer todas las respuestas.
 *
 * Ahora:
 *   - La respuesta se guarda como hash scrypt (con sal aleatoria) en
 *     mi_comunidad_comunidades/{comunidadId}/secretos/{uid}, colección que
 *     firestore.rules cierra por completo a los clientes (solo Admin SDK).
 *   - La comparación se hace aquí, en el servidor.
 *   - 5 intentos fallidos bloquean ese departamento por 15 minutos, para
 *     que no se pueda adivinar la respuesta probando muchas veces.
 *   - La respuesta se normaliza (minúsculas, sin tildes, espacios
 *     simples) para que "Tobi" y " tobí " cuenten como la misma.
 * ===================================================================== */

const MAX_INTENTOS_SECRETO = 5;
const BLOQUEO_SECRETO_MS = 15 * 60 * 1000;

function normalizarRespuesta(texto) {
  return String(texto || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
}

function hashRespuesta(respuesta, salHex) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(normalizarRespuesta(respuesta), Buffer.from(salHex, "hex"), 64,
        (err, clave) => err ? reject(err) : resolve(clave.toString("hex")));
  });
}

async function docSecretoNuevo(respuesta) {
  const sal = crypto.randomBytes(16).toString("hex");
  return {
    algoritmo: "scrypt",
    sal,
    hash: await hashRespuesta(respuesta, sal),
    intentosFallidos: 0,
    bloqueadoHasta: 0,
    actualizado: Date.now(),
  };
}

// Consulta el estado actual: el token de una sesión anterior no basta.
async function exigirCuentaActiva(request, comunidadId) {
  const token = request.auth.token;
  const comunidadRef = getFirestore().collection(COMUNIDADES_COLLECTION).doc(comunidadId);
  const comunidad = await comunidadRef.get();
  if (!comunidad.exists || comunidad.get("estado") === "Suspendida") {
    throw new HttpsError("failed-precondition", "Esta comunidad no está activa.");
  }
  if (token.role === "admin") {
    // Lista de bajas: una cuenta de administración sin documento sigue
    // habilitada (comunidades creadas antes de que existiera), pero una
    // marcada "Inactivo" por el superadmin queda cortada al instante.
    const adminDoc = await comunidadRef.collection("administradores").doc(request.auth.uid).get();
    if (adminDoc.exists && adminDoc.get("estado") === "Inactivo") {
      throw new HttpsError("permission-denied", "La cuenta de administración fue desactivada.");
    }
    return;
  }
  const coleccion = token.role === "residente" ? "residentes" : token.role === "conserje" ? "conserjes" : null;
  if (!coleccion) return;
  const ficha = await comunidadRef.collection(coleccion).doc(request.auth.uid).get();
  if (!ficha.exists || ficha.get("estado") === "Inactivo" ||
      (token.role === "residente" && ficha.get("depto") !== token.depto)) {
    throw new HttpsError("permission-denied", "La cuenta no está habilitada o cambió su departamento. Contacta a administración.");
  }
}

// Valida aplicación, rol y comunidad; superadmin conserva su acceso global.
async function exigirRol(request, comunidadId, rolesPermitidos) {
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }
  const token = auth.token || {};
  if (token.app !== APP_ID) {
    throw new HttpsError("permission-denied", "Esta cuenta no pertenece a Mi Comunidad.");
  }
  if (token.role === "superadmin") {
    return token;
  }
  if (!rolesPermitidos.includes(token.role) || token.comunidadId !== comunidadId) {
    throw new HttpsError("permission-denied", "No tienes permiso para esta acción.");
  }
  await exigirCuentaActiva(request, comunidadId);
  return token;
}

// Si el residente todavía tiene la respuesta en texto plano (datos de
// antes de este cambio), la pasa a hash y la borra de la ficha.
async function migrarSecretoSiHaceFalta(comunidadRef, uid) {
  const secretoRef = comunidadRef.collection("secretos").doc(uid);
  const secretoSnap = await secretoRef.get();
  const residenteRef = comunidadRef.collection("residentes").doc(uid);
  const residenteSnap = await residenteRef.get();

  if (!residenteSnap.exists) {
    throw new HttpsError("not-found", "No se encontró la ficha del residente.");
  }

  const legado = residenteSnap.get("respuestaSecreta");

  if (legado !== undefined) {
    if (!secretoSnap.exists && String(legado).trim()) {
      await secretoRef.set(await docSecretoNuevo(String(legado)));
    }
    await residenteRef.update({respuestaSecreta: FieldValue.delete()});
    return await secretoRef.get();
  }

  return secretoSnap;
}

exports.definirPreguntaSecretaMiComunidad = onCall(async (request) => {
  const data = request.data || {};
  const comunidadId = String(data.comunidadId || "").trim();
  const uid = String(data.uid || "").trim();
  const pregunta = String(data.pregunta || "").trim();
  const respuesta = String(data.respuesta || "").trim();

  const token = await exigirRol(request, comunidadId, ["admin", "residente"]);

  // Un residente solo puede definir SU propia pregunta secreta.
  if (token.role === "residente" && request.auth.uid !== uid) {
    throw new HttpsError("permission-denied", "Solo puedes cambiar tu propia pregunta secreta.");
  }

  if (!uid || !pregunta || !respuesta) {
    throw new HttpsError("invalid-argument", "Completa la pregunta y la respuesta secreta.");
  }
  if (pregunta.length > 200 || respuesta.length > 100) {
    throw new HttpsError("invalid-argument", "La pregunta o la respuesta son demasiado largas.");
  }
  if (normalizarRespuesta(respuesta).length < 2) {
    throw new HttpsError("invalid-argument", "La respuesta es demasiado corta.");
  }

  const comunidadRef = getFirestore().collection(COMUNIDADES_COLLECTION).doc(comunidadId);
  const residenteRef = comunidadRef.collection("residentes").doc(uid);

  if (!(await residenteRef.get()).exists) {
    throw new HttpsError("not-found", "No se encontró la ficha del residente.");
  }

  await comunidadRef.collection("secretos").doc(uid).set(await docSecretoNuevo(respuesta));
  await residenteRef.update({
    preguntaSecreta: pregunta,
    respuestaSecreta: FieldValue.delete(),
  });

  return {ok: true};
});

// Datos de la ficha que conserjería solo recibe tras verificar la
// identidad (RUT, familiares con su RUT, personas sin acceso con su motivo
// y datos de propiedad). El resto viaja en directorioConserjeriaMiComunidad.
function fichaProtegida(residente) {
  return {
    rut: residente.rut || "",
    familiares: Array.isArray(residente.familiares) ? residente.familiares : [],
    restringidos: Array.isArray(residente.restringidos) ? residente.restringidos : [],
    nombreDueno: residente.nombreDueno || "",
    nombreArrendatario: residente.nombreArrendatario || "",
  };
}

// Tope adicional al bloqueo de 15 minutos: más de 15 respuestas erradas en
// 24 horas bloquean la ficha hasta que se cumpla ese plazo.
const MAX_FALLOS_DIA = 15;
const DIA_MS = 24 * 60 * 60 * 1000;

exports.verificarPreguntaSecretaMiComunidad = onCall(async (request) => {
  const data = request.data || {};
  const comunidadId = String(data.comunidadId || "").trim();
  const uid = String(data.uid || "").trim();
  const respuesta = String(data.respuesta || "").slice(0, 200);

  const token = await exigirRol(request, comunidadId, ["admin", "conserje"]);

  if (!uid || uid.includes("/") || !respuesta.trim()) {
    throw new HttpsError("invalid-argument", "Falta la respuesta.");
  }

  const db = getFirestore();
  const comunidadRef = db.collection(COMUNIDADES_COLLECTION).doc(comunidadId);
  const secretoSnap = await migrarSecretoSiHaceFalta(comunidadRef, uid);

  if (!secretoSnap.exists) {
    throw new HttpsError("failed-precondition", "Este departamento no tiene una pregunta secreta configurada.");
  }

  // El hash (lento a propósito) se calcula fuera de la transacción.
  const hashIngresado = await hashRespuesta(respuesta, secretoSnap.get("sal"));
  const actor = await nombreActor(request, comunidadRef);

  // Leer y actualizar el contador de intentos en una transacción: antes,
  // varias respuestas enviadas en paralelo leían el mismo contador y
  // se podían probar más de MAX_INTENTOS_SECRETO sin llegar al bloqueo.
  const resultado = await db.runTransaction(async (t) => {
    const snap = await t.get(secretoSnap.ref);
    const residenteSnap = await t.get(comunidadRef.collection("residentes").doc(uid));
    const secreto = snap.data();
    const ahora = Date.now();

    if ((secreto.bloqueadoHasta || 0) > ahora) {
      return {bloqueadoMin: Math.ceil((secreto.bloqueadoHasta - ahora) / 60000)};
    }

    // Si la respuesta cambió entre medio (sal nueva), el hash ya no sirve.
    const esCorrecta = secreto.sal === secretoSnap.get("sal") && crypto.timingSafeEqual(
        Buffer.from(hashIngresado, "hex"),
        Buffer.from(secreto.hash, "hex"),
    );

    t.create(comunidadRef.collection("auditoria").doc(), {
      tipo: "Verificación de ficha",
      residenteUid: uid,
      depto: residenteSnap.exists ? residenteSnap.get("depto") || "" : "",
      actorUid: request.auth.uid,
      actorNombre: actor,
      actorRol: token.role,
      resultado: esCorrecta ? "Correcta" : "Incorrecta",
      ts: FieldValue.serverTimestamp(),
    });

    if (esCorrecta) {
      t.update(snap.ref, {intentosFallidos: 0, bloqueadoHasta: 0});
      return {ok: true, ficha: residenteSnap.exists ? fichaProtegida(residenteSnap.data()) : null};
    }

    const ventanaVigente = (secreto.ventanaInicio || 0) + DIA_MS > ahora;
    const fallosDia = (ventanaVigente ? secreto.fallosDia || 0 : 0) + 1;
    const ventanaInicio = ventanaVigente ? secreto.ventanaInicio : ahora;
    const intentos = (secreto.intentosFallidos || 0) + 1;

    if (fallosDia >= MAX_FALLOS_DIA) {
      t.update(snap.ref, {intentosFallidos: 0, fallosDia, ventanaInicio, bloqueadoHasta: ventanaInicio + DIA_MS});
      return {recienBloqueado: true, horas: true};
    }
    if (intentos >= MAX_INTENTOS_SECRETO) {
      t.update(snap.ref, {intentosFallidos: 0, fallosDia, ventanaInicio, bloqueadoHasta: ahora + BLOQUEO_SECRETO_MS});
      return {recienBloqueado: true};
    }

    t.update(snap.ref, {intentosFallidos: intentos, fallosDia, ventanaInicio});
    return {ok: false, intentosRestantes: MAX_INTENTOS_SECRETO - intentos};
  });

  if (resultado.bloqueadoMin) {
    throw new HttpsError(
        "resource-exhausted",
        `Demasiados intentos fallidos. Intenta de nuevo en ${resultado.bloqueadoMin} minuto(s).`,
    );
  }
  if (resultado.recienBloqueado) {
    throw new HttpsError(
        "resource-exhausted",
        resultado.horas ?
          "Demasiados intentos fallidos hoy. Este departamento quedó bloqueado por 24 horas." :
          "Demasiados intentos fallidos. Este departamento quedó bloqueado por 15 minutos.",
    );
  }
  return resultado;
});

// Nombre de quien opera, para la auditoría: la ficha propia si existe y,
// para administración, el nombre de su cuenta (no el del primer admin).
async function nombreActor(request, comunidadRef) {
  const token = request.auth.token || {};
  const coleccion = token.role === "conserje" ? "conserjes" : token.role === "admin" ? "administradores" : null;
  if (coleccion) {
    const ficha = await comunidadRef.collection(coleccion).doc(request.auth.uid).get();
    if (ficha.exists && ficha.get("nombre")) return String(ficha.get("nombre"));
  }
  return String(token.name || (token.role === "superadmin" ? "Superadministración" : "Administración"));
}

/**
 * directorioConserjeriaMiComunidad:
 *   Conserjería ya no lee la colección de residentes: recibe solo lo que
 *   necesita para operar (depto, nombre, teléfono, familiares autorizados
 *   por nombre y las personas sin acceso para la alerta de ingreso). El RUT
 *   de residentes y familiares, el motivo de cada restricción y los datos
 *   de propiedad se entregan únicamente al verificar la identidad.
 */
exports.directorioConserjeriaMiComunidad = onCall(async (request) => {
  const data = request.data || {};
  const comunidadId = String(data.comunidadId || "").trim();
  await exigirRol(request, comunidadId, ["admin", "conserje"]);

  const comunidadRef = getFirestore().collection(COMUNIDADES_COLLECTION).doc(comunidadId);
  const [residentes, secretos] = await Promise.all([
    comunidadRef.collection("residentes").get(),
    comunidadRef.collection("secretos").get(),
  ]);
  const conSecreto = new Set(secretos.docs.map((d) => d.id));

  const texto = (v, max) => String(v || "").slice(0, max);
  return {
    residentes: residentes.docs.map((d) => {
      const r = d.data();
      const tienePregunta = conSecreto.has(d.id) || !!String(r.respuestaSecreta || "").trim();
      return {
        uid: d.id,
        depto: texto(r.depto, 40),
        nombre: texto(r.nombre, 150),
        estado: texto(r.estado, 20),
        telefono: texto(r.telefono, 40),
        esAirbnb: r.esAirbnb === true,
        arrendado: !!r.nombreArrendatario,
        preguntaSecreta: tienePregunta ? texto(r.preguntaSecreta, 200) || "Pregunta de seguridad" : "",
        familiares: (Array.isArray(r.familiares) ? r.familiares : []).slice(0, 50)
            .map((f) => ({nombre: texto(f && f.nombre, 150), parentesco: texto(f && f.parentesco, 60)})),
        restringidos: (Array.isArray(r.restringidos) ? r.restringidos : []).slice(0, 50)
            .map((p) => ({nombre: texto(p && p.nombre, 150), rut: texto(p && p.rut, 20)})),
      };
    }),
  };
});

/**
 * verificarFichaMiComunidad:
 *   Verificación manual (por otro medio) SOLO para fichas sin pregunta de
 *   seguridad. Queda en auditoría y se avisa al propio departamento; si la
 *   ficha tiene pregunta, hay que responderla.
 */
exports.verificarFichaMiComunidad = onCall(async (request) => {
  const data = request.data || {};
  const comunidadId = String(data.comunidadId || "").trim();
  const uid = String(data.uid || "").trim();
  const motivo = String(data.motivo || "").trim().slice(0, 500);
  const token = await exigirRol(request, comunidadId, ["admin", "conserje"]);

  if (!uid || uid.includes("/")) {
    throw new HttpsError("invalid-argument", "Identificador inválido.");
  }
  if (motivo.length < 10) {
    throw new HttpsError("invalid-argument", "Describe cómo verificaste la identidad (mínimo 10 caracteres).");
  }

  const db = getFirestore();
  const comunidadRef = db.collection(COMUNIDADES_COLLECTION).doc(comunidadId);
  const residenteRef = comunidadRef.collection("residentes").doc(uid);
  const [residenteSnap, secretoSnap] = await Promise.all([
    residenteRef.get(),
    comunidadRef.collection("secretos").doc(uid).get(),
  ]);
  if (!residenteSnap.exists) {
    throw new HttpsError("not-found", "No se encontró la ficha.");
  }
  if (secretoSnap.exists || String(residenteSnap.get("respuestaSecreta") || "").trim()) {
    throw new HttpsError("failed-precondition", "Esta ficha tiene pregunta de seguridad: verifica con la respuesta.");
  }

  const actor = await nombreActor(request, comunidadRef);
  const depto = String(residenteSnap.get("depto") || "");
  const batch = db.batch();
  batch.create(comunidadRef.collection("auditoria").doc(), {
    tipo: "Verificación manual de ficha",
    residenteUid: uid,
    depto,
    actorUid: request.auth.uid,
    actorNombre: actor,
    actorRol: token.role,
    motivo,
    ts: FieldValue.serverTimestamp(),
  });
  batch.create(comunidadRef.collection("notificaciones").doc(), {
    icon: "lock",
    titulo: "Se consultó la ficha de tu departamento",
    meta: `${actor} · verificación manual. Configura tu pregunta de seguridad en Mi perfil.`,
    depto,
    paraTodos: false,
    leidaPor: [],
    ts: Date.now(),
  });
  await batch.commit();

  return {ok: true, ficha: fichaProtegida(residenteSnap.data())};
});

/**
 * cambiarEstadoAdminMiComunidad (solo superadmin):
 *   Desactiva o reactiva una cuenta de administración. Desactivar marca la
 *   lista de bajas que revisan reglas y funciones, deshabilita la cuenta de
 *   Auth y cierra sus sesiones, así el corte es inmediato.
 */
exports.cambiarEstadoAdminMiComunidad = onCall(async (request) => {
  const token = (request.auth && request.auth.token) || {};
  if (!request.auth || token.app !== APP_ID || token.role !== "superadmin") {
    throw new HttpsError("permission-denied", "Solo el superadministrador puede gestionar administradores.");
  }
  const data = request.data || {};
  const comunidadId = String(data.comunidadId || "").trim();
  const uid = String(data.uid || "").trim();
  const estado = data.estado;
  if (!comunidadId || !uid || uid.includes("/") || !["Activo", "Inactivo"].includes(estado)) {
    throw new HttpsError("invalid-argument", "Datos inválidos.");
  }

  let cuenta;
  try {
    cuenta = await getAuth().getUser(uid);
  } catch (err) {
    throw new HttpsError("not-found", "No se encontró esa cuenta.");
  }
  const claims = cuenta.customClaims || {};
  if (claims.app !== APP_ID || claims.role !== "admin" || claims.comunidadId !== comunidadId) {
    throw new HttpsError("permission-denied", "Esa cuenta no es administración de esta comunidad.");
  }

  const comunidadRef = getFirestore().collection(COMUNIDADES_COLLECTION).doc(comunidadId);
  await comunidadRef.collection("administradores").doc(uid).set({
    nombre: cuenta.displayName || "",
    estado,
    actualizadoEn: FieldValue.serverTimestamp(),
    actualizadoPor: request.auth.uid,
  }, {merge: true});
  await getAuth().updateUser(uid, {disabled: estado === "Inactivo"});
  if (estado === "Inactivo") await getAuth().revokeRefreshTokens(uid);

  return {ok: true, estado};
});

/**
 * crearAdministradorMiComunidad (solo superadmin):
 *   Da de alta una nueva cuenta de administración para una comunidad que ya
 *   existe (por ejemplo, al cambiar de administradora).
 */
exports.crearAdministradorMiComunidad = onCall(async (request) => {
  const token = (request.auth && request.auth.token) || {};
  if (!request.auth || token.app !== APP_ID || token.role !== "superadmin") {
    throw new HttpsError("permission-denied", "Solo el superadministrador puede crear administradores.");
  }
  const data = request.data || {};
  const comunidadId = String(data.comunidadId || "").trim();
  const nombre = String(data.nombre || "").trim();
  if (!comunidadId || comunidadId.includes("/")) {
    throw new HttpsError("invalid-argument", "Falta la comunidad.");
  }
  if (!nombre || nombre.length > 150) {
    throw new HttpsError("invalid-argument", "Falta el nombre del administrador.");
  }
  if (!data.rut || !validarRut(data.rut)) {
    throw new HttpsError("invalid-argument", "El RUT del administrador no es válido.");
  }
  exigirClaveValida(data.password, "La contraseña del administrador");

  const comunidadRef = getFirestore().collection(COMUNIDADES_COLLECTION).doc(comunidadId);
  if (!(await comunidadRef.get()).exists) {
    throw new HttpsError("not-found", "No existe esa comunidad.");
  }

  const email = rutToEmail(data.rut);
  let userRecord;
  try {
    userRecord = await getAuth().createUser({email, password: data.password, displayName: nombre});
  } catch (err) {
    if (err && err.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Ya existe una cuenta creada con ese RUT.");
    }
    throw new HttpsError("internal", "No se pudo crear la cuenta del administrador.");
  }
  try {
    await getAuth().setCustomUserClaims(userRecord.uid, {app: APP_ID, role: "admin", comunidadId});
    const batch = getFirestore().batch();
    batch.set(comunidadRef.collection("administradores").doc(userRecord.uid), {
      nombre, estado: "Activo", creadoEn: FieldValue.serverTimestamp(), creadoPor: request.auth.uid,
    });
    batch.update(comunidadRef, {adminNombre: nombre, adminUid: userRecord.uid});
    await batch.commit();
  } catch (err) {
    await getAuth().deleteUser(userRecord.uid).catch(() => {});
    console.error("crearAdministradorMiComunidad falló, cuenta revertida:", err);
    throw new HttpsError("internal", "No se pudo crear la cuenta del administrador.");
  }
  return {uid: userRecord.uid, email};
});

// Migra de una vez todas las respuestas en texto plano de una comunidad.
// La app la llama sola cuando administración inicia sesión y detecta que
// aún quedan fichas con respuestaSecreta (ver iniciarSesionComunidad()).
exports.migrarRespuestasSecretasMiComunidad = onCall(async (request) => {
  const data = request.data || {};
  const comunidadId = String(data.comunidadId || "").trim();

  await exigirRol(request, comunidadId, ["admin"]);

  const comunidadRef = getFirestore().collection(COMUNIDADES_COLLECTION).doc(comunidadId);
  const residentes = await comunidadRef.collection("residentes").get();

  let migradas = 0;
  for (const doc of residentes.docs) {
    if (doc.get("respuestaSecreta") !== undefined) {
      await migrarSecretoSiHaceFalta(comunidadRef, doc.id);
      migradas++;
    }
  }

  return {migradas};
});


/* =====================================================================
 * VENCIMIENTOS (tarea programada, todos los días 00:15 hora de Chile)
 *
 * Antes cada celular que abría la app revisaba los gastos comunes y
 * mantenciones vencidos y trataba de escribir el cambio de estado por su
 * cuenta (y a los residentes las reglas se lo rechazaban). Ahora lo hace
 * una sola vez al día el servidor, para todas las comunidades activas:
 *   - gastosComunes "Pendiente" con vencimiento < hoy  -> "Atrasado"
 *   - mantenciones  "Programada" con fecha < hoy       -> "Atrasada"
 * Solo usa filtros de igualdad (estado), así que no necesita índices
 * compuestos; la comparación de fechas se hace aquí en el código.
 * Requiere el plan Blaze (Cloud Scheduler), igual que las demás v2.
 * ===================================================================== */

function hoyChile() {
  // "en-CA" formatea como AAAA-MM-DD
  return new Intl.DateTimeFormat("en-CA", {timeZone: "America/Santiago"}).format(new Date());
}

async function marcarVencidos(query, campoFecha, hoy, nuevoEstado) {
  const snap = await query.get();
  const vencidos = snap.docs.filter((d) => String(d.get(campoFecha) || "") < hoy);
  for (let i = 0; i < vencidos.length; i += 400) {
    const batch = getFirestore().batch();
    vencidos.slice(i, i + 400).forEach((d) => batch.update(d.ref, {estado: nuevoEstado}));
    await batch.commit();
  }
  return vencidos.length;
}

exports.actualizarVencimientosMiComunidad = onSchedule(
    {schedule: "15 0 * * *", timeZone: "America/Santiago"},
    async () => {
      const db = getFirestore();
      const hoy = hoyChile();
      const comunidades = await db.collection(COMUNIDADES_COLLECTION).get();

      let gastos = 0;
      let mantenciones = 0;

      for (const c of comunidades.docs) {
        if (c.get("estado") === "Suspendida") {
          continue;
        }
        gastos += await marcarVencidos(
            c.ref.collection("gastosComunes").where("estado", "==", "Pendiente"),
            "vencimiento", hoy, "Atrasado");
        mantenciones += await marcarVencidos(
            c.ref.collection("mantenciones").where("estado", "==", "Programada"),
            "fecha", hoy, "Atrasada");
      }

      console.log(`Vencimientos ${hoy}: ${gastos} gastos atrasados, ${mantenciones} mantenciones atrasadas`);
    });


/* =====================================================================
 * DEPURACIÓN (tarea programada, todos los días 03:30 hora de Chile)
 *
 * Aplica los plazos de conservación de la política de privacidad a las
 * bitácoras y a la auditoría (ver depuracion.js). Mientras DEPURACION_ACTIVA
 * sea false solo cuenta y deja el resumen en el registro de la función.
 * ===================================================================== */
const {depurar} = require("./depuracion");

exports.depurarRegistrosMiComunidad = onSchedule(
    {schedule: "30 3 * * *", timeZone: "America/Santiago", timeoutSeconds: 540},
    async () => {
      const resumen = await depurar(getFirestore(), {Timestamp, FieldValue});
      const total = resumen.reduce((n, c) => n + c.total, 0);
      console.log(`Depuración: ${total} registros vencidos`, JSON.stringify(resumen));
    });


// Operación profesional añadida; se conservan las funciones existentes de identidad.
const profesional = require('./profesional')({firestore: Object.assign(() => getFirestore(), {FieldValue, Timestamp})}, onCall, HttpsError);
// La verificación de fichas vive arriba (verificarFichaMiComunidad), sobre
// la colección secretos; el módulo no debe pisarla.
Object.keys(profesional).forEach((nombre) => {
  if (!exports[nombre]) exports[nombre] = profesional[nombre];
});
