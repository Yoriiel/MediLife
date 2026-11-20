// Objeto que Medi lleva flotando sobre la cabeza (con un vaivén suave, como el signo "!").
// Se ajusta en CARRY_UI (src/config.js). Objetos nuevos: añádelos a CARRY_ITEMS.
// Para probar desde la consola: carry.set("bathrobe") / carry.clear()

import { CARRY_UI } from "../config.js";
import { getImage } from "./assets.js";

// id del objeto -> imagen (carpetas dentro de public/)
export const CARRY_ITEMS = {
  bathrobe: { image: "objects/bathrobe" },
  roses: { image: "objects/roseshead" }, // el ramo que le da Yori (story/scene7.js)
};

let carried = null;

// Medi pasa a llevar este objeto (reemplaza al anterior). Devuelve false si no existe.
export function setCarried(id) {
  if (!CARRY_ITEMS[id]) {
    console.warn("Objeto desconocido para llevar:", id);
    return false;
  }
  carried = id;
  return true;
}

export function clearCarried() {
  carried = null;
}

export function getCarried() {
  return carried;
}

export function isCarrying(id) {
  return carried === id;
}

// Se llama desde drawPlayer: x = centro de la jugadora, headTop = fila de pantalla donde empieza su cabeza
export function drawCarried(ctx, x, headTop) {
  if (!carried) return;
  const img = getImage(CARRY_ITEMS[carried].image);
  const w = Math.max(1, Math.round(img.width * CARRY_UI.scale));
  const h = Math.max(1, Math.round(img.height * CARRY_UI.scale));
  const bob = Math.round(Math.sin((performance.now() / 1000) * CARRY_UI.bobSpeed) * CARRY_UI.bobAmplitude);
  ctx.drawImage(img, Math.round(x - w / 2), headTop - CARRY_UI.gap - h + bob, w, h);
}
