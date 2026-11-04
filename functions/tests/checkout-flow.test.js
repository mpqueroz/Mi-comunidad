"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");
const {applyVerifiedRenewal} = require("../licencias");

const {harness}=require("./checkout-harness.cjs");

test("Checkout fija el monto en servidor y activa con pago sin preference_id", async () => {
  const h = harness();
  await h.create();
  assert.equal(h.state.preference.items[0].unit_price, 1000);
  assert.equal(h.order().months, 12);
  assert.equal(h.state.payment.preference_id, undefined);
  assert.equal((await h.webhook()).code, 200);
  assert.equal(h.order().status, "paid");
  assert.equal(h.license().estado, "active");
  assert.ok(h.license().paidUntil > new Date());
  assert.ok(h.state.calls.includes("/merchant_orders/55"));
});

test("avisos duplicados concurrentes no duplican el año contratado", async () => {
  const h = harness(); await h.create();
  await Promise.all([h.webhook(), h.webhook()]);
  const until = h.license().paidUntil.getTime();
  await Promise.all([h.webhook(), h.webhook()]);
  assert.equal(h.license().paidUntil.getTime(), until);
});

test("monto, moneda, modo o preferencia ajenos no activan licencia", async () => {
  for (const change of [{transaction_amount: 1}, {currency_id: "USD"}, {live_mode: true}]) {
    const h = harness(); await h.create(); Object.assign(h.state.payment, change);
    await h.webhook(); assert.equal(h.order().status, "checkout_ready");
    assert.equal(h.license().estado, "trial");
  }
  const h = harness(); await h.create(); h.state.merchant.preference_id = "otra";
  await h.webhook(); assert.equal(h.license().estado, "trial");
});

test("orden comercial incoherente requiere reintento y no activa", async () => {
  for (const change of [{id: 56}, {external_reference: "ajena"}, {payments: []}, {preference_id: ""}]) {
    const h = harness(); await h.create(); Object.assign(h.state.merchant, change);
    assert.equal((await h.webhook()).code, 500);
    assert.equal(h.license().estado, "trial");
  }
});

test("pago pendiente o rechazado no consulta orden comercial ni activa", async () => {
  for (const status of ["pending", "rejected"]) {
    const h = harness(); await h.create(); h.state.payment.status = status;
    assert.equal((await h.webhook()).code, 200);
    assert.equal(h.license().estado, "trial");
    assert.equal(h.state.calls.includes("/merchant_orders/55"), false);
  }
});

test("firma inválida se rechaza antes de consultar el pago", async () => {
  const h = harness(); await h.create(); const calls = h.state.calls.length;
  assert.equal((await h.webhook(false)).code, 401);
  assert.equal(h.state.calls.length, calls);
  assert.equal(h.license().estado, "trial");
});

test("reembolso posterior verifica orden comercial y suspende último pago", async () => {
  const h = harness(); await h.create(); await h.webhook();
  h.state.payment.status = "refunded";
  assert.equal((await h.webhook()).code, 200);
  assert.equal(h.order().status, "payment_review");
  assert.equal(h.license().estado, "suspended");
});

test("pago sin orden comercial no se habilita aunque declare preference_id", async () => {
  const h = harness(); await h.create(); h.state.payment.order = undefined;
  h.state.payment.preference_id = "pref-1";
  assert.equal((await h.webhook()).code, 500);
  assert.equal(h.license().estado, "trial");
});

test("Checkout con cuenta de prueba API live conserva validación del vendedor", async()=>{
  const h=harness();
  h.secrets.MC_MP_TEST_ACCOUNT=JSON.stringify({collectorId:"123",liveMode:true});
  h.state.payment.live_mode=true;
  await h.create();
  assert.equal(h.order().liveMode,true);
  assert.equal(h.order().collectorId,"123");
  assert.equal((await h.webhook()).code,200);
  assert.equal(h.license().estado,"active");
  const end=h.license().paidUntil.getTime();
  await h.webhook();
  assert.equal(h.license().paidUntil.getTime(),end);
});

test("un vendedor ajeno no genera una orden habilitada", async()=>{
  const h=harness();
  h.secrets.MC_MP_TEST_ACCOUNT=JSON.stringify({collectorId:"999",liveMode:true});
  await assert.rejects(h.create());
  assert.equal(h.order().status,"checkout_error");
  assert.equal(h.license().estado,"trial");
});

test("producción cobra 800000 CLP y aplica exactamente 12 meses", async()=>{
  const h=harness();
  h.secrets.MC_MP_ENVIRONMENT="production";
  delete h.docs.get("mi_comunidad_comunidades/test-edificio").mpTestFixture;
  h.secrets.MC_PLAN_ANUAL_CLP="800000";
  h.state.payment.transaction_amount=800000;
  h.state.payment.live_mode=true;
  await h.create();
  assert.equal(h.state.preference.items[0].unit_price,800000);
  assert.equal(h.order().months,12);
  await h.webhook();
  assert.equal(h.order().status,"paid");
  const until=h.license().paidUntil.getTime();
  await h.webhook();
  assert.equal(h.license().paidUntil.getTime(),until);
});

test("producción bloquea fixture antes de crear orden o preferencia", async()=>{
  const h=harness();
  h.secrets.MC_MP_ENVIRONMENT="production";
  h.secrets.MC_PLAN_ANUAL_CLP="800000";
  h.docs.get("mi_comunidad_comunidades/test-edificio").mpTestFixture=true;
  await assert.rejects(h.create(), /failed-precondition/);
  assert.equal(h.order(),undefined);
  assert.equal(h.state.calls.length,0);
});



test("configuración de prueba no cobra a una comunidad real", async()=>{
  const h=harness();
  delete h.docs.get("mi_comunidad_comunidades/test-edificio").mpTestFixture;
  await assert.rejects(h.create(), /failed-precondition/);
  assert.equal(h.order(),undefined);
  assert.equal(h.state.calls.length,0);
});

test("suspensión administrativa impide iniciar cobro", async () => {
  const h = harness(); h.docs.get("mi_comunidad_comunidades/test-edificio").estado = "Suspendida";
  await assert.rejects(h.create()); assert.equal(h.state.calls.length, 0);
});
test("pago iniciado antes de suspensión queda en revisión sin habilitar acceso", async () => {
  const h = harness(); await h.create();
  h.docs.get("mi_comunidad_comunidades/test-edificio").estado = "Suspendida";
  await h.webhook(); assert.equal(h.order().status, "payment_review");
  assert.equal(h.license().estado, "trial");
});
test("reembolso parcial aprobado suspende el último pago sin sumar vigencia", async () => {
  const h = harness(); await h.create(); await h.webhook();
  const until = h.license().paidUntil.getTime();
  h.state.payment.transaction_amount_refunded = 100;
  await h.webhook(); assert.equal(h.order().status, "payment_review");
  assert.equal(h.license().estado, "suspended");
  assert.equal(h.license().paidUntil.getTime(), until);
});
test("contracargo antiguo queda en revisión sin suspender una renovación posterior", async () => {
  const h = harness(); await h.create(); await h.webhook();
  h.license().lastPaymentId = "100"; h.state.payment.status = "charged_back";
  await h.webhook(); assert.equal(h.order().status, "payment_review");
  assert.equal(h.license().estado, "active");
});


test("conciliación detecta reembolso perdido de una orden pagada",async()=>{
 const h=harness();await h.create();await h.webhook();h.state.payment.status="refunded";
 await h.helpers.reconcilePayments(h.db,"ficticio",h.request);
 assert.equal(h.order().status,"payment_review");assert.equal(h.license().estado,"suspended");
});
test("cursor recorre 65 órdenes, tolera fallo intermedio y vuelve al inicio",async()=>{
 const h=harness(),seen=[];
 for(let i=0;i<65;i++){const id=String(i).padStart(20,"0");h.docs.set("mi_comunidad_ordenes_pago/"+id,{id,status:"checkout_ready"});}
 const request=async path=>{const id=new URL("https://example.invalid"+path).searchParams.get("external_reference");seen.push(id);if(id===String(12).padStart(20,"0"))throw Error("fallo simulado");return {results:[]};};
 for(let i=0;i<3;i++)await h.helpers.reconcilePayments(h.db,"ficticio",request);
 assert.equal(new Set(seen).size,65);assert.equal(h.docs.get("mi_comunidad_config_comercial/conciliacion").lastOrderId,String(64).padStart(20,"0"));
 await h.helpers.reconcilePayments(h.db,"ficticio",request);
 assert.equal(seen.filter(id=>id===String(12).padStart(20,"0")).length,2);
});

const factura = {tipo: "factura", correo: "contabilidad@example.test", rut: "76.123.456-0",
  razonSocial: "Comunidad de prueba", giro: "Administración", direccion: "Calle de prueba 123", comuna: "Peñalolén"};
test("datos tributarios inválidos no crean orden ni contactan Mercado Pago", async () => {
  for (const input of [null, {}, {tipo:"otro",correo:"a@b.cl"}, {tipo:"boleta",correo:"invalido"},
    {...factura,rut:"76.123.456-1"}, {...factura,giro:""}, {...factura,comuna:"x".repeat(101)},
    {...factura,razonSocial:"Nombre\nInyectado"}]) {
    const h = harness();
    await assert.rejects(h.create(input));
    assert.equal(h.order(), undefined);
    assert.equal(h.state.calls.length, 0);
  }
});
test("factura queda ligada a orden y conserva datos tras pago sin emitir un DTE", async () => {
  const h = harness(); await h.create({...factura, estado:"emitido", folio:"falso"});
  const d = h.order().documentoTributario;
  assert.equal(d.tipo,"factura"); assert.equal(d.rut,"76123456-0");
  assert.equal(d.estado,"no_emitido"); assert.equal(d.folio,undefined);
  assert.equal(d.modalidad,"manual_sii");
  assert.equal(h.state.preference.documentoTributario,undefined);
  await h.webhook();
  assert.equal(h.order().status,"paid");
  assert.equal(h.order().documentoTributario,d);
  assert.equal(d.estado,"no_emitido");
});
test("boleta guarda correo y descarta datos de factura y estados enviados por cliente", async () => {
  const h = harness(); await h.create({...factura,tipo:"boleta",correo:" comprador@example.test ",estado:"emitido"});
  assert.equal(h.order().documentoTributario.correo,"comprador@example.test");
  assert.equal(h.order().documentoTributario.rut,undefined);
  assert.equal(h.order().documentoTributario.estado,"no_emitido");
});
