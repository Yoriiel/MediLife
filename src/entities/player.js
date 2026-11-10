import { getDirection } from "../engine/input.js";
import { collides } from "../engine/collisions.js";


export const SPRITE = {
  src: "/sprites/medi.png",
  frame: 32,
  feetY: 27, // fila (dentro del cuadro) donde apoyan los pies
  idle: { down: 0, up: 4, left: 7, right: 10 },
  walk: {
    down: [0, 2],          // no hay cuadros de caminar hacia abajo: se alterna la pose de frente
    up: [4, 5, 4, 6],
    left: [7, 8, 7, 9],
    right: [10, 11, 10, 12],
  },
  walkFrameTime: 0.14, // segundos por cuadro al caminar
};

export const player = {
  // x, y = esquina superior izquierda de la "caja de pies" (colisión)
  x: 150,
  y: 110,
  w: 10,
  h: 6,
  speed: 80, // píxeles por segundo
  facing: "down",
  moving: false,
  walkTime: 0,
  idleTime: 0,
};

// Coloca al jugador en la posición de entrada de una habitación
export function placePlayer(spawn) {
  player.x = spawn.x;
  player.y = spawn.y;
}

export function updatePlayer(room, dt) {
  const { dx, dy } = getDirection();

  player.moving = dx !== 0 || dy !== 0;

  if (player.moving) {
    // Si va en diagonal, manda el eje horizontal
    if (Math.abs(dx) >= Math.abs(dy)) player.facing = dx < 0 ? "left" : "right";
    else player.facing = dy < 0 ? "up" : "down";

    player.walkTime += dt;
    player.idleTime = 0;
  } else {
    player.walkTime = 0;
    player.idleTime += dt;
  }

  // Ejes separados para poder "deslizar" por las paredes
  const nextX = player.x + dx * player.speed * dt;
  if (!collides(room, nextX, player.y, player.w, player.h)) player.x = nextX;

  const nextY = player.y + dy * player.speed * dt;
  if (!collides(room, player.x, nextY, player.w, player.h)) player.y = nextY;
}

// Devuelve el índice del cuadro que toca dibujar ahora
export function getFrameIndex() {
  if (player.moving) {
    const seq = SPRITE.walk[player.facing];
    const step = Math.floor(player.walkTime / SPRITE.walkFrameTime) % seq.length;
    return seq[step];
  }

  // Quieta de frente: solo pestañea cada ~3.5 s (cuadro 0 abierto, cuadro 1 cerrado)
  if (player.facing === "down") {
    const blinking = player.idleTime % 3.5 > 3.35;
    return blinking ? 1 : 0;
  }
  return SPRITE.idle[player.facing];
}

// Mantiene a la jugadora quieta (por ejemplo durante un diálogo)
export function idlePlayer(dt) {
  player.moving = false;
  player.walkTime = 0;
  player.idleTime += dt;
}
