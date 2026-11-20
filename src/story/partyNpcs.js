// Escena 8: la familia en la fiesta (eventos de una sola vez)
//
// Después de la fiesta ("partyDone"), al ENTRAR en la zona de un familiar este dice su frase y, si tiene
// respuesta, Medi contesta en una burbuja sobre su cabeza. Cada familiar habla una sola vez.
// Para añadir otro: una línea en NPCS y sus textos en i18n. La zona sale de la posición del objeto
// en rooms/plantabaja.js (si lo mueves, la zona lo sigue). Ajuste de cercanía: REACH.

import { say, isDialogueActive } from "../engine/dialogue.js";
import { isFading } from "../engine/fade.js";
import { isTransitioning } from "../engine/world.js";
import { isAutoWalking } from "../engine/autowalk.js";
import { getImage } from "../engine/assets.js";
import { getCarried, CARRY_ITEMS } from "../engine/carry.js";
import { CARRY_UI } from "../config.js";
import { player, SPRITE } from "../entities/player.js";
import { hasFlag, setFlag } from "./events.js";

const ROOM_ID = "plantabaja";

// Pies de los familiares dentro de su cuadro de 32x32
const NPC_FEET = { x: 16, y: 27 };

// Zona de interacción alrededor de sus pies (píxeles, desde el centro de la caja de pies de Medi)
const REACH = { side: 18, up: 18, down: 12 }; // up en 18: los puntos de Yori (scene7) quedan fuera de la zona de mamá

// sprite = nombre del objeto en la habitación; line = lo que dice; reply = respuesta de Medi (opcional);
// needs = marca (events.js) que debe estar activa para que hable (opcional)
const NPCS = [
  { sprite: "mamusik", line: "scene8.mom", reply: "scene8.momReply", needs: "rosesGiven" }, // "¿Quieres pastel?" / "Sipi"; solo después de que Yori le dé el ramo
  { sprite: "teia", line: "scene8.teia", reply: "scene8.teiaReply" }, // "Traje sushi!!!" / "Yayyyyy"
  { sprite: "papusik", line: "scene8.papa", reply: "scene8.papaReply" }, // "Disfruta de tu fiesta мои тигры" / "спасибоооо"
  { sprite: "kiana", line: "scene8.kiana", reply: "scene8.kianaReply" }, // "Juguemos Roblox!!!" / "Oki"
];

// ¿Medi estaba ya dentro de la zona de cada uno? (solo salta al ENTRAR)
const inside = {};

// Burbuja sobre la cabeza de Medi (por encima del ramo, si lo lleva)
function mediBubble() {
  let y = player.y + player.h - SPRITE.feetY + CARRY_UI.headY;
  const carried = getCarried();
  if (carried) {
    const img = getImage(CARRY_ITEMS[carried].image);
    if (img) y -= CARRY_UI.gap + Math.round(img.height * CARRY_UI.scale);
  }
  return { x: Math.round(player.x + player.w / 2), y: y - 2, above: true };
}

function isNear(feet) {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  return Math.abs(cx - feet.x) <= REACH.side && cy >= feet.y - REACH.up && cy <= feet.y + REACH.down;
}

// Medi se gira hacia el familiar
function faceNpc(feet) {
  const dx = feet.x - (player.x + player.w / 2);
  const dy = feet.y - 8 - (player.y + player.h / 2); // 8 px arriba de sus pies = su cuerpo
  if (Math.abs(dx) > Math.abs(dy)) player.facing = dx < 0 ? "left" : "right";
  else player.facing = dy < 0 ? "up" : "down";
}

function talk(npc, feet) {
  setFlag("talked_" + npc.sprite); // una sola vez
  faceNpc(feet);
  say(npc.line, () => {
    if (npc.reply) say(npc.reply, null, { bubble: mediBubble() });
  });
}

// Se llama en cada cuadro (main.js)
export function updatePartyNpcs(room) {
  if (room.id !== ROOM_ID) {
    for (const k in inside) inside[k] = false; // al volver a entrar, las zonas se evalúan de cero
    return;
  }
  const blocked =
    !hasFlag("partyDone") || isFading() || isTransitioning() || isDialogueActive() || isAutoWalking();

  for (const npc of NPCS) {
    const o = (room.objects || []).find((obj) => obj.sprite === npc.sprite);
    if (!o) continue;
    const feet = { x: o.x + NPC_FEET.x, y: o.y + NPC_FEET.y };

    const near = isNear(feet);
    const was = !!inside[npc.sprite];
    inside[npc.sprite] = near;
    if (!near || was || blocked || hasFlag("talked_" + npc.sprite)) continue;
    if (npc.needs && !hasFlag(npc.needs)) continue; // todavía no toca que hable

    talk(npc, feet);
    break; // un familiar a la vez
  }
}
