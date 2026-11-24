// Menú de pausa: se abre con Escape o con el botón de 3 rayitas de la esquina superior derecha.

import { FONT_FAMILY, VIEW_W, VIEW_H } from "../config.js";
import { t } from "../i18n/index.js";
import { wasPressed, getMouse } from "../engine/input.js";
import { createMenu, updateMenu, drawMenu } from "./ui.js";
import { buildOptionsItems } from "./options.js";

// Botón de la esquina (píxeles de pantalla 320x240)
const BUTTON = { w: 18, h: 16, margin: 4 };
const BUTTON_RECT = { x: VIEW_W - BUTTON.margin - BUTTON.w, y: BUTTON.margin, w: BUTTON.w, h: BUTTON.h };

let paused = false;
let confirmQuit = false; // true tras el primer clic en "Salir": el segundo sí sale

function closePause() {
  paused = false;
  confirmQuit = false;
}

const items = [
  { type: "button", label: () => t("pause.resume"), onSelect: closePause },
  ...buildOptionsItems(),
  {
    type: "button",
    label: () => t(confirmQuit ? "pause.quitConfirm" : "pause.quit"),
    onSelect: () => {
      if (confirmQuit) window.location.reload(); // recargar deja todo limpio y vuelve al menú principal
      else confirmQuit = true;
    },
  },
];
const quitIndex = items.length - 1;

const menu = createMenu({ y: 56, w: 190, rowH: 20, onBack: closePause, items });

function inButton(m) {
  const pad = 2;
  return (
    m.x >= BUTTON_RECT.x - pad && m.x <= BUTTON_RECT.x + BUTTON_RECT.w + pad &&
    m.y >= BUTTON_RECT.y - pad && m.y <= BUTTON_RECT.y + BUTTON_RECT.h + pad
  );
}

export function isPaused() {
  return paused;
}

export function tryOpenPause(dialogueActive) {
  const m = getMouse();
  const byKey = wasPressed("escape") && !dialogueActive;
  const byButton = m.pressed && inButton(m);
  if (!byKey && !byButton) return false;
  paused = true;
  confirmQuit = false;
  menu.index = 0;
  return true;
}

export function updatePauseMenu() {
  const m = getMouse();
  if (m.pressed && inButton(m)) {
    closePause(); // el botón también cierra la pausa
    return;
  }
  updateMenu(menu);
  if (menu.index !== quitIndex) confirmQuit = false; // al moverse a otra fila se cancela la confirmación
}

// Las 3 rayitas (se ilumina al pasar el mouse o con la pausa abierta)
export function drawPauseButton(ctx) {
  const r = BUTTON_RECT;
  const lit = paused || inButton(getMouse());
  ctx.save();
  ctx.fillStyle = "rgba(59, 35, 20, 0.85)";
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = lit ? "#c68642" : "#f5deb3";
  for (let i = 0; i < 3; i++) ctx.fillRect(r.x + 4, r.y + 3 + i * 4, 10, 2);
  ctx.restore();
}

export function drawPauseMenu(ctx) {
  if (!paused) return;
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = "#3b2314";
  ctx.fillText(t("pause.title"), VIEW_W / 2 + 1, 32 + 1);
  ctx.fillStyle = "#f5deb3";
  ctx.fillText(t("pause.title"), VIEW_W / 2, 32);
  ctx.restore();
  drawMenu(ctx, menu);
}
