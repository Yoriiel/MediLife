import { TILE, VIEW_W, VIEW_H, CARRY_UI, WALL_FADE } from "../config.js";
import { SPRITE, player, getFrameIndex } from "../entities/player.js";
import { getImage } from "./assets.js";
import { drawMarkers } from "./markers.js";
import { drawPickups } from "./pickups.js";
import { drawCarried, getCarried } from "./carry.js";
import { drawParticles } from "./particles.js";
import { hasFlag } from "../story/events.js";
import { getDanceOffset } from "./dance.js";

// Fondo con pisos (room.floors): cambia solo los píxeles de piso (room.floorColors) dentro de cada zona.
// Se arma una vez por habitación y se guarda; sin room.floors se usa la imagen tal cual.
const bgCache = {};

function readPixels(img) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  return g.getImageData(0, 0, c.width, c.height);
}

function getBackground(room) {
  const src = getImage(room.background);
  if (!room.floors) return src;
  if (bgCache[room.id]) return bgCache[room.id];

  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(src, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const orig = new Uint8ClampedArray(d);
  const colors = room.floorColors || [];
  const isFloor = (i) => colors.some((k) => orig[i] === k[0] && orig[i + 1] === k[1] && orig[i + 2] === k[2]);

  for (const f of room.floors) {
    const t = readPixels(getImage(f.tile));
    for (const [zx, zy, zw, zh] of f.zones) {
      for (let y = zy; y < zy + zh && y < c.height; y++) {
        for (let x = zx; x < zx + zw && x < c.width; x++) {
          const i = (y * c.width + x) * 4;
          if (!isFloor(i)) continue;
          const j = ((y % t.height) * t.width + (x % t.width)) * 4;
          d[i] = t.data[j];
          d[i + 1] = t.data[j + 1];
          d[i + 2] = t.data[j + 2];
        }
      }
    }
  }
  g.putImageData(img, 0, 0);
  bgCache[room.id] = c;
  return c;
}

function drawRoomTiles(ctx, room) {
  // Habitación con fondo ya armado (room.background = "carpeta/nombre" de una imagen en public/)
  if (room.background) {
    ctx.drawImage(getBackground(room), 0, 0);
    return;
  }

  const map = room.map;
  const floor = getImage("tiles/floor-wood");
  const floorTile = room.floorTile ? getImage(room.floorTile) : null; // piso propio de 32x32
  const WALL_ROWS = room.wallRows ?? 3; // filas de pared del fondo (se ven "de frente")

  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const x = col * TILE;
      const y = row * TILE;

      if (map[row][col] === "d") {
        ctx.fillStyle = "#000"; // "d": se camina, pero se ve negro (hueco de puerta)
        ctx.fillRect(x, y, TILE, TILE);
      } else if (map[row][col] !== "#") {
        if (floorTile) {
          ctx.drawImage(floorTile, x % floorTile.width, y % floorTile.height, TILE, TILE, x, y, TILE, TILE);
        } else ctx.drawImage(floor, x, y);
      } else if (row < WALL_ROWS) {
        // pared del fondo
        ctx.fillStyle = row === WALL_ROWS - 1 ? "#e3cba4" : "#ecd9b6";
        ctx.fillRect(x, y, TILE, TILE);
        if (row === WALL_ROWS - 1) {
          ctx.fillStyle = "#8a5a3c"; // zócalo
          ctx.fillRect(x, y + TILE - 5, TILE, 5);
          ctx.fillStyle = "#5b3a29";
          ctx.fillRect(x, y + TILE - 1, TILE, 1);
        }
      } else {
        // bordes laterales y pared de abajo
        ctx.fillStyle = "#5b3a29";
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = "#6e4731";
        ctx.fillRect(x, y, TILE, 3);
      }
    }
  }
}

function drawObject(ctx, o) {
  // los invitados de la fiesta dan saltitos mientras suena la canción (engine/dance.js)
  ctx.drawImage(getImage("objects/" + o.sprite), o.x, o.y + getDanceOffset(o.sprite));
}

export function drawPlayer(ctx, player, sprite) {
  const f = SPRITE.frame;
  const index = getFrameIndex();

  // El sprite se centra sobre la caja de pies y apoya en su borde inferior
  const dx = Math.round(player.x + player.w / 2 - f / 2);
  const dy = Math.round(player.y + player.h - SPRITE.feetY);

  // sombra suave bajo los pies
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(Math.round(player.x), Math.round(player.y + player.h - 2), player.w, 3);

  ctx.drawImage(sprite, index * f, 0, f, f, dx, dy, f, f);

  // objeto que lleva flotando sobre la cabeza (si lleva alguno)
  drawCarried(ctx, Math.round(player.x + player.w / 2), dy + CARRY_UI.headY);
}

// Posición de la habitación en un eje de la pantalla:
function axisOffset(view, size, focus) {
  if (size <= view) return Math.round((view - size) / 2);
  return Math.min(0, Math.max(view - size, Math.round(view / 2) - focus));
}

// Esquina de la habitación en pantalla (centrada, o cámara que sigue a la jugadora si es grande)
export function getRoomOffset(room) {
  return {
    x: axisOffset(VIEW_W, room.map[0].length * TILE, Math.round(player.x + player.w / 2)),
    y: axisOffset(VIEW_H, room.map.length * TILE, Math.round(player.y + player.h / 2)),
  };
}

// Animación de fondo (room.animations): una hoja de cuadros en fila que se repite sin parar.
function drawAnimation(ctx, a) {
  const frame = Math.floor((performance.now() + (a.phase || 0)) / a.frameMs) % a.frames;
  ctx.drawImage(getImage(a.image), frame * a.frameW, 0, a.frameW, a.frameH, a.x, a.y, a.frameW, a.frameH);
}

// Transparencia de paredes (overlays con fade: true): si Medi está detrás de la pared y su figura
const overlayAlpha = new Map(); // overlay -> opacidad actual (cambia poco a poco)
let lastDrawTime = performance.now();

function currentOverlayAlpha(ov, player, dt) {
  if (!ov.fade) return 1;
  const footY = player.y + player.h;
  const cx = player.x + player.w / 2;
  const top = footY - (SPRITE.feetY - CARRY_UI.headY) - (getCarried() ? 14 : 0);
  const behind = footY < ov.sortY;
  const overlaps = cx + 6 > ov.x && cx - 6 < ov.x + ov.w && footY > ov.y && top < ov.y + ov.h;
  const target = behind && overlaps ? WALL_FADE.alpha : 1;

  let a = overlayAlpha.get(ov) ?? 1;
  const step = WALL_FADE.speed * dt;
  a = a < target ? Math.min(target, a + step) : Math.max(target, a - step);
  overlayAlpha.set(ov, a);
  return a;
}

// Dibuja el cuarto completo: suelo, objetos y jugadora ordenados por profundidad.
export function drawScene(ctx, room, player, playerSprite) {
  const offset = getRoomOffset(room);
  const now = performance.now();
  const dt = Math.min((now - lastDrawTime) / 1000, 0.05);
  lastDrawTime = now;

  ctx.save();
  ctx.translate(offset.x, offset.y);

  drawRoomTiles(ctx, room);

  // Objetos con showIf: "marca" solo existen (se ven) cuando esa marca de events.js está activa
  const objects = (room.objects || []).filter((o) => !o.showIf || hasFlag(o.showIf));

  // Lo que va pegado al suelo o a la pared (alfombras, ventana...) se dibuja primero
  for (const o of objects) if (o.layer === "floor") drawObject(ctx, o);

  // El resto se ordena por la altura de su base: lo que está más abajo se dibuja encima
  const drawables = objects
    .filter((o) => o.layer !== "floor")
    .map((o) => ({
      y: o.sortY ?? o.y + getImage("objects/" + o.sprite).height,
      draw: () => drawObject(ctx, o),
    }));
  drawables.push({ y: player.y + player.h, draw: () => drawPlayer(ctx, player, playerSprite) });

  // Partes del fondo que tapan a la jugadora cuando está DETRÁS de una pared (room.overlays):
  if (room.background) {
    const bg = getBackground(room);
    for (const ov of room.overlays || []) {
      drawables.push({
        y: ov.sortY,
        draw: () => {
          ctx.globalAlpha = currentOverlayAlpha(ov, player, dt);
          ctx.drawImage(bg, ov.x, ov.y, ov.w, ov.h, ov.x, ov.y, ov.w, ov.h);
          ctx.globalAlpha = 1;
        },
      });
    }
  }

  // Animaciones de fondo (ej. el humo de la chimenea), ordenadas por profundidad como todo lo demás
  for (const a of room.animations || []) {
    drawables.push({ y: a.sortY ?? a.y + a.frameH, draw: () => drawAnimation(ctx, a) });
  }

  drawables.sort((a, b) => a.y - b.y);
  drawables.forEach((d) => d.draw());

  // Partículas (corazones...), encima de los objetos
  drawParticles(ctx, room);

  // Signos "!" de misión, encima de todo
  drawMarkers(ctx, room);

  // Objetos para recoger (la llave sobre el arbusto): solo se ven al tocarlos, encima de todo
  drawPickups(ctx, room, player);

  ctx.restore();
}

export function clearScreen(ctx) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
}