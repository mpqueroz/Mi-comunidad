"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
function harness(incidents){
 const order={comunidadId:"edificio-test",status:"paid",paymentId:"99",amount:800000,additionalPaymentReview:true};
 const queries=[];
 const query=(filter=null,cap=Infinity)=>({where:(field,op,value)=>{queries.push([field,op,value]);return query(data=>data[field]===value,cap);},limit:n=>query(filter,n),get:async()=>({docs:incidents.filter(data=>!filter||filter(data)).slice(0,cap).map(data=>({id:data.id,get:key=>data[key]}))})});
 const docs=[{id:"order000000001",data:()=>order,ref:{collection:()=>query()}}];
 const db={collection:()=>({limit:()=>({get:async()=>({docs:[],size:0})}),where:field=>({limit:()=>({get:async()=>({docs:field==="additionalPaymentReview"?docs:[],size:field==="additionalPaymentReview"?1:0})})})})};
 const context={exports:{},Date,require:name=>name==="firebase-admin/firestore"?{getFirestore:()=>db}:{onCall:fn=>fn,HttpsError:Error}};
 vm.runInNewContext(fs.readFileSync(require.resolve("../comercial"),"utf8"),context);
 return {order,queries,run:()=>context.exports.resumenComercialMiComunidad({auth:{token:{app:"mi_comunidad",role:"superadmin"}}})};
}
test("resumen incluye segundo cobro aunque orden original permanece pagada",async()=>{
 const h=harness([{id:"100",estado:"pendiente"},{id:"101",estado:"resuelta"}]);const result=await h.run();
 assert.equal(result.revisiones.length,1);assert.equal(result.revisiones[0].paymentId,"100");assert.equal(result.revisiones[0].additional,true);assert.equal(result.revisiones[0].amount,800000);assert.equal(h.order.status,"paid");
});
test("101 incidencias históricas resueltas no ocultan una pendiente posterior",async()=>{
 const h=harness([...Array.from({length:101},(_,i)=>({id:String(i),estado:"resuelta"})),{id:"999",estado:"pendiente"}]);const result=await h.run();
 assert.equal(result.revisiones.length,1);assert.equal(result.revisiones[0].paymentId,"999");assert.equal(result.limitado,false);assert.deepEqual(h.queries,[["estado","==","pendiente"]]);
});
test("límite de incidencias distingue100 completas de101 truncadas",async()=>{
 for(const count of [100,101]){const h=harness(Array.from({length:count},(_,i)=>({id:String(i),estado:"pendiente"})));const result=await h.run();assert.equal(result.revisiones.length,100);assert.equal(result.limitado,count>100);}
});
