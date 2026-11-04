'use strict';
const {test,before,after,beforeEach}=require('node:test');
const fs=require('node:fs'),path=require('node:path');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const firebase=require('firebase/compat/app');
require('firebase/compat/firestore');
const {FieldValue}=firebase.firestore;
let env;
const db=(uid,extra={})=>env.authenticatedContext(uid,{email:uid+'@example.invalid',email_verified:true,...extra}).firestore();
const now=()=>FieldValue.serverTimestamp();
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-compat-compartidas',firestore:{rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});});
after(async()=>env&&env.cleanup());
beforeEach(async()=>{
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async c=>{
  const d=c.firestore();
  await Promise.all([
   d.doc('admins/moderador').set({activo:true}),
   d.doc('usuarios/autor').set({nombre:'Autor',correo:'privado@example.invalid'}),
   d.doc('stores/dueno').set({nombre:'Negocio ficticio'}),
   d.doc('stores/dueno/team/cajero').set({role:'vendedor'}),
   d.doc('stores/dueno/settings/general').set({name:'Negocio ficticio',currentCashierName:'Inicial'}),
   d.doc('stores/dueno/products/arroz').set({name:'Arroz',price:1500,cost:1000,stock:10}),
   d.doc('stores/dueno/sales/previa').set({total:1500,cost:1000}),
   d.doc('mi_comunidad_comunidades/edificio-compat').set({name:'Edificio ficticio',estado:'Activa'}),
  ]);
 });
});
test('Mercado Ciudadano: perfil privado y edición del titular conservados',async()=>{
 const owner=db('autor'),other=db('ajeno');
 await assertSucceeds(owner.doc('usuarios/autor').get());
 await assertSucceeds(owner.doc('usuarios/autor').update({nombre:'Nombre corregido'}));
 await assertFails(owner.doc('usuarios/autor').update({correo:'otro@example.invalid'}));
 await assertFails(other.doc('usuarios/autor').get());
 await assertFails(env.unauthenticatedContext().firestore().doc('usuarios/autor').get());
 await assertSucceeds(db('moderador').doc('usuarios/autor').get());
});
test('Mercado Ciudadano: publicación, moderación y lectura pública completas',async()=>{
 const author=db('autor'),mod=db('moderador'),publicDb=env.unauthenticatedContext().firestore();
 const ad={autorUid:'autor',autorNombre:'Autor',autorVerificado:true,tipo:'servicio',titulo:'Servicio ficticio',descripcion:'Prueba de compatibilidad',region:'Metropolitana',comuna:'Peñalolén',precio:1000,aprobado:false,ratingCount:0,ratingSuma:0,ratingPromedio:0,fechaCreacion:now()};
 await assertSucceeds(author.doc('anuncios/compat').set(ad));
 await assertFails(publicDb.doc('anuncios/compat').get());
 await assertFails(author.doc('anuncios/compat').update({aprobado:true}));
 await assertSucceeds(mod.doc('anuncios/compat').update({aprobado:true}));
 await assertSucceeds(publicDb.doc('anuncios/compat').get());
 await assertFails(db('ajeno').doc('anuncios/compat').update({titulo:'Secuestro'}));
});
test('Mercado Ciudadano: contacto confirmado y valoración conservan sus permisos',async()=>{
 await env.withSecurityRulesDisabled(c=>c.firestore().doc('anuncios/servicio').set({autorUid:'autor',tipo:'servicio',aprobado:true}));
 const buyer=db('comprador'),author=db('autor'),ref='anuncios/servicio';
 await assertSucceeds(buyer.doc(ref+'/contactos/comprador').set({clienteNombre:'Cliente ficticio',primerContacto:now(),confirmado:false}));
 await assertFails(buyer.doc(ref+'/contactos/comprador').update({confirmado:true,fechaConfirmacion:now()}));
 await assertSucceeds(author.doc(ref+'/contactos/comprador').update({confirmado:true,fechaConfirmacion:now()}));
 await assertSucceeds(buyer.doc(ref+'/valoraciones/comprador').set({autorUid:'comprador',autorNombre:'Cliente ficticio',estrellas:5,comentario:'Prueba',fecha:now()}));
 await assertFails(buyer.doc(ref+'/valoraciones/comprador').update({estrellas:1}));
});
test('Almacén Digital: dueño administra inventario y vendedor registra venta',async()=>{
 const owner=db('dueno'),seller=db('cajero');
 await assertSucceeds(owner.doc('stores/dueno/products/nuevo').set({name:'Producto',price:500,stock:5}));
 await assertSucceeds(seller.doc('stores/dueno/products/arroz').get());
 await assertSucceeds(seller.doc('stores/dueno/products/arroz').update({stock:9}));
 await assertSucceeds(seller.doc('stores/dueno/sales/nueva').set({total:1500,quantity:1}));
 await assertSucceeds(owner.doc('stores/dueno/sales/nueva').get());
 await assertFails(seller.doc('stores/dueno/sales/nueva').get());
 await assertFails(seller.doc('stores/dueno/products/arroz').update({price:1}));
 await assertFails(seller.doc('stores/dueno/products/arroz').update({stock:11}));
});
test('Almacén Digital: caja y configuración se mantienen separadas',async()=>{
 const seller=db('cajero');
 await assertSucceeds(seller.doc('stores/dueno/settings/general').get());
 await assertSucceeds(seller.doc('stores/dueno/settings/general').update({currentCashierName:'Cajero ficticio'}));
 await assertSucceeds(seller.doc('stores/dueno/settings/counters').set({sale:2}));
 await assertFails(seller.doc('stores/dueno/settings/general').update({name:'Nombre ajeno'}));
 await assertFails(seller.doc('stores/dueno/team/cajero').update({role:'owner'}));
 await assertFails(seller.doc('stores/dueno/purchases/compra').set({total:1}));
 await assertFails(seller.doc('stores/dueno/expenses/gasto').set({total:1}));
});
test('Compatibilidad: un administrador de Mi Comunidad no obtiene permisos en otro negocio',async()=>{
 const communityAdmin=db('admin-edificio',{app:'mi_comunidad',role:'admin',comunidadId:'edificio-compat'});
 await assertSucceeds(communityAdmin.doc('mi_comunidad_comunidades/edificio-compat').get());
 await assertFails(communityAdmin.doc('stores/dueno/products/arroz').get());
 await assertFails(communityAdmin.doc('stores/dueno/team/admin-edificio').set({role:'owner'}));
 await assertFails(communityAdmin.doc('usuarios/autor').get());
 await assertFails(db('dueno').doc('mi_comunidad_comunidades/edificio-compat').get());
});
