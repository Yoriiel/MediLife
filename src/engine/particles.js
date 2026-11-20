// Partículas (corazones, destellos verdes, etc.) que flotan sobre la escena.
//   emitHearts(roomId, x, y, onDone)
//       -> lanza corazones que suben y se desvanecen alrededor del punto (x, y) de la habitación
//          (coordenadas de la habitación; x = centro, y = altura de la cabeza).
//          Dura ~2 segundos en total. onDone (opcional) se llama cuando desaparece el último corazón.
//   startSatisfied(id, roomId, x, y)
//       -> partículas verdes constantes y lentas ("gato satisfecho") alrededor del punto (x, y).
//          No terminan solas. "id" identifica al emisor (p. ej. "pacho"): si ya existe, no se duplica.
//   stopSatisfied(id)
//       -> detiene ese emisor (las partículas que ya salieron se desvanecen solas).
//   drawParticles(ctx, room)
//       -> se llama desde drawScene (ya con la habitación trasladada); avanza y dibuja las partículas.
// Sprites: public/particles/heart-small.png (7x7) y public/particles/sparkle.png (7x7).
// (heart.png, el corazón grande de 13x12, ya no se usa; se puede conservar o borrar.)

import { loadAssets, getImage } from "./assets.js";
import { getSettings } from "./settings.js";

const HEART_IMAGE = "particles/heart-small"; // 7x7, mismo tamaño que las partículas verdes
const SPARK_IMAGE = "particles/sparkle";

// Ajustes de los corazones (tiempos en segundos, distancias en píxeles)
const HEART = {
  emitTime: 1.3,   // cuánto tiempo se siguen lanzando corazones
  interval: 0.17,  // cada cuánto sale uno nuevo
  life: [0.8, 1.0],// cuánto dura cada corazón (mínimo, máximo)
  spread: 11,      // dispersión horizontal alrededor del punto
  rise: [14, 22],  // velocidad con la que suben (píxeles por segundo)
  wobble: 2,       // vaivén lateral
};

// Ajustes de las partículas verdes (constantes y lentas)
const SPARK = {
  interval: [0.45, 0.8], // cada cuánto sale una nueva (mínimo, máximo)
  life: [2.0, 2.6],      // cuánto dura cada una
  spread: 11,            // dispersión horizontal alrededor del punto
  startY: [-2, 8],       // altura inicial respecto al punto (negativo = más arriba)
  rise: [5, 9],          // velocidad con la que suben (píxeles por segundo): lento
  wobble: 1.5,           // vaivén lateral suave
  fadeIn: 0.2,           // fracción de la vida que tarda en aparecer
  fadeOut: 0.45,         // fracción de la vida que tarda en desvanecerse (al final)
  maxAlpha: 0.95,
};

// Se cargan solas al importar este archivo; si alguna falla, el juego sigue sin ella
loadAssets([HEART_IMAGE]).catch((err) => console.warn("No se pudo cargar el corazón:", err));
loadAssets([SPARK_IMAGE]).catch((err) => console.warn("No se pudo cargar la partícula verde:", err));

const particles = [];
const emitters = [];       // corazones (terminan solos)
const sparkEmitters = [];  // partículas verdes (permanentes hasta stopSatisfied)
let lastTime = null;

const rand = (a, b) => a + Math.random() * (b - a);

export function emitHearts(roomId, x, y, onDone) {
  emitters.push({ room: roomId, x, y, time: 0, next: 0, emitting: true, onDone: onDone || null });
}

export function startSatisfied(id, roomId, x, y) {
  if (sparkEmitters.some((s) => s.id === id)) return; // ya está activo
  sparkEmitters.push({ id, room: roomId, x, y, wait: 0 });
}

export function stopSatisfied(id) {
  const i = sparkEmitters.findIndex((s) => s.id === id);
  if (i >= 0) sparkEmitters.splice(i, 1);
}

function spawnHeart(e) {
  particles.push({
    kind: "heart",
    emitter: e,
    room: e.room,
    x0: e.x + rand(-HEART.spread, HEART.spread),
    x: 0,
    y: e.y + rand(-4, 4),
    vy: -rand(HEART.rise[0], HEART.rise[1]),
    phase: rand(0, Math.PI * 2),
    age: 0,
    life: rand(HEART.life[0], HEART.life[1]),
  });
}

function spawnSpark(s) {
  particles.push({
    kind: "spark",
    emitter: s,
    room: s.room,
    x0: s.x + rand(-SPARK.spread, SPARK.spread),
    x: 0,
    y: s.y + rand(SPARK.startY[0], SPARK.startY[1]),
    vy: -rand(SPARK.rise[0], SPARK.rise[1]),
    phase: rand(0, Math.PI * 2),
    age: 0,
    life: rand(SPARK.life[0], SPARK.life[1]),
  });
}

function update(dt) {
  for (const e of emitters) {
    if (!e.emitting) continue;
    e.time += dt;
    while (e.next <= e.time && e.next < HEART.emitTime) {
      spawnHeart(e);
      e.next += HEART.interval;
    }
    if (e.next >= HEART.emitTime) e.emitting = false;
  }

  // partículas verdes: salen una tras otra, sin parar
  for (const s of sparkEmitters) {
    s.wait -= dt;
    if (s.wait <= 0) {
      spawnSpark(s);
      s.wait = rand(SPARK.interval[0], SPARK.interval[1]);
    }
  }

  for (const p of particles) {
    p.age += dt;
    p.y += p.vy * dt;
    const heart = p.kind === "heart";
    p.x = p.x0 + Math.sin(p.age * (heart ? 6 : 2) + p.phase) * (heart ? HEART.wobble : SPARK.wobble);
  }

  // quita las partículas que ya terminaron
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].age >= particles[i].life) particles.splice(i, 1);
  }

  // un efecto de corazones termina cuando ya no lanza más y no queda ningún corazón suyo
  for (let i = emitters.length - 1; i >= 0; i--) {
    const e = emitters[i];
    if (e.emitting || particles.some((p) => p.emitter === e)) continue;
    emitters.splice(i, 1);
    if (e.onDone) e.onDone();
  }
}

function heartAlpha(p) {
  // opaco la primera parte de su vida y luego se desvanece
  const fadeStart = p.life * 0.55;
  return p.age < fadeStart ? 1 : Math.max(0, 1 - (p.age - fadeStart) / (p.life - fadeStart));
}

function sparkAlpha(p) {
  // aparece suave, se queda y se desvanece al final
  const t = p.age / p.life;
  let a = 1;
  if (t < SPARK.fadeIn) a = t / SPARK.fadeIn;
  else if (t > 1 - SPARK.fadeOut) a = (1 - t) / SPARK.fadeOut;
  return Math.max(0, Math.min(1, a)) * SPARK.maxAlpha;
}

export function drawParticles(ctx, room) {
  const now = performance.now();
  const dt = lastTime === null ? 0 : Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt); // siempre avanza (aunque estén ocultas) para que los tiempos de las escenas no cambien

  if (!getSettings().particles) return; // ajuste "Partículas" desactivado: no se dibujan

  const heartImg = getImage(HEART_IMAGE);
  const sparkImg = getImage(SPARK_IMAGE);

  for (const p of particles) {
    if (p.room !== room.id) continue;
    const img = p.kind === "heart" ? heartImg : sparkImg;
    if (!img) continue;
    ctx.globalAlpha = p.kind === "heart" ? heartAlpha(p) : sparkAlpha(p);
    ctx.drawImage(img, Math.round(p.x - img.width / 2), Math.round(p.y - img.height / 2));
  }
  ctx.globalAlpha = 1;
}
