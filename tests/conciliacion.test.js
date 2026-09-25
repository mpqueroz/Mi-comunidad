// Tests de la lectura de cartolas y de la búsqueda de coincidencias de la
// conciliación bancaria. Toma el bloque de funciones puras directo de
// index.html (entre los marcadores CONCILIACION-PURAS), así se prueba el
// mismo código que corre en la app.

const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const bloque = html.split("/* CONCILIACION-PURAS:INICIO */")[1].split("/* CONCILIACION-PURAS:FIN */")[0];
const C = new Function(bloque + `; return {parsearMontoConc, parsearFechaConc, parsearCSVConc,
  detectarColumnasCartola, interpretarCartola, idMovimientoBancario, deptosEnDescripcion,
  buscarCoincidencias, resumenConciliacion};`)();

test("montos en formatos de cartola chilena", () => {
  assert.equal(C.parsearMontoConc("85.000"), 85000);
  assert.equal(C.parsearMontoConc("$ 1.234.567"), 1234567);
  assert.equal(C.parsearMontoConc("-650.000"), -650000);
  assert.equal(C.parsearMontoConc("(650.000)"), -650000);
  assert.equal(C.parsearMontoConc("650.000-"), -650000);
  assert.equal(C.parsearMontoConc("85000,00"), 85000);
  assert.equal(C.parsearMontoConc("1.234.567,50"), 1234568);
  assert.equal(C.parsearMontoConc("85,000"), 85000);
  assert.equal(C.parsearMontoConc(85000), 85000);
  assert.equal(C.parsearMontoConc(""), 0);
});

test("fechas en formatos de cartola", () => {
  assert.equal(C.parsearFechaConc("03/09/2026"), "2026-09-03");
  assert.equal(C.parsearFechaConc("3-9-26"), "2026-09-03");
  assert.equal(C.parsearFechaConc("2026-09-03"), "2026-09-03");
  assert.equal(C.parsearFechaConc(46268), "2026-09-03"); // serie de Excel
  assert.equal(C.parsearFechaConc("03/09", 2026), "2026-09-03");
  assert.equal(C.parsearFechaConc("31/02/2026"), null);
  assert.equal(C.parsearFechaConc("SALDO INICIAL"), null);
});

const cartolaCSV = [
  "Banco Ejemplo;;;;;",
  "Cuenta Corriente N° 123456;;;;;",
  "Titular: Comunidad Edificio Los Aromos;;;;;",
  ";;;;;",
  "Fecha;N° Operación;Descripción;Cargos (-);Abonos (+);Saldo",
  "06/09/2026;9001;PAGO DESCONOCIDO;350.000;;18.070.000",
  "05/09/2026;9000;TRANSFERENCIA ELECTRONICA;;80.000;18.420.000",
  "04/09/2026;8999;TRANSF SERVICIOS ASEO XYZ;650.000;;18.340.000",
  "03/09/2026;8998;\"TRANSF DEPTO 405; SEPT\";;120.000;18.990.000",
  "02/09/2026;8997;TRANSF DEPTO 302;;95.000;18.870.000",
  ";;SALDO INICIAL;;;18.775.000",
].join("\r\n");

test("lee una cartola con encabezado desplazado y orden inverso", () => {
  const filas = C.parsearCSVConc(cartolaCSV);
  const det = C.detectarColumnasCartola(filas);
  assert.ok(det, "debe encontrar la fila de encabezados");
  assert.equal(filas[det.filaEncabezado][0], "Fecha");
  assert.deepEqual(det.mapa, {fecha: 0, descripcion: 2, cargo: 3, abono: 4, saldo: 5});

  const r = C.interpretarCartola(filas, det.filaEncabezado, det.mapa);
  assert.equal(r.movimientos.length, 5);
  assert.equal(r.periodo, "2026-09");
  // Queda en orden cronológico.
  assert.equal(r.movimientos[0].descripcion, "TRANSF DEPTO 302");
  assert.equal(r.movimientos[0].monto, 95000);
  assert.equal(r.movimientos[2].monto, -650000);
  assert.equal(r.movimientos[1].descripcion, "TRANSF DEPTO 405; SEPT");
});

test("lee una cartola con una sola columna de monto con signo", () => {
  const filas = C.parsearCSVConc("fecha,glosa,monto,saldo\n02-09-2026,Abono dpto 302,95000,100000\n04-09-2026,Pago aseo,-650000,-550000");
  const det = C.detectarColumnasCartola(filas);
  assert.deepEqual(det.mapa, {fecha: 0, descripcion: 1, monto: 2, saldo: 3});
  const r = C.interpretarCartola(filas, det.filaEncabezado, det.mapa);
  assert.deepEqual(r.movimientos.map((m) => m.monto), [95000, -650000]);
});

test("el id de un movimiento es estable y distingue repetidos", () => {
  const m = {fecha: "2026-09-02", monto: 95000, descripcion: "TRANSF DEPTO 302", saldo: 100};
  assert.equal(C.idMovimientoBancario(m, 1), C.idMovimientoBancario({...m}, 1));
  assert.notEqual(C.idMovimientoBancario(m, 1), C.idMovimientoBancario(m, 2));
  assert.ok(!C.idMovimientoBancario(m, 1).includes("/"));
});

const residentes = [
  {depto: "302", nombre: "Ana Soto"},
  {depto: "305", nombre: "Pedro Rojas"},
  {depto: "405", nombre: "Luis Pérez"},
  {depto: "408", nombre: "Carla Muñoz"},
];

test("identifica el departamento en la glosa", () => {
  assert.deepEqual(C.deptosEnDescripcion("TRANSFERENCIA DEPTO 305", residentes), ["305"]);
  assert.deepEqual(C.deptosEnDescripcion("TRF DPTO. 302 GC SEPT", residentes), ["302"]);
  assert.deepEqual(C.deptosEnDescripcion("TRANSF 405", residentes), ["405"]);
  assert.deepEqual(C.deptosEnDescripcion("TRANSF DE CARLA MUNOZ", residentes), ["408"]);
  assert.deepEqual(C.deptosEnDescripcion("TRANSFERENCIA ELECTRONICA", residentes), []);
  assert.deepEqual(C.deptosEnDescripcion("TRANSF DEPTO 999", residentes), []);
});

const datos = () => ({
  residentes,
  gastos: [
    {id: "g305", depto: "305", monto: 85000, estado: "Pendiente", periodo: "2026-09"},
    {id: "g408", depto: "408", monto: 75000, estado: "Pendiente", periodo: "2026-09"},
    {id: "g302", depto: "302", monto: 95000, estado: "Por confirmar", periodo: "2026-09",
      pagoInformado: {fecha: "2026-09-02", referencia: "77881234"}},
    {id: "g405", depto: "405", monto: 120000, estado: "Pagado", periodo: "2026-09"},
  ],
  multas: [],
  contables: [
    {id: "c1", tipo: "Egreso", categoria: "Proveedores", descripcion: "Aseo mensual · Servicios de Aseo XYZ", monto: 650000, fecha: "2026-09-03"},
    {id: "c2", tipo: "Ingreso", categoria: "Gasto común", descripcion: "Gasto común depto 405 · Septiembre 2026", monto: 120000, fecha: "2026-09-03", depto: "405"},
  ],
  contablesUsados: new Set(),
});

test("coincidencia exacta: depto y monto calzan", () => {
  const r = C.buscarCoincidencias({fecha: "2026-09-03", monto: 85000, descripcion: "TRANSFERENCIA DEPTO 305"}, datos());
  assert.equal(r.nivel, "exacta");
  assert.equal(r.candidatos[0].id, "g305");
  assert.equal(r.candidatos[0].diferencia, 0);
});

test("coincidencia exacta por N° de operación del pago informado", () => {
  const r = C.buscarCoincidencias({fecha: "2026-09-02", monto: 95000, descripcion: "TEF RECIBIDA OP 77881234"}, datos());
  assert.equal(r.nivel, "exacta");
  assert.equal(r.candidatos[0].id, "g302");
});

test("coincidencia probable: solo el monto calza", () => {
  const r = C.buscarCoincidencias({fecha: "2026-09-05", monto: 85000, descripcion: "TRANSFERENCIA ELECTRONICA"}, datos());
  assert.equal(r.nivel, "probable");
  assert.equal(r.candidatos[0].id, "g305");
});

test("pago mayor que la deuda: probable con diferencia", () => {
  const r = C.buscarCoincidencias({fecha: "2026-09-05", monto: 80000, descripcion: "TRANSF DEPTO 408"}, datos());
  assert.equal(r.nivel, "probable");
  assert.equal(r.candidatos[0].id, "g408");
  assert.equal(r.candidatos[0].diferencia, 5000);
});

test("pago menor que la deuda no se ofrece como candidato", () => {
  const r = C.buscarCoincidencias({fecha: "2026-09-05", monto: 50000, descripcion: "TRANSF DEPTO 305"}, datos());
  assert.equal(r.nivel, "sin");
});

test("sin coincidencia", () => {
  const r = C.buscarCoincidencias({fecha: "2026-09-06", monto: 150000, descripcion: "TRANSFERENCIA"}, datos());
  assert.equal(r.nivel, "sin");
  assert.equal(r.candidatos.length, 0);
});

test("abono de una deuda ya pagada calza con el ingreso registrado", () => {
  const r = C.buscarCoincidencias({fecha: "2026-09-03", monto: 120000, descripcion: "TRANSF DEPTO 405"}, datos());
  assert.equal(r.nivel, "exacta");
  assert.equal(r.candidatos[0].tipo, "contable");
  assert.equal(r.candidatos[0].id, "c2");
});

test("egreso: calza con el proveedor registrado", () => {
  const r = C.buscarCoincidencias({fecha: "2026-09-04", monto: -650000, descripcion: "TRANSF SERVICIOS ASEO XYZ"}, datos());
  assert.equal(r.nivel, "exacta");
  assert.equal(r.candidatos[0].id, "c1");
});

test("egreso desconocido: sin coincidencia", () => {
  const r = C.buscarCoincidencias({fecha: "2026-09-06", monto: -350000, descripcion: "PAGO DESCONOCIDO"}, datos());
  assert.equal(r.nivel, "sin");
});

test("un ingreso contable ya conciliado no se vuelve a ofrecer", () => {
  const d = datos();
  d.contablesUsados = new Set(["c2"]);
  const r = C.buscarCoincidencias({fecha: "2026-09-03", monto: 120000, descripcion: "TRANSF DEPTO 405"}, d);
  assert.equal(r.nivel, "sin");
});

test("dos deudas iguales del mismo depto: probable (el admin elige el mes)", () => {
  const d = datos();
  d.gastos.push({id: "g305ago", depto: "305", monto: 85000, estado: "Atrasado", periodo: "2026-08"});
  const r = C.buscarCoincidencias({fecha: "2026-09-03", monto: 85000, descripcion: "TRANSF DEPTO 305"}, d);
  assert.equal(r.nivel, "probable");
  assert.equal(r.candidatos[0].id, "g305ago", "ante empate sugiere la deuda más antigua");
});

test("resumen del período: saldos y conteos", () => {
  const movs = [
    {id: "a", fecha: "2026-09-02", monto: 95000, saldo: 18870000, orden: 1, estado: "Conciliado"},
    {id: "b", fecha: "2026-09-04", monto: -650000, saldo: 18220000, orden: 2, estado: "Pendiente"},
    {id: "c", fecha: "2026-09-06", monto: -350000, saldo: 17870000, orden: 3, estado: "Pendiente"},
  ];
  const contables = [
    {tipo: "Ingreso", monto: 95000, fecha: "2026-09-02"},
    {tipo: "Egreso", monto: 650000, fecha: "2026-09-03"},
    {tipo: "Ingreso", monto: 1, fecha: "2026-08-30"}, // otro período: no cuenta
  ];
  const r = C.resumenConciliacion(movs, contables, {b: "exacta", c: "sin"});
  assert.equal(r.saldoInicial, 18775000);
  assert.equal(r.saldoBanco, 17870000);
  assert.equal(r.saldoSistema, 18775000 + 95000 - 650000);
  assert.equal(r.diferencia, -350000);
  assert.equal(r.conciliados, 1);
  assert.equal(r.pendientes, 1);
  assert.equal(r.diferencias, 1);
});
