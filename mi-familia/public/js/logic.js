// Reglas de negocio puras (sin HTML): calendario, turnos de tareas,
// cuentas, salidas atrasadas y la pregunta del día.

import {S, list, members, nameOf} from "./state.js";
import {dayKey, parseDay, addDays, diffDays, monthKey, fmtMoney, pad} from "./util.js";

// ---------- calendario ----------

// ¿El evento ocurre en el día k? (repetir: no | semanal | mensual | anual)
function eventOn(ev, k) {
  if (!ev.fecha) return false;
  if (ev.fecha === k) return true;
  if (ev.fecha > k) return false; // las repeticiones parten desde la fecha original
  switch (ev.repetir) {
    case "anual": return ev.fecha.slice(5) === k.slice(5);
    case "mensual": return ev.fecha.slice(8) === k.slice(8);
    case "semanal": return parseDay(ev.fecha).getDay() === parseDay(k).getDay();
    default: return false;
  }
}

const lastDayOfMonth = (k) => {
  const d = parseDay(k);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};

// Día de vencimiento de una cuenta en el mes de k (31 → último día del mes).
export const dueDay = (cuenta, k) => Math.min(Number(cuenta.dia) || 1, lastDayOfMonth(k));

// Todo lo que pasa el día k, como [{kind, icon, title, sub, who, ref}].
export function itemsOn(k) {
  const out = [];
  for (const ev of list("eventos")) {
    if (!eventOn(ev, k)) continue;
    const years = ev.repetir === "anual" ? Number(k.slice(0, 4)) - Number(ev.fecha.slice(0, 4)) : 0;
    out.push({
      kind: "evento", icon: TIPOS[ev.tipo]?.icon || "📌", time: ev.hora || "",
      title: ev.titulo + (years > 0 && ev.tipo === "familia" ? ` (${years} años)` : ""),
      sub: ev.notas || "", who: ev.quienes || [], ref: ev,
    });
  }
  for (const m of members()) {
    if (m.birthday && m.birthday.slice(5) === k.slice(5)) {
      const years = Number(k.slice(0, 4)) - Number(m.birthday.slice(0, 4));
      out.push({kind: "cumple", icon: "🎂", title: `Cumpleaños de ${m.name}` + (years > 0 && years < 120 ? ` (${years})` : ""), who: [m.id]});
    }
  }
  for (const c of list("cuentas")) {
    if (Number(k.slice(8)) === dueDay(c, k)) {
      const paid = !!c.pagado?.[k.slice(0, 7)];
      out.push({kind: "cuenta", icon: c.emoji || "🧾", title: `Vence ${c.nombre}`, sub: fmtMoney(c.monto) + (paid ? " · pagada ✓" : ""), done: paid, ref: c});
    }
  }
  for (const p of list("mascotas")) {
    for (const v of p.vacunas || []) {
      if (v.proxima === k) out.push({kind: "vacuna", icon: "💉", title: `${p.nombre}: ${v.nombre}`, ref: p});
    }
  }
  for (const p of list("planes")) {
    if (p.fecha === k) out.push({kind: "plan", icon: "🎉", time: p.hora || "", title: p.titulo, sub: p.lugar || "", ref: p});
  }
  for (const c of list("colegio")) {
    if (c.fecha === k && !c.hecho) {
      const icon = {prueba: "📚", materiales: "✂️", recordatorio: "📌"}[c.tipo] || "📝";
      out.push({kind: "colegio", icon, title: `${nameOf(c.para)}: ${c.titulo}`, sub: c.asignatura || "", who: [c.para], ref: c});
    }
  }
  for (const p of list("pedidos")) {
    if (p.fecha === k && p.estado !== "recibido") {
      out.push({kind: "pedido", icon: "📦", title: `Llega: ${p.descripcion || p.tienda}`, sub: [p.tienda, rango(p)].filter(Boolean).join(" · "), ref: p});
    }
  }
  return out.sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
}

export const rango = (p) => (p.desde && p.hasta ? `${p.desde}–${p.hasta}` : p.desde ? `desde ${p.desde}` : p.hasta ? `hasta ${p.hasta}` : "");

// Próximos n días (desde hoy) con algo agendado.
export function agenda(days = 7, from = new Date()) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const k = dayKey(addDays(from, i));
    const items = itemsOn(k);
    if (items.length) out.push({k, items});
  }
  return out;
}

export const TIPOS = {
  familia: {icon: "👨‍👩‍👧", label: "Familia"},
  colegio: {icon: "🎒", label: "Colegio"},
  salud: {icon: "🩺", label: "Salud"},
  trabajo: {icon: "💼", label: "Trabajo"},
  deporte: {icon: "⚽", label: "Deporte"},
  otro: {icon: "📌", label: "Otro"},
};

// ---------- tareas con turnos ----------

function mondayOf(d) {
  const x = parseDay(dayKey(d));
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function periodKey(t, d = new Date()) {
  return t.frecuencia === "semanal" ? "s" + dayKey(mondayOf(d)) : dayKey(d);
}

// A quién le toca la tarea en la fecha d. Los turnos avanzan solos cada
// día (o semana) desde la fecha de inicio, en el orden de la rotación.
export function turnoDe(t, d = new Date()) {
  const rot = (t.rotacion || []).filter((u) => members().some((m) => m.id === u));
  if (!rot.length) return null;
  const n = t.frecuencia === "semanal"
    ? Math.round((mondayOf(d) - mondayOf(parseDay(t.inicio || dayKey()))) / (7 * 864e5))
    : diffDays(d, parseDay(t.inicio || dayKey()));
  return rot[((n % rot.length) + rot.length) % rot.length];
}

export const tareaHecha = (t, d = new Date()) => t.hechas?.[periodKey(t, d)] || null;

export function proximosTurnos(t, count = 4) {
  const step = t.frecuencia === "semanal" ? 7 : 1;
  const out = [];
  for (let i = 1; i <= count; i++) out.push({d: addDays(new Date(), i * step), uid: turnoDe(t, addDays(new Date(), i * step))});
  return out;
}

// ---------- cuentas ----------

export function estadoCuenta(c, now = new Date()) {
  const mk = monthKey(now);
  const pago = c.pagado?.[mk];
  if (pago) return {paid: true, label: "Pagada", cls: "ok", pago};
  const due = new Date(now.getFullYear(), now.getMonth(), dueDay(c, dayKey(now)));
  const dd = diffDays(due, now);
  if (dd < 0) return {paid: false, label: `Vencida hace ${-dd} día${dd === -1 ? "" : "s"}`, cls: "bad", dd};
  if (dd === 0) return {paid: false, label: "Vence hoy", cls: "bad", dd};
  if (dd <= 3) return {paid: false, label: `Vence en ${dd} día${dd === 1 ? "" : "s"}`, cls: "warn", dd};
  return {paid: false, label: `Vence el ${pad(due.getDate())}`, cls: "", dd};
}

// ---------- salidas ----------

export const enCamino = () => list("salidas").filter((s) => s.estado === "en_camino");
export const atrasadas = () => enCamino().filter((s) => s.esperaAt && s.esperaAt < Date.now());
export const miSalida = () => enCamino().find((s) => s.quien === S.user?.uid);
export const salidaDe = (uid) => enCamino().find((s) => s.quien === uid);

export const sosActivos = () => list("sos").filter((s) => !s.resuelto);

// ---------- pregunta del día ----------

export const PREGUNTAS = [
  "¿Cuál es tu recuerdo favorito de esta familia?",
  "Si pudiéramos viajar todos juntos a cualquier parte, ¿adónde iríamos?",
  "¿Qué comida te recuerda a tu infancia?",
  "¿Qué fue lo mejor que te pasó esta semana?",
  "¿Qué superpoder elegirías y para qué lo usarías?",
  "¿Qué canción pondrías en un viaje largo en auto?",
  "¿Qué es algo que te gustaría aprender este año?",
  "¿Quién de la familia te hizo reír última vez y por qué?",
  "Si fueras un animal, ¿cuál serías?",
  "¿Cuál es la película que podrías ver mil veces?",
  "¿Qué te gustaría que hiciéramos más seguido en familia?",
  "¿Qué es lo que más te gusta de la casa?",
  "Si tuvieras un día libre sin obligaciones, ¿qué harías?",
  "¿Qué consejo le darías a tu yo de hace 5 años?",
  "¿Cuál es tu tradición familiar favorita?",
  "¿Qué plato te sale mejor (o te gustaría aprender a cocinar)?",
  "¿Qué te pone de buen humor al tiro?",
  "¿Qué lugar de Chile te gustaría conocer?",
  "¿Cuál fue tu juguete favorito de chico/a?",
  "Si escribieran un libro sobre ti, ¿cómo se llamaría?",
  "¿De qué estás orgulloso/a últimamente?",
  "¿Cuál es el mejor regalo que has recibido?",
  "¿Qué invento cambiarías o mejorarías?",
  "¿Qué te gustaría agradecerle hoy a alguien de la familia?",
  "¿Cuál es tu estación del año favorita y por qué?",
  "¿Qué harías si te ganaras la lotería?",
  "¿Cuál es tu palabra o dicho favorito?",
  "¿Qué es algo que te da miedo pero te gustaría intentar?",
  "¿Cuál ha sido el mejor cumpleaños de tu vida?",
  "¿Qué personaje famoso invitarías a almorzar con nosotros?",
  "¿Qué es lo más rico que has comido en un viaje?",
  "¿Qué app o juego te tiene enganchado/a ahora?",
  "¿Qué hábito te gustaría mejorar?",
  "¿Qué te gustaría que la familia supiera de ti que quizás no sabe?",
  "¿Cuál es tu programa o serie favorita de este momento?",
  "Si pudieras cambiar una regla de la casa, ¿cuál sería?",
  "¿Qué deporte te gustaría practicar?",
  "¿Cuál es el mejor chiste que te sabes?",
  "¿Qué te gustaría estar haciendo en 10 años?",
  "¿Qué cosa simple te hace feliz?",
  "¿Cuál es tu once ideal?",
  "¿A qué época de la historia viajarías?",
  "¿Qué fue lo más difícil que te tocó esta semana y cómo lo enfrentaste?",
  "¿Qué es lo que más admiras de alguien de esta familia?",
];

export function preguntaDe(k = dayKey()) {
  const d = parseDay(k);
  const start = new Date(d.getFullYear(), 0, 0);
  const doy = Math.floor((d - start) / 864e5);
  return PREGUNTAS[(doy + d.getFullYear()) % PREGUNTAS.length];
}

export const respuestasDe = (k = dayKey()) => list("respuestas").filter((r) => r.fecha === k);
export const miRespuesta = (k = dayKey()) => respuestasDe(k).find((r) => r.by === S.user?.uid);

export const MOODS = [
  ["😄", "Feliz"], ["🙂", "Bien"], ["😐", "Más o menos"], ["😴", "Cansado/a"],
  ["😔", "Bajoneado/a"], ["😢", "Triste"], ["😠", "Enojado/a"], ["🤒", "Enfermo/a"],
];

export const nombres = (uids) => uids.map(nameOf).join(", ");
