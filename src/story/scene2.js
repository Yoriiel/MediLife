// Escena 2: la comida de los gatos (la nevera)

import { ask, say } from "../engine/dialogue.js";
import { addItem } from "../engine/inventory.js";
import { playFridge } from "../engine/sfx.js";
import { setFlag } from "./events.js";
import { setObjective } from "./objectives.js";

// Cuántas salchichas se toman de la nevera
const SAUSAGES = 2;

function takeSausages() {
  playFridge(); // sonido de la nevera (x2)
  let taken = 0;
  for (let i = 0; i < SAUSAGES; i++) if (addItem("sausage")) taken++;
  if (taken !== SAUSAGES) return;

  setFlag("sausagesTaken"); // la nevera ya no pregunta más

  // Medi lo dice enseguida; al terminar, la misión pasa a "salir a dárselas" (el "!" va a la puerta de la calle)
  say("scene2.goOutside", () => {
    setObjective("mission1b");
  });
}

// "Sí" (opción 0) toma las salchichas; "No" no hace nada y la jugadora queda libre
export function startFridge() {
  ask("scene2.fridgePrompt", ["choice.yes", "choice.no"], (index) => {
    if (index === 0) takeSausages();
  });
}
