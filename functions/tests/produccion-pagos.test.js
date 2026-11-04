"use strict";
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {harness}=require('./checkout-harness.cjs');
const path='mi_comunidad_ordenes_pago/order000000000000001';
const oldest=()=>new Date(Date.now()-20*60000);

test('administrador dado de baja no cotiza ni inicia checkout con token previo',async()=>{
 const h=harness();h.docs.set('mi_comunidad_comunidades/test-edificio/administradores/admin-test',{estado:'Inactivo'});
 await assert.rejects(h.create(),{code:'permission-denied'});
 await assert.rejects(h.functions.cotizarPlanMiComunidad({auth:h.auth,data:{}}),{code:'permission-denied'});
 assert.equal(h.state.calls.length,0);assert.equal(h.order(),undefined);
});
test('cotización comparte monto servidor y no acepta precio del cliente',async()=>{
 const h=harness();h.secrets.MC_PLAN_ANUAL_CLP='25000';
 const quote=await h.functions.cotizarPlanMiComunidad({auth:h.auth,data:{amount:1}});
 assert.equal(quote.amount,25000);assert.equal(quote.currency,'CLP');assert.equal(quote.months,12);
 assert.equal(h.state.calls.length,0);
});
test('dos solicitudes simultáneas y reintentos usan una intención, una preferencia',async()=>{
 const h=harness();await Promise.allSettled([h.create(),h.create()]);
 const original=h.order().id;
 const retry=await h.create();assert.equal(retry.orderId,original);assert.equal(h.state.postCount,1);
 assert.equal([...h.docs.keys()].filter(p=>p.startsWith('mi_comunidad_ordenes_pago/')).length,1);
});
test('POST incierto se recupera con GET validado sin volver a publicar',async()=>{
 const h=harness();let sent=0;
 h.state.request=async(resource,token,options)=>{
  if(resource==='/checkout/preferences'){
   sent++;const p=JSON.parse(options.body);h.state.preferences.set('p-recuperada',{...p,id:'p-recuperada',collector_id:123,init_point:'https://www.mercadopago.cl/checkout/v1/redirect?pref_id=p-recuperada'});throw Error('Conexión perdida después del POST');
  }
 };
 await assert.rejects(h.create());assert.equal(h.order().creationOutcome,'uncertain');
 const result=await h.create();assert.equal(sent,1);assert.match(result.checkoutUrl,/p-recuperada/);assert.equal(h.order().status,'checkout_ready');
});
test('preferencia recuperada ajena no habilita compra ni activa licencia',async()=>{
 const h=harness();await h.create();h.order().status='checkout_error';
 h.state.preferences.get('pref-1').items[0].unit_price=1;
 await assert.rejects(h.helpers.recoverCheckout(h.db,h.order().id,'ficticio',h.request),/no coincide/);
 assert.equal(h.order().status,'checkout_error');assert.equal(h.license().estado,'trial');
});
test('ausencia de preferencia tras POST incierto no permite nuevo POST ni reinicio',async()=>{
 const h=harness();h.state.request=async resource=>{if(resource==='/checkout/preferences')throw Error('Timeout incierto');};
 await assert.rejects(h.create());h.order().createdAt=oldest();
 await assert.rejects(h.create());
 await assert.rejects(h.helpers.assertCheckoutCanRestart(h.db,h.order().id,'ficticio',h.request),/reinicio seguro/);
 assert.equal(h.state.calls.filter(p=>p==='/checkout/preferences').length,1);
});
test('reinicio requiere resultado seguro, antigüedad y búsquedas completas vacías',async()=>{
 const h=harness();const order={id:'order000000000000001',status:'checkout_error',creationOutcome:'rejected',createdAt:oldest()};h.docs.set(path,order);
 assert.equal((await h.helpers.assertCheckoutCanRestart(h.db,order.id,'ficticio',h.request)).id,order.id);
 order.createdAt=new Date();await assert.rejects(h.helpers.assertCheckoutCanRestart(h.db,order.id,'ficticio',h.request));
 order.createdAt=oldest();h.state.request=async resource=>resource.startsWith('/v1/payments/search')?{results:[{id:99}]}:undefined;
 await assert.rejects(h.helpers.assertCheckoutCanRestart(h.db,order.id,'ficticio',h.request),/tiene pagos/);
});
test('órdenes históricas sin entorno verificable no se activan por recovery',async()=>{
 const h=harness();h.docs.set(path,{id:'order000000000000001',status:'pending'});
 await assert.rejects(h.helpers.recoverCheckout(h.db,'order000000000000001','ficticio',h.request),/sin entorno/);
 assert.equal(h.state.calls.length,0);
});
test('conciliación encuentra aprobado después de veinte intentos rechazados',async()=>{
 const h=harness();await h.create();const offsets=[];
 const request=async resource=>{
  if(resource.startsWith('/v1/payments/search')){
   const offset=Number(new URL('https://example.invalid'+resource).searchParams.get('offset')||0);offsets.push(offset);
   return offset===0?{results:Array.from({length:20},(_,i)=>({id:i+200,status:'rejected'})),paging:{total:21}}:{results:[h.state.payment],paging:{total:21}};
  }
  return h.request(resource);
 };
 await h.helpers.reconcilePayments(h.db,'ficticio',request);
 assert.deepEqual(offsets,[0,20]);assert.equal(h.order().status,'paid');
});
test('paginación persiste avance de cien resultados y continúa en la ejecución siguiente',async()=>{
 const h=harness();await h.create();const offsets=[];
 const request=async resource=>{
  if(resource.startsWith('/v1/payments/search')){
   const offset=Number(new URL('https://example.invalid'+resource).searchParams.get('offset')||0);offsets.push(offset);
   return offset<100?{results:Array.from({length:20},(_,i)=>({id:offset+i+200,status:'rejected'})),paging:{total:101}}:{results:[h.state.payment],paging:{total:101}};
  }
  return h.request(resource);
 };
 await h.helpers.reconcilePayments(h.db,'ficticio',request);assert.equal(h.order().searchOffset,100);assert.equal(h.order().status,'checkout_ready');
 await h.helpers.reconcilePayments(h.db,'ficticio',request);assert.equal(offsets.at(-1),100);assert.equal(h.order().searchOffset,0);assert.equal(h.order().status,'paid');
});
test('lease impide solapamiento de conciliación y se libera después del trabajo',async()=>{
 const h=harness();await h.create();let release,started;
 const reached=new Promise(r=>started=r),wait=new Promise(r=>release=r);
 const request=async resource=>{if(resource.startsWith('/v1/payments/search')){started();await wait;return {results:[]};}return h.request(resource);};
 const first=h.helpers.reconcilePayments(h.db,'ficticio',request);await reached;
 assert.equal((await h.helpers.reconcilePayments(h.db,'ficticio',request)).skipped,'lease_busy');
 release();await first;assert.equal(h.docs.get('mi_comunidad_config_comercial/conciliacion').leaseUntil,0);
});
test('renovación conserva saldo verificable para resolución de reverso',async()=>{
 const h=harness();const previous=new Date(Date.now()+86400000);h.license().estado='active';h.license().paidUntil=previous;h.license().lastPaymentId='11';
 await h.create();await h.webhook();assert.equal(h.order().licenseBeforeRenewal.lastPaymentId,'11');
 assert.equal(h.order().licenseBeforeRenewal.paidUntil.getTime(),previous.getTime());assert.equal(h.order().paidUntilApplied.getTime(),h.license().paidUntil.getTime());
});
test('segundo pago aprobado genera incidencia sin sumar vigencia y retry no reabre revisión resuelta',async()=>{
 const h=harness();await h.create();await h.webhook();const until=h.license().paidUntil.getTime();
 await h.helpers.settleVerifiedPayment(h.db,h.order().id,{...h.state.payment,preference_id:'pref-1',id:100},'100');
 assert.equal(h.license().paidUntil.getTime(),until);assert.equal(h.order().paymentId,'99');assert.equal(h.order().additionalPaymentReview,true);
 const incident=h.docs.get(path+'/incidencias/100');assert.equal(incident.estado,'pendiente');incident.estado='resuelta';h.order().additionalPaymentReview=false;
 await h.helpers.settleVerifiedPayment(h.db,h.order().id,{...h.state.payment,preference_id:'pref-1',id:100},'100');assert.equal(h.order().additionalPaymentReview,false);
});
test('replay de mismo evento no vuelve a consultar API y guarda expiración TTL',async()=>{
 const h=harness();await h.create();assert.equal((await h.webhook(true,'evento-estable')).code,200);const calls=h.state.calls.length;
 assert.equal((await h.webhook(true,'evento-estable')).code,200);assert.equal(h.state.calls.length,calls);
 const receipt=[...h.docs.entries()].find(([p])=>p.startsWith('mi_comunidad_webhook_recibos/'))[1];assert.equal(receipt.done,true);assert.ok(receipt.expiresAt>new Date());
});
test('webhook fallido libera lease y el mismo evento puede reintentarse',async()=>{
 const h=harness();await h.create();delete h.state.payment.order;
 assert.equal((await h.webhook(true,'fallo-reintentable')).code,500);h.state.payment.order={id:55};
 assert.equal((await h.webhook(true,'fallo-reintentable')).code,200);assert.equal(h.order().status,'paid');
});

test('presupuesto de conciliación conserva offset dentro de una página incompleta',async()=>{
 const h=harness();await h.create();const realNow=Date.now;let clock=realNow();
 Date.now=()=>clock;
 try{
  const request=async resource=>{
   if(resource.startsWith('/v1/payments/search'))return {results:Array.from({length:20},()=>({...h.state.payment})),paging:{total:20}};
   if(resource==='/v1/payments/99')clock+=200000;
   return h.request(resource);
  };
  await h.helpers.reconcilePayments(h.db,'ficticio',request);
  assert.equal(h.order().searchOffset,3);
  assert.equal(h.order().status,'paid');
  assert.equal(h.docs.get('mi_comunidad_config_comercial/conciliacion').leaseUntil,0);
 }finally{Date.now=realNow;}
});

test('solicitud pausada antes de seleccionar usa ciclo vigente y no restaura intención antigua',async()=>{
 const h=harness(),original=h.db.runTransaction;let release,entered,calls=0;
 const paused=new Promise(r=>entered=r),wait=new Promise(r=>release=r);
 h.db.runTransaction=async callback=>{if(++calls===1){entered();await wait;}return original(callback);};
 const old=h.create();await paused;h.license().checkoutRevision=1;
 const fresh=await h.create();release();const resumed=await old;
 assert.equal(resumed.orderId,fresh.orderId);assert.equal(h.state.postCount,1);
 assert.equal([...h.docs.keys()].filter(p=>p.startsWith('mi_comunidad_ordenes_pago/')&&!p.includes('/incidencias/')).length,1);
});
test('cambio de ciclo entre selección y POST invalida la solicitud vieja sin cobrar',async()=>{
 const h=harness(),original=h.db.runTransaction;let release,entered,calls=0;
 const paused=new Promise(r=>entered=r),wait=new Promise(r=>release=r);
 h.db.runTransaction=async callback=>{if(++calls===2){entered();await wait;}return original(callback);};
 const old=h.create();await paused;h.license().checkoutRevision=1;
 const fresh=await h.create();release();await assert.rejects(old);
 assert.equal(h.state.postCount,1);assert.notEqual(fresh.orderId,h.order().id);
 assert.equal(h.order().status,'checkout_error');assert.equal(h.order().creationOutcome,'not_started');
});
test('baja entre contexto y transacción impide crear una preferencia',async()=>{
 const h=harness(),original=h.db.runTransaction;let first=true;
 h.db.runTransaction=async callback=>{if(first){first=false;h.docs.set('mi_comunidad_comunidades/test-edificio/administradores/admin-test',{estado:'Inactivo'});}return original(callback);};
 await assert.rejects(h.create(),{code:'permission-denied'});assert.equal(h.state.postCount,0);
});
