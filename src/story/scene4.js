// Escena 4: la bata y la ducha (misión 3)

import { ask, say } from "../engine/dialogue.js";
import { fadeToBlack, fadeFromBlack } from "../engine/fade.js";
import { setCarried, clearCarried } from "../engine/carry.js";
import { playSfx } from "../engine/sfx.js";
import { setFlag } from "./events.js";
import { startPartySurprise } from "./scene6.js";
import { setObjective } from "./objectives.js";

const FADE_OUT = 0.6;  // segundos hasta quedar en negro
const BLACK_HOLD = 1.2; // segundos que se queda en negro
const FADE_IN = 0.6;   // segundos para volver

function takeBathrobe() {
  playSfx("bathrobe"); // al tomar la bata (sin sonido de armario)
  setCarried("bathrobe"); // la lleva flotando sobre la cabeza
  setFlag("bathrobeTaken"); // tacha la tarea y oculta el "!"
}

// "Sí" (opción 0) toma la bata; "No" no hace nada y la jugadora queda libre
export function startWardrobe() {
  ask("scene4.wardrobePrompt", ["choice.yes", "choice.no"], (index) => {
    if (index === 0) takeBathrobe();
  });
}

function takeShower() {
  fadeToBlack(
    FADE_OUT,
    () => {
      clearCarried(); // deja la bata para ducharse: desaparece de su cabeza
      setFlag("showerDone");  // ya no vuelve a preguntar y el "!" se oculta
      fadeFromBlack(FADE_IN, () => {
        setObjective(null); // desaparece la leyenda de la misión
        say("scene4.clean", () => {
          playSfx("horn"); // cornetas justo después de "Limpiecita"
          startPartySurprise(); // empieza la sorpresa (scene6.js)
        });
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
