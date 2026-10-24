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

module.exports = {TRIAL_DAYS, STATES, createTrial, evaluateLicense};
