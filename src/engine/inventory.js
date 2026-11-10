// Inventario: espacios fijos (uno por objeto) dibujados en pantalla, fuera del mapa.
// Tamaño y posición: INVENTORY_UI en src/config.js. Objetos nuevos: añádelos a ITEMS.

import { VIEW_W, VIEW_H, INVENTORY_UI } from "../config.js";
import { getImage } from "./assets.js";

// id del objeto -> imagen (carpetas dentro de public/)
export const ITEMS = {
  pizza: { image: "objects/pizza" },
  banana: { image: "objects/banana" },
  sausage: { image: "objects/sausage" },
};

const slots = new Array(INVENTORY_UI.slots).fill(null);

// Guarda un objeto en el primer espacio libre. Devuelve false si no existe o no hay espacio.
export function addItem(id) {
  if (!ITEMS[id]) {
    console.warn("Objeto desconocido en el inventario:", id);
    return false;
  }
  const i = slots.indexOf(null);
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
    const img = getImage(ITEMS[id].image);
    const inner = s - 4; // margen de 2 px dentro del espacio
    const k = Math.min(inner / img.width, inner / img.height, 1);
    const w = Math.max(1, Math.round(img.width * k));
    const h = Math.max(1, Math.round(img.height * k));
    ctx.drawImage(img, x + Math.round((s - w) / 2), y0 + Math.round((s - h) / 2), w, h);
  }
}
