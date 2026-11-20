
import { player } from "../entities/player.js";
import { collides } from "./collisions.js";

const STUCK_LIMIT = 0.8; // segundos sin poder avanzar antes de saltar al punto

let path = null;
let onArrive = null;
let finalFacing = null;
let stuck = 0;

export function walkTo(points, callback, facing) {
  path = Array.isArray(points) ? [...points] : [points];
  onArrive = callback || null;
  finalFacing = facing || null;
  stuck = 0;
}

export function isAutoWalking() {
  return path !== null;
}

function arrive() {
  path = null;
  player.moving = false;
  player.walkTime = 0;
  if (finalFacing) player.facing = finalFacing;
  const callback = onArrive;
  onArrive = null;
  finalFacing = null;
  if (callback) callback();
}

export function updateAutoWalk(room, dt) {
  if (!path) return;

  const target = path[0];
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.hypot(dx, dy);
  const step = player.speed * dt;

  // llegó a este punto: sigue con el siguiente o termina
  if (dist <= step) {
    player.x = target.x;
    player.y = target.y;
    stuck = 0;
    path.shift();
    if (path.length === 0) arrive();
    return;
  }

  // mira hacia donde camina
  if (Math.abs(dx) >= Math.abs(dy)) player.facing = dx < 0 ? "left" : "right";
  else player.facing = dy < 0 ? "up" : "down";
  player.moving = true;
  player.walkTime += dt;
  player.idleTime = 0;

  // ejes separados, como en updatePlayer, para deslizar por las paredes
  let moved = false;
  const nextX = player.x + (dx / dist) * step;
  if (!collides(room, nextX, player.y, player.w, player.h)) {
    player.x = nextX;
    moved = true;
  }
  const nextY = player.y + (dy / dist) * step;
  if (!collides(room, player.x, nextY, player.w, player.h)) {
    player.y = nextY;
    moved = true;
  }

  stuck = moved ? 0 : stuck + dt;
  if (stuck >= STUCK_LIMIT) {
    player.x = target.x;
    player.y = target.y;
    stuck = 0;
  }
}
