// Final del juego: después de la primera acción con Yori (Besar / Slap / Morder), al cerrar su menú
// la pantalla se funde a negro y salen los créditos (engine/credits.js). Solo pasa una vez ("creditsShown").
//
// DESPUÉS DE LOS CRÉDITOS (si Medi aún no tomó la llave, marca "keyTaken"):
//   Al volver al juego, Yori dice dos cosas en una burbuja sobre su cabeza y se activa la misión secreta
//   "Encuentra la llave escondida" (textos: secret.notOver, secret.hintChest y missionSecret en i18n).
//   Si la llave ya estaba tomada, no pasa nada de esto.

import { hasFlag, setFlag } from "./events.js";
import { setObjective } from "./objectives.js";
import { say } from "../engine/dialogue.js";
import { fadeToBlack, fadeFromBlack } from "../engine/fade.js";
import { startCredits } from "../engine/credits.js";
import { playMusic, stopMusic } from "../engine/audio.js";
import plantabaja from "../rooms/plantabaja.js";

const YORI_SPRITE = "yori";
// Mismas medidas que en story/scene7.js: pies de Yori dentro de su cuadro y altura de su cabeza
const YORI_FEET = { x: 16, y: 27 };
const YORI_HEAD_ABOVE = 21;
const SECRET_MISSION = "missionSecret";

// Burbuja sobre la cabeza de Yori (en la planta baja, donde está él)
function yoriBubble() {
  const o = plantabaja.objects.find((obj) => obj.sprite === YORI_SPRITE);
  if (!o) return undefined;
  const feetX = o.x + YORI_FEET.x;
  const feetY = o.y + YORI_FEET.y;
  return { x: feetX, y: feetY - YORI_HEAD_ABOVE - 2, above: true };
}

// Al volver de los créditos: si no tiene la llave, Yori le habla y empieza la misión secreta
function startSecretMission() {
  if (hasFlag("keyTaken")) return;
  setObjective(SECRET_MISSION);
  say(["secret.notOver", "secret.hintChest"], null, { bubble: yoriBubble() });
}

export function startEnding() {
  if (hasFlag("creditsShown")) return;
  setFlag("creditsShown");
  fadeToBlack(1.2, () => {
    playMusic("ending"); // canción de los créditos (public/audio/endingsong.mp3); su volumen se ajusta en audio.js
    startCredits(() => {
      stopMusic(1.5); // se apaga con un fundido al acabar los créditos
      fadeFromBlack(1.2, startSecretMission); // vuelve al juego; luego saldrá el menú Seguir explorando / Volver al menú
    });
  });
}
