// Marcadores de misión: un signo "!" que flota (sube y baja) sobre el lugar donde hay que ir.
// Se definen en cada habitación (room.markers):
//   { x, y, mission: "mission1" }
//     x, y    = punto de reposo del signo: x = centro, y = base del signo (píxeles de la habitación)
//     mission = clave de la misión (story/objectives.js). También acepta una lista: ["mission1", "mission2"].
//               El signo solo se ve mientras esa misión esté activa.
//     unless  = (opcional) nombre de una marca de events.js; cuando está activa, el signo se oculta.

import { getObjective } from "../story/objectives.js";
import { hasFlag } from "../story/events.js";

const BOB_AMPLITUDE = 2; // píxeles que sube y baja desde su punto de reposo
const BOB_SPEED = 5;     // velocidad del vaivén (radianes por segundo; ~1.2 s por ciclo)

const W = 5;  // ancho del signo en píxeles
const H = 12; // alto del signo en píxeles

const OUTLINE = "#3b2314";
const FILL = "#ffd23f";
const SHINE = "#fff3a0";

// Dibuja el signo con su esquina superior izquierda en (x, y)
function drawExclamation(ctx, x, y) {
  // contornos: cuerpo (5x8) y punto (5x5), unidos por la fila 7
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x, y, 5, 8);
  ctx.fillRect(x, y + 7, 5, 5);

  // relleno del cuerpo y del punto
  ctx.fillStyle = FILL;
  ctx.fillRect(x + 1, y + 1, 3, 6);
  ctx.fillRect(x + 1, y + 8, 3, 3);

  // brillo
  ctx.fillStyle = SHINE;
  ctx.fillRect(x + 1, y + 1, 1, 3);
}

// Se llama dentro de drawScene (ya con la habitación trasladada), encima de todo
export function drawMarkers(ctx, room) {
  const markers = room.markers;
  if (!markers || markers.length === 0) return;

  const objective = getObjective();
  if (!objective) return;

  // mismo vaivén para todos los signos; en píxeles enteros para que se vea nítido
  const bob = Math.round(Math.sin((performance.now() / 1000) * BOB_SPEED) * BOB_AMPLITUDE);

  for (const m of markers) {
    const missions = Array.isArray(m.mission) ? m.mission : [m.mission];
    if (!missions.includes(objective)) continue;
    if (m.unless && hasFlag(m.unless)) continue; // se oculta cuando ya se cumplió esa marca
    drawExclamation(ctx, Math.round(m.x - W / 2), Math.round(m.y - H + bob));
  }
}
