"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("la página principal tiene un solo cierre HTML", () => {
  const html = fs.readFileSync(path.join(__dirname, "../../public/index.html"), "utf8");
  assert.equal((html.match(/<\\/html>/gi) || []).length, 1);
  assert.equal((html.match(/function renderComunidades\\s*\\(/g) || []).length, 1);
});

test("el panel comercial está conectado sin duplicar la vista de comunidades", () => {
  const html = fs.readFileSync(path.join(__dirname, "../../public/index.html"), "utf8");
  const panel = fs.readFileSync(path.join(__dirname, "../../public/comercial-panel.js"), "utf8");
  assert.match(html, /comercial:\\s*renderPanelComercial/);
  assert.match(html, /src="comercial-panel\\.js"/);
  assert.match(panel, /async function renderPanelComercial\\(/);
  assert.match(panel, /historialPagosMiComunidad/);
});

test("el servidor registra los controles comerciales", () => {
  const index = fs.readFileSync(path.join(__dirname, "../index.js"), "utf8");
  assert.match(index, /require\\("\\.\\/comercial"\\)/);
  assert.match(index, /require\\("\\.\\/rehabilitacion"\\)/);
});
