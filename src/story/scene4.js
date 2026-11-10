// Escena 4: la ducha (puerta del baño en la planta baja)
//
// 1. Medi llega al borde del baño y aparece la pregunta "¿Darse una ducha?" con "Sí" / "No".
//    Si elige "No", puede irse; al volver a pararse en la zona (salir y entrar de nuevo),
//    la pregunta vuelve a aparecer mientras la misión de la ducha siga activa.
// 2. Con "Sí", la pantalla se pone en negro (un momento) y vuelve.
// 3. Medi dice "Limpiecita".

import { ask, say } from "../engine/dialogue.js";
import { fadeToBlack, fadeFromBlack } from "../engine/fade.js";

const FADE_OUT = 0.6;  // segundos hasta quedar en negro
const BLACK_HOLD = 1.2; // segundos que se queda en negro
const FADE_IN = 0.6;   // segundos para volver

function takeShower() {
  fadeToBlack(
    FADE_OUT,
    () => {
      fadeFromBlack(FADE_IN, () => {
        say("scene4.clean");
      });
    },
    BLACK_HOLD
  );
}

// "Sí" (opción 0) toma la ducha; "No" no hace nada y la jugadora queda libre
export function startShower() {
  ask("scene4.prompt", ["choice.yes", "choice.no"], (index) => {
    if (index === 0) takeShower();
  });
}
