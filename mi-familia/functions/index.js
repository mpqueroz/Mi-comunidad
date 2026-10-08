// Cloud Functions de Mi Familia: notificaciones push.
//
// - onFamiliaCreado / onFamiliaActualizado: avisan a la familia cuando hay
//   un aviso, pedido, SOS, salida/llegada, votación, plan, gracias, etc.
// - revisarLlegadas (cada 5 min): "llegada segura". Si alguien no marcó
//   "Llegué" a la hora que dijo, alerta a la familia.
// - resumenDiario (7:30, hora de Chile): lo que pasa hoy, para cada persona.
//
// Las notificaciones respetan el "no molestar" de cada uno, salvo SOS,
// avisos urgentes y llegadas atrasadas.

const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {setGlobalOptions} = require("firebase-functions/v2");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {getMessaging} = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

// Debe coincidir con la ubicación de Firestore que elegiste al crear el
// proyecto (ver LEEME). southamerica-west1 = Santiago.
const REGION = "southamerica-west1";
const TZ = "America/Santiago";
setGlobalOptions({region: REGION, maxInstances: 5});

// El proyecto se comparte con otras apps: todo lo de Mi Familia lleva el
// prefijo "mi_familia_".
const FAMILIES = "mi_familia_families";
const USERS = "mi_familia_users";

// Sitio de Mi Familia dentro del proyecto compartido (firebase.json → hosting.site).
const APP_URL = "https://mi-familia-md.web.app/";

// ---------- utilidades ----------

const dayKeyTZ = (d = new Date()) => new Intl.DateTimeFormat("en-CA", {timeZone: TZ}).format(d); // YYYY-MM-DD
const timeTZ = (ts) => new Intl.DateTimeFormat("es-CL", {timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false}).format(new Date(ts));
const cut = (s, n = 140) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");

async function familyMembers(fid) {
  const snap = await db.collection(`${FAMILIES}/${fid}/members`).get();
  return snap.docs.map((d) => ({id: d.id, ...d.data()}));
}

const nameIn = (members, uid) => members.find((m) => m.id === uid)?.name || "Alguien";

// Envía una notificación a los miembros de la familia.
//   except: uid(s) que no la reciben (normalmente quien la generó)
//   only:   si viene, solo a estos uid
//   urgent: ignora "no molestar" y queda fija en pantalla
async function notify(fid, members, {title, body, path = "#/hoy", except = [], only = null, urgent = false, tag}) {
  const now = Date.now();
  const skip = new Set([].concat(except));
  const uids = members
    .filter((m) => !skip.has(m.id) && (!only || only.includes(m.id)) && (urgent || !(m.dndUntil > now)))
    .map((m) => m.id);
  if (!uids.length) return 0;

  const users = await db.getAll(...uids.map((u) => db.doc(`${USERS}/${u}`)));
  const tokens = [];
  const owner = {};
  for (const u of users) {
    for (const t of u.get("fcmTokens") || []) {
      if (!owner[t]) tokens.push(t);
      owner[t] = u.id;
    }
  }
  if (!tokens.length) return 0;

  const res = await getMessaging().sendEachForMulticast({
    tokens,
    notification: {title, body: cut(body, 200)},
    webpush: {
      notification: {
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        ...(tag ? {tag, renotify: true} : {}),
        ...(urgent ? {requireInteraction: true, vibrate: [400, 150, 400, 150, 800]} : {}),
      },
      fcmOptions: {link: APP_URL + path},
      headers: {Urgency: urgent ? "high" : "normal"},
    },
  });

  // Limpia tokens de teléfonos que ya no existen.
  const dead = res.responses
    .map((r, i) => (!r.success && /registration-token-not-registered|invalid-registration-token|invalid-argument/.test(r.error?.code || "") ? tokens[i] : null))
    .filter(Boolean);
  await Promise.all(dead.map((t) => db.doc(`${USERS}/${owner[t]}`).update({fcmTokens: FieldValue.arrayRemove(t)}).catch(() => {})));
  return res.successCount;
}

// ---------- al crear algo ----------

exports.onFamiliaCreado = onDocumentCreated("mi_familia_families/{fid}/{col}/{id}", async (event) => {
  const {fid, col} = event.params;
  const d = event.data?.data();
  if (!d) return;
  const members = await familyMembers(fid);
  const who = nameIn(members, d.by);

  switch (col) {
    case "avisos": {
      const urgent = d.prioridad === "urgente";
      const icon = urgent ? "🔴" : d.prioridad === "importante" ? "🟠" : "📣";
      return notify(fid, members, {title: `${icon} ${who}`, body: d.texto, path: "#/muro/avisos", except: d.by, urgent});
    }
    case "pedidos":
      return notify(fid, members, {
        title: "📦 Pedido en camino",
        body: `${d.descripcion || "Un pedido"}${d.tienda ? ` (${d.tienda})` : ""} llega ${d.fecha === dayKeyTZ() ? "hoy" : d.fecha}${d.desde ? ` desde las ${d.desde}` : ""}. ¿Quién lo recibe?`,
        path: "#/muro/pedidos", except: d.by,
      });
    case "sos":
      return notify(fid, members, {
        title: `🚨 SOS: ${who} necesita ayuda`,
        body: d.mensaje || "Toca para ver su ubicación.",
        path: "#/hoy", except: d.by, urgent: true, tag: "sos-" + event.params.id,
      });
    case "salidas": {
      const quien = nameIn(members, d.quien);
      return notify(fid, members, {
        title: `🚶 ${quien} salió`,
        body: `Hacia ${d.destino}${d.esperaAt ? `. Llega aprox. a las ${timeTZ(d.esperaAt)}` : ""}`,
        path: "#/cuidado/salidas", except: [d.by, d.quien], tag: "salida-" + event.params.id,
      });
    }
    case "votaciones":
      return notify(fid, members, {title: `🗳️ ${who} quiere saber`, body: d.pregunta, path: "#/momentos/votaciones", except: d.by});
    case "planes":
      return notify(fid, members, {title: `🎉 ${who} propone un plan`, body: `${d.titulo}${d.fecha ? ` · ${d.fecha}` : ""}`, path: "#/momentos/planes", except: d.by});
    case "gracias":
      return notify(fid, members, {title: `💛 ${who} te dio las gracias`, body: d.texto, path: "#/momentos/gracias", only: [d.para]});
    case "eventos":
      if (!d.quienes?.length) return;
      return notify(fid, members, {title: `📅 ${who} agendó algo`, body: `${d.titulo} · ${d.fecha}${d.hora ? " " + d.hora : ""}`, path: "#/casa/calendario", only: d.quienes, except: d.by});
    case "colegio": {
      if (d.by === d.para) return; // lo anotó el mismo hijo/a
      const tipo = {prueba: "📚 Prueba", materiales: "✂️ Materiales", recordatorio: "📌 Recordatorio"}[d.tipo] || "📝 Tarea";
      return notify(fid, members, {
        title: `🎒 ${who} te envió: ${tipo}`,
        body: `${d.asignatura ? d.asignatura + ": " : ""}${d.titulo}${d.fecha ? ` · para el ${d.fecha.slice(8)}/${d.fecha.slice(5, 7)}` : ""}`,
        path: "#/casa/colegio", only: [d.para], tag: "colegio-" + event.params.id,
      });
    }
    case "fotos":
      return; // las fotos no notifican (serían demasiadas)
    default:
      return;
  }
});

// ---------- al actualizar algo ----------

exports.onFamiliaActualizado = onDocumentUpdated("mi_familia_families/{fid}/{col}/{id}", async (event) => {
  const {fid, col} = event.params;
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (col === "salidas" && before.estado === "en_camino" && after.estado === "llego") {
    const members = await familyMembers(fid);
    return notify(fid, members, {
      title: `✅ ${nameIn(members, after.quien)} llegó`,
      body: `Llegó a ${after.destino}`,
      path: "#/cuidado/salidas", except: [after.quien], tag: "salida-" + event.params.id,
    });
  }

  if (col === "sos") {
    const members = await familyMembers(fid);
    const nuevos = Object.keys(after.voy || {}).filter((u) => !before.voy?.[u]);
    if (nuevos.length) {
      await notify(fid, members, {title: `🏃 ${nuevos.map((u) => nameIn(members, u)).join(", ")} va en camino`,
        body: "Recibieron tu alerta SOS.", only: [after.by], urgent: true});
    }
    if (!before.resuelto && after.resuelto) {
      await notify(fid, members, {title: "✅ SOS resuelto", body: `${nameIn(members, after.by)} está bien.`,
        except: [after.resueltoBy], urgent: true, tag: "sos-" + event.params.id});
    }
    return;
  }

  if (col === "colegio" && !before.hecho && after.hecho && after.by !== after.hechoBy) {
    const members = await familyMembers(fid);
    return notify(fid, members, {title: `✅ ${nameIn(members, after.hechoBy)} terminó`, body: after.titulo, only: [after.by], path: "#/casa/colegio"});
  }

  if (col === "avisos" && !before.encargado && after.encargado && after.encargado !== after.by) {
    const members = await familyMembers(fid);
    return notify(fid, members, {title: `✋ ${nameIn(members, after.encargado)} se encarga`, body: cut(after.texto, 100), only: [after.by], path: "#/muro/avisos"});
  }
});

// ---------- llegada segura ----------

exports.revisarLlegadas = onSchedule({schedule: "every 5 minutes", timeZone: TZ}, async () => {
  const now = Date.now();
  const snap = await db.collectionGroup("salidas").where("estado", "==", "en_camino").where("esperaAt", "<", now).get();
  for (const doc of snap.docs) {
    if (doc.ref.parent.parent?.parent.id !== FAMILIES) continue; // "salidas" de otra app
    const s = doc.data();
    if (s.avisoAtraso || now - s.esperaAt > 12 * 3600e3) continue; // ya avisado, o muy antiguo
    const fid = doc.ref.parent.parent.id;
    const members = await familyMembers(fid);
    const quien = nameIn(members, s.quien);
    await notify(fid, members, {
      title: `⚠️ ${quien} no ha llegado`,
      body: `Debía llegar a ${s.destino} a las ${timeTZ(s.esperaAt)}. ¿Alguien sabe de ${quien}?`,
      path: "#/cuidado/salidas", except: [s.quien], urgent: true, tag: "atraso-" + doc.id,
    });
    await notify(fid, members, {
      title: "⏱️ ¿Ya llegaste?", body: `Marca “Llegué” en ${s.destino} para que la familia esté tranquila.`,
      path: "#/cuidado/salidas", only: [s.quien], urgent: true,
    });
    await doc.ref.update({avisoAtraso: true});
  }
});

// ---------- resumen diario ----------

function eventOn(ev, k) {
  if (!ev.fecha || ev.fecha > k) return false;
  if (ev.fecha === k) return true;
  const dow = (x) => new Date(x + "T12:00:00Z").getUTCDay();
  switch (ev.repetir) {
    case "anual": return ev.fecha.slice(5) === k.slice(5);
    case "mensual": return ev.fecha.slice(8) === k.slice(8);
    case "semanal": return dow(ev.fecha) === dow(k);
    default: return false;
  }
}

function turnoDe(t, k, memberIds) {
  const rot = (t.rotacion || []).filter((u) => memberIds.includes(u));
  if (!rot.length) return null;
  const days = Math.round((Date.parse(k) - Date.parse(t.inicio || k)) / 864e5);
  let n = days;
  if (t.frecuencia === "semanal") {
    const monday = (x) => {
      const d = new Date(x + "T12:00:00Z");
      return Date.parse(x) - ((d.getUTCDay() + 6) % 7) * 864e5;
    };
    n = Math.round((monday(k) - monday(t.inicio || k)) / (7 * 864e5));
  }
  return rot[((n % rot.length) + rot.length) % rot.length];
}

exports.resumenDiario = onSchedule({schedule: "30 7 * * *", timeZone: TZ}, async () => {
  const k = dayKeyTZ();
  const md = k.slice(5);
  const families = await db.collection(FAMILIES).get();

  for (const fam of families.docs) {
    const fid = fam.id;
    const manana = dayKeyTZ(new Date(Date.now() + 864e5));
    const [members, pedidos, eventos, cuentas, mascotas, planes, tareas, colegio] = await Promise.all([
      familyMembers(fid),
      db.collection(`${FAMILIES}/${fid}/pedidos`).where("fecha", "==", k).get(),
      db.collection(`${FAMILIES}/${fid}/eventos`).get(),
      db.collection(`${FAMILIES}/${fid}/cuentas`).get(),
      db.collection(`${FAMILIES}/${fid}/mascotas`).get(),
      db.collection(`${FAMILIES}/${fid}/planes`).where("fecha", "==", k).get(),
      db.collection(`${FAMILIES}/${fid}/tareas`).get(),
      db.collection(`${FAMILIES}/${fid}/colegio`).where("hecho", "==", false).get(),
    ]);
    const escolar = colegio.docs.map((d) => d.data()).filter((c) => c.fecha === k || c.fecha === manana);
    const tipoTxt = (c) => ({prueba: "prueba de", materiales: "llevar", recordatorio: ""}[c.tipo] ?? "tarea de");
    const comunes = [];
    for (const p of pedidos.docs.map((d) => d.data()).filter((p) => p.estado !== "recibido")) {
      comunes.push(`📦 Llega ${p.descripcion || p.tienda}`);
    }
    for (const e of eventos.docs.map((d) => d.data()).filter((e) => eventOn(e, k))) {
      comunes.push(`📅 ${e.titulo}${e.hora ? " " + e.hora : ""}`);
    }
    for (const m of members.filter((x) => x.birthday?.slice(5) === md)) comunes.push(`🎂 Cumpleaños de ${m.name}`);
    for (const p of planes.docs.map((d) => d.data())) comunes.push(`🎉 ${p.titulo}`);
    for (const p of mascotas.docs.map((d) => d.data())) {
      for (const v of p.vacunas || []) if (v.proxima === k) comunes.push(`💉 ${p.nombre}: ${v.nombre}`);
    }
    const lastDay = new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)), 0).getDate();
    const cuentasHoy = cuentas.docs.map((d) => d.data())
      .filter((c) => Math.min(Number(c.dia) || 1, lastDay) === Number(k.slice(8)) && !c.pagado?.[k.slice(0, 7)])
      .map((c) => `🧾 Vence ${c.nombre}`);

    const ids = members.map((m) => m.id);
    for (const m of members) {
      const mias = tareas.docs.map((d) => d.data())
        .filter((t) => turnoDe(t, k, ids) === m.id && !(t.frecuencia === "semanal" && new Date(k + "T12:00:00Z").getUTCDay() !== 1))
        .map((t) => `${t.emoji || "✅"} Te toca: ${t.titulo}`);
      const adulto = ["admin", "adulto"].includes(m.role);
      const cole = escolar
        .filter((c) => c.para === m.id || adulto)
        .map((c) => `🎒 ${c.para === m.id ? "" : nameIn(members, c.para) + ", "}${c.fecha === k ? "hoy" : "mañana"}: ${[tipoTxt(c), c.tipo === "materiales" ? c.titulo : c.asignatura || c.titulo].filter(Boolean).join(" ")}`);
      const lines = [...comunes, ...(adulto ? cuentasHoy : []), ...cole, ...mias];
      if (!lines.length) continue;
      await notify(fid, members, {title: "☀️ Hoy en la familia", body: lines.join(" · "), only: [m.id], tag: "resumen"});
    }
  }
});
