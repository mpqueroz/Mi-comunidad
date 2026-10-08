// Estado compartido de la app y atajos que usan todas las vistas.
//
// Las vistas no agregan listeners: declaran acciones en A (data-act="x"
// en un botón), formularios en F (data-form="x") y cambios en C
// (data-change="x"); app.js los despacha con delegación de eventos.

import {esc} from "./util.js";

export const S = {
  store: null,
  demo: false,
  user: null, // {uid, name, email}
  families: [], // [{id, name}]
  fid: null,
  family: null,
  data: {}, // colección → lista de docs
  loaded: new Set(), // colecciones que ya respondieron
};

export const A = {};
export const F = {};
export const C = {};

let renderFn = () => {};
export const setRender = (f) => (renderFn = f);
export const rerender = () => renderFn();

export const ROLES = {admin: "Administra", adulto: "Adulto", nino: "Niño/a"};

export const list = (col) => S.data[col] || [];
export const members = () => list("members").slice().sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
export const member = (uid) => list("members").find((m) => m.id === uid);
export const me = () => member(S.user?.uid) || {};
export const nameOf = (uid) => member(uid)?.name || "Alguien";
export const isAdmin = () => me().role === "admin";
export const isAdult = () => ["admin", "adulto"].includes(me().role);
export const canDelete = (item) => item.by === S.user?.uid || isAdmin();
export const dndActive = (m) => m?.dndUntil && m.dndUntil > Date.now();

export function avatar(uid, cls = "") {
  const m = member(uid) || {};
  const label = m.emoji || (m.name || "?")[0];
  return `<span class="av ${cls}" style="--c:${esc(m.color || "#868e96")}" title="${esc(m.name || "")}">${esc(label)}</span>`;
}

export const add = (col, data) => S.store.add(S.fid, col, {...data, by: S.user.uid, createdAt: Date.now()});
export const upd = (col, id, patch) => S.store.update(S.fid, col, id, patch);
export const del = (col, id) => S.store.remove(S.fid, col, id);
export const setDoc = (col, id, data, merge = true) => S.store.set(S.fid, col, id, data, {merge});
export const updMe = (patch) => S.store.update(S.fid, "members", S.user.uid, patch);

export const go = (tab, sub) => (location.hash = "#/" + tab + (sub ? "/" + sub : ""));

// Barra de sub-secciones (pestañas internas de cada página).
export function subnav(tab, current, items) {
  return `<nav class="subnav">${items
    .map(([k, label]) => `<a href="#/${tab}/${k}" class="${k === current ? "on" : ""}">${label}</a>`)
    .join("")}</nav>`;
}

export const empty = (emoji, text) => `<div class="empty"><div class="big">${emoji}</div><p>${text}</p></div>`;

export function findById(col, id) {
  return list(col).find((x) => x.id === id);
}
