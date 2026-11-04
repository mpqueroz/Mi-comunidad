"use strict";
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),vm=require('node:vm');
const {applyVerifiedRenewal}=require('../licencias');
function harness(){
 const orderId='order000000000000001';
 const docs=new Map([
  ['mi_comunidad_comunidades/test-edificio',{estado:'Activa',mpTestFixture:true}],
  ['mi_comunidad_licencias/test-edificio',{estado:'trial',paidUntil:null}],
 ]);
 const secrets={MC_MP_ACCESS_TOKEN:'ficticio',MC_MP_WEBHOOK_SECRET:'firma-ficticia',MC_MP_ENVIRONMENT:'test',MC_MP_TEST_ACCOUNT:JSON.stringify({collectorId:'123',liveMode:false}),MC_PLAN_ANUAL_CLP:'1000',MC_MP_WEBHOOK_URL:'https://example.invalid/webhook'};
 const state={calls:[],preferences:new Map(),postCount:0,eventCount:0,
  payment:{id:99,status:'approved',external_reference:orderId,order:{id:55,type:'mercadopago'},transaction_amount:1000,currency_id:'CLP',live_mode:false,collector_id:123},
  merchant:{id:55,external_reference:orderId,preference_id:'pref-1',payments:[{id:99}]},
 };
 let generated=0,lock=Promise.resolve();
 const clone=data=>data===undefined?undefined:structuredClone(data);
 function snap(path){const data=clone(docs.get(path));return {id:path.split('/').at(-1),ref:ref(path),exists:docs.has(path),data:()=>data,get:key=>data?.[key]};}
 function ref(path){return {id:path.split('/').at(-1),path,collection:name=>collection(path+'/'+name),get:async()=>snap(path),
  create:async data=>{assert.equal(docs.has(path),false);docs.set(path,clone(data));},
  set:async(data,options)=>docs.set(path,options?.merge?{...docs.get(path),...clone(data)}:clone(data)),
  update:async data=>{assert.equal(docs.has(path),true);docs.set(path,{...docs.get(path),...clone(data)});}};}
 function collection(path,filters=[],after='',cap=Infinity){return {
  doc:id=>ref(path+'/'+(id||('order'+String(++generated).padStart(15,'0')))),
  where:(field,op,value)=>collection(path,[...filters,[field,op,value]],after,cap),
  orderBy:()=>collection(path,filters,after,cap),startAfter:id=>collection(path,filters,typeof id==='string'?id:id.id,cap),limit:n=>collection(path,filters,after,n),
  get:async()=>{const rows=[...docs.keys()].filter(k=>k.startsWith(path+'/')&&!k.slice(path.length+1).includes('/')).sort().map(snap).filter(d=>d.id>after&&filters.every(([k,op,v])=>op==='in'?v.includes(d.get(k)):d.get(k)===v)).slice(0,cap);return {docs:rows,size:rows.length,empty:!rows.length};},
 };}
 const db={collection,runTransaction:async fn=>{
  const previous=lock;let release;lock=new Promise(resolve=>release=resolve);await previous;const writes=[];
  try{const result=await fn({get:r=>r.get(),create:(r,d)=>writes.push(()=>r.create(d)),set:(r,d,o)=>writes.push(()=>r.set(d,o)),update:(r,d)=>writes.push(()=>r.update(d))});for(const write of writes)await write();return result;}finally{release();}
 }};
 async function request(path,token,options={}){
  state.calls.push(path);
  if(state.request){const response=await state.request(path,token,options);if(response!==undefined)return response;}
  if(path==='/checkout/preferences'){
   state.postCount++;state.preference=JSON.parse(options.body);
   const result={...state.preference,id:'pref-'+state.postCount,collector_id:123,init_point:'https://www.mercadopago.cl/checkout/v1/redirect?pref_id=pref-'+state.postCount};
   state.preferences.set(result.id,result);return result;
  }
  if(path.startsWith('/checkout/preferences/search')){
   const url=new URL('https://example.invalid'+path),id=url.searchParams.get('external_reference'),offset=Number(url.searchParams.get('offset')||0),limit=Number(url.searchParams.get('limit')||20);
   const all=[...state.preferences.values()].filter(p=>p.external_reference===id);return {elements:all.slice(offset,offset+limit),total:all.length};
  }
  if(path.startsWith('/checkout/preferences/'))return clone(state.preferences.get(decodeURIComponent(path.slice('/checkout/preferences/'.length))));
  if(path.startsWith('/v1/payments/search'))return {results:[]};
  if(path==='/v1/payments/99')return {...state.payment};
  if(path==='/merchant_orders/55')return {...state.merchant};
  throw Error('Unexpected API request '+path);
 }
 const context={Buffer,Date,URL,AbortSignal,console:{info(){},warn(){},error(){}},module:{exports:{}},require:name=>{
  if(name==='crypto')return crypto;
  if(name==='./licencias')return {applyVerifiedRenewal};
  if(name==='firebase-admin/firestore')return {getFirestore:()=>db,FieldValue:{serverTimestamp:()=>new Date()}};
  if(name==='firebase-functions/v2/https')return {onCall:(_,fn)=>fn,onRequest:(_,fn)=>fn,HttpsError:class extends Error{constructor(code,msg){super(code+': '+msg);this.code=code;}}};
  if(name==='firebase-functions/v2/scheduler')return {onSchedule:(_,fn)=>fn};
  if(name==='firebase-functions/params')return {defineSecret:name=>({value:()=>secrets[name]})};
  throw Error('Unexpected import '+name);
 },fetch:async(url,options)=>({ok:true,json:async()=>request(url.replace('https://api.mercadopago.com',''),'ficticio',options)})};
 vm.runInNewContext(fs.readFileSync(require.resolve('../mercadopago'),'utf8'),context);
 const helpers=context.module.exports,functions=helpers.registerMercadoPago();
 const auth={uid:'admin-test',token:{app:'mi_comunidad',role:'admin',comunidadId:'test-edificio'}};
 const create=(documentoTributario={tipo:'boleta',correo:'comprador@example.test'})=>functions.crearCheckoutMiComunidad({auth,data:{amount:1,months:999,documentoTributario}});
 async function webhook(validSignature=true,eventId){
  const ts=String(Math.floor(Date.now()/1000)),requestId=eventId||'event-'+(++state.eventCount);
  const hash=crypto.createHmac('sha256',secrets.MC_MP_WEBHOOK_SECRET).update('id:99;request-id:'+requestId+';ts:'+ts+';').digest('hex');
  const response={code:200,status(code){this.code=code;return this;},send(body){this.body=body;return this;}};
  await functions.webhookMercadoPagoMiComunidad({method:'POST',headers:{'x-request-id':requestId,'x-signature':'ts='+ts+',v1='+(validSignature?hash:'0'.repeat(64))},query:{'data.id':'99'},body:{type:'payment',data:{id:'99'}}},response);return response;
 }
 return {create,webhook,state,secrets,helpers,functions,docs,db,request,auth,order:()=>docs.get('mi_comunidad_ordenes_pago/'+orderId),license:()=>docs.get('mi_comunidad_licencias/test-edificio')};
}
module.exports={harness};
