import { getDirection } from "../engine/input.js";
import { collides } from "../engine/collisions.js";

export const player = {
  x: 150,
  y: 110,
  w: 12,
  h: 12,
  speed: 80, // píxeles por segundo
};

// Coloca al jugador en la posición de entrada de una habitación
export function placePlayer(spawn) {
  player.x = spawn.x;
  player.y = spawn.y;
}

export function updatePlayer(room, dt) {
  const { dx, dy } = getDirection();

  // Ejes separados para poder "deslizar" por las paredes
  const nextX = player.x + dx * player.speed * dt;
  if (!collides(room, nextX, player.y, player.w, player.h)) player.x = nextX;

  const nextY = player.y + dy * player.speed * dt;
  if (!collides(room, player.x, nextY, player.w, player.h)) player.y = nextY;
}
