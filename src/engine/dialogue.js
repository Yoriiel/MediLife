// Cuadros de diálogo con efecto máquina de escribir (sin sonido).
//   say("clave")                              -> cuadro normal abajo
//   say(["clave1", "clave2"], fin)            -> varios cuadros y una función al terminar
//   say("clave", fin, { bubble: { x, y } })   -> burbuja con cola que sale de un punto
//                                                de la habitación (x, y = punta de la cola)
//   ask("clave", ["op1", "op2"], elegida)    -> pregunta con opciones (claves de texto).
//                                                Cuando termina de escribirse la pregunta, se elige con
//                                                flechas / WASD y se confirma con Espacio / Enter / E.
//                                                Llama a elegida(indice) con la opción escogida (0, 1...)
// Espacio / Enter / E: si el texto aún se está escribiendo, lo completa;
// si ya terminó, pasa al siguiente cuadro.

import { VIEW_W, VIEW_H, FONT_FAMILY } from "../config.js";
import { t } from "../i18n/index.js";
import { wasPressed } from "./input.js";

const FONT = `10px ${FONT_FAMILY}`;
const LINE_H = 12;
const BOX = { x: 8, y: VIEW_H - 64, w: VIEW_W - 16, h: 56, pad: 9 };
const BUBBLE = { maxTextW: 104, pad: 6, tail: 9 };
const CHARS_PER_SECOND = 35;
const ACTION_KEYS = [" ", "enter", "e"];

const measureCtx = document.createElement("canvas").getContext("2d");

let queue = [];
let current = null; // { key, text, lines, total, bubble, textW }
let shown = 0;      // caracteres visibles (con decimales)
let timer = 0;
let onEnd = null;
let options = null;
let choice = null; // { keys: [claves de las opciones], index, onSelect } mientras hay una pregunta

// Parte el texto en líneas que quepan en el ancho dado
function wrap(text, maxW) {
  measureCtx.font = FONT;
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? line + " " + word : word;
    if (!line || measureCtx.measureText(test).width <= maxW) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Recalcula las líneas si cambió el texto (por ejemplo, al cambiar de idioma)
function prepare() {
  const text = t(current.key);
  if (current.text === text) return;

  current.text = text;
  const maxW = current.bubble ? BUBBLE.maxTextW : BOX.w - BOX.pad * 2;
  current.lines = wrap(text, maxW);
  current.total = current.lines.reduce((n, l) => n + l.length, 0);
  measureCtx.font = FONT;
  current.textW = Math.max(...current.lines.map((l) => measureCtx.measureText(l).width));
}

function next() {
  if (queue.length === 0) {
    current = null;
    const callback = onEnd;
    onEnd = null;
    options = null;
    choice = null;
    if (callback) callback();
    return;
  }
  current = {
    key: queue.shift(),
    text: null,
    lines: [],
    total: 0,
    textW: 0,
    bubble: options && options.bubble ? options.bubble : null,
  };
  shown = 0;
  timer = 0;
  prepare();
}

export function say(keys, callback, opts) {
  choice = null; // un diálogo normal cancela cualquier pregunta que hubiera quedado
  queue = Array.isArray(keys) ? [...keys] : [keys];
  onEnd = callback || null;
  options = opts || null;
  next();
}

// Pregunta con opciones. optionKeys = claves de texto de cada opción (ej. ["choice.yes", "choice.no"]).
// onSelect recibe el índice de la opción elegida. Mientras la pregunta está abierta,
// isDialogueActive() es true, así que la jugadora no se puede mover.
export function ask(key, optionKeys, onSelect) {
  say(key);
  choice = { keys: optionKeys, index: 0, onSelect };
}

export function isDialogueActive() {
  return current !== null;
}

export function updateDialogue(dt) {
  if (!current) return;
  prepare();
  timer += dt;

  const typing = shown < current.total; // ¿seguía escribiéndose al empezar este cuadro?
  if (typing) {
    shown = Math.min(current.total, shown + dt * CHARS_PER_SECOND);
  }

  // Pregunta con opciones: primero termina de escribirse, luego se elige
  if (choice) {
    if (typing) {
      if (ACTION_KEYS.some(wasPressed)) shown = current.total;
      return;
    }
    const n = choice.keys.length;
    if (["arrowleft", "arrowup", "a", "w"].some(wasPressed)) choice.index = (choice.index + n - 1) % n;
    if (["arrowright", "arrowdown", "d", "s"].some(wasPressed)) choice.index = (choice.index + 1) % n;

    if (ACTION_KEYS.some(wasPressed)) {
      const { index, onSelect } = choice;
      choice = null;
      current = null;
      queue = [];
      onEnd = null;
      options = null;
      if (onSelect) onSelect(index); // puede abrir otra pregunta o diálogo
    }
    return;
  }

  if (ACTION_KEYS.some(wasPressed)) {
    if (shown < current.total) shown = current.total;
    else next();
  }
}

// Escribe las líneas reveladas hasta ahora
function drawLines(ctx, x, y) {
  ctx.font = FONT;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#3b2314";

  let remaining = Math.floor(shown);
  current.lines.forEach((line, i) => {
    const part = line.slice(0, Math.max(0, remaining));
    ctx.fillText(part, x, y + i * LINE_H);
    remaining -= line.length;
  });
}

function drawArrow(ctx, ax, ay) {
  if (shown < current.total || Math.floor(timer * 2.5) % 2 !== 0) return;
  ctx.fillStyle = "#3b2314";
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax + 8, ay);
  ctx.lineTo(ax + 4, ay + 5);
  ctx.closePath();
  ctx.fill();
}

// Opciones de una pregunta, en una fila bajo el texto, con un triángulo junto a la elegida
function drawChoice(ctx) {
  if (!choice || shown < current.total) return;

  ctx.font = FONT;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#3b2314";

  const y = BOX.y + BOX.h - 22;
  let x = BOX.x + BOX.pad + 10; // deja sitio para el triángulo
  choice.keys.forEach((key, i) => {
    const label = t(key);
    if (i === choice.index) {
      ctx.beginPath();
      ctx.moveTo(x - 9, y + 1);
      ctx.lineTo(x - 9, y + 9);
      ctx.lineTo(x - 4, y + 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillText(label, x, y);
    x += Math.ceil(ctx.measureText(label).width) + 28;
  });
}

function drawBox(ctx) {
  // marco estilo madera / pergamino
  ctx.fillStyle = "#3b2314";
  ctx.fillRect(BOX.x, BOX.y, BOX.w, BOX.h);
  ctx.fillStyle = "#c68642";
  ctx.fillRect(BOX.x + 2, BOX.y + 2, BOX.w - 4, BOX.h - 4);
  ctx.fillStyle = "#f5deb3";
  ctx.fillRect(BOX.x + 4, BOX.y + 4, BOX.w - 8, BOX.h - 8);

  drawLines(ctx, BOX.x + BOX.pad, BOX.y + BOX.pad);
  if (choice) drawChoice(ctx);
  else drawArrow(ctx, BOX.x + BOX.w - 16, BOX.y + BOX.h - 14);
}

// Burbuja con cola: la cola apunta al punto (anchor) y la burbuja queda debajo
function drawBubble(ctx, origin) {
  const ax = Math.round(origin.x + current.bubble.x);
  const ay = Math.round(origin.y + current.bubble.y);

  const w = Math.ceil(current.textW) + BUBBLE.pad * 2;
  const h = current.lines.length * LINE_H + BUBBLE.pad * 2 - 1;
  const x = Math.max(4, Math.min(VIEW_W - w - 4, Math.round(ax - w / 2)));
  const y = ay + BUBBLE.tail;

  const dark = "#3b2314";
  const light = "#fffaf0";

  // cola (borde oscuro)
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - 5, y + 1);
  ctx.lineTo(ax + 5, y + 1);
  ctx.closePath();
  ctx.fill();

  // cuerpo con esquinas recortadas
  ctx.fillStyle = dark;
  ctx.fillRect(x + 1, y, w - 2, h);
  ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = light;
  ctx.fillRect(x + 2, y + 1, w - 4, h - 2);
  ctx.fillRect(x + 1, y + 2, w - 2, h - 4);

  // cola (relleno claro, tapa la unión con el borde)
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.moveTo(ax, ay + 3);
  ctx.lineTo(ax - 3, y + 2);
  ctx.lineTo(ax + 3, y + 2);
  ctx.closePath();
  ctx.fill();

  drawLines(ctx, x + BUBBLE.pad, y + BUBBLE.pad);
  drawArrow(ctx, x + w - 12, y + h - 8);
}

// origin: esquina de la habitación en pantalla (para las burbujas)
export function drawDialogue(ctx, origin) {
  if (!current) return;
  if (current.bubble) drawBubble(ctx, origin);
  else drawBox(ctx);
}
