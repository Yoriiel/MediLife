
import { say, ask, isDialogueActive } from "../engine/dialogue.js";
import { isFading } from "../engine/fade.js";
import { isTransitioning } from "../engine/world.js";
import { hasItem, removeItem } from "../engine/inventory.js";
import { player } from "../entities/player.js";
import { emitHearts, startSatisfied } from "../engine/particles.js";
import { getObjective, setObjective } from "./objectives.js";
import { hasFlag, setFlag } from "./events.js";
import { CATS } from "../rooms/exterior.js";
import { playSfx, playPurr } from "../engine/sfx.js";

// Altura de la cabeza sobre las patas del gato (el cuadro mide 32x32 y las patas están en la fila 24)
const HEAD_OFFSET_Y = 20;

// Desplazamiento lateral de cada burbuja (para que la de Conejito no tape a Medi al salir)
const BUBBLE_SHIFT = { pacho: 0, conejito: 16 };

// Zona de interacción alrededor de las patas del gato (píxeles de la habitación, medidos desde el
// centro de la caja de pies de Medi): a los lados, hacia arriba y hacia abajo.
// Medi se detiene pegada al cuerpo del gato, así que estos márgenes dejan una franja cómoda.
const REACH = { side: 22, up: 20, down: 10 };

// Cuánto más hay que alejarse (píxeles extra sobre REACH) para que el gato al que se le dijo "No" maúlle
const LEAVE_MARGIN = 14;

// Qué gatos ya estaban "cerca" en el cuadro anterior (la pregunta solo salta al ENTRAR en la zona)
const inside = {};

// Gatos a los que Medi les dijo "No" y todavía no han maullado por su partida
const declined = {};

function clearState() {
  for (const k in inside) delete inside[k];
  for (const k in declined) delete declined[k];
}

// Punto de donde sale la burbuja de un gato (coordenadas de la habitación), encima de su cabeza
export function catBubble(cat) {
  return { x: cat.x, y: cat.y - HEAD_OFFSET_Y, above: true, dx: BUBBLE_SHIFT[cat.id] || 0 };
}

// Frase que dice Medi al darle la salchicha a cada gato (no se traducen)
const FED_LINE = { pacho: "scene2.fedPacho", conejito: "scene2.fedConejito" };

// Nombre de la marca que indica que ese gato ya comió
export function fedFlag(cat) {
  return "fed_" + cat.id;
}

// margin (opcional): agranda la zona por todos lados
function isNear(cat, margin = 0) {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  return (
    Math.abs(cx - cat.x) <= REACH.side + margin &&
    cy >= cat.y - REACH.up - margin &&
    cy <= cat.y + REACH.down + margin
  );
}

// Medi se gira hacia el gato
function faceCat(cat) {
  const dx = cat.x - (player.x + player.w / 2);
  const dy = cat.y - 3 - (player.y + player.h / 2);
  if (Math.abs(dx) > Math.abs(dy)) player.facing = dx < 0 ? "left" : "right";
  else player.facing = dy < 0 ? "up" : "down";
}

// ¿Ya comieron todos los gatos?
function allFed() {
  return CATS.every((c) => hasFlag(fedFlag(c)));
}

// Cierra la misión 1. La misión 2 la activa story/scene3.js cuando Medi vuelve a entrar en la casa
function finishMission1() {
  setFlag("mission1Done");
  setObjective(null);
}

// Acariciar al gato: los mismos corazones de siempre sobre su cabeza
// (si ya había comido, las partículas verdes siguen su curso)
function petCat(cat) {
  playSfx("meow2"); // gatos2 cada vez que lo acaricia
  playPurr(cat.id); // y ronronea (se reinicia si ya estaba ronroneando)
  emitHearts("exterior", cat.x, cat.y - HEAD_OFFSET_Y);
}

function giveSausage(cat) {
  removeItem("sausage");
  setFlag(fedFlag(cat));
  delete declined[cat.id];
  const head = cat.y - HEAD_OFFSET_Y;
  // corazones sobre su cabeza; al desaparecer, empiezan las partículas verdes (gato satisfecho)
  emitHearts("exterior", cat.x, head, () => {
    playPurr(cat.id); // ronroneo cuando salen las partículas verdes
    startSatisfied(cat.id, "exterior", cat.x, head);
  });

  // Medi dice su frase; si ya comieron los dos gatos, al terminarla se cierra la misión 1
  say(FED_LINE[cat.id], () => {
    if (allFed()) finishMission1();
  });
}

// Revisa si Medi acaba de acercarse a un gato: si aún no ha comido y Medi tiene salchichas, pregunta
// "¿Dar salchicha?"; en cualquier otro caso pregunta "¿Acariciar?".
// También revisa si se alejó de uno al que le dijo "No" (entonces ese gato maúlla)
function updateGiveFood() {
  for (const cat of CATS) {
    if (declined[cat.id] && !isNear(cat, LEAVE_MARGIN)) {
      delete declined[cat.id];
      inside[cat.id] = false;
      playSfx("meow"); // el gato al que le dijo "No" maúlla al alejarse (gatos1)
      say("scene2.catMeow", null, { bubble: catBubble(cat) });
      return;
    }

    const near = isNear(cat);
    const was = !!inside[cat.id];
    inside[cat.id] = near;
    if (!near || was) continue;

    faceCat(cat);
    if (!hasFlag(fedFlag(cat)) && hasItem("sausage")) {
      ask("scene2.givePrompt", ["choice.yes", "choice.no"], (index) => {
        if (index === 0) giveSausage(cat);
        else declined[cat.id] = true; // maullará cuando Medi se aleje
      });
    } else {
      ask("scene2.petPrompt", ["choice.yes", "choice.no"], (index) => {
        if (index === 0) petCat(cat);
      });
    }
    return; // una pregunta a la vez
  }
}

// Se llama en cada cuadro
export function updateCatsScene(room) {
  if (room.id !== "exterior") {
    clearState(); // al volver a salir, las zonas se evalúan de cero
    return;
  }
  // activo durante la misión de las salchichas y, después, para siempre (marca "mission1Done")
  const inMission1b = getObjective() === "mission1b";
  if (!inMission1b && !hasFlag("mission1Done")) return;
  if (isFading() || isTransitioning() || isDialogueActive()) return;

  if (inMission1b && !hasFlag("catsMeowed")) {
    setFlag("catsMeowed");
    playSfx("meow2"); // maullido de los dos gatos al salir de casa (gatos2)
    say("scene2.catMeow", null, { bubble: CATS.map(catBubble) });
    return;
  }

  updateGiveFood();
}
