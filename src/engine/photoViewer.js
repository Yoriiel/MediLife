import { VIEW_W, VIEW_H, FONT_FAMILY } from "../config.js";
import { t } from "../i18n/index.js";
import { getImage } from "./assets.js";
import { getMouse, wasPressed } from "./input.js";

const FRAME = { margin: 12 };                      // distancia entre el marco y el borde de la pantalla
const TOP_ROW = 20;                                 // alto reservado arriba para la X
const CLOSE = { size: 14 };                         // X en la esquina superior derecha del marco
const BUTTON = { w: 110, h: 16, bottom: 6 };        // botón "Descargar foto", centrado abajo
const COLORS = { paper: "#f5deb3", ink: "#3b2314", shade: "rgba(0, 0, 0, 0.6)" };
const CLOSE_KEYS = ["escape", "enter", " ", "e"];

let active = null; // { image, downloadName } mientras el visor está abierto

export function openPhotoViewer(opts) {
  active = { image: opts.image, downloadName: opts.downloadName || "foto.png" };
}

export function isPhotoViewerActive() {
  return !!active;
}

function frameRect() {
  return {
    x: FRAME.margin,
    y: FRAME.margin,
    w: VIEW_W - FRAME.margin * 2,
    h: VIEW_H - FRAME.margin * 2,
  };
}

function closeRect(r) {
  return { x: r.x + r.w - CLOSE.size - 4, y: r.y + 4, w: CLOSE.size, h: CLOSE.size };
}

function buttonRect(r) {
  return { x: r.x + (r.w - BUTTON.w) / 2, y: r.y + r.h - BUTTON.h - BUTTON.bottom, w: BUTTON.w, h: BUTTON.h };
}

// Área donde cabe la imagen: debajo de la X y encima del botón
function imageArea(r) {
  const b = buttonRect(r);
  return { x: r.x + 8, y: r.y + TOP_ROW, w: r.w - 16, h: b.y - (r.y + TOP_ROW) - 6 };
}

function inRect(m, q) {
  return m.x >= q.x && m.x <= q.x + q.w && m.y >= q.y && m.y <= q.y + q.h;
}

// Baja la imagen al dispositivo con un enlace temporal (funciona porque la imagen está en el mismo sitio)
function downloadImage(img, name) {
  const a = document.createElement("a");
  a.href = img.src;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Se llama en cada cuadro mientras el visor está abierto (main.js)
export function updatePhotoViewer() {
  if (!active) return;
  const m = getMouse();
  const r = frameRect();

  if (CLOSE_KEYS.some(wasPressed) || (m.pressed && inRect(m, closeRect(r)))) {
    active = null;
    return;
  }
  if (m.pressed && inRect(m, buttonRect(r))) {
    const img = getImage(active.image);
    if (img) downloadImage(img, active.downloadName);
  }
}

// Se dibuja por encima de todo (main.js)
export function drawPhotoViewer(ctx) {
  if (!active) return;
  const r = frameRect();

  ctx.save();
  ctx.fillStyle = COLORS.shade;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // marco y papel
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.ink;
  ctx.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3);

  // la imagen, centrada y sin deformarla
  const img = getImage(active.image);
  if (img) {
    const a = imageArea(r);
    const s = Math.min(a.w / img.width, a.h / img.height);
    const w = Math.round(img.width * s);
    const h = Math.round(img.height * s);
    ctx.imageSmoothingEnabled = true; // un dibujo a mano se ve mejor suavizado
    ctx.drawImage(img, Math.round(a.x + (a.w - w) / 2), Math.round(a.y + (a.h - h) / 2), w, h);
  }

  // X
  const c = closeRect(r);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.fillStyle = COLORS.paper;
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("X", c.x + c.w / 2, c.y + c.h / 2 + 0.5);

  // botón de descarga
  const b = buttonRect(r);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = COLORS.paper;
  ctx.font = `8px ${FONT_FAMILY}`;
  ctx.fillText(t("photo.download"), b.x + b.w / 2, b.y + b.h / 2 + 0.5);

  ctx.restore();
}
