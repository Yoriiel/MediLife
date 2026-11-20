// Menús con teclado y mouse (los usan el menú principal y el menú de pausa).
//
//   createMenu({ items, cx, y, w, rowH, onBack })
//       items: lista de filas. Cada fila tiene un "type":
//         { type: "button", label: () => texto, onSelect: () => {} }
//         { type: "toggle", label: () => texto, get: () => bool, set: (bool) => {} }
//         { type: "slider", label: () => texto, get: () => 0..1, set: (v) => {}, dim: () => bool (opcional) }
//         { type: "choice", label: () => texto, value: () => texto, onChange: (dir) => {} }   dir = -1 o 1
//       cx = centro horizontal; y = borde superior de la primera fila; w = ancho; rowH = alto por fila
//       onBack: se llama al pulsar Escape (opcional)
//       outline: color del contorno de cada fila, por ejemplo "#f5deb3" (opcional; sin él no hay contorno)
//   updateMenu(menu)   -> lee teclado y mouse (llamar una vez por cuadro)
//   drawMenu(ctx, menu)
//
// Teclado: ↑↓ / W S mueven; Enter, Espacio o E activan; ←→ / A D cambian valores; Escape = onBack.
// Mouse: pasar sobre una fila la selecciona; clic la activa; en la barra de volumen se puede arrastrar.

import { FONT_FAMILY } from "../config.js";
import { wasPressed, getMouse } from "../engine/input.js";

const FONT = `10px ${FONT_FAMILY}`;
const DARK = "#3b2314";
const MID = "#c68642";
const LIGHT = "#f5deb3";
const ON_COLOR = "#9be37a";
const OFF_COLOR = "#d98c7a";
const BAR_W = 64;
const BAR_H = 5;
const PAD = 8;
const KEY_STEP = 0.1;

export function createMenu({ items, cx = 160, y = 100, w = 180, rowH = 18, onBack = null, outline = null }) {
  return { items, cx, y, w, rowH, onBack, outline, index: 0, drag: -1 };
}

function rowRect(menu, i) {
  return { x: menu.cx - menu.w / 2, y: menu.y + i * menu.rowH, w: menu.w, h: menu.rowH - 2 };
}

function barRect(menu, i) {
  const r = rowRect(menu, i);
  return { x: r.x + r.w - PAD - BAR_W, y: r.y + Math.floor((r.h - BAR_H) / 2), w: BAR_W, h: BAR_H };
}

function rowAt(menu, mx, my) {
  for (let i = 0; i < menu.items.length; i++) {
    const r = rowRect(menu, i);
    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i;
  }
  return -1;
}

function sliderFromMouse(menu, i, mx) {
  const b = barRect(menu, i);
  const v = Math.min(1, Math.max(0, (mx - b.x) / b.w));
  menu.items[i].set(v);
}

function activate(item) {
  if (item.type === "button") item.onSelect();
  else if (item.type === "toggle") item.set(!item.get());
  else if (item.type === "choice") item.onChange(1);
}

function adjust(item, dir) {
  if (item.type === "toggle") item.set(dir > 0);
  else if (item.type === "slider") item.set(Math.min(1, Math.max(0, item.get() + dir * KEY_STEP)));
  else if (item.type === "choice") item.onChange(dir);
}

export function updateMenu(menu) {
  const n = menu.items.length;

  // teclado
  if (wasPressed("arrowup") || wasPressed("w")) menu.index = (menu.index - 1 + n) % n;
  if (wasPressed("arrowdown") || wasPressed("s")) menu.index = (menu.index + 1) % n;
  const item = menu.items[menu.index];
  if (wasPressed("enter") || wasPressed(" ") || wasPressed("e")) activate(item);
  if (wasPressed("arrowleft") || wasPressed("a")) adjust(item, -1);
  if (wasPressed("arrowright") || wasPressed("d")) adjust(item, 1);
  if (wasPressed("escape") && menu.onBack) menu.onBack();

  // mouse
  const m = getMouse();
  if (m.moved) {
    const hover = rowAt(menu, m.x, m.y);
    if (hover >= 0) menu.index = hover;
  }
  if (m.pressed) {
    const hit = rowAt(menu, m.x, m.y);
    if (hit >= 0) {
      menu.index = hit;
      const it = menu.items[hit];
      if (it.type === "slider") {
        menu.drag = hit; // empieza a arrastrar la barra
        sliderFromMouse(menu, hit, m.x);
      } else {
        activate(it);
      }
    }
  }
  if (!m.down) menu.drag = -1;
  else if (menu.drag >= 0 && menu.items[menu.drag]) sliderFromMouse(menu, menu.drag, m.x);
}

export function drawMenu(ctx, menu) {
  ctx.save();
  ctx.font = FONT;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  menu.items.forEach((item, i) => {
    const r = rowRect(menu, i);
    const selected = i === menu.index;
    const midY = r.y + r.h / 2 + 1;

    ctx.globalAlpha = 1;
    ctx.fillStyle = selected ? DARK : "rgba(59, 35, 20, 0.55)";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    if (selected) {
      ctx.fillStyle = MID;
      ctx.fillRect(r.x, r.y, 2, r.h); // marca lateral de la fila elegida
    }
    if (menu.outline) {
      ctx.strokeStyle = menu.outline;
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); // contorno de 1 px
    }

    const dim = item.dim && item.dim();
    ctx.globalAlpha = dim ? 0.5 : 1;
    ctx.fillStyle = selected ? LIGHT : "#d9c4a0";

    if (item.type === "button") {
      ctx.textAlign = "center";
      ctx.fillText(item.label(), r.x + r.w / 2, midY);
      ctx.textAlign = "left";
    } else {
      ctx.fillText(item.label(), r.x + PAD, midY);
    }

    if (item.type === "toggle") {
      const on = item.get();
      ctx.textAlign = "right";
      ctx.fillStyle = on ? ON_COLOR : OFF_COLOR;
      ctx.fillText(on ? "ON" : "OFF", r.x + r.w - PAD, midY);
      ctx.textAlign = "left";
    } else if (item.type === "choice") {
      ctx.textAlign = "right";
      ctx.fillText(`< ${item.value()} >`, r.x + r.w - PAD, midY);
      ctx.textAlign = "left";
    } else if (item.type === "slider") {
      const b = barRect(menu, i);
      const v = Math.min(1, Math.max(0, item.get()));
      ctx.fillStyle = "#1e120a";
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = MID;
      ctx.fillRect(b.x, b.y, Math.round(b.w * v), b.h);
      ctx.fillStyle = LIGHT;
      const kx = b.x + Math.round(b.w * v);
      ctx.fillRect(Math.min(kx, b.x + b.w - 2), b.y - 2, 2, b.h + 4); // perilla
    }
  });

  ctx.restore();
}
