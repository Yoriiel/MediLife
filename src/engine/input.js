// Teclado: flechas o WASD. Acción: Espacio, Enter o E.

import { VIEW_W, VIEW_H } from "../config.js";

const keys = {};
const justPressed = {};

const BLOCKED_KEYS = ["arrowup", "arrowdown", "arrowleft", "arrowright", " "];

export function initInput() {
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (!keys[k]) justPressed[k] = true;
    keys[k] = true;
    if (BLOCKED_KEYS.includes(k)) e.preventDefault();
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });
}

// Devuelve la dirección deseada: dx y dy entre -1 y 1
export function getDirection() {
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

// Mantenida: true mientras la tecla siga abajo
export function isPressed(key) {
  return !!keys[key.toLowerCase()];
}

// Pulsación nueva: true solo en el cuadro en que se presionó la tecla
export function wasPressed(key) {
  return !!justPressed[key.toLowerCase()];
}

// Mouse / pantalla táctil (coordenadas lógicas del canvas, 0..320 x 0..240)
const mouse = { x: -1, y: -1, down: false, pressed: false, moved: false };

// Se llama una vez con el canvas del juego
export function initMouse(canvas) {
  canvas.style.touchAction = "none"; // en pantallas táctiles, arrastrar no desplaza la página
  const place = (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) * VIEW_W) / r.width;
    mouse.y = ((e.clientY - r.top) * VIEW_H) / r.height;
  };
  canvas.addEventListener("pointermove", (e) => {
    place(e);
    mouse.moved = true;
  });
  canvas.addEventListener("pointerdown", (e) => {
    place(e);
    mouse.down = true;
    mouse.pressed = true;
    mouse.moved = true;
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId); // sigue el arrastre fuera del canvas
  });
  const release = () => {
    mouse.down = false;
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
}

// x, y: posición; down: botón mantenido; pressed: clic nuevo este cuadro; moved: se movió este cuadro
export function getMouse() {
  return mouse;
}

// Se llama una vez por cuadro, al final del update
export function endFrame() {
  for (const k in justPressed) delete justPressed[k];
  mouse.pressed = false;
  mouse.moved = false;
}
