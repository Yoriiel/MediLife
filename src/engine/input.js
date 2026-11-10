// Teclado: flechas o WASD. Acción: Espacio, Enter o E.

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

// Se llama una vez por cuadro, al final del update
export function endFrame() {
  for (const k in justPressed) delete justPressed[k];
}
