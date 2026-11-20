// Baile de la fiesta: mientras suena la canción de cumpleaños, Yori y la familia dan saltitos
// (un movimiento leve de arriba a abajo).
//   getDanceOffset(sprite) -> desplazamiento vertical en píxeles (0 o negativo = hacia arriba) que el
//                             renderer (engine/renderer.js) suma a la posición del objeto con ese sprite.
// Ajustes en DANCE; quién baila, en DANCERS (nombre del sprite del objeto en rooms/plantabaja.js).
// La canción es el sonido "birthday" de engine/sfx.js (la pone story/scene6.js al llegar Medi a la mesa).

import { isSfxPlaying } from "./sfx.js";

// Sprites que bailan (el pastel y Medi no)
const DANCERS = ["yori", "mamusik", "kiana", "papusik", "teia"];

// height = altura máxima del salto en píxeles (sube a 1 o 2 y baja); hopsPerSecond = saltos por segundo
const DANCE = { height: 2, hopsPerSecond: 2 };

export function getDanceOffset(sprite) {
  if (!DANCERS.includes(sprite) || !isSfxPlaying("birthday")) return 0;
  const t = performance.now() / 1000;
  return -Math.round(DANCE.height * Math.abs(Math.sin(Math.PI * DANCE.hopsPerSecond * t)));
}
