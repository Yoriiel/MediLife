// Escena 2: la comida de los gatos (la nevera)
//
// 1. Con la misión 1 activa, al acercarse a la nevera aparece la pregunta "¿Tomar salchichas?"
//    con "Sí" / "No".
//    Si elige "No", puede alejarse; al volver a entrar en la zona de la nevera (salir y entrar de nuevo),
//    la pregunta vuelve a aparecer mientras no haya tomado las salchichas.
// 2. Con "Sí", las 2 salchichas pasan al inventario (una en cada hueco). No hace falta tocar el
//    inventario: solo se muestran.
// 3. Enseguida Medi dice "Iré afuera a dárselas" y la misión cambia a "mission1b":
//    el signo "!" pasa de la nevera a la puerta de la calle (planta baja).

import { ask, say } from "../engine/dialogue.js";
import { addItem } from "../engine/inventory.js";
import { setFlag } from "./events.js";
import { setObjective } from "./objectives.js";

// Cuántas salchichas se toman de la nevera
const SAUSAGES = 2;

function takeSausages() {
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
