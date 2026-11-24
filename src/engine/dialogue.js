import { VIEW_W, VIEW_H, FONT_FAMILY } from "../config.js";
import { t } from "../i18n/index.js";
import { wasPressed, getMouse } from "./input.js";
import { startTyping, stopTyping } from "./sfx.js";
import { getImage } from "./assets.js";

const FONT = `10px ${FONT_FAMILY}`;
const LINE_H = 12;
const BOX = { x: 8, y: VIEW_H - 64, w: VIEW_W - 16, h: 56, pad: 9 };
const BUBBLE = { maxTextW: 104, pad: 6, tail: 9 };
// Cuadro con imagen grande (opción image de say): margen alrededor de la imagen y separación con el texto
const IMAGE_BOX = { pad: 6, gap: 8, scale: 1 };
const CHARS_PER_SECOND = 35;
const ACTION_KEYS = [" ", "enter", "e"];
// Botón X (opción closeButton de ask): cuadrado de 12 px en la esquina superior derecha del cuadro,
// medio fuera del marco. size = tamaño; offX / offY = desplazamiento desde la esquina del cuadro.
const CLOSE_BTN = { size: 12, offX: 10, offY: 8 };

const measureCtx = document.createElement("canvas").getContext("2d");

let queue = [];
let current = null; // { key, text, lines, total, bubble, image, textW }
let shown = 0;      // caracteres visibles (con decimales)
let timer = 0;
let onEnd = null;
let options = null;
let choice = null; // { keys: [claves de las opciones], index, onSelect, keepOpen, onCancel } mientras hay una pregunta

// Imagen grande del cuadro actual (null si no hay o aún no cargó)
function boxImage() {
  return current && current.image ? getImage(current.image) || null : null;
}

// Tamaño en pantalla de la imagen del cuadro
function imageSize(img) {
  return { w: Math.round(img.width * IMAGE_BOX.scale), h: Math.round(img.height * IMAGE_BOX.scale) };
}

// Rectángulo del cuadro: el de siempre, o más alto si lleva una imagen grande (queda pegado abajo)
function boxRect() {
  const img = boxImage();
  if (!img) return BOX;
  const h = Math.max(BOX.h, imageSize(img).h + IMAGE_BOX.pad * 2);
  return { x: BOX.x, y: VIEW_H - 8 - h, w: BOX.w, h, pad: BOX.pad };
}

// Ancho disponible para el texto dentro del cuadro (menos si hay imagen a la derecha)
function boxTextWidth() {
  const img = boxImage();
  return BOX.w - BOX.pad * 2 - (img ? imageSize(img).w + IMAGE_BOX.pad + IMAGE_BOX.gap : 0);
}

// Rectángulo de la X, en la esquina superior derecha del cuadro
function closeRect(r) {
  return { x: r.x + r.w - CLOSE_BTN.offX, y: r.y - CLOSE_BTN.offY, w: CLOSE_BTN.size, h: CLOSE_BTN.size };
}

// ¿El punto (m.x, m.y) está dentro del rectángulo q?
function inRect(m, q) {
  return m.x >= q.x && m.x <= q.x + q.w && m.y >= q.y && m.y <= q.y + q.h;
}

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
  const hasImage = !!boxImage();
  if (current.text === text && current.hadImage === hasImage) return;

  current.text = text;
  current.hadImage = hasImage;
  const maxW = current.bubble ? BUBBLE.maxTextW : boxTextWidth();
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
    image: options && options.image ? options.image : null,
    hadImage: false,
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

export function ask(key, optionKeys, onSelect, opts) {
  say(key);
  choice = {
    keys: optionKeys,
    index: 0,
    onSelect,
    keepOpen: !!(opts && opts.keepOpen),
    onCancel: (opts && opts.onCancel) || null,
    closeButton: !!(opts && opts.closeButton && opts.onCancel), // la X solo tiene sentido con onCancel
  };
}

export function isDialogueActive() {
  return current !== null;
}

export function updateDialogue(dt) {
  stepDialogue(dt);
  // suena la escritura solo mientras se escribe (se corta al completar el texto o cerrar el cuadro)
  if (current && shown < current.total) startTyping();
  else stopTyping();
}

// Cierra una pregunta por cancelación (X, clic fuera o Escape) y llama a su onCancel
function cancelChoice() {
  const { onCancel } = choice;
  choice = null;
  current = null;
  queue = [];
  onEnd = null;
  options = null;
  onCancel();
}

function stepDialogue(dt) {
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
    // Las opciones y, si la hay, la X (último lugar del recorrido con las flechas)
    const n = choice.keys.length + (choice.closeButton ? 1 : 0);
    if (["arrowleft", "arrowup", "a", "w"].some(wasPressed)) choice.index = (choice.index + n - 1) % n;
    if (["arrowright", "arrowdown", "d", "s"].some(wasPressed)) choice.index = (choice.index + 1) % n;

    // Clic / toque en la X, clic / toque fuera del cuadro o Escape: cierran el menú si tiene onCancel
    if (choice.onCancel) {
      const m = getMouse();
      const r = boxRect();
      const onX = !!choice.closeButton && m.pressed && inRect(m, closeRect(r));
      const outside = m.pressed && !inRect(m, r);
      if (onX || outside || wasPressed("escape")) {
        cancelChoice();
        return;
      }
    }

    if (ACTION_KEYS.some(wasPressed)) {
      const { index, onSelect, keepOpen, closeButton } = choice;
      if (closeButton && index === choice.keys.length) {
        cancelChoice(); // la X tiene el foco: igual que cerrar con el clic fuera
        return;
      }
      if (keepOpen) {
        // el menú se queda abierto: solo avisa de la opción elegida
        if (onSelect) onSelect(index);
        return;
      }
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
function drawChoice(ctx, r) {
  if (!choice || shown < current.total) return;

  ctx.font = FONT;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#3b2314";

  const y = r.y + r.h - 22;
  let x = r.x + r.pad + 10; // deja sitio para el triángulo
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

// X en píxeles: borde oscuro, relleno claro (naranja si tiene el foco con las flechas)
function drawCloseButton(ctx, r) {
  const q = closeRect(r);
  const focused = choice.index === choice.keys.length;
  const m = 3; // margen interior de la X
  ctx.fillStyle = "#3b2314";
  ctx.fillRect(q.x, q.y, q.w, q.h);
  ctx.fillStyle = focused ? "#c68642" : "#fffaf0";
  ctx.fillRect(q.x + 1, q.y + 1, q.w - 2, q.h - 2);
  ctx.fillStyle = "#3b2314";
  const len = q.w - m * 2;
  for (let i = 0; i < len; i++) {
    ctx.fillRect(q.x + m + i, q.y + m + i, 1, 1);             // diagonal \
    ctx.fillRect(q.x + q.w - m - 1 - i, q.y + m + i, 1, 1);   // diagonal /
  }
}

function drawBox(ctx) {
  const r = boxRect();
  const img = boxImage();

  // marco estilo madera / pergamino
  ctx.fillStyle = "#3b2314";
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = "#c68642";
  ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
  ctx.fillStyle = "#f5deb3";
  ctx.fillRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);

  // imagen grande a la derecha, centrada de arriba a abajo
  if (img) {
    const s = imageSize(img);
    ctx.drawImage(img, r.x + r.w - IMAGE_BOX.pad - s.w, r.y + Math.round((r.h - s.h) / 2), s.w, s.h);
  }

  drawLines(ctx, r.x + r.pad, r.y + r.pad);
  if (choice) drawChoice(ctx, r);
  else drawArrow(ctx, img ? r.x + r.pad + boxTextWidth() - 8 : r.x + r.w - 16, r.y + r.h - 14);
  if (choice && choice.closeButton) drawCloseButton(ctx, r);
}

// Burbuja con cola: la cola apunta al punto (anchor); la burbuja queda debajo (o encima con above: true)
function drawBubble(ctx, origin, anchor, isLast) {
  const ax = Math.round(origin.x + anchor.x);
  const ay = Math.round(origin.y + anchor.y);
  const above = !!anchor.above;

  const w = Math.ceil(current.textW) + BUBBLE.pad * 2;
  const h = current.lines.length * LINE_H + BUBBLE.pad * 2 - 1;
  const x = Math.max(4, Math.min(VIEW_W - w - 4, Math.round(ax - w / 2 + (anchor.dx || 0))));
  const y = above ? ay - BUBBLE.tail - h : ay + BUBBLE.tail;

  // donde la cola se une al cuerpo (arriba del cuerpo, o abajo si la burbuja va encima)
  const baseDark = above ? y + h - 1 : y + 1;
  const baseLight = above ? y + h - 2 : y + 2;
  const tipLight = above ? ay - 3 : ay + 3;

  const dark = "#3b2314";
  const light = "#fffaf0";

  // cola (borde oscuro)
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - 5, baseDark);
  ctx.lineTo(ax + 5, baseDark);
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
  ctx.moveTo(ax, tipLight);
  ctx.lineTo(ax - 3, baseLight);
  ctx.lineTo(ax + 3, baseLight);
  ctx.closePath();
  ctx.fill();

  drawLines(ctx, x + BUBBLE.pad, y + BUBBLE.pad);
  if (isLast) drawArrow(ctx, x + w - 12, y + h - 8); // la flecha solo en la última burbuja
}

// origin: esquina de la habitación en pantalla (para las burbujas)
export function drawDialogue(ctx, origin) {
  if (!current) return;
  if (current.bubble) {
    const anchors = Array.isArray(current.bubble) ? current.bubble : [current.bubble];
    anchors.forEach((a, i) => drawBubble(ctx, origin, a, i === anchors.length - 1));
  } else drawBox(ctx);
}
