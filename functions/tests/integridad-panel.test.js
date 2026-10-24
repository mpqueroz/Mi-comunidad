"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = p => fs.readFileSync(path.join(__dirname, p), "utf8");

test("HTML principal íntegro", () => {
  const html = read("../../public/index.html");
  assert.equal(html.split("</html>").length - 1, 1);
  assert.equal(html.split("function renderComunidades(){").length - 1, 1);
});

test("panel comercial conectado", () => {
  const html = read("../../public/index.html");
  const panel = read("../../public/comercial-panel.js");
  assert.ok(html.includes("comercial: renderPanelComercial"));
  assert.ok(html.includes('src="comercial-panel.js"'));
  assert.ok(panel.includes("async function renderPanelComercial()"));
  assert.ok(panel.includes("historialPagosMiComunidad"));
});

test("funciones comerciales registradas", () => {
  const index = read("../index.js");
  assert.ok(index.includes('require("./comercial")'));
  assert.ok(index.includes('require("./rehabilitacion")'));
});
