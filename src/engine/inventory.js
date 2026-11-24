import { VIEW_W, VIEW_H, INVENTORY_UI } from "../config.js";
import { getImage } from "./assets.js";

// id del objeto -> imagen (carpetas dentro de public/)
export const ITEMS = {
  pizza: { image: "objects/pizza" },
  banana: { image: "objects/banana" },
  cucumber: { image: "objects/cucumber" },
  sausage: { image: "objects/sausage" },
  key: { image: "objects/key", trim: true },
};

const slots = new Array(INVENTORY_UI.slots).fill(null);

export function addItem(id, slot) {
  if (!ITEMS[id]) {
    console.warn("Objeto desconocido en el inventario:", id);
    return false;
  }
  let i = -1;
  if (slot !== undefined) {
    const want = slot < 0 ? slots.length + slot : slot;
    if (want >= 0 && want < slots.length && slots[want] === null) i = want;
  }
  if (i === -1) i = slots.indexOf(null);
  if (i === -1) return false;
  slots[i] = id;
  return true;
}

// Quita el objeto (si lo tiene). Devuelve true si lo quitó.
export function removeItem(id) {
  const i = slots.indexOf(id);
  if (i === -1) return false;
  slots[i] = null;
  return true;
}

export function hasItem(id) {
  return slots.includes(id);
}

// Parte visible (no transparente) de una imagen, para los objetos con `trim: true`. Se calcula una sola vez por imagen.
const trimCache = {};
function getTrimBox(name, img) {
  if (trimCache[name]) return trimCache[name];
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (d[(y * c.width + x) * 4 + 3] === 0) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  // imagen totalmente transparente: se usa entera
  trimCache[name] = x1 < 0 ? { x: 0, y: 0, w: c.width, h: c.height } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  return trimCache[name];
}

export function drawInventory(ctx) {
  const { slotSize: s, gap, slots: n } = INVENTORY_UI;
  const totalW = n * s + (n - 1) * gap;
  const x0 = INVENTORY_UI.x ?? Math.round((VIEW_W - totalW) / 2); // null = centrado
  const y0 = INVENTORY_UI.y ?? VIEW_H - s - 1; // null = pegado abajo

  for (let i = 0; i < n; i++) {
    const x = x0 + i * (s + gap);

    ctx.fillStyle = "rgba(59, 35, 20, 0.85)";
    ctx.fillRect(x, y0, s, s);
    ctx.strokeStyle = "#f5deb3";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y0 + 0.5, s - 1, s - 1);

    const id = slots[i];
    if (!id) continue;
    const item = ITEMS[id];
    const img = getImage(item.image);
    const inner = s - 4; // margen de 2 px dentro del espacio
    const box = item.trim ? getTrimBox(item.image, img) : { x: 0, y: 0, w: img.width, h: img.height };
    const k = Math.min(inner / box.w, inner / box.h, 1);
    const w = Math.max(1, Math.round(box.w * k));
    const h = Math.max(1, Math.round(box.h * k));
    ctx.drawImage(img, box.x, box.y, box.w, box.h, x + Math.round((s - w) / 2), y0 + Math.round((s - h) / 2), w, h);
  }
}
