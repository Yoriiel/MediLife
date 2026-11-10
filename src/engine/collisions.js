import { TILE } from "../config.js";

// Un tile es sólido si es pared (#), vacío exterior (espacio) o si está fuera del mapa
export function isSolidTile(room, col, row) {
  const map = room.map;
  if (row < 0 || row >= map.length || col < 0 || col >= map[row].length) return true;
  const ch = map[row][col];
  return ch === "#" || ch === " ";
}

// Revisa si un rectángulo toca una pared o un mueble sólido de la habitación
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

  // Paredes finas o zonas sólidas sueltas de la habitación: room.solids = [[x, y, ancho, alto], ...]
  // (en píxeles, coordenadas de la habitación)
  for (const z of room.solids || []) {
    if (x < z[0] + z[2] && x + w > z[0] && y < z[1] + z[3] && y + h > z[1]) return true;
  }

  // Muebles: cada objeto con `solid: [dx, dy, ancho, alto]` (relativo a su esquina).
  // También se acepta una lista de zonas: `solid: [[dx, dy, ancho, alto], [...]]`
  for (const o of room.objects || []) {
    if (!o.solid) continue;
    const zones = Array.isArray(o.solid[0]) ? o.solid : [o.solid];
    for (const z of zones) {
      const rx = o.x + z[0];
      const ry = o.y + z[1];
      if (x < rx + z[2] && x + w > rx && y < ry + z[3] && y + h > ry) return true;
    }
  }
  return false;
}
