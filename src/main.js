import { VIEW_W, VIEW_H } from "./config.js";
import { initInput, initMouse, endFrame } from "./engine/input.js";
import { initTouchControls } from "./engine/touchControls.js";
import { loadImage, loadAssets } from "./engine/assets.js";
import { clearScreen, drawScene, getRoomOffset } from "./engine/renderer.js";
import { isDialogueActive, updateDialogue, drawDialogue } from "./engine/dialogue.js";
import { isFading, updateFade, drawFade, fadeToBlack, fadeFromBlack } from "./engine/fade.js";
import { drawHud } from "./engine/hud.js";
import { ITEMS, addItem, removeItem, hasItem, drawInventory } from "./engine/inventory.js";
import { CARRY_ITEMS, setCarried, clearCarried } from "./engine/carry.js";
import { player, placePlayer, updatePlayer, idlePlayer, SPRITE } from "./entities/player.js";
import { rooms } from "./rooms/index.js";
import { getCurrentRoom } from "./engine/world.js";
import { updateTriggers } from "./engine/triggers.js";
import { isAutoWalking, updateAutoWalk } from "./engine/autowalk.js";
import { getSettings, setSetting } from "./engine/settings.js";
import { initAudio, playMusic, stopMusic } from "./engine/audio.js";
import { setWalking, stopTyping } from "./engine/sfx.js";
import { startScene1, updateScene1 } from "./story/scene1.js";
import { updateCatsScene } from "./story/scene2cats.js";
import { updateYoriScene } from "./story/scene7.js";
import { updatePartyNpcs } from "./story/partyNpcs.js";
import { updateBreakfastScene, drawBreakfastHint } from "./story/scene3.js";
import { setObjective } from "./story/objectives.js";
import { openMainMenu, updateMainMenu, drawMainMenu, MENU_ASSETS } from "./menu/mainMenu.js";
import { needsIntro, startIntro, updateIntro, drawIntro } from "./menu/introScreen.js";
import { isCreditsActive, updateCredits, drawCredits } from "./engine/credits.js";
import { isPaused, tryOpenPause, updatePauseMenu, drawPauseButton, drawPauseMenu } from "./menu/pauseMenu.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

initInput();
initMouse(canvas);
initTouchControls(resizeCanvas); // cruceta y botón A en pantallas táctiles
initAudio();

// Para probar desde la consola del navegador: inventory.addItem("pizza")
window.inventory = { addItem, removeItem, hasItem };
// Para probar el objeto sobre la cabeza: carry.set("bathrobe") / carry.clear()
window.carry = { set: setCarried, clear: clearCarried };
// Para probar misiones: story.setObjective("mission1b")
window.story = { setObjective };
// Para probar ajustes y música: settings.set("volume", 0.3) / settings.set("particles", false) / audio.play("game")
window.settings = { get: getSettings, set: setSetting };
window.audio = { play: playMusic, stop: stopMusic };

// Estado del juego
let playerSprite = null;
let gameState = needsIntro() ? "intro" : "menu"; // "intro" (bienvenida, solo la primera vez) | "menu" (menú principal) | "playing"
placePlayer(getCurrentRoom().spawn);

// "Jugar": fundido a negro y arranca la escena 1 (que se aclara sola desde negro)
function startGame() {
  fadeToBlack(0.4, () => {
    gameState = "playing";
    playMusic("game");
    startScene1();
  });
}

function update(dt) {
  // Bienvenida: al primer clic, toque o tecla pasa al menú con un fundido desde negro
  if (gameState === "intro") {
    if (updateIntro()) {
      gameState = "menu";
      fadeFromBlack(0.5);
    }
    endFrame();
    return;
  }

  if (gameState === "menu") {
    updateFade(dt);
    if (!isFading()) updateMainMenu(); // mientras funde a negro no se toca el menú
    endFrame();
    return;
  }

  // Créditos finales: pantalla aparte, el juego queda congelado (sin pausa)
  if (isCreditsActive()) {
    updateCredits(dt);
    endFrame();
    return;
  }

  // Pausa: Escape o el botón de la esquina; mientras está abierta el juego se congela
  if (isPaused()) {
    updatePauseMenu();
    endFrame();
    return;
  }
  if (tryOpenPause(isDialogueActive())) {
    setWalking(false);
    stopTyping();
    endFrame();
    return;
  }

  updateFade(dt);
  updateBreakfastScene(getCurrentRoom(), dt); // antes del diálogo: un Espacio que cierra un cuadro no come
  updateDialogue(dt);

  if (isDialogueActive() || isFading()) idlePlayer(dt);
  else if (isAutoWalking()) updateAutoWalk(getCurrentRoom(), dt); // Medi camina sola (escenas)
  else {
    updatePlayer(getCurrentRoom(), dt);
    updateTriggers(getCurrentRoom(), player);
  }

  updateScene1(player, getCurrentRoom());
  updateCatsScene(getCurrentRoom());
  updateYoriScene(getCurrentRoom()); // después de la fiesta: Yori le habla a Medi al acercarse
  updatePartyNpcs(getCurrentRoom()); // después de la fiesta: los familiares le hablan al acercarse

  // pasos mientras Medi camina (también al caminar sola); sin pasos en celular/tablet (body.touch)
  setWalking(player.moving && !document.body.classList.contains("touch"));

  endFrame(); // limpia las pulsaciones nuevas del cuadro
}

function draw() {
  if (gameState === "intro") {
    drawIntro(ctx);
    return;
  }

  if (gameState === "menu") {
    clearScreen(ctx);
    drawMainMenu(ctx);
    drawFade(ctx);
    return;
  }

  clearScreen(ctx);
  drawScene(ctx, getCurrentRoom(), player, playerSprite);
  drawHud(ctx);
  drawInventory(ctx);
  drawBreakfastHint(ctx, getRoomOffset(getCurrentRoom()));
  drawDialogue(ctx, getRoomOffset(getCurrentRoom()));
  drawFade(ctx);
  drawPauseMenu(ctx);
  drawPauseButton(ctx);
  drawCredits(ctx);
}

// Escalado del canvas en múltiplos enteros (pixel art nítido)
function resizeCanvas() {
  let availW = window.innerWidth;
  let availH = window.innerHeight;
  // En táctil se reserva espacio para los controles (cruceta y botón A)
  if (document.body.classList.contains("touch")) {
    if (window.innerWidth > window.innerHeight) availW -= 2 * 150; // horizontal: a los lados
    else availH -= 190; // vertical: debajo
  }
  const scale = Math.max(1, Math.floor(Math.min(availW / VIEW_W, availH / VIEW_H)));
  canvas.style.width = VIEW_W * scale + "px";
  canvas.style.height = VIEW_H * scale + "px";
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
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
  for (const a of MENU_ASSETS) names.add(a); // sprites decorativos del menú
  for (const it of Object.values(ITEMS)) names.add(it.image); // íconos del inventario
  for (const it of Object.values(CARRY_ITEMS)) names.add(it.image); // objetos que se llevan sobre la cabeza
  for (const room of Object.values(rooms)) {
    for (const o of room.objects || []) names.add("objects/" + o.sprite);
    if (room.tileset) names.add(room.tileset); // habitaciones armadas con tileset
    if (room.background) names.add(room.background); // habitaciones con fondo ya armado
    for (const a of room.animations || []) names.add(a.image); // animaciones de fondo (humo, etc.)
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
    openMainMenu(startGame);
    if (gameState === "intro") startIntro(); // la música del menú empieza con el primer gesto
    else playMusic("menu");
    requestAnimationFrame(loop);
  })
  .catch((err) => {
    console.error(err);
    if (window.showError) window.showError(err.message);
  });
