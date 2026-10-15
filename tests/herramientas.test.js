'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const {once} = require('node:events');
const {createRequire} = require('node:module');
const cliRequire = createRequire(require.resolve('firebase-tools/package.json'));

test('herramientas: watcher del CLI detecta cambios y respeta exclusiones por expresión', {timeout:10000}, async()=>{
  const chokidar = cliRequire('chokidar');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mc-watcher-'));
  const rules = path.join(dir, 'firestore.rules');
  await fs.writeFile(rules, 'reglas iniciales');
  const watcher = chokidar.watch(dir, {ignoreInitial:true, ignored:/\.log$/, persistent:true});
  try {
    await once(watcher, 'ready');
    const changes = [];
    watcher.on('all', (event,file)=>changes.push({event,file}));
    const changed = once(watcher, 'change');
    await fs.writeFile(rules, 'reglas actualizadas');
    assert.equal((await changed)[0], rules);
    await fs.writeFile(path.join(dir,'ignorado.log'), 'no recargar');
    await new Promise(resolve=>setTimeout(resolve,200));
    assert.ok(changes.some(change=>change.file===rules));
    assert.ok(changes.every(change=>!change.file.endsWith('.log')));
  } finally {
    await watcher.close();
    await fs.rm(dir,{recursive:true,force:true});
  }
});

test('herramientas: cliente HTTP del CLI conserva envíos multipart con UUID actualizado', {timeout:10000}, async()=>{
  let received;
  const server = http.createServer(async(req,res)=>{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    received={type:req.headers['content-type'],body:Buffer.concat(chunks).toString()};
    res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  try {
    const {Gaxios} = cliRequire('gaxios');
    const result=await new Gaxios().request({url:`http://127.0.0.1:${server.address().port}/upload`,method:'POST',
      multipart:[{headers:{'Content-Type':'text/plain'},content:'datos ficticios'}],
      noProxy:['127.0.0.1'],retry:false,timeout:5000,responseType:'json'});
    assert.equal(result.status,200);assert.equal(result.data.ok,true);
    assert.match(received.type,/^multipart\/related; boundary=[a-f0-9-]+$/);
    const boundary=received.type.split('boundary=')[1];
    assert.ok(received.body.includes(`--${boundary}`));assert.ok(received.body.includes('datos ficticios'));
  } finally {await new Promise(resolve=>server.close(resolve));}
});

test('herramientas: PubSub conserva propagación W3C con OpenTelemetry actualizado',()=>{
  const pubsubRequire=createRequire(cliRequire.resolve('@google-cloud/pubsub/package.json'));
  const telemetry=pubsubRequire('./build/src/telemetry-tracing.js');
  const {TraceFlags}=pubsubRequire('@opentelemetry/api');
  const spanContext={traceId:'1'.repeat(32),spanId:'2'.repeat(16),traceFlags:TraceFlags.SAMPLED};
  const message={attributes:{}};
  telemetry.setGloballyEnabled(true);
  try {
    telemetry.injectSpan({spanContext:()=>spanContext},message);
    assert.equal(message.attributes.googclient_traceparent,`00-${spanContext.traceId}-${spanContext.spanId}-01`);
    delete message.parentSpan;
    assert.equal(telemetry.containsSpanContext(message),true);
    const span=telemetry.extractSpan(message,'projects/demo-mi-comunidad/subscriptions/prueba');
    assert.equal(span.spanContext().traceId,spanContext.traceId);span.end();
  } finally {telemetry.setGloballyEnabled(false);}
});
