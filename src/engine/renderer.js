import { TILE, VIEW_W, VIEW_H } from "../config.js";
import { SPRITE, player, getFrameIndex } from "../entities/player.js";
import { getImage } from "./assets.js";
import { drawMarkers } from "./markers.js";


// Color del "vacío" fuera de la casa (el mismo oscuro del tileset)
const VOID_COLOR = "#2f2929";

// Habitaciones armadas con un tileset (room.tileset): suelo repetido + piezas ("stamps") de pared.
//   room.tileset  nombre de la imagen, ej. "tiles/walls_floor"
//   room.floor    [col, fila, ancho, alto] bloque del tileset que se repite como suelo (en tiles)
//   room.stamps   lista de piezas: { src: [col, fila, ancho, alto], at: [col, fila],
//                                    times: [nx, ny], layer: "floor" | "top" }
//                 src = pieza dentro del tileset, at = dónde va en el mapa, todo en TILES.
//                 times = repetirla nx x ny veces (opcional). layer "top" = se dibuja encima
//                 de los objetos y de la jugadora (opcional).
// En el mapa:  "." suelo   "#" pared (sólida)   " " vacío exterior (sólido, color oscuro)
function drawTilesetFloor(ctx, room) {
  const map = room.map;
  const sheet = getImage(room.tileset);
  const [fc, fr, fw, fh] = room.floor || [0, 0, 1, 1];

  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const x = col * TILE;
      const y = row * TILE;
      if (map[row][col] === ".") {
        const sc = fc + (col % fw);
        const sr = fr + (row % fh);
        ctx.drawImage(sheet, sc * TILE, sr * TILE, TILE, TILE, x, y, TILE, TILE);
      } else {
        // pared o vacío: de fondo oscuro; las piezas (stamps) se dibujan encima
        ctx.fillStyle = VOID_COLOR;
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }
}

function drawStamps(ctx, room, layer) {
  for (const s of room.stamps || []) {
    if ((s.layer || "floor") !== layer) continue;
    const img = getImage(s.image || room.tileset);
    const [sc, sr, sw, sh] = s.src;
    const [ac, ar] = s.at;
    const [nx, ny] = s.times || [1, 1];
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        ctx.drawImage(
          img,
          sc * TILE, sr * TILE, sw * TILE, sh * TILE,
          (ac + i * sw) * TILE, (ar + j * sh) * TILE, sw * TILE, sh * TILE
        );
      }
    }
  }
}

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

  if (room.tileset) {
    drawTilesetFloor(ctx, room);
    drawStamps(ctx, room, "floor");
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
  ctx.drawImage(getImage("objects/" + o.sprite), o.x, o.y);
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
}

// Posición de la habitación en un eje de la pantalla:
//  - si cabe entera, se centra;
//  - si es más grande que la pantalla, la cámara sigue a la jugadora (sin salirse de los bordes).
// `focus` va en píxeles ENTEROS para que la jugadora no "tiemble" respecto al fondo.
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

// Dibuja el cuarto completo: suelo, objetos y jugadora ordenados por profundidad.
// La habitación se centra en la pantalla; el resto queda en negro.
export function drawScene(ctx, room, player, playerSprite) {
  const offset = getRoomOffset(room);

  ctx.save();
  ctx.translate(offset.x, offset.y);

  drawRoomTiles(ctx, room);

  const objects = room.objects || [];

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
  //   { x, y, w, h, sortY }  -> rectángulo del fondo (en píxeles) que se vuelve a dibujar encima de ella.
  //   sortY = línea de la base de la pared: si los pies de la jugadora están por encima de esa línea
  //   (detrás), la pared la tapa; si están por debajo (delante), ella se dibuja sobre la pared.
  if (room.background) {
    const bg = getBackground(room);
    for (const ov of room.overlays || []) {
      drawables.push({
        y: ov.sortY,
        draw: () => ctx.drawImage(bg, ov.x, ov.y, ov.w, ov.h, ov.x, ov.y, ov.w, ov.h),
      });
    }
  }

  drawables.sort((a, b) => a.y - b.y);
  drawables.forEach((d) => d.draw());

  // Piezas que van por encima de todo (solo habitaciones con tileset)
  if (room.tileset) drawStamps(ctx, room, "top");

  // Signos "!" de misión, encima de todo
  drawMarkers(ctx, room);

  ctx.restore();
}

export function clearScreen(ctx) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
}