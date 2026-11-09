import { TILE } from "../config.js";

// Un tile es sólido si es pared o si está fuera del mapa
export function isSolidTile(room, col, row) {
  const map = room.map;
  if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return true;
  return map[row][col] === "#";
}

// Revisa si un rectángulo toca algún tile sólido de la habitación
export function collides(room, x, y, w, h) {
  const left = Math.floor(x / TILE);
  const right = Math.floor((x + w - 1) / TILE);
  const top = Math.floor(y / TILE);
  const bottom = Math.floor((y + h - 1) / TILE);

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (isSolidTile(room, col, row)) return true;
    }
  }
  return false;
}
