// Zonas activables de cada habitación (room.triggers):
//   { type: "exit", zone: [x, y, ancho, alto], to: "idHabitacion", spawn: {x, y}, facing }
//       -> al entrar en la zona, cambia de habitación
//          (opcional: mission: "clave" -> solo funciona mientras esa misión esté activa)
//   { type: "text", zone: [...], text: "clave", once: true }
//       -> al entrar en la zona, muestra un cuadro de texto (once: solo la primera vez)
//   { type: "shower", zone: [...], facing: "down" }
//       -> al entrar en la zona, empieza la escena de la ducha (story/scene4.js),
//          pero SOLO si la misión actual es "mission3" (tomar una ducha); si no, no pasa nada
//   { type: "fridge", zone: [...], facing: "up" }
//       -> al entrar en la zona, pregunta "¿Tomar salchichas?" (story/scene2.js),
//          pero SOLO si la misión actual es "mission1" y aún no las tomó; si no, no pasa nada
// Las zonas se activan al ENTRAR en ellas; para repetir hay que salir y volver a entrar.

import { say } from "./dialogue.js";
import { goToRoom } from "./world.js";
import { startShower } from "../story/scene4.js";
import { startFridge } from "../story/scene2.js";
import { getObjective } from "../story/objectives.js";
import { hasFlag } from "../story/events.js";

let lastRoomId = null;
const inside = {};
const fired = {};

export function updateTriggers(room, player) {
  if (room.id !== lastRoomId) {
    lastRoomId = room.id;
    for (const k in inside) delete inside[k];
  }

  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;

  (room.triggers || []).forEach((t, i) => {
    const id = `${room.id}:${i}`;
    const [zx, zy, zw, zh] = t.zone;
    const now = cx >= zx && cx <= zx + zw && cy >= zy && cy <= zy + zh;
    const was = inside[id];
    inside[id] = now;
    if (!now || was) return;

    if (t.type === "exit") {
      if (t.mission && getObjective() !== t.mission) return; // salida solo disponible con esa misión activa
      goToRoom(t.to, t.spawn, t.facing);
    } else if (t.type === "text") {
      if (t.once && fired[id]) return;
      fired[id] = true;
      say(t.text);
    } else if (t.type === "shower") {
      if (getObjective() !== "mission3") return; // sin la misión de la ducha, no ocurre nada
      player.facing = t.facing || "down"; // hacia dónde mira al empezar
      startShower();
    } else if (t.type === "fridge") {
      if (getObjective() !== "mission1" || hasFlag("sausagesTaken")) return; // sin misión (o ya las tomó), no pasa nada
      player.facing = t.facing || "up"; // mira hacia la nevera
      startFridge();
    }
  });
}
