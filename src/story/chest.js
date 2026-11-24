// Cofre del cuarto de Medi (rooms/cuarto.js, trigger type "chest").
//   Sin la llave ("keyTaken") y sin abrir: al entrar en la zona sale "Está cerrado con llave".
//   Con la llave y sin abrir: al entrar en la zona sale el cuadro "¿Abrir cofre?" con Sí / No.
//     Sí -> la llave desaparece del inventario, el cofre queda abierto ("chestOpened") y se muestra el dibujo.
//     No -> se cierra el cuadro (al volver a entrar, vuelve a preguntar).
//   Ya abierto: encima del cofre sale "Abrir" mientras Medi está en la zona; al presionar Espacio, Enter, E
//     o el botón A (táctil) se muestra el dibujo. Ya no hace falta la llave.
//   El visor del dibujo (engine/photoViewer.js) tiene una X para cerrarlo y un botón para descargar la foto.

import { say, ask, isDialogueActive } from "../engine/dialogue.js";
import { isFading } from "../engine/fade.js";
import { isTransitioning } from "../engine/world.js";
import { loadAssets } from "../engine/assets.js";
import { wasPressed } from "../engine/input.js";
import { removeItem } from "../engine/inventory.js";
import { openPhotoViewer, isPhotoViewerActive } from "../engine/photoViewer.js";
import { t } from "../i18n/index.js";
import { FONT_FAMILY } from "../config.js";
import { player } from "../entities/player.js";
import { hasFlag, setFlag } from "./events.js";

// Dibujo de Medi: archivo public/photos/medi-dibujo.png (cambia la ruta aquí si lo nombras distinto)
const CHEST_PHOTO = "photos/medi-dibujo";
const CHEST_PHOTO_NAME = "Medi-dibujo.png"; // nombre con el que se descarga

// Cofre en la habitación (mismas medidas que en rooms/cuarto.js: sprite en x 23, y 86; 24x20)
const CHEST = { x: 23, y: 86, w: 24, h: 20 };
const KEY_ITEM = "key";
const ACTION_KEYS = [" ", "enter", "e"];

let near = false; // Medi está en la zona del cofre y el cofre ya está abierto (sale "Abrir")

// Se carga aparte (no en requiredAssets): si el archivo aún no existe, el juego sigue funcionando
loadAssets([CHEST_PHOTO]).catch((err) => console.warn("No se pudo cargar el dibujo de Medi:", err));

function showPhoto() {
  setFlag("drawingSeen"); // Medi ya vio el dibujo: Yori lo comenta después (story/scene7.js, parte 8)
  openPhotoViewer({ image: CHEST_PHOTO, downloadName: CHEST_PHOTO_NAME });
}

// Se llama al ENTRAR en la zona del cofre (engine/triggers.js)
export function openChest() {
  if (hasFlag("chestOpened")) return; // ya abierto: el aviso "Abrir" y updateChest se encargan
  if (!hasFlag("keyTaken")) {
    say("chest.locked");
    return;
  }
  ask("chest.askOpen", ["chest.yes", "chest.no"], (index) => {
    if (index !== 0) return; // No: se cierra el cuadro y no pasa nada
    removeItem(KEY_ITEM); // la llave se gasta al abrir el cofre
    setFlag("chestOpened");
    showPhoto();
  });
}

// ¿Medi está dentro de la zona "chest" de la habitación?
function insideChestZone(room) {
  const trig = (room.triggers || []).find((tr) => tr.type === "chest");
  if (!trig) return false;
  const [zx, zy, zw, zh] = trig.zone;
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  return cx >= zx && cx <= zx + zw && cy >= zy && cy <= zy + zh;
}

// Se llama en cada cuadro de juego (main.js): aviso "Abrir" y abrir con el teclado / botón A
export function updateChest(room) {
  near = hasFlag("chestOpened") && insideChestZone(room);
  if (!near) return;
  if (isDialogueActive() || isFading() || isTransitioning() || isPhotoViewerActive()) return;
  if (ACTION_KEYS.some(wasPressed)) showPhoto();
}

// Aviso "Abrir" encima del cofre (origen = desplazamiento de la habitación en pantalla, como drawBreakfastHint)
export function drawChestHint(ctx, origin) {
  if (!near) return;
  ctx.save();
  ctx.font = `8px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  const text = t("chest.open");
  const w = Math.ceil(ctx.measureText(text).width) + 8;
  const cx = origin.x + CHEST.x + CHEST.w / 2;
  const top = origin.y + CHEST.y - 14;
  const x = Math.max(2, Math.min(320 - w - 2, Math.round(cx - w / 2)));
  ctx.fillStyle = "#3b2314";
  ctx.fillRect(x, top, w, 12);
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(x + 1, top + 1, w - 2, 10);
  ctx.fillStyle = "#3b2314";
  ctx.fillText(text, x + 4, top + 2);
  ctx.restore();
}
