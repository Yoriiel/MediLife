// Escena 7: después de la fiesta, Medi y Yori (el final del juego)
//
// PARTE 1 — Yori te habla
//   Cuando termina la fiesta (marca "partyDone", la pone story/scene6.js) y Medi se acerca a Yori,
//   Medi camina sola hasta quedar a su lado (engine/autowalk.js) y Yori le habla en el cuadro de abajo:
//   "Te amo mi amorcito" y "Toma, esto es para ti".
//   Funciona igual que la nevera y el armario: salta al ENTRAR en la zona de Yori (para repetir hay que
//   salir y volver a entrar) y solo pasa una vez (marca "yoriMet").
//
// La zona se calcula sola a partir de la posición de Yori en rooms/plantabaja.js (el objeto cuyo sprite
// es "yori"): si lo mueves a mano, la zona lo sigue. Los márgenes se ajustan en REACH.
//
// PARTE 2 — El ramo
//   En "Toma, esto es para ti" el ramo (public/objects/rosesgif.png) sale en grande dentro del cuadro de
//   texto. Al cerrarlo, Medi lo lleva flotando sobre la cabeza como la bata (public/objects/roseshead.png,
//   engine/carry.js) y se activa la marca "rosesGiven".
//
// PARTE 3 — Menú Besar / Slap / Morder
//   Con el ramo ya entregado ("rosesGiven"), cada vez que Medi ENTRA en la zona de Yori (salir y volver a
//   entrar para repetir) Medi se gira hacia él y sale la pregunta con tres opciones, igual que con los gatos.
//   Cada opción suena con su sonido (engine/sfx.js: kiss, slap, bite).
//
// MENÚ QUE SE QUEDA ABIERTO
//   El menú no se cierra al elegir: se pueden dar todos los besos, slaps o mordidas que se quiera.
//   Para irse: clic / toque FUERA del cuadro de texto (o Escape). Mientras está abierto, Medi no se mueve.
//
// PARTE 4 — Corazones
//   Justo después de cada acción (Besar, Slap o Morder) salen corazones sobre la cabeza de Yori y también
//   sobre la de Medi (por encima del ramo, si lo lleva). Usan los mismos corazones de los gatos
//   (engine/particles.js) y respetan el ajuste "Partículas". Ajustes: HEARTS.
//
// PARTE 5 — El menú sale justo después del ramo
//   Al cerrar "Toma, esto es para ti" el menú aparece enseguida, sin salir y volver a entrar a la zona.
//
// PARTE 6 — Medi se pega a Yori
//   Al elegir Besar / Slap / Morder, Medi se acerca juntito a Yori, hace la acción y se queda ahí
//   hasta que la muevas. Ajustes: CLOSE_SPOT.
//
// PARTE 7 — Créditos finales
//   Tras la primera acción, al cerrar el menú se activa el final (story/ending.js).

import { say, ask, isDialogueActive } from "../engine/dialogue.js";
import { isFading } from "../engine/fade.js";
import { isTransitioning } from "../engine/world.js";
import { walkTo, isAutoWalking } from "../engine/autowalk.js";
import { loadAssets } from "../engine/assets.js";
import { setCarried } from "../engine/carry.js";
import { playSfx } from "../engine/sfx.js";
import { emitHearts } from "../engine/particles.js";
import { getImage } from "../engine/assets.js";
import { getCarried, CARRY_ITEMS } from "../engine/carry.js";
import { CARRY_UI } from "../config.js";
import { player, SPRITE } from "../entities/player.js";
import { hasFlag, setFlag } from "./events.js";
import { startEnding } from "./ending.js";

// Imagen grande del ramo para el cuadro de texto (se carga sola al importar este archivo)
const ROSES_BIG = "objects/rosesgif";
loadAssets([ROSES_BIG]).catch((err) => console.warn("No se pudo cargar el ramo:", err));

const ROOM_ID = "plantabaja";
const YORI_SPRITE = "yori";

// Pies de Yori dentro de su cuadro de 32x32 (x = centro del cuerpo, y = fila donde apoya)
const YORI_FEET = { x: 16, y: 27 };

// Zona de interacción alrededor de los pies de Yori (píxeles de la habitación, medidos desde el centro
// de la caja de pies de Medi): a los lados, hacia arriba y hacia abajo.
const REACH = { side: 26, up: 22, down: 12 };

// Dónde se detiene Medi junto a Yori: esquina superior izquierda de su caja de pies, relativa a los pies
// de Yori. "left" = a la izquierda de Yori (mirando a la derecha); "right" = a su derecha.
// Quedan un poco más arriba que Yori para no quedar detrás del pastel.
const TALK_SPOT = {
  left: { dx: -19, dy: -12, facing: "right" },
  right: { dx: 9, dy: -12, facing: "left" },
};

// Dónde se queda Medi al elegir una acción (más pegada a Yori que TALK_SPOT); mismas medidas que TALK_SPOT
const CLOSE_SPOT = {
  left: { dx: -16, dy: -10, facing: "right" },
  right: { dx: 6, dy: -10, facing: "left" },
};

// Opciones del menú, en este orden: clave del texto y sonido de cada una
const MENU_ACTIONS = [
  { label: "scene7.kiss", sfx: "kiss" },  // Besar
  { label: "scene7.slap", sfx: "slap" },  // Slap
  { label: "scene7.bite", sfx: "bite" },  // Morder
];

// Corazones tras cada acción
//   delay = segundos entre el sonido y los corazones (0 = a la vez)
//   yoriHeadAbove = altura de la cabeza de Yori sobre sus pies (píxeles)
const HEARTS = { delay: 0.15, yoriHeadAbove: 21 };

// ¿Medi estaba ya dentro de la zona en el cuadro anterior? (la escena solo salta al ENTRAR)
let inside = false;

// Busca a Yori en la habitación y devuelve sus pies en coordenadas de la habitación
function getYoriFeet(room) {
  const o = (room.objects || []).find((obj) => obj.sprite === YORI_SPRITE);
  if (!o) return null;
  return { x: o.x + YORI_FEET.x, y: o.y + YORI_FEET.y };
}

function isNear(feet) {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  return Math.abs(cx - feet.x) <= REACH.side && cy >= feet.y - REACH.up && cy <= feet.y + REACH.down;
}

// Medi camina hasta el lado de Yori en el que ya estaba y Yori le habla
function startYoriTalk(feet) {
  const side = player.x + player.w / 2 < feet.x ? "left" : "right";
  const spot = TALK_SPOT[side];
  walkTo({ x: feet.x + spot.dx, y: feet.y + spot.dy }, () => {
    say("scene7.love", () => {
      // el ramo aparece en grande dentro del cuadro; al cerrarlo, Medi lo lleva sobre la cabeza
      say("scene7.gift", () => {
        setCarried("roses");
        setFlag("rosesGiven");
        setFlag("yoriMet"); // ya no vuelve a empezar la conversación
        startYoriMenu(feet); // el menú sale justo después del ramo
      }, { image: ROSES_BIG });
    });
  }, spot.facing);
}

// Medi se gira hacia Yori
function faceYori(feet) {
  const dx = feet.x - (player.x + player.w / 2);
  const dy = feet.y - 8 - (player.y + player.h / 2); // 8 px arriba de sus pies = su cuerpo
  if (Math.abs(dx) > Math.abs(dy)) player.facing = dx < 0 ? "left" : "right";
  else player.facing = dy < 0 ? "up" : "down";
}

// Altura (en la habitación) de donde salen los corazones de Medi: sobre su cabeza,
// o sobre el objeto que lleva flotando (el ramo)
function mediHeartsY() {
  let y = player.y + player.h - SPRITE.feetY + CARRY_UI.headY;
  const carried = getCarried();
  if (carried) {
    const img = getImage(CARRY_ITEMS[carried].image);
    if (img) y -= CARRY_UI.gap + Math.round(img.height * CARRY_UI.scale);
  }
  return y - 2;
}

// Corazones de Yori y de Medi (los puntos se miden ahora, por si Medi se mueve durante el retraso)
function emitLoveHearts(feet) {
  const yori = { x: feet.x, y: feet.y - HEARTS.yoriHeadAbove };
  const medi = { x: Math.round(player.x + player.w / 2), y: mediHeartsY() };
  const emit = () => {
    emitHearts(ROOM_ID, yori.x, yori.y);
    emitHearts(ROOM_ID, medi.x, medi.y);
  };
  if (HEARTS.delay > 0) setTimeout(emit, HEARTS.delay * 1000);
  else emit();
}

// Punto pegado a Yori, del lado en el que está Medi
function getCloseSpot(feet) {
  const side = player.x + player.w / 2 < feet.x ? "left" : "right";
  const s = CLOSE_SPOT[side];
  return { x: feet.x + s.dx, y: feet.y + s.dy, facing: s.facing };
}

// Menú Besar / Slap / Morder: Medi se pega a Yori, suena la opción elegida y salen los corazones
function startYoriMenu(feet) {
  faceYori(feet);
  ask(
    "scene7.menuPrompt",
    MENU_ACTIONS.map((a) => a.label),
    (index) => {
      const act = () => {
        setFlag("yoriActed"); // ya eligió una acción: al cerrar el menú salen los créditos
        playSfx(MENU_ACTIONS[index].sfx);
        emitLoveHearts(feet);
      };
      const spot = getCloseSpot(feet);
      if (Math.abs(player.x - spot.x) < 1 && Math.abs(player.y - spot.y) < 1) {
        act(); // ya está pegada: solo hace la acción
        return;
      }
      // say([]) cierra el menú para que Medi pueda caminar; al llegar actúa y el menú vuelve a salir
      say([], () => {
        walkTo({ x: spot.x, y: spot.y }, () => {
          act();
          startYoriMenu(feet);
        }, spot.facing);
      });
    },
    // se queda abierto; el clic fuera / Escape lo cierra (y, tras la primera acción, salen los créditos)
    { keepOpen: true, onCancel: () => { if (hasFlag("yoriActed")) startEnding(); } }
  );
}

// Se llama en cada cuadro (main.js)
export function updateYoriScene(room) {
  if (room.id !== ROOM_ID) {
    inside = false; // al volver a entrar, la zona se evalúa de cero
    return;
  }
  if (!hasFlag("partyDone")) return; // la fiesta aún no termina
  if (isFading() || isTransitioning() || isDialogueActive() || isAutoWalking()) return;

  const feet = getYoriFeet(room);
  if (!feet) return;

  const near = isNear(feet);
  const was = inside;
  inside = near;
  if (!near || was) return; // solo al ENTRAR en la zona

  if (!hasFlag("yoriMet")) startYoriTalk(feet);
  else if (hasFlag("rosesGiven")) startYoriMenu(feet);
}
