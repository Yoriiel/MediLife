import { ask, isDialogueActive } from "./dialogue.js";
import { addItem } from "./inventory.js";
import { isFading } from "./fade.js";
import { isTransitioning } from "./world.js";
import { isAutoWalking } from "./autowalk.js";
import { getImage } from "./assets.js";
import { player } from "../entities/player.js";
import { hasFlag, setFlag } from "../story/events.js";

const BOB_AMPLITUDE = 2; // píxeles que sube y baja desde su punto de reposo (igual que el signo "!")
const BOB_SPEED = 5;     // velocidad del vaivén (radianes por segundo; ~1.2 s por ciclo)
const DEFAULT_MARGIN = 2;
const DEFAULT_SLOT = -1; // el último espacio del inventario (el de más a la derecha)

// Marca que indica que ya se tomó
function takenFlag(p) {
  return p.unless || "taken_" + p.id;
}

// ¿La caja de pies de Medi toca (o casi) la zona `touch` del objeto?
function isTouching(p, player) {
  const m = p.margin ?? DEFAULT_MARGIN;
  const [zx, zy, zw, zh] = p.touch;
  return (
    player.x < zx + zw + m &&
    player.x + player.w > zx - m &&
    player.y < zy + zh + m &&
    player.y + player.h > zy - m
  );
}

// Se llama dentro de drawScene (ya con la habitación trasladada), encima de todo:
// así la llave se ve siempre, incluso si Medi está justo detrás del arbusto
export function drawPickups(ctx, room, player) {
  const pickups = room.pickups;
  if (!pickups || pickups.length === 0) return;

  // mismo vaivén para todos; en píxeles enteros para que se vea nítido
  const bob = Math.round(Math.sin((performance.now() / 1000) * BOB_SPEED) * BOB_AMPLITUDE);

  for (const p of pickups) {
    if (hasFlag(takenFlag(p))) continue;  // ya lo tomó
    if (!isTouching(p, player)) continue; // solo aparece al tocar el arbusto
    ctx.drawImage(getImage("objects/" + p.sprite), Math.round(p.x), Math.round(p.y + bob));
  }
}

// ¿Medi estaba ya tocando cada objeto en el cuadro anterior? (la pregunta solo sale al ENTRAR)
let lastRoomId = null;
const inside = {};

// Medi se gira hacia lo que toca (el centro de la zona `touch`)
function faceTouch(p) {
  const [zx, zy, zw, zh] = p.touch;
  const dx = zx + zw / 2 - (player.x + player.w / 2);
  const dy = zy + zh / 2 - (player.y + player.h / 2);
  if (Math.abs(dx) > Math.abs(dy)) player.facing = dx < 0 ? "left" : "right";
  else player.facing = dy < 0 ? "up" : "down";
}

// "Tomar": pasa al inventario y se activa la marca (si el inventario estuviera lleno no pasa nada: puede volver a intentarlo)
function take(p) {
  if (!addItem(p.id, p.slot ?? DEFAULT_SLOT)) return;
  setFlag(takenFlag(p));
}

function offer(p) {
  faceTouch(p);
  ask(`pickup.${p.id}.prompt`, [`pickup.${p.id}.take`], () => take(p));
}

// Se llama en cada cuadro (main.js)
export function updatePickups(room) {
  if (room.id !== lastRoomId) {
    lastRoomId = room.id;
    for (const k in inside) delete inside[k]; // al cambiar de habitación, las zonas se evalúan de cero
  }

  const blocked = isFading() || isTransitioning() || isDialogueActive() || isAutoWalking();

  for (const p of room.pickups || []) {
    if (hasFlag(takenFlag(p))) continue;
    const near = isTouching(p, player);
    const was = !!inside[p.id];
    inside[p.id] = near;
    if (!near || was || blocked) continue; // solo al ENTRAR en la zona
    offer(p);
    break; // un objeto a la vez
  }
}
