// Escena 1: La mañana y el hambre de Pacho
//
// 0. Tarjeta de fecha: negro medio transparente con "1 de Diciembre..." en blanco, centrado.
// 1. La pantalla se aclara. Medi dice "Me desperté".
// 2. Medi camina hacia el centro del cuarto.
// 3. Al entrar en la zona del centro, los maullidos salen de la ventana (burbuja)
//    y Medi dice "Necio, Pacho tiene hambre...". Aparece la misión 1.
// 4. La primera vez que baja por las escaleras a la planta baja, Medi dice "wtf, esta no es mi casa"
//    y justo después "yoyel tonti kxx" (marca "downstairsSaid": solo pasa una vez).

import { fadeTo, setFadeText, isFading } from "../engine/fade.js";
import { say, isDialogueActive } from "../engine/dialogue.js";
import { isTransitioning } from "../engine/world.js";
import { setObjective } from "./objectives.js";
import { hasFlag, setFlag } from "./events.js";
import { playSfx } from "../engine/sfx.js";

// Punta de la cola de la burbuja: parte baja de la ventana (coordenadas de la habitación)
const WINDOW_ANCHOR = { x: 124, y: 46 };

// Zona del centro del cuarto que activa los maullidos (coordenadas de la habitación)
const MEOW_ZONE = { x: 120, y: 86, w: 150, h: 110 };

// Tarjeta de fecha: alpha = qué tan negra queda (0 a 1), fadeIn / fadeOut = segundos, hold = segundos que se queda
const DATE_CARD = { alpha: 0.6, fadeIn: 1.2, hold: 3, fadeOut: 1.5 };

let stage = "idle"; // idle -> intro -> explore -> meow -> done

export function startScene1() {
  stage = "intro";
  // Desde negro total pasa al negro medio transparente con la fecha; luego se aclara y ella habla
  setFadeText("scene1.date", DATE_CARD.alpha);
  fadeTo(DATE_CARD.alpha, DATE_CARD.fadeIn, () => {
    fadeTo(0, DATE_CARD.fadeOut, () => {
      setFadeText(null);
      say("scene1.wake", () => {
        stage = "explore";
      });
    });
  }, DATE_CARD.hold);
}

// Se llama en cada cuadro con la jugadora
export function updateScene1(player, room) {
  // Primera vez en la planta baja (solo se llega bajando la escalera): espera a que termine el fundido
  if (room.id === "plantabaja" && !hasFlag("downstairsSaid") && !isFading() && !isTransitioning() && !isDialogueActive()) {
    setFlag("downstairsSaid");
    say(["scene1.downstairs1", "scene1.downstairs2"]);
    return;
  }

  if (stage !== "explore" || room.id !== "cuarto") return;

  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  const inside =
    cx >= MEOW_ZONE.x && cx <= MEOW_ZONE.x + MEOW_ZONE.w &&
    cy >= MEOW_ZONE.y && cy <= MEOW_ZONE.y + MEOW_ZONE.h;
  if (!inside) return;

  stage = "meow";
  playSfx("meow"); // maullido de los gatos desde la ventana
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
