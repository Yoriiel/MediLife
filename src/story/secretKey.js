// Misión secreta "Encuentra la llave escondida" (la activa story/ending.js después de los créditos).
// Mientras esa misión esté activa y Medi NO tenga la llave ("keyTaken"), cuenta el tiempo de juego:
// solo corre mientras Medi puede moverse (sin diálogos, fundidos ni cambios de habitación; la pausa y los
// créditos no llegan aquí). Al cumplirse SECRET_HINT_SECONDS, Medi dice una vez una pista en una burbuja
// sobre su cabeza ("secret.hintGarden") y se marca "secretHintShown".

import { say, isDialogueActive } from "../engine/dialogue.js";
import { isFading } from "../engine/fade.js";
import { isTransitioning } from "../engine/world.js";
import { getImage } from "../engine/assets.js";
import { getCarried, CARRY_ITEMS } from "../engine/carry.js";
import { CARRY_UI } from "../config.js";
import { player, SPRITE } from "../entities/player.js";
import { hasFlag, setFlag } from "./events.js";
import { getObjective, setObjective } from "./objectives.js";

const SECRET_MISSION = "missionSecret";
const SECRET_HINT_SECONDS = 25; // segundos de juego con la misión secreta activa y sin la llave antes de mostrar la pista

let elapsed = 0; // segundos de juego con la misión secreta activa y sin la llave

// Burbuja sobre la cabeza de Medi (si lleva algo encima, como el ramo, sale por encima de ese objeto)
function mediBubble() {
  let y = player.y + player.h - SPRITE.feetY + CARRY_UI.headY;
  const carried = getCarried();
  if (carried) {
    const img = getImage(CARRY_ITEMS[carried].image);
    if (img) y -= CARRY_UI.gap + Math.round(img.height * CARRY_UI.scale);
  }
  return { x: Math.round(player.x + player.w / 2), y: y - 2, above: true };
}

// Se llama en cada cuadro de juego (main.js)
export function updateSecretHint(dt) {
  // Medi ya tomó la llave (en el exterior, durante la misión secreta): la misión se completa y sale del HUD
  if (getObjective() === SECRET_MISSION && hasFlag("keyTaken")) {
    setObjective(null);
    return;
  }
  if (getObjective() !== SECRET_MISSION || hasFlag("keyTaken") || hasFlag("secretHintShown")) return;
  if (isDialogueActive() || isFading() || isTransitioning()) return; // el tiempo no corre en diálogos ni fundidos

  elapsed += dt;
  if (elapsed < SECRET_HINT_SECONDS) return;

  setFlag("secretHintShown"); // solo una vez
  say("secret.hintGarden", null, { bubble: mediBubble() });
}
