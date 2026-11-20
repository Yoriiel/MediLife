// Escena 6: la fiesta sorpresa
//
// 1. Justo después de "Limpiecita" (story/scene4.js llama a startPartySurprise), Medi camina sola
//    hasta la izquierda de la mesa del pastel (engine/autowalk.js) y se queda mirando hacia la mesa.
// 2. Aparecen los cuadros de Yori y la familia: "¡Sorpresaaaaaa!", "Feliz Cumpleaños Mediiii"
//    y "Te hicimos una fiesta de cumpleaños... ¿te gusta?".
// 3. Medi responde: "Siii, me encantaaa!!!", "Gachiassss mi vidaaa!!!" y "Vengasheee!!!"
//    (los dos últimos no se traducen).
// El pastel, los banners y los sprites de la fiesta ya se ven desde que termina la ducha
// (showIf: "showerDone" en rooms/plantabaja.js).
// La marca "partyDone" queda activa al terminar (por si más adelante hay una escena final).

import { say } from "../engine/dialogue.js";
import { walkTo } from "../engine/autowalk.js";
import { player, SPRITE } from "../entities/player.js";
import { CARRY_UI } from "../config.js";
import { playSfx } from "../engine/sfx.js";
import { hasFlag, setFlag } from "./events.js";

// Dónde se detiene Medi: esquina superior izquierda de su caja de pies (coordenadas de la habitación).
// Ajústalo a tu gusto: queda a la izquierda de la mesa y mirando hacia ella.
const STAND_AT = { x: 85, y: 110 };
const STAND_FACING = "right";

// true = las frases de Medi salen en una burbuja sobre su cabeza (así se distingue de la familia,
// que habla en el cuadro de abajo). false = todas en el cuadro de abajo.
const MEDI_BUBBLE = true;

// Burbuja sobre la cabeza de Medi (la cola apunta a su cabeza)
function mediBubble() {
  const x = Math.round(player.x + player.w / 2);
  const headTop = Math.round(player.y + player.h - SPRITE.feetY + CARRY_UI.headY);
  return { x, y: headTop - 2, above: true };
}

export function startPartySurprise() {
  walkTo(STAND_AT, () => {
    // la canción empieza al llegar a la mesa, sigue durante los diálogos y suena una sola vez
    if (!hasFlag("birthdaySongPlayed")) {
      setFlag("birthdaySongPlayed");
      playSfx("birthday");
    }
    // la familia grita
    say(["scene6.surprise1", "scene6.surprise2", "scene6.you"], () => {
      // Medi responde
      say(
        ["scene6.she1", "scene6.she2", "scene6.she3"],
        () => setFlag("partyDone"),
        MEDI_BUBBLE ? { bubble: mediBubble() } : undefined
      );
    });
  }, STAND_FACING);
}
