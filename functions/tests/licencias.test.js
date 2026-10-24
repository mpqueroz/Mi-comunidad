"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const {createTrial, evaluateLicense, canReadLicense, applyVerifiedRenewal, TRIAL_DAYS} = require("../licencias");

test("prueba dura exactamente siete días", () => {
  const start = new Date("2026-10-24T12:00:00Z");
  const trial = createTrial(start);
  assert.equal(TRIAL_DAYS, 7);
  assert.equal(trial.trialEndsAt.toISOString(), "2026-10-31T12:00:00.000Z");
  assert.equal(evaluateLicense(trial, new Date("2026-10-31T11:59:59Z")).allowed, true);
  assert.equal(evaluateLicense(trial, new Date("2026-10-31T12:00:00Z")).allowed, false);
});

test("licencia pagada prevalece sobre prueba vencida", () => {
  const license = {...createTrial(new Date("2026-01-01T00:00:00Z")), estado: "active", paidUntil: new Date("2026-11-01T00:00:00Z")};
  assert.equal(evaluateLicense(license, new Date("2026-10-24T00:00:00Z")).reason, "paid");
});

test("suspensión administrativa prevalece sobre pago", () => {
  const license = {...createTrial(), estado: "suspended", paidUntil: new Date("2030-01-01T00:00:00Z")};
  assert.equal(evaluateLicense(license).allowed, false);
});

test("sin licencia no se autoriza acceso comercial", () => {
  assert.equal(evaluateLicense(null).allowed, false);
});

test("superadmin puede consultar licencias de distintas comunidades", () => {
  assert.equal(canReadLicense({app: "mi_comunidad", role: "superadmin"}, "edificio-1"), true);
});

test("administrador solo consulta licencia de su comunidad", () => {
  const token = {app: "mi_comunidad", role: "admin", comunidadId: "edificio-1"};
  assert.equal(canReadLicense(token, "edificio-1"), true);
  assert.equal(canReadLicense(token, "edificio-2"), false);
});

test("residentes, conserjes y tokens ajenos no consultan licencias", () => {
  for (const role of ["residente", "conserje"]) {
    assert.equal(canReadLicense({app: "mi_comunidad", role, comunidadId: "edificio-1"}, "edificio-1"), false);
  }
  assert.equal(canReadLicense({app: "otra_app", role: "superadmin"}, "edificio-1"), false);
  assert.equal(canReadLicense(null, "edificio-1"), false);
});

test("identificadores de comunidad inválidos son rechazados", () => {
  assert.equal(canReadLicense({app: "mi_comunidad", role: "superadmin"}, "../otro"), false);
});

test("renovación anticipada conserva días ya pagados", () => {
  const license = {estado: "active", paidUntil: new Date("2026-12-15T00:00:00Z")};
  const result = applyVerifiedRenewal(license, {now: new Date("2026-10-24T00:00:00Z"), months: 12});
  assert.equal(result.paidUntil.toISOString(), "2027-12-15T00:00:00.000Z");
});

test("renovación vencida comienza desde el nuevo pago", () => {
  const license = {estado: "expired", paidUntil: new Date("2026-09-01T00:00:00Z")};
  const result = applyVerifiedRenewal(license, {now: new Date("2026-10-24T00:00:00Z"), months: 12});
  assert.equal(result.paidUntil.toISOString(), "2027-10-24T00:00:00.000Z");
});

test("renovación al fin de mes ajusta fecha correctamente", () => {
  const result = applyVerifiedRenewal({estado: "trial"}, {
    now: new Date("2026-01-31T10:00:00Z"), months: 1,
  });
  assert.equal(result.paidUntil.toISOString(), "2026-02-28T10:00:00.000Z");
});

test("no se renueva automáticamente una comunidad suspendida", () => {
  assert.throws(() => applyVerifiedRenewal({estado: "suspended"}, {months: 12}));
});

test("no se aceptan períodos comerciales arbitrarios", () => {
  assert.throws(() => applyVerifiedRenewal({estado: "trial"}, {months: 0}));
  assert.throws(() => applyVerifiedRenewal({estado: "trial"}, {months: 120}));
});


test("el primer pago durante la prueba activa doce meses desde el cobro", () => {
  const now = new Date("2026-10-26T12:00:00Z");
  const license = createTrial(new Date("2026-10-24T12:00:00Z"));
  const result = applyVerifiedRenewal(license, {now, months: 12});
  assert.equal(result.estado, "active");
  assert.equal(result.paidUntil.toISOString(), "2027-10-26T12:00:00.000Z");
  assert.equal(evaluateLicense(result, new Date("2027-10-26T12:00:00Z")).allowed, false);
});

test("dos renovaciones anticipadas acumulan los doce meses sin perder saldo", () => {
  const now = new Date("2026-10-24T00:00:00Z");
  const first = applyVerifiedRenewal({estado: "trial"}, {now, months: 12});
  const second = applyVerifiedRenewal(first, {now: new Date("2026-11-24T00:00:00Z"), months: 12});
  assert.equal(second.paidUntil.toISOString(), "2028-10-24T00:00:00.000Z");
});

test("licencia vencida y suspensión bloquean acceso incluso con fechas futuras", () => {
  const now = new Date("2026-10-24T12:00:00Z");
  assert.equal(evaluateLicense({estado: "expired", paidUntil: new Date("2030-01-01T00:00:00Z")}, now).allowed, false);
  assert.equal(evaluateLicense({estado: "suspended", trialEndsAt: new Date("2030-01-01T00:00:00Z")}, now).allowed, false);
});
