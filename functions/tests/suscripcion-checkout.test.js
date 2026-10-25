"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("el panel permite Checkout oficial y bloquea direcciones ajenas", async () => {
  for (const [url, valid] of [
    ["https://www.mercadopago.cl/checkout/v1/redirect?pref_id=1", true],
    ["https://www.mercadopago.com/checkout/v1/redirect?pref_id=1", true],
    ["https://mercadopago.cl.ejemplo.com/checkout", false],
    ["https://falsomercadopago.cl/checkout", false],
    ["http://www.mercadopago.cl/checkout", false],
    ["javascript:alert(1)", false],
  ]) {
    let click, assigned;
    const button = {addEventListener: (_, fn) => {click = fn;}}, status = {};
    const container = {querySelector: id => id === "#mc-pagar-licencia" ? button : status};
    const context = {Date, Intl, URL, console: {error() {}}, window: {location: {assign: v => {assigned = v;}}}};
    vm.runInNewContext(fs.readFileSync(require.resolve("../../public/suscripcion.js"), "utf8"), context);
    await context.window.MiComunidadSuscripcion.mostrar(container, {
      httpsCallable: name => async () => ({data: name === "crearCheckoutMiComunidad" ?
        {checkoutUrl: url} : {estado: "trial", trialEndsAt: "2026-11-01T00:00:00Z"}}),
    }, "test-edificio");
    await click();
    assert.equal(assigned === url, valid, url);
  }
});
