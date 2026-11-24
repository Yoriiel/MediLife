// Escena 7: después de la fiesta, Medi y Yori (el final del juego)

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
import { getObjective, setObjective } from "./objectives.js";

// Imagen grande del ramo para el cuadro de texto (se carga sola al importar este archivo)
const ROSES_BIG = "objects/rosesgif";
loadAssets([ROSES_BIG]).catch((err) => console.warn("No se pudo cargar el ramo:", err));

const ROOM_ID = "plantabaja";
const YORI_SPRITE = "yori";

// Pies de Yori dentro de su cuadro de 32x32 (x = centro del cuerpo, y = fila donde apoya)
const YORI_FEET = { x: 16, y: 27 };

// Zona de interacción alrededor de los pies de Yori
const REACH = { side: 26, up: 22, down: 12 };

// Dónde se detiene Medi junto a Yori: esquina superior izquierda de su caja de pies
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
const HEARTS = { delay: 0.15, yoriHeadAbove: 21 };

// ¿Medi estaba ya dentro de la zona en el cuadro anterior? (la escena solo salta al ENTRAR)
let inside = false;
let wasPending = false; // el comentario del dibujo estaba pendiente en el cuadro anterior

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
        startAfterRosesMenu(feet); // el menú sale justo después del ramo (antes, el dibujo si lo vio)
      }, { image: ROSES_BIG });
    });
  }, spot.facing);
}

// ¿Medi ya vio el dibujo, pasaron los créditos y Yori aún no lo ha comentado?
function drawingPending() {
  return hasFlag("drawingSeen") && hasFlag("creditsShown") && !hasFlag("drawingTalkDone");
}

// Yori pregunta por el dibujo y Medi responde; al cerrar, sale el menú
function startDrawingTalk(feet) {
  faceYori(feet);
  say(["scene7.drawingAsk", "scene7.drawingLove"], () => {
    setFlag("drawingTalkDone"); // solo una vez
    if (getObjective() === YOYEL_MISSION) setObjective(null); // ya fue a donde Yoyel
    startYoriMenu(feet);
  });
}

// Misión "Ve donde yoyel": sale cuando Medi ya vio el dibujo y la fiesta terminó (Yori ya está en la casa)
const YOYEL_MISSION = "missionYoyel";
function updateYoyelMission() {
  if (!hasFlag("partyDone") || !drawingPending()) return;
  if (getObjective() !== YOYEL_MISSION) setObjective(YOYEL_MISSION);
}

// Sale el menú, pero antes el comentario del dibujo si hace falta
function startAfterRosesMenu(feet) {
  if (drawingPending()) startDrawingTalk(feet);
  else startYoriMenu(feet);
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
    // se queda abierto; la X, el clic fuera o Escape lo cierran (y, tras la primera acción, salen los créditos)
    { keepOpen: true, closeButton: true, onCancel: () => { if (hasFlag("yoriActed")) startEnding(); } }
  );
}

// Se llama en cada cuadro (main.js)
export function updateYoriScene(room) {
  updateYoyelMission(); // misión "Ve donde yoyel" (sale en cualquier habitación)
  const pending = drawingPending();
  if (pending && !wasPending) inside = false; // tras los créditos, si ya está junto a Yori, el comentario salta solo
  wasPending = pending;
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
  else if (hasFlag("rosesGiven")) startAfterRosesMenu(feet);
}
