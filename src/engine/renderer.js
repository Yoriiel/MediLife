import { TILE, VIEW_W, VIEW_H } from "../config.js";

export function drawRoom(ctx, room) {
  const map = room.map;
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const x = col * TILE;
      const y = row * TILE;

      if (map[row][col] === "#") {
        ctx.fillStyle = "#5b3a29";
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = "#6e4731";
        ctx.fillRect(x, y, TILE, 3);
      } else {
        // piso con patrón de ajedrez suave
        ctx.fillStyle = (row + col) % 2 === 0 ? "#d9a766" : "#cf9d5c";
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }
}

export function drawPlayer(ctx, player) {
  const x = Math.round(player.x);
  const y = Math.round(player.y);

  // sombra
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(x + 1, y + player.h - 2, player.w, 4);

  // cuerpo del cubo
  ctx.fillStyle = "#4aa3df";
  ctx.fillRect(x, y, player.w, player.h);

  // cara superior
  ctx.fillStyle = "#7cc4f0";
  ctx.fillRect(x, y, player.w, 4);

  // borde
  ctx.strokeStyle = "#1f5f8b";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, player.w - 1, player.h - 1);
}

export function clearScreen(ctx) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
}
