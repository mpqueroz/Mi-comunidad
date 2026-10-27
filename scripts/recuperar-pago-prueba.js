"use strict";
// Recuperación limitada a la compra técnica aprobada del 25/10/2026.
// API de Mercado Pago como fuente; nunca comprobantes ni datos del navegador.
const {execFileSync} = require("node:child_process");
const {applyVerifiedRenewal} = require("../functions/licencias");
const PROJECT = "mercado-ciudadano";
const COMMUNITY = "nodar-pagos-prueba-20261025";
const ORDER = "bMD6LqqClo6nUQ2VETv3";
const PAYMENT = "186051318596";
const ACCOUNT = Object.freeze({collectorId:"3791682940", liveMode:true});

function planRecovery(community, order, license, payment, verifyPayment) {
  if (community.mpTestFixture !== true || order.id !== ORDER || order.comunidadId !== COMMUNITY ||
      order.adminUid !== "nodar-mp-prueba-20261025" || order.amount !== 1000 ||
      order.currency !== "CLP" || order.months !== 12 ||
      String(payment.collector_id) !== ACCOUNT.collectorId || payment.live_mode !== ACCOUNT.liveMode) {
    throw new Error("Datos distintos a la compra técnica autorizada; no se modifica nada");
  }
  const corrected = {...order, collectorId:ACCOUNT.collectorId, liveMode:ACCOUNT.liveMode};
  if (!verifyPayment(payment, corrected, PAYMENT)) throw new Error("El pago no supera la verificación completa");
  if (order.status === "paid") {
    if (String(order.paymentId) !== PAYMENT || String(license.lastPaymentId) !== PAYMENT || license.estado !== "active") {
      throw new Error("Pago aplicado con estado inconsistente; requiere revisión");
    }
    return null;
  }
  if (order.status !== "checkout_ready" || license.lastPaymentId) throw new Error("Orden o licencia fuera del estado esperado");
  const renewed = applyVerifiedRenewal(license, {months:12});
  const now = new Date();
  return {
    order:{collectorId:ACCOUNT.collectorId, liveMode:ACCOUNT.liveMode, environment:"test", status:"paid",
      paymentId:PAYMENT, paidAt:now, testModeCorrectedAt:now},
    license:{estado:renewed.estado, paidUntil:renewed.paidUntil, lastPaymentId:PAYMENT, updatedAt:now},
  };
}
function decode(fields) {
  return Object.fromEntries(Object.entries(fields || {}).map(([k,v]) => [k,
    "stringValue" in v ? v.stringValue : "booleanValue" in v ? v.booleanValue :
    "integerValue" in v ? Number(v.integerValue) : "doubleValue" in v ? v.doubleValue :
    "timestampValue" in v ? new Date(v.timestampValue) : null]));
}
function encode(data) {
  return Object.fromEntries(Object.entries(data).map(([k,v])=>[k,
    v instanceof Date ? {timestampValue:v.toISOString()} : typeof v === "boolean" ? {booleanValue:v} :
    {stringValue:String(v)}]));
}
async function main(mode) {
  const run = (...args) => execFileSync("gcloud", args, {encoding:"utf8"}).trim();
  const secret = name => run("secrets","versions","access","latest","--secret="+name,"--project="+PROJECT);
  if (secret("MC_MP_ENVIRONMENT") !== "test") throw new Error("Solo se permite entorno test");
  const token = secret("MC_MP_ACCESS_TOKEN");
  const {fetchCheckoutPayment, verifyPayment} = require("../functions/mercadopago");
  const mp = async path => {
    const r = await fetch("https://api.mercadopago.com"+path, {
      headers:{Authorization:"Bearer "+token},signal:AbortSignal.timeout(20000)});
    if (!r.ok) throw new Error("Consulta Mercado Pago: HTTP "+r.status);
    return r.json();
  };
  const payment = await fetchCheckoutPayment(PAYMENT, token, mp);
  const oauth = run("auth","print-access-token");
  const root = "projects/"+PROJECT+"/databases/(default)/documents";
  const api = async (path, body) => {
    const r = await fetch("https://firestore.googleapis.com/v1/"+path, {
      method:body?"POST":"GET", headers:{Authorization:"Bearer "+oauth,"Content-Type":"application/json"},
      ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
    if (!r.ok) throw new Error("Consulta Firestore: HTTP "+r.status);
    return r.json();
  };
  const c = await api(root+"/mi_comunidad_comunidades/"+COMMUNITY);
  const o = await api(root+"/mi_comunidad_ordenes_pago/"+ORDER);
  const l = await api(root+"/mi_comunidad_licencias/"+COMMUNITY);
  const plan = planRecovery(decode(c.fields),decode(o.fields),decode(l.fields),payment,verifyPayment);
  console.log("Pago aprobado, vendedor de prueba, monto y orden verificados con la API.");
  if (mode === "--prepare") {
    let account;
    try {account=JSON.parse(secret("MC_MP_TEST_ACCOUNT"));} catch(error) {
      // Si ya existe pero no puede leerse, no crear ni alterar a ciegas.
      let exists=true;
      try {run("secrets","describe","MC_MP_TEST_ACCOUNT","--project="+PROJECT);} catch {exists=false;}
      if (exists) throw new Error("No se pudo validar la configuración existente de la cuenta de prueba");
      execFileSync("gcloud",["secrets","create","MC_MP_TEST_ACCOUNT","--project="+PROJECT,
        "--replication-policy=automatic","--data-file=-"],{input:JSON.stringify(ACCOUNT),stdio:["pipe","inherit","inherit"]});
      account=ACCOUNT;
    }
    if (String(account.collectorId)!==ACCOUNT.collectorId || account.liveMode!==ACCOUNT.liveMode) throw new Error("Cuenta de prueba configurada diferente; no se altera");
    console.log("Identidad del vendedor de prueba configurada. Licencia aún sin modificar.");
    return;
  }
  if (mode !== "--apply") {console.log("Verificación completada; no se modificó nada.");return;}
  const account=JSON.parse(secret("MC_MP_TEST_ACCOUNT"));
  if (String(account.collectorId)!==ACCOUNT.collectorId || account.liveMode!==ACCOUNT.liveMode) throw new Error("Cuenta de prueba no coincide");
  if (!plan) {console.log("Este pago ya está aplicado. No se agregaron más meses.");return;}
  const writes=[{update:{name:c.name,fields:{mpTestFixture:{booleanValue:true}}},
    updateMask:{fieldPaths:["mpTestFixture"]},currentDocument:{updateTime:c.updateTime}},
    ...[[o,plan.order],[l,plan.license]].map(([doc,data])=>({
      update:{name:doc.name,fields:encode(data)},updateMask:{fieldPaths:Object.keys(data)},
      currentDocument:{updateTime:doc.updateTime},
    }))];
  await api(root+":commit",{writes});
  console.log("LICENCIA ACTIVADA: 12 meses. Pago "+PAYMENT+" aplicado una sola vez.");
  console.log("Vigencia pagada: "+plan.license.paidUntil.toISOString());
}
module.exports={planRecovery,decode,encode};
if(require.main===module)main(process.argv[2]).catch(e=>{console.error(e.message);process.exitCode=1;});
