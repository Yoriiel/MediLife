// Fundidos a negro / desde negro

import { VIEW_W, VIEW_H } from "../config.js";

let alpha = 0;
let target = 0;
let speed = 1;
let onDone = null;
let holdLeft = 0; // segundos que se queda en negro antes de llamar al callback

export function fadeFromBlack(seconds, callback) {
  alpha = 1;
  target = 0;
  speed = 1 / seconds;
  onDone = callback || null;
  holdLeft = 0;
}

// hold (opcional): segundos que la pantalla se queda en negro antes de llamar al callback.
// Mientras dura, isFading() sigue siendo true, así que la jugadora no se puede mover.
export function fadeToBlack(seconds, callback, hold = 0) {
  target = 1;
  speed = 1 / seconds;
  onDone = callback || null;
  holdLeft = hold;
}

export function isFading() {
  return alpha !== target || holdLeft > 0;
}

export function updateFade(dt) {
  if (alpha !== target) {
    const step = speed * dt;
    alpha = alpha < target ? Math.min(target, alpha + step) : Math.max(target, alpha - step);
    if (alpha !== target) return;
  }

  if (!onDone) return;

  // ya llegó al objetivo: espera el tiempo de pausa (si lo hay) y luego avisa
  if (holdLeft > 0) {
    holdLeft -= dt;
    if (holdLeft > 0) return;
    holdLeft = 0;
  }

  const callback = onDone;
  onDone = null;
  callback();
}

export function drawFade(ctx) {
  if (alpha <= 0) return;
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}
