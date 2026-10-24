"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const {createTrial, evaluateLicense, TRIAL_DAYS} = require("../licencias");

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
