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
    let click, assigned, received;
    const button = {addEventListener: (_, fn) => {click = fn;}}, status = {};
    const form = {elements: Object.fromEntries(["tipo", "correo", "rut", "razonSocial", "giro", "direccion", "comuna"].map(name => [name, {value: name === "tipo" ? "boleta" : name === "correo" ? "comprador@example.test" : "", addEventListener() {}}])),
      reportValidity: () => true, addEventListener: (_, fn) => {click = fn;}};
    const container = {querySelector: id => id === "#mc-datos-tributarios" ? form : id === "#mc-pagar-licencia" ? button : id === "#mc-actualizar-licencia" ? {addEventListener() {}} : status};
    const context = {Date, Intl, URL, console: {error() {}}, window: {location: {assign: v => {assigned = v;}}}};
    vm.runInNewContext(fs.readFileSync(require.resolve("../../public/suscripcion.js"), "utf8"), context);
    await context.window.MiComunidadSuscripcion.mostrar(container, {
      httpsCallable: name => async data => {if (name === "crearCheckoutMiComunidad") received = data; return ({data: name === "crearCheckoutMiComunidad" ?
        {checkoutUrl: url} : {estado: "trial", trialEndsAt: "2026-11-01T00:00:00Z"}});},
    }, "test-edificio");
    await click({preventDefault() {}});
    assert.equal(received.documentoTributario.tipo, "boleta");
    assert.equal(received.documentoTributario.correo, "comprador@example.test");
    assert.equal(assigned === url, valid, url);
  }
});

test("sin licencia o suspendida no ofrece iniciar un cobro", () => {
  const context = {Date, Intl, window: {}};
  vm.runInNewContext(fs.readFileSync(require.resolve("../../public/suscripcion.js"), "utf8"), context);
  for (const estado of ["sin_licencia", "suspended"]) {
    const html = context.window.MiComunidadSuscripcion.htmlLicencia({estado, acceso:false});
    assert.equal(html.includes('id="mc-pagar-licencia"'), false);
    assert.equal(html.includes("$800.000"), true);
    assert.equal(html.includes("Sin fecha"), false);
  }
});

test("factura exige sus campos y boleta los omite al enviar", async () => {
  const ctx = {Date, Intl, URL, console: {error() {}}, window: {}};
  vm.runInNewContext(fs.readFileSync(require.resolve("../../public/suscripcion.js"),"utf8"),ctx);
  let submit, change, payload;
  const factura = {hidden:true}, button = {disabled:false}, status = {};
  const fields = Object.fromEntries(Object.entries({tipo:"factura",correo:"c@example.test",rut:"76123456-0",razonSocial:"Comunidad",giro:"Administración",direccion:"Calle 123",comuna:"Peñalolén"}).map(([name,value])=>[name,{value,addEventListener:(_,fn)=>{change=fn;}}]));
  let valid = false;
  const form = {elements:fields,reportValidity:()=>valid,addEventListener:(_,fn)=>{submit=fn;}};
  const container = {querySelector:id=>({"#mc-datos-tributarios":form,"#mc-pagar-licencia":button,"#mc-datos-factura":factura,"#mc-estado-pago":status,"#mc-actualizar-licencia":{addEventListener(){}}})[id]};
  await ctx.window.MiComunidadSuscripcion.mostrar(container,{httpsCallable:name=>async data=>{
    if(name==="crearCheckoutMiComunidad"){payload=data;throw {code:"functions/invalid-argument"};}
    return {data:{estado:"trial"}};
  }},"test");
  change(); assert.equal(factura.hidden,false); assert.equal(fields.rut.required,true);
  await submit({preventDefault(){}}); assert.equal(payload,undefined);
  valid=true; await submit({preventDefault(){}});
  assert.equal(payload.documentoTributario.rut,"76123456-0");
  assert.match(status.textContent,/dígito verificador/);
  fields.tipo.value="boleta"; change();
  assert.equal(factura.hidden,true);assert.equal(fields.rut.disabled,true);assert.equal(fields.rut.required,false);
  await submit({preventDefault(){}});assert.equal(payload.documentoTributario.rut,undefined);
});
