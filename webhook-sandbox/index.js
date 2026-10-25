"use strict";
// Receptor de diagnóstico completamente aislado. Sin Firebase Admin, Firestore ni cobros.
const crypto = require("node:crypto");
const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const SECRET = defineSecret("MC_MP_WEBHOOK_SECRET");

function validate(headers, query, secret, now = Date.now()) {
  const sig = String(headers["x-signature"] || "");
  const rid = String(headers["x-request-id"] || "");
  const id = String(query["data.id"] || "");
  const ts = /(?:^|,)\s*ts=(\d+)\s*(?=,|$)/.exec(sig)?.[1];
  const v1 = /(?:^|,)\s*v1=([a-f0-9]{64})\s*(?=,|$)/i.exec(sig)?.[1];
  if (!rid || !/^\d{1,20}$/.test(id) || !ts || !v1 || !secret) return "invalid_headers";
  // MP's simulator can replay historical timestamps; signature still must match.
  const manifest = `id:${id.toLowerCase()};request-id:${rid};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(v1, "hex"))) return "invalid_hmac";
  const skew = Math.abs(now - Number(ts) * 1000);
  if (!Number.isFinite(skew) || skew > 10 * 60 * 1000) return "stale_timestamp";
  return "valid";
}

exports.webhookMercadoPagoNodarSandbox = onRequest({
  secrets:[SECRET],invoker:"public",maxInstances:1,concurrency:1,
  timeoutSeconds:15,memory:"256MiB"
},(req,res)=>{
  res.set("Cache-Control","no-store");
  if(req.method!=="POST")return res.status(405).send("Method not allowed");
  const result=validate(req.headers,req.query,SECRET.value());
  if(result!=="valid"){
    console.warn("Sandbox MP validation", {reason:result});
    return res.status(401).send("Invalid signature");
  }
  if(req.body?.type!=="payment" || String(req.body?.data?.id)!==String(req.query["data.id"])){
    return res.status(200).send("Ignored");
  }
  console.info("Sandbox MP signature verified");
  return res.status(200).send("OK");
});
module.exports.validate=validate;
