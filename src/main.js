import { VIEW_W, VIEW_H } from "./config.js";
import { initInput, wasPressed, endFrame } from "./engine/input.js";
import { loadImage, loadAssets } from "./engine/assets.js";
import { clearScreen, drawScene, getRoomOffset } from "./engine/renderer.js";
import { isDialogueActive, updateDialogue, drawDialogue } from "./engine/dialogue.js";
import { isFading, updateFade, drawFade } from "./engine/fade.js";
import { drawHud } from "./engine/hud.js";
import { ITEMS, addItem, removeItem, hasItem, drawInventory } from "./engine/inventory.js";
import { player, placePlayer, updatePlayer, idlePlayer, SPRITE } from "./entities/player.js";
import { rooms } from "./rooms/index.js";
import { getCurrentRoom } from "./engine/world.js";
import { updateTriggers } from "./engine/triggers.js";
import { toggleLanguage } from "./i18n/index.js";
import { startScene1, updateScene1 } from "./story/scene1.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

initInput();

// Para probar desde la consola del navegador: inventory.addItem("pizza")
window.inventory = { addItem, removeItem, hasItem };

// Estado del juego
let playerSprite = null;
placePlayer(getCurrentRoom().spawn);

function update(dt) {
  updateFade(dt);
  updateDialogue(dt);

  // Tecla L: cambia de idioma (solo para probar; luego lo hará el menú principal)
  if (wasPressed("l")) toggleLanguage();

  if (isDialogueActive() || isFading()) idlePlayer(dt);
  else {
    updatePlayer(getCurrentRoom(), dt);
    updateTriggers(getCurrentRoom(), player);
  }

  updateScene1(player, getCurrentRoom());

  endFrame(); // limpia las pulsaciones nuevas del cuadro
}

function draw() {
  clearScreen(ctx);
  drawScene(ctx, getCurrentRoom(), player, playerSprite);
  drawHud(ctx);
  drawInventory(ctx);
  drawDialogue(ctx, getRoomOffset(getCurrentRoom()));
  drawFade(ctx);
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

  try {
    update(dt);
    draw();
  } catch (err) {
    console.error(err);
    if (window.showError && !loop.failed) window.showError("Error en el juego: " + err.message);
    loop.failed = true;
  }
  requestAnimationFrame(loop);
}

// Lista de imágenes que necesitan todas las habitaciones
function requiredAssets() {
  const names = new Set(["tiles/floor-wood"]);
  for (const it of Object.values(ITEMS)) names.add(it.image); // íconos del inventario
  for (const room of Object.values(rooms)) {
    for (const o of room.objects || []) names.add("objects/" + o.sprite);
    if (room.tileset) names.add(room.tileset); // habitaciones armadas con tileset
    if (room.background) names.add(room.background); // habitaciones con fondo ya armado
    for (const s of room.stamps || []) if (s.image) names.add(s.image);
    for (const f of room.floors || []) names.add(f.tile); // pisos por zonas
    if (room.floorTile) names.add(room.floorTile); // piso propio de la habitación
  }
  return [...names];
}

// Primero cargamos las imágenes y luego arrancamos
Promise.all([loadImage(SPRITE.src), loadAssets(requiredAssets())])
  .then(([img]) => {
    playerSprite = img;
    startScene1();
    requestAnimationFrame(loop);
  })
  .catch((err) => {
    console.error(err);
    if (window.showError) window.showError(err.message);
  });
