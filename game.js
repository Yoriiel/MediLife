// ============================================================
//  JUEGO DE CUMPLEAÑOS - base del proyecto
//  Resolución lógica: 320x240 (se escala sola a la pantalla)
//  Cada tile mide 16x16 px -> el cuarto es una cuadrícula de 20x15
// ============================================================

const TILE = 16;
const VIEW_W = 320;
const VIEW_H = 240;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// ------------------------------------------------------------
//  HABITACIONES
//  Leyenda del mapa:
//    #  pared (sólida)
//    .  piso
//  Más adelante añadiremos: D (puerta a otra habitación),
//  muebles, objetos interactivos, etc.
// ------------------------------------------------------------
const rooms = {
  cuarto: {
    name: "Cuarto de prueba",
    map: [
      "####################",
      "#..................#",
      "#..................#",
      "#..................#",
      "#..................#",
      "#..................#",
      "#..................#",
      "#..................#",
      "#..................#",
      "#..................#",
      "#..................#",
      "#..................#",
      "#..................#",
      "#..................#",
      "####################",
    ],
  },
};

let currentRoom = rooms.cuarto;

// ------------------------------------------------------------
//  JUGADOR (por ahora un cubo)
// ------------------------------------------------------------
const player = {
  x: 150,
  y: 110,
  w: 12,
  h: 12,
  speed: 80, // píxeles por segundo
};

// ------------------------------------------------------------
//  CONTROLES (flechas o WASD)
// ------------------------------------------------------------
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function getInput() {
  let dx = 0;
  let dy = 0;
  if (keys["arrowleft"] || keys["a"]) dx -= 1;
  if (keys["arrowright"] || keys["d"]) dx += 1;
  if (keys["arrowup"] || keys["w"]) dy -= 1;
  if (keys["arrowdown"] || keys["s"]) dy += 1;

  // Evita ir más rápido en diagonal
  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }
  return { dx, dy };
}

// ------------------------------------------------------------
//  COLISIONES
// ------------------------------------------------------------
function isSolidTile(col, row) {
  const map = currentRoom.map;
  if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return true;
  return map[row][col] === "#";
}

// Revisa si un rectángulo toca algún tile sólido
function collides(x, y, w, h) {
  const left = Math.floor(x / TILE);
  const right = Math.floor((x + w - 1) / TILE);
  const top = Math.floor(y / TILE);
  const bottom = Math.floor((y + h - 1) / TILE);

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (isSolidTile(col, row)) return true;
    }
  }
  return false;
}

// ------------------------------------------------------------
//  ACTUALIZACIÓN
// ------------------------------------------------------------
function update(dt) {
  const { dx, dy } = getInput();

  // Se mueve por ejes separados para poder "deslizar" por las paredes
  const nextX = player.x + dx * player.speed * dt;
  if (!collides(nextX, player.y, player.w, player.h)) player.x = nextX;

  const nextY = player.y + dy * player.speed * dt;
  if (!collides(player.x, nextY, player.w, player.h)) player.y = nextY;
}

// ------------------------------------------------------------
//  DIBUJO
// ------------------------------------------------------------
function drawRoom() {
  const map = currentRoom.map;
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

function drawPlayer() {
  const x = Math.round(player.x);
  const y = Math.round(player.y);

  // sombra
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(x + 1, y + player.h - 2, player.w, 4);

  // cuerpo del cubo
  ctx.fillStyle = "#4aa3df";
  ctx.fillRect(x, y, player.w, player.h);

  // cara superior (efecto de cubo)
  ctx.fillStyle = "#7cc4f0";
  ctx.fillRect(x, y, player.w, 4);

  // borde
  ctx.strokeStyle = "#1f5f8b";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, player.w - 1, player.h - 1);
}

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawRoom();
  drawPlayer();
}

// ------------------------------------------------------------
//  ESCALADO DEL CANVAS (múltiplos enteros para pixel art nítido)
// ------------------------------------------------------------
function resizeCanvas() {
  const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H)));
  canvas.style.width = VIEW_W * scale + "px";
  canvas.style.height = VIEW_H * scale + "px";
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ------------------------------------------------------------
//  BUCLE PRINCIPAL
// ------------------------------------------------------------
let lastTime = performance.now();

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05); // limita saltos grandes
  lastTime = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
