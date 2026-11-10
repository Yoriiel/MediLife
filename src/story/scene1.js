// Escena 1: La mañana y el hambre de Pacho
//
// 1. Pantalla negra que se aclara. Medi dice "Me desperté".
// 2. Medi camina hacia el centro del cuarto.
// 3. Al entrar en la zona del centro, los maullidos salen de la ventana (burbuja)
//    y Medi dice "Necio, Pacho tiene hambre...". Aparece la misión 1.

import { fadeFromBlack } from "../engine/fade.js";
import { say } from "../engine/dialogue.js";
import { setObjective } from "./objectives.js";

// Punta de la cola de la burbuja: parte baja de la ventana (coordenadas de la habitación)
const WINDOW_ANCHOR = { x: 124, y: 46 };

// Zona del centro del cuarto que activa los maullidos (coordenadas de la habitación)
const MEOW_ZONE = { x: 120, y: 86, w: 150, h: 110 };

let stage = "idle"; // idle -> intro -> explore -> meow -> done

export function startScene1() {
  stage = "intro";
  // La pantalla empieza negra y se va aclarando; luego ella habla
  fadeFromBlack(2.5, () => {
    say("scene1.wake", () => {
      stage = "explore";
    });
  });
}

// Se llama en cada cuadro con la jugadora
export function updateScene1(player, room) {
  if (stage !== "explore" || room.id !== "cuarto") return;

  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  const inside =
    cx >= MEOW_ZONE.x && cx <= MEOW_ZONE.x + MEOW_ZONE.w &&
    cy >= MEOW_ZONE.y && cy <= MEOW_ZONE.y + MEOW_ZONE.h;
  if (!inside) return;

  stage = "meow";
  say(
    "scene1.meow",
    () => {
      say("scene1.hungry", () => {
        setObjective("mission1");
        stage = "done";
      });
    },
    { bubble: WINDOW_ANCHOR }
  );
}
