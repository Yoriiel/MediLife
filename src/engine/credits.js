// Créditos finales: pantalla negra con el texto subiendo despacio (se dibuja por encima de todo).
//   startCredits(callback) -> empieza; al terminar llama a callback
//   isCreditsActive() / updateCredits(dt) / drawCredits(ctx)   (main.js)
// El contenido sale de CREDITS (claves de i18n); para añadir líneas, añade entradas ahí.

import { VIEW_W, VIEW_H, FONT_FAMILY } from "../config.js";
import { t } from "../i18n/index.js";
import { isPressed, getMouse } from "./input.js";

const SPEED = 8; // píxeles por segundo (lento, para poder leer la carta)
const FAST = 4; // multiplicador mientras se mantiene Espacio / Enter / clic
const MAX_WIDTH = 260; // ancho máximo de una línea (las largas se parten)

// key = texto; lineH = alto de línea; gapAfter = espacio que queda debajo
const CREDITS = [
  { key: "final.title", font: `bold 14px ${FONT_FAMILY}`, color: "#ffffff", lineH: 18, gapAfter: 36 },
  { key: "final.letter1", font: `10px ${FONT_FAMILY}`, color: "#f5deb3", lineH: 14, gapAfter: 14 },
  { key: "final.letter2", font: `10px ${FONT_FAMILY}`, color: "#f5deb3", lineH: 14, gapAfter: 40 },
  { key: "final.credits", font: `bold 12px ${FONT_FAMILY}`, color: "#ffffff", lineH: 16, gapAfter: 0 },
];

let active = false;
let scroll = 0;
let layout = null; // { lines: [{ text, y, font, color }], height }
let onDone = null;

// Parte un texto en líneas que no pasen de maxW
function wrap(ctx, text, maxW) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? line + " " + word : word;
    if (line && ctx.measureText(test).width > maxW) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function buildLayout() {
  const ctx = document.createElement("canvas").getContext("2d"); // solo para medir texto
  const lines = [];
  let y = 0;
  for (const c of CREDITS) {
    ctx.font = c.font;
    for (const text of wrap(ctx, t(c.key), MAX_WIDTH)) {
      lines.push({ text, y, font: c.font, color: c.color });
      y += c.lineH;
    }
    y += c.gapAfter;
  }
  return { lines, height: y };
}

export function startCredits(callback) {
  layout = buildLayout();
  scroll = 0;
  onDone = callback || null;
  active = true;
}

export function isCreditsActive() {
  return active;
}

export function updateCredits(dt) {
  const fast = isPressed(" ") || isPressed("enter") || getMouse().down;
  scroll += SPEED * (fast ? FAST : 1) * dt;
  if (scroll < VIEW_H + 10 + layout.height + 10) return; // aún se ve algo
  active = false;
  const cb = onDone;
  onDone = null;
  if (cb) cb();
}

export function drawCredits(ctx) {
  if (!active) return;
  ctx.save();
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const top = VIEW_H + 10 - scroll; // empieza justo debajo de la pantalla
  for (const l of layout.lines) {
    const y = Math.round(top + l.y);
    if (y < -20 || y > VIEW_H) continue;
    ctx.font = l.font;
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, VIEW_W / 2, y);
  }
  ctx.restore();
}
