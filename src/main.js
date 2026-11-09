import { VIEW_W, VIEW_H } from "./config.js";
import { initInput } from "./engine/input.js";
import { clearScreen, drawRoom, drawPlayer } from "./engine/renderer.js";
import { player, placePlayer, updatePlayer } from "./entities/player.js";
import { rooms, START_ROOM } from "./rooms/index.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

initInput();

// Estado del juego
let currentRoom = rooms[START_ROOM];
placePlayer(currentRoom.spawn);

// Cambiar de habitación (lo usaremos cuando haya puertas)
export function changeRoom(roomId, spawn) {
  currentRoom = rooms[roomId];
  placePlayer(spawn || currentRoom.spawn);
}

function update(dt) {
  updatePlayer(currentRoom, dt);
}

function draw() {
  clearScreen(ctx);
  drawRoom(ctx, currentRoom);
  drawPlayer(ctx, player);
}

// Escalado del canvas en múltiplos enteros (pixel art nítido)
function resizeCanvas() {
  const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H)));
  canvas.style.width = VIEW_W * scale + "px";
  canvas.style.height = VIEW_H * scale + "px";
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Bucle principal
let lastTime = performance.now();

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
