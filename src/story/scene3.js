
import { ask, say, isDialogueActive } from "../engine/dialogue.js";
import { isFading } from "../engine/fade.js";
import { isTransitioning } from "../engine/world.js";
import { addItem, removeItem, hasItem } from "../engine/inventory.js";
import { wasPressed } from "../engine/input.js";
import { playFridge, playSfx } from "../engine/sfx.js";
import { player } from "../entities/player.js";
import { t } from "../i18n/index.js";
import { FONT_FAMILY, VIEW_W, VIEW_H, INVENTORY_UI } from "../config.js";
import { getObjective, setObjective } from "./objectives.js";
import { hasFlag, setFlag } from "./events.js";

// Cuántos pedazos de pizza se toman de la nevera
const PIZZAS = 2;

// Comidas que Medi puede comer en la misión 2, en orden (se ofrece la primera que tenga en el inventario)
const FOODS = [
  { item: "pizza", prompt: "scene3.pizzaPrompt" },
  { item: "banana", prompt: "scene3.bananaPrompt" },
  { item: "cucumber", prompt: "scene3.cucumberPrompt" },
];

const YUM_TIME = 1.0;  // segundos que se ve "¡Ñam!"
const YUM_FADE = 0.4;  // últimos segundos en los que se desvanece
const MISSION3_DELAY = 3;  // segundos entre "Barriguita llena" y la misión 3

let yum = null; // { time } mientras se muestra "¡Ñam!"
let fullBellyPending = false; // se comió todo: falta decir "Barriguita llena" (cuando pase el "¡Ñam!")
let fridgeRecheck = false; // se acaba de cerrar "Quiero un poco más": ver si Medi ya está junto a la nevera
let mission3Timer = null; // segundos que faltan para la misión 3 (null = no está contando)
let mission3Pending = false; // terminó la cuenta: falta decir "Estoy apestosa" y empezar la misión 3
let wantMorePending = false; // se comió el último pedazo de pizza: falta decir "Quiero un poco más" (cuando pase el "¡Ñam!")

function takePizzas() {
  playFridge(); // sonido de la nevera (x2)
  let taken = 0;
  for (let i = 0; i < PIZZAS; i++) if (addItem("pizza")) taken++;
  if (taken !== PIZZAS) return;

  setFlag("pizzaTaken"); // la nevera ya no pregunta más y el "!" se oculta
  say("scene3.yico"); // Medi lo dice al tomar la pizza
}

// "Sí" (opción 0) toma la pizza; "No" no hace nada y la jugadora queda libre
export function startPizzaFridge() {
  ask("scene3.pizzaFridgePrompt", ["choice.yes", "choice.no"], (index) => {
    if (index === 0) takePizzas();
  });
}

// Segunda ida a la nevera: plátano y pepino. Solo se agrega lo que aún no tenga, así nunca se duplican
function takeMore() {
  playFridge(); // sonido de la nevera (x2)
  for (const id of ["banana", "cucumber"]) if (!hasItem(id)) addItem(id);
  if (!hasItem("banana") || !hasItem("cucumber")) return; // no cupieron: la nevera vuelve a preguntar

  setFlag("moreTaken"); // la nevera ya no pregunta más y el "!" se oculta
}

// "Sí" (opción 0) toma el plátano y el pepino; "No" no hace nada y la jugadora queda libre
export function startMoreFridge() {
  ask("scene3.moreFridgePrompt", ["choice.yes", "choice.no"], (index) => {
    if (index === 0) takeMore();
  });
}

// Medi entra de nuevo en la casa: habla de su hambre y empieza la misión 2
function startMission2() {
  setFlag("mission2Started");
  say(["scene3.hungry1", "scene3.hungry2"], () => {
    setObjective("mission2");
  });
}

// Comida que se puede comer ahora (null si no hay ninguna)
function currentFood() {
  if (getObjective() !== "mission2" || !hasFlag("pizzaTaken")) return null;
  return FOODS.find((f) => hasItem(f.item)) || null;
}

// Un pulsado de Espacio = un pedazo
function eatOne() {
  const food = currentFood();
  if (!food) return;
  removeItem(food.item);
  playSfx("eat"); // sonido de comer un pedazo
  yum = { time: 0 };

  // Se acabó la pizza (y todavía no pidió más): al terminar el "¡Ñam!" dirá "Quiero un poco más"
  if (food.item === "pizza" && !hasItem("pizza") && !hasFlag("wantsMore")) wantMorePending = true;

  // Se acabó todo (ya había tomado plátano y pepino): al terminar el "¡Ñam!" dirá "Barriguita llena"
  if (hasFlag("moreTaken") && !hasItem("banana") && !hasItem("cucumber") && !hasFlag("bellyFull")) fullBellyPending = true;
}

// Se llama en cada cuadro, ANTES de updateDialogue: así un Espacio que cierra un diálogo no se
// cuenta también como "comer" (dt = segundos desde el cuadro anterior)
export function updateBreakfastScene(room, dt) {
  if (yum) {
    yum.time += dt;
    if (yum.time >= YUM_TIME) yum = null;
  }

  // cuenta de 3 s hasta la misión 3 (corre aunque Medi se mueva o cambie de habitación)
  if (mission3Timer !== null) {
    mission3Timer -= dt;
    if (mission3Timer <= 0) {
      mission3Timer = null;
      mission3Pending = true;
    }
  }

  if (isFading() || isTransitioning() || isDialogueActive()) return;

  // pasó el delay: Medi dice "Estoy apestosa" (cuando no haya otro cuadro o fundido) y empieza la misión 3
  if (mission3Pending) {
    mission3Pending = false;
    setFlag("mission3Started");
    say("scene3.smelly", () => {
      setObjective("mission3");
    });
    return;
  }

  if (hasFlag("mission1Done") && !hasFlag("mission2Started") && room.id === "plantabaja") {
    startMission2();
    return;
  }

  if (wantMorePending && !yum) {
    wantMorePending = false;
    setFlag("wantsMore"); // el "!" vuelve a aparecer sobre la nevera
    say("scene3.wantMore", () => {
      fridgeRecheck = true;
    });
    return;
  }

  // Medi no salió de la zona de la nevera: el trigger solo salta al ENTRAR, así que se pregunta aquí
  if (fridgeRecheck) {
    fridgeRecheck = false;
    const zone = (room.triggers || []).find((tr) => tr.type === "fridgeMore");
    if (zone && getObjective() === "mission2" && !hasFlag("moreTaken")) {
      const [zx, zy, zw, zh] = zone.zone;
      const cx = player.x + player.w / 2;
      const cy = player.y + player.h / 2;
      if (cx >= zx && cx <= zx + zw && cy >= zy && cy <= zy + zh) {
        player.facing = zone.facing || "up";
        startMoreFridge();
        return;
      }
    }
  }

  if (fullBellyPending && !yum) {
    fullBellyPending = false;
    setFlag("bellyFull");
    setObjective(null); // desaparece la leyenda de la misión de arriba
    say("scene3.fullBelly", () => {
      mission3Timer = MISSION3_DELAY; // 3 s después de cerrar el cuadro empieza la misión 3
    });
    return;
  }

  if (wasPressed(" ")) eatOne();
}

// Texto con marco de madera (mismo estilo que el HUD)
function drawTag(ctx, text, x, y, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.font = `8px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  const w = Math.ceil(ctx.measureText(text).width) + 8;
  ctx.fillStyle = "rgba(59, 35, 20, 0.85)";
  ctx.fillRect(x, y, w, 14);
  ctx.fillStyle = "#f5deb3";
  ctx.fillText(text, x + 4, y + 3);
  ctx.globalAlpha = 1;
  return w;
}

// Se llama en draw(): "¡Ñam!" sobre Medi (coordenadas de la habitación + origin) y el aviso de comer
// sobre el inventario (coordenadas de pantalla)
export function drawBreakfastHint(ctx, origin) {
  if (yum) {
    const alpha = yum.time > YUM_TIME - YUM_FADE ? (YUM_TIME - yum.time) / YUM_FADE : 1;
    ctx.font = `8px ${FONT_FAMILY}`;
    const text = t("scene3.yum");
    const w = Math.ceil(ctx.measureText(text).width) + 8;
    const cx = origin.x + player.x + player.w / 2;
    const top = origin.y + player.y - 22;
    const x = Math.max(2, Math.min(VIEW_W - w - 2, Math.round(cx - w / 2)));
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = "#3b2314";
    ctx.fillRect(x, top, w, 12);
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(x + 1, top + 1, w - 2, 10);
    ctx.fillStyle = "#3b2314";
    ctx.textBaseline = "top";
    ctx.fillText(text, x + 4, top + 2);
    ctx.globalAlpha = 1;
  }

  const food = currentFood();
  if (food && !isDialogueActive() && !isFading()) {
    ctx.font = `8px ${FONT_FAMILY}`;
    const text = t(food.prompt);
    const w = Math.ceil(ctx.measureText(text).width) + 8;
    const { slotSize: s } = INVENTORY_UI;
    const y = VIEW_H - s - 1 - 3 - 14; // justo encima del inventario
    drawTag(ctx, text, Math.round((VIEW_W - w) / 2), y);
  }
}
