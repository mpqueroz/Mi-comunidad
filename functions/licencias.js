"use strict";

// Estados comerciales independientes de la suspensión administrativa.
// Este módulo no realiza escrituras ni modifica las reglas de Firestore.
const TRIAL_DAYS = 7;
const STATES = Object.freeze({
  TRIAL: "trial",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  EXPIRED: "expired",
  SUSPENDED: "suspended",
});

function validDate(value) {
  if (!value) return null;
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function createTrial(now = new Date()) {
  const start = validDate(now);
  if (!start) throw new TypeError("Fecha inicial inválida");
  return {
    estado: STATES.TRIAL,
    trialStartedAt: start,
    trialEndsAt: new Date(start.getTime() + TRIAL_DAYS * 86400000),
    paidUntil: null,
  };
}

function evaluateLicense(license, now = new Date()) {
  const current = validDate(now);
  if (!current) throw new TypeError("Fecha actual inválida");
  if (!license) return {allowed: false, reason: "missing"};
  if (license.estado === STATES.SUSPENDED) return {allowed: false, reason: "suspended"};
  const paidUntil = validDate(license.paidUntil);
  if ((license.estado === STATES.ACTIVE || license.estado === STATES.PAST_DUE) && paidUntil && current < paidUntil) {
    return {allowed: true, reason: "paid"};
  }
  const trialEndsAt = validDate(license.trialEndsAt);
  if (license.estado === STATES.TRIAL && trialEndsAt && current < trialEndsAt) {
    return {allowed: true, reason: "trial"};
  }
  return {allowed: false, reason: "expired"};
}

function canReadLicense(token, comunidadId) {
  if (!token || token.app !== "mi_comunidad" || typeof comunidadId !== "string" ||
      !/^[a-z0-9-]+$/.test(comunidadId)) return false;
  return token.role === "superadmin" ||
    (token.role === "admin" && token.comunidadId === comunidadId);
}

// Solo debe llamarse desde un proceso de pago verificado en el servidor.
// Nunca aceptar estado "pagado" enviado directamente por el navegador.
function applyVerifiedRenewal(license, options) {
  const opts = options || {};
  const now = validDate(opts.now || new Date());
  const months = opts.months;
  if (!license || !now || !Number.isInteger(months) || months < 1 || months > 24) {
    throw new TypeError("Datos de renovación inválidos");
  }
  if (license.estado === STATES.SUSPENDED) {
    throw new Error("Una suspensión administrativa requiere revisión manual");
  }
  const previousEnd = validDate(license.paidUntil);
  const base = previousEnd && previousEnd > now ? previousEnd : now;
  const next = new Date(base.getTime());
  const originalDay = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(originalDay, lastDay));
  return {...license, estado: STATES.ACTIVE, paidUntil: next};
}

module.exports = {TRIAL_DAYS, STATES, createTrial, evaluateLicense, canReadLicense, applyVerifiedRenewal};
