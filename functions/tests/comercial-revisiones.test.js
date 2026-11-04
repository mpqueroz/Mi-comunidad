"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
test("resumen incluye segundo cobro aunque orden original permanece pagada",async()=>{
 const order={comunidadId:"edificio-test",status:"paid",paymentId:"99",amount:800000,additionalPaymentReview:true};
 const docs=[{id:"order000000001",data:()=>order,ref:{collection:()=>({limit:()=>({get:async()=>({docs:[{id:"100",get:key=>key==="estado"?"pendiente":null},{id:"101",get:key=>key==="estado"?"resuelta":null}]})})})}}];
 const db={collection:name=>({limit:()=>({get:async()=>({docs:[],size:0})}),where:(field)=>({limit:()=>({get:async()=>({docs:field==="additionalPaymentReview"?docs:[],size:field==="additionalPaymentReview"?1:0})})})})};
 const context={exports:{},Date,require:name=>name==="firebase-admin/firestore"?{getFirestore:()=>db}:{onCall:fn=>fn,HttpsError:Error}};
 vm.runInNewContext(fs.readFileSync(require.resolve("../comercial"),"utf8"),context);
 const result=await context.exports.resumenComercialMiComunidad({auth:{token:{app:"mi_comunidad",role:"superadmin"}}});
 assert.equal(result.revisiones.length,1);assert.equal(result.revisiones[0].paymentId,"100");assert.equal(result.revisiones[0].additional,true);assert.equal(result.revisiones[0].amount,800000);assert.equal(order.status,"paid");
});
