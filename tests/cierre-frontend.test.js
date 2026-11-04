'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
// Reusa el DOM de interfaz sin ejecutar sus casos.
const source=fs.readFileSync(path.join(__dirname,'interfaz.test.js'),'utf8');
const helper=source.slice(0,source.indexOf("test('carga completa"));
const app=new Function('require','__dirname',helper.replace('return {ctx,el,run:', 'return {listeners,ctx,el,run:')+';return app;')(require,__dirname);
function state(a){return JSON.parse(a.run('JSON.stringify(eventos)'));}
function setup(a){a.ctx.console={...console,error(){}};a.run(`currentRole='admin';currentUid='admin';community.id='torre';eventos=[];showToast=s=>eventos.push(['mensaje',s]);renderAdmin=()=>eventos.push(['render']);renderPerfil=()=>eventos.push(['perfil']);remuneraciones=[{id:'r1',nombre:'Ana',estado:'Pendiente'}];mantenciones=[{id:'m1',estado:'Programada'}];gastosComunes=[{id:'g1',depto:'101',estado:'Pendiente',monto:20000,periodo:'2026-11'}];multas=[{id:'mu1',depto:'101',estado:'Pendiente',monto:5000}];refComunidadActual=()=>{throw Error('No se permiten escrituras directas');};crearNotificacion=()=>{throw Error('No se permiten notificaciones duplicadas');};`);}
test('sueldos y mantenciones esperan al servidor y comparten llamadas repetidas en curso',async()=>{
 const a=app();setup(a);let release;const pending=new Promise(r=>release=r);const calls=[];
 a.run('functions').httpsCallable=name=>async data=>{calls.push({name,data});await pending;return {data:{ok:true,movimientoId:'egreso'}};};
 const first=a.run("pagarRemuneracion('r1')");const second=a.run("pagarRemuneracion('r1')");assert.equal(calls.length,1);assert.deepEqual(state(a),[]);release();assert.equal(await first,'egreso');assert.equal(await second,'egreso');
 assert.equal(calls[0].name,'registrarPagoOperativoMiComunidad');assert.equal(calls[0].data.tipo,'remuneracion');assert.equal(calls[0].data.comunidadId,'torre');assert.ok(state(a).some(x=>x[1]==='Sueldo pagado a Ana'));
 await a.run("marcarMantencionRealizada('m1')");assert.equal(calls[1].data.tipo,'mantencion');
});
test('fallo del servidor no comunica pago exitoso ni modifica el estado y permite reintentar',async()=>{
 const a=app();setup(a);a.run('functions').httpsCallable=()=>async()=>{throw Error('Sin confirmar');};
 await a.run("pagarRemuneracion('r1')");assert.equal(a.run('remuneraciones[0].estado'),'Pendiente');assert.ok(state(a).every(x=>x[0]!=='render'&&!/Sueldo pagado/.test(x[1]||'')));
 let called=0;a.run('functions').httpsCallable=()=>async()=>{called++;return {data:{ok:true,movimientoId:'egreso'}};};await a.run("pagarRemuneracion('r1')");assert.equal(called,1);
});
test('gastos y multas preservan id contable y opciones de conciliación sin mutación prematura',async()=>{
 const a=app();setup(a);let release;const pending=new Promise(r=>release=r);const calls=[];
 a.run('functions').httpsCallable=name=>async data=>{calls.push({name,data});await pending;return {data:{ok:true,movimientoId:'asiento-'+data.tipo}};};
 const one=a.run("marcarGastoPagado('g1',{fechaPago:'2026-11-02',metodoPago:'Transferencia (cartola bancaria)',silencioso:true})");const two=a.run("marcarGastoPagado('g1',{silencioso:true})");
 assert.equal(calls.length,1);assert.equal(a.run('gastosComunes[0].estado'),'Pendiente');assert.deepEqual(state(a),[]);release();assert.equal(await one,'asiento-gasto');assert.equal(await two,'asiento-gasto');
 assert.equal(calls[0].name,'confirmarIngresoComunidad');assert.equal(calls[0].data.fechaPago,'2026-11-02');assert.match(calls[0].data.metodoPago,/cartola bancaria/);assert.ok(state(a).every(x=>x[0]!=='mensaje'));
 assert.equal(await a.run("marcarMultaPagada('mu1',{silencioso:true})"),'asiento-multa');assert.equal(calls[1].data.tipo,'multa');
});
test('ingreso fallido retorna null, conserva deuda y no publica éxito',async()=>{
 const a=app();setup(a);a.run('functions').httpsCallable=()=>async()=>{throw Error('No confirmado');};
 assert.equal(await a.run("marcarGastoPagado('g1')"),null);assert.equal(a.run('gastosComunes[0].estado'),'Pendiente');assert.equal(await a.run("marcarMultaPagada('mu1')"),null);assert.equal(a.run('multas[0].estado'),'Pendiente');assert.ok(state(a).every(x=>x[0]!=='render'&&!/registrado/.test(x[1]||'')));
});
test('restricción rechazada conserva ficha y formulario sin anunciar éxito',async()=>{
 const a=app();setup(a);a.run(`currentRole='residente';currentPage='perfil';residentesDirectorio=[{uid:'r',depto:'101',restringidos:[]}];modalMode='restringido';modalContext={depto:'101'};`);
 a.el('mRestringidoNombre').value='Persona';a.el('mRestringidoMotivo').value='Sin autorización';a.run('functions').httpsCallable=()=>async()=>{throw Error('No guardado');};
 await a.run('saveModal()');assert.equal(a.run('residentesDirectorio[0].restringidos.length'),0);assert.equal(a.run('modalMode'),'restringido');assert.ok(state(a).every(x=>!/agregada|perfil/.test(x[1]||x[0])));
});
test('alta usa lista confirmada del servidor y baja envía persona, nunca índice',async()=>{
 const a=app();setup(a);a.run(`currentPage='perfil';residentesDirectorio=[{uid:'r',depto:'101',familiares:[{nombre:'Ana',rut:'',parentesco:'Madre'}]}];`);const calls=[];
 a.run('functions').httpsCallable=name=>async data=>{calls.push({name,data});return {data:{ok:true,personas:[{nombre:'Otra persona concurrente',rut:'',parentesco:'Otro'}]}};};
 await a.run("guardarIntegranteFicha(residentesDirectorio[0],'familiares','agregar',{nombre:'Nueva',rut:'',parentesco:'Otro'})");assert.equal(a.run('residentesDirectorio[0].familiares[0].nombre'),'Otra persona concurrente');
 await a.run("quitarFamiliar('101',0)");assert.equal(calls[1].name,'gestionarIntegrantesFichaMiComunidad');assert.equal(calls[1].data.persona.nombre,'Otra persona concurrente');assert.equal(calls[1].data.accion,'eliminar');assert.equal(calls[1].data.uid,'r');assert.ok(!('idx' in calls[1].data));
});
test('modal contiene foco en ambos sentidos, Escape cierra y devuelve foco',()=>{
 const a=app();let focused;const previous={isConnected:true,closest:()=>null,focus(){focused='previous';}};
 const first={disabled:false,tabIndex:0,closest:()=>null,getClientRects:()=>[1],focus(){focused='first';}};
 const last={disabled:false,tabIndex:0,closest:()=>null,getClientRects:()=>[1],focus(){focused='last';}};
 const dialog={contains:el=>el===first||el===last,querySelector:()=>first,querySelectorAll:()=>[first,last],focus(){focused='dialog';}};
 a.el('modalBackdrop').querySelector=()=>dialog;a.listeners.focusin({target:previous});a.ctx.document.activeElement=first;
 a.run('activarFocoModal()');assert.equal(a.el('app').inert,true);assert.equal(a.el('loginScreen').inert,true);
 a.ctx.document.activeElement=last;let prevented=false;a.listeners.keydown({key:'Tab',shiftKey:false,preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(focused,'first');
 a.ctx.document.activeElement=first;a.listeners.keydown({key:'Tab',shiftKey:true,preventDefault(){}});assert.equal(focused,'last');
 a.listeners.keydown({key:'Escape',preventDefault(){}});assert.equal(focused,'previous');assert.equal(a.el('app').inert,false);assert.equal(a.el('loginScreen').inert,false);assert.equal(a.run('modalMode'),null);
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');assert.match(html,/role="dialog" aria-modal="true" aria-labelledby="modalTitle"/);
});
test('listas históricas inválidas no rompen perfil, ficha ni búsqueda y no se mutan al mostrar',()=>{
 const a=app();setup(a);a.run(`currentRole='residente';currentUid='r';profile={nombre:'Residente',depto:'101',telefono:''};residentesDirectorio=[{uid:'r',depto:'101',nombre:'Residente',rut:'',telefono:''}];`);
 for(const value of [null,17,{nombre:'Mapa'},[null,23,{},[],{nombre:37},{nombre:'Inválido',rut:{}},{nombre:'Familiar válido',rut:'',parentesco:'Otro'}]]){
  a.ctx.historico=value;a.run('residentesDirectorio[0].familiares=historico;residentesDirectorio[0].restringidos=historico;renderPerfil();');assert.equal(a.run('residentesDirectorio[0].familiares'),value);
  a.run(`currentRole='admin';fichaDeptoHtml(residentesDirectorio[0]);resultadosBusquedaConserjeHtml('familiar');currentRole='residente';`);
 }
});
