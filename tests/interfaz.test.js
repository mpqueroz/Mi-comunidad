'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..');
function app(){const nodes=new Map(),listeners={};const el=id=>{if(!nodes.has(id))nodes.set(id,{id,innerHTML:'',textContent:'',value:'',disabled:false,classList:{add(){},remove(){},toggle(){},contains(){return id==='app';}},querySelector(){return {innerHTML:''};},insertAdjacentHTML(position,s){this.innerHTML=position==='afterbegin'?s+this.innerHTML:this.innerHTML+s;},focus(){},addEventListener(){},remove(){}});return nodes.get(id);};const noop=()=>{};const ctx={console,Intl,Date,Map,Set,Uint8Array,Promise,JSON,Number,String,Array,Object,Math,RegExp,Error,setTimeout:noop,clearTimeout:noop,requestAnimationFrame:noop,cancelAnimationFrame:noop,navigator:{onLine:true},crypto:require('node:crypto').webcrypto,history:{state:{mcPage:'inicio'},pushState(s){this.state=s;},replaceState(s){this.state=s;}},location:{hostname:'example.test',pathname:'/'},localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:el,querySelector:()=>null,documentElement:{setAttribute:noop,getAttribute:()=>null},addEventListener:(k,cb)=>{const previous=listeners[k];listeners[k]=event=>{const first=previous?.(event);const next=cb(event);return first?.then||next?.then?Promise.all([first,next]):next;};},body:{appendChild:noop},createElement:()=>el('created')},addEventListener:noop,scrollTo:noop,print:noop};ctx.window=ctx;ctx.firebase={initializeApp:noop,auth:()=>({}),firestore:Object.assign(()=>({}),{FieldValue:{serverTimestamp:()=>Date.now()}}),functions:()=>({})};vm.createContext(ctx);const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');const scripts=[fs.readFileSync(path.join(root,'public/app.js'),'utf8')];for(const script of scripts)vm.runInContext(script,ctx);vm.runInContext(fs.readFileSync(path.join(root,'public/profesional.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(root,'public/continuidad.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(root,'public/gestion.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(root,'public/cierre.js'),'utf8'),ctx);return {ctx,el,run:s=>vm.runInContext(s,ctx),listeners};}
test('carga completa de ambos scripts sin errores de inicialización',()=>{const a=app();assert.equal(a.run('typeof renderHome'),'function');assert.equal(a.run('typeof mcAbrirOperacion'),'function');assert.equal(a.run('novedades.length'),0);});
test('residente ve solo reservas próximas y datos escapados',()=>{const a=app();a.run(`currentRole='residente';currentUid='r';profile={nombre:'Ana <img src=x onerror=alert(1)>',depto:'101'};community.name='Edificio';reservas=[{depto:'101',fecha:'2000-01-01',estado:'Confirmada',lugar:'Quincho'},{depto:'101',fecha:'2099-01-01',estado:'Confirmada',lugar:'Piscina',hora:'10:00'}];renderHome();`);const h=a.el('content').innerHTML;assert.ok(h.includes('Piscina'));assert.ok(h.includes('Piscina'));assert.ok(!h.includes('2000-01-01'));assert.ok(!h.includes('<img src=x'));const actions=[...h.matchAll(/data-mc-action="([^"]+)"/g)].map(m=>JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&')));for(const [fn] of actions)assert.equal(a.run(`typeof ${fn}`),'function',fn);});
test('panel de conserjería y administración renderizan acciones existentes',()=>{const a=app();a.run(`currentRole='conserje';currentUid='uno';community.adminNombre='Admin';renderConserjeria();`);assert.ok(a.el('content').innerHTML.includes('Bitácora compartida'));a.run(`currentRole='admin';renderAdmin();`);assert.ok(a.el('content').innerHTML.includes('Continuidad del servicio'));assert.ok(!a.el('content').innerHTML.includes('Avisos nuevos'));for(const m of a.el('content').innerHTML.matchAll(/data-mc-action="([^"]+)"/g)){const [fn]=JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&'));assert.equal(a.run(`typeof ${fn}`),'function',fn);}});
test('detalle del paquete usa Timestamp y no interpreta textos como HTML',()=>{const a=app();a.run(`currentRole='conserje';encomiendas=[{id:'paq',title:'<img src=x onerror=alert(1)>',depto:'101',estado:'Recibido',codigo:'PAQ-1',ubicacion:'B2',ts:{toDate:()=>new Date('2026-10-15')}}];mcDetallePaquete('paq');`);const h=a.el('modalBody').innerHTML;assert.ok(h.includes('&lt;img'));assert.ok(!h.includes('<img src=x'));assert.ok(h.includes('B2'));});
test('fotos admiten únicamente JPEG base64 acotado',()=>{const a=app();assert.equal(a.run(`mcFoto('javascript:alert(1)')`),'');assert.equal(a.run(`mcFoto('data:image/svg+xml;base64,AA==')`),'');assert.ok(a.run(`mcFoto('data:image/jpeg;base64,AA==')`).includes('<img'));});
test('funciones de pago se conservan sin cambios',()=>{const baseline=require('./finance-baseline.json');const updated=fs.readFileSync(path.join(root,'public/app.js'),'utf8');for(const [n,sha] of Object.entries(baseline)){const re=new RegExp('^(?:async )?function '+n+'\\([^\\n]*\\)[\\s\\S]*?^\\}','m');const source=updated.match(re)?.[0];assert.ok(source,n);assert.equal(require('node:crypto').createHash('sha256').update(source).digest('hex'),sha,n);}});

test('buscador unificado escapa los datos y encuentra paquetes por ubicación',()=>{const a=app();a.run(`currentRole='conserje';encomiendas=[{id:'p1',title:'<img src=x>',depto:'101',ubicacion:'Estante B2',estado:'Recibido'}];mcBuscarOperacion();`);a.el('mcBuscaTodo').value='B2';a.run('mcResultadosBusqueda()');const h=a.el('mcBuscaResultados').innerHTML;assert.ok(h.includes('Encomiendas'));assert.ok(h.includes('&lt;img'));assert.ok(!h.includes('<img src=x>'));});
test('visitas antiguas no se cuentan como personas dentro',()=>{const a=app();a.run(`currentRole='conserje';mc.filtro='Pendientes';visitas=[{id:'old',nombre:'Antigua',depto:'101',ts:1},{id:'new',nombre:'Actual',depto:'101',estado:'Dentro',ts:Date.now()}];`);const h=a.run('mcVistaVisitas()');assert.ok(h.includes('Dentro (1)'));assert.ok(h.includes('Actual'));assert.ok(!h.includes('Antigua'));});
test('restaura una sesión válida y vacía la contraseña del formulario',async()=>{const a=app();a.run(`auth.currentUser={uid:'r1'};iniciarSesionComunidad=async()=>{};aplicarRolUI=()=>{};navigate=()=>{};actualizarContadorNotificaciones=()=>{};`);a.el('loginPassword').value='secreto';await a.run(`mcEntrarUsuario({uid:'r1',getIdTokenResult:async()=>({claims:{app:'mi_comunidad',role:'residente',comunidadId:'edificio'}})})`);assert.equal(a.run('currentUid'),'r1');assert.equal(a.el('loginPassword').value,'');});

test('avisos vigentes excluyen vencidos y archivados y ordenan destacados primero',()=>{const a=app();a.run(`avisos=[{id:'v',title:'Vencido',vence:'2000-01-01'},{id:'n',title:'Normal',ts:100},{id:'a',title:'Archivado',estado:'Archivado'},{id:'f',title:'Destacado',fijado:true,ts:1}];`);assert.equal(a.run('mcAvisosVigentes().map(a=>a.id).join(",")'),'f,n');});
test('agenda del residente no muestra planes del personal y retira avisos confirmados',()=>{const a=app();a.run(`currentRole='residente';profile.depto='101';avisos=[{id:'a',title:'Corte de agua',confirmacion:true,categoria:'Importante'}];mc.planes=[{id:'p',activo:true,proximaFecha:'2000-01-01',titulo:'Plan interno'}];`);assert.equal(a.run('mcAlertas().length'),1);a.run(`mc.lecturas.add('a');`);assert.equal(a.run('mcAlertas().length'),0);});
test('planes se renderizan con datos escapados y opciones de operación por rol',()=>{const a=app();a.run(`currentRole='conserje';mc.planes=[{id:'p',titulo:'<img src=x>',activo:true,proximaFecha:'2099-01-01',periodicidad:'Mensual',version:1}];mcRenderMantenciones();`);const h=a.el('content').innerHTML;assert.ok(h.includes('&lt;img'));assert.ok(!h.includes('Nuevo plan'));assert.ok(h.includes('Ver plan'));});


test('conserjería carga su propia ficha sin necesitar el directorio laboral',()=>{const a=app();a.run("currentRole='conserje';currentUid='c1';aplicarSnapshotConserjes({exists:true,id:'c1',data:()=>({nombre:'Conserje propio'})});");assert.equal(a.run('conserjesDirectorio.length'),1);assert.equal(a.run('mcNombre()'),'Conserje propio');});

test('la interfaz delega el cobro al servidor sin escribir deudas en el cliente',async()=>{const a=app();a.run("community.id='torre-a';functions.httpsCallable=name=>async data=>{if(name!=='generarCobrosMiComunidad'||data.comunidadId!=='torre-a'||data.monto!==45000)throw Error('Solicitud incorrecta');return {data:{creados:3,departamentos:3}};};");assert.equal(await a.run("generarCobroMensual(45000,'2099-12-31')"),3);});

test('licencia vencida deja a administración solo en Mi suscripción, igual que las reglas',()=>{const a=app();const ts=ms=>`{toMillis:()=>${ms}}`;const vence=(d)=>a.run(`licenciaSinAcceso({exists:true,data:()=>(${d})})`);const ahora=Date.now();assert.equal(a.run('licenciaSinAcceso({exists:false})'),true);assert.equal(vence(`{estado:'trial',trialEndsAt:${ts(ahora+60000)}}`),false);assert.equal(vence(`{estado:'trial',trialEndsAt:${ts(ahora-60000)}}`),true);assert.equal(vence(`{estado:'active',paidUntil:${ts(ahora+60000)}}`),false);assert.equal(vence(`{estado:'past_due',paidUntil:${ts(ahora-60000)}}`),true);assert.equal(vence(`{estado:'expired'}`),true);assert.equal(vence(`{estado:'suspended',paidUntil:${ts(ahora+60000)}}`),true);a.run(`currentRole='admin';licenciaRestringida=true;`);assert.equal(a.run('JSON.stringify(configRolActual().paginas)'),'["suscripcion"]');assert.equal(a.run('rolesConfig.admin.paginas.length')>1,true);a.run('licenciaRestringida=false;');assert.ok(a.run('configRolActual().paginas').includes('admin'));});

test('acciones delegadas rechazan JSON inválido y funciones globales no autorizadas',async()=>{
 const a=app();const messages=[];a.ctx.showToast=s=>messages.push(s);let executed=0;
 a.ctx.eval=()=>executed++;a.ctx.fetch=()=>executed++;
 for(const raw of ['{','null','{}','["eval","alert(1)"]','["fetch","https://example.invalid"]','["constructor"]','["__proto__"]','["navigate",{}]']){
  const button={disabled:false,dataset:{mcAction:raw}};
  await a.listeners.click({target:{closest:()=>button}});
  assert.equal(button.disabled,false);
 }
 assert.equal(executed,0);assert.equal(messages.length,8);
});
test('acciones autorizadas conservan argumentos como datos y liberan el botón al terminar',async()=>{
 const a=app();const calls=[];a.ctx.navigate=(...args)=>calls.push(args);
 const value=`departamento'\"><img src=x onerror=alert(1)>`;
 const button={disabled:false,dataset:{mcAction:JSON.stringify(['navigate',value])}};
 await a.listeners.click({target:{closest:()=>button}});
 assert.equal(calls.length,1);assert.equal(calls[0][0],value);assert.equal(button.disabled,false);
 a.ctx.navigate=async()=>{throw Error('fallo controlado');};a.ctx.console={...console,error(){}};a.ctx.showToast=()=>{};
 await a.listeners.click({target:{closest:()=>button}});assert.equal(button.disabled,false);
});

test('eventos de formulario conservan el elemento, valor y argumentos sin evaluar texto',async()=>{
 const a=app(),calls=[];
 a.ctx.cambiarColumnaCartola=(...args)=>calls.push(args);
 const field={value:`columna'\"><img src=x onerror=alert(1)>`,dataset:{mcChange:JSON.stringify(['mcCampo_cambiarColumnaCartola','monto'])}};
 await a.run('mcDespacharEvento')({target:{closest:()=>field}},'change');
 assert.equal(calls[0][0],'monto');assert.equal(calls[0][1],field.value);assert.equal(field.disabled,undefined);
 a.ctx.validarRutEnVivo=el=>calls.push(el);a.ctx.chequearRestriccionVisita=()=>calls.push('verificada');
 field.dataset.mcInput=JSON.stringify(['mcValidarRutVisita']);
 await a.run('mcDespacharEvento')({target:{closest:()=>field}},'input');assert.equal(calls[1],field);assert.equal(calls[2],'verificada');
});
test('Enter inicia sesión, otras teclas y composición no; selección y normalización conservan su efecto',async()=>{
 const a=app();let logins=0,prevented=0;a.ctx.login=()=>logins++;
 const field={dataset:{mcKeydown:'["mcIngresarConEnter"]'}};
 for(const [key,isComposing] of [['a',false],['Enter',true],['Enter',false]])await a.run('mcDespacharEvento')({key,isComposing,target:{closest:()=>field},preventDefault(){prevented++;}},'keydown');
 assert.equal(logins,1);assert.equal(prevented,1);
 field.value='TORRE Norte!';field.dataset.mcInput='["mcNormalizarIdComunidad"]';await a.run('mcDespacharEvento')({target:{closest:()=>field}},'input');assert.equal(field.value,'torre-norte-');
 field.dataset.mcClick='["mcSeleccionarBloque","bloque-1"]';await a.listeners.click({target:{closest:()=>field}});assert.equal(a.run('reservaBloqueSeleccionado'),'bloque-1');
});
test('la misma acción de clic no se ejecuta dos veces mientras está en curso',async()=>{
 const a=app();let resolve,calls=0;const pending=new Promise(r=>resolve=r);a.ctx.navigate=()=>{calls++;return pending;};
 const button={disabled:false,dataset:{mcClick:'["navigate","reservas"]'}};const event={target:{closest:()=>button}};
 const first=a.listeners.click(event);await a.listeners.click(event);assert.equal(calls,1);assert.equal(button.disabled,true);resolve();await first;assert.equal(button.disabled,false);
});
test('todas las acciones migradas tienen un destino explícito y argumentos serializados',()=>{
 const a=app();const script=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
 const actions=[...script.matchAll(/mcEvento\("(?:click|change|input|keydown)", "([\w]+)"/g)].map(m=>m[1]);
 for(const name of new Set(actions))assert.equal(a.run(`Object.hasOwn(mcAccionesPermitidas,${JSON.stringify(name)})`),true,name);
 const payload=`'\"><img src=x onerror=alert(1)> & \\ \n`;
 a.ctx.payload=payload;const attr=a.run('mcEvento("click","navigate",payload)');assert.ok(!attr.includes('<img'));assert.ok(attr.includes('&quot;'));
});

test('datos de pago y documento tributario conservan texto hostil sin crear etiquetas ni atributos',()=>{
 const a=app(),payload=`'"><img src=x onerror=alert(1)> & <script>alert(1)</script>`;
 a.ctx.payload=payload;
 a.run(`community.configuracionPago={banco:payload,tipoCuenta:payload,titular:payload,rut:payload,numeroCuenta:payload,correo:payload,instrucciones:payload,enlace:'javascript:alert(1)'};`);
 let html=a.run('mcDatosPagoHtml()');assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('href='));
 a.run(`community.configuracionPago.enlace='https://ejemplo.invalid/?dato='+payload;`);
 html=a.run('mcDatosPagoHtml()');assert.ok(html.includes('rel="noopener noreferrer"'));assert.ok(html.includes('&quot;'));assert.ok(!html.includes('<script'));
 vm.runInContext(fs.readFileSync(path.join(root,'public/comercial-panel.js'),'utf8'),a.ctx);
 html=a.run(`detalleDocumentoTributario({estado:'paid',documentoTributario:{tipo:'factura',correo:payload,rut:payload,razonSocial:payload,giro:payload,direccion:payload,comuna:payload}})`);
 assert.ok(html.includes('Factura electrónica'));assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('<script'));
});
