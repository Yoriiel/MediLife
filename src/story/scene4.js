// Escena 4: la bata y la ducha (misión 3)
//
// 0. En el cuarto, al pararse frente al wardrobe sale "¿Tomar bata de baño?" con "Sí" / "No".
//    Con "Sí", Medi se pone la bata flotando sobre la cabeza y se tacha la primera tarea. Con "No" puede irse y,
//    al salir y volver a entrar en la zona, la pregunta vuelve a salir.
// 1. Medi llega al borde del baño y aparece la pregunta "¿Darse una ducha?" con "Sí" / "No".
//    Si elige "No", puede irse; al volver a pararse en la zona (salir y entrar de nuevo),
//    la pregunta vuelve a aparecer mientras la misión de la ducha siga activa.
//    La ducha solo funciona si ya tomó la bata (misión 3).
// 2. Con "Sí", la pantalla se pone en negro (un momento) y vuelve; la bata desaparece de su cabeza.
// 3. Medi dice "Limpiecita" y la misión 3 termina.
// 4. Al cerrar ese cuadro empieza la fiesta sorpresa (story/scene6.js).

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
const BATHROBE_DELAY = 0.6; // segundos entre el sonido del armario y el de la bata

function takeBathrobe() {
  playSfx("closet"); // abre el armario
  playSfx("bathrobe", BATHROBE_DELAY); // y luego toma la bata
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
