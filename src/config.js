// Constantes globales del juego

export const TILE = 16;      // tamaño de cada tile en píxeles
export const VIEW_W = 320;   // resolución lógica (20 tiles)
export const VIEW_H = 240;   // resolución lógica (15 tiles)

// Fuente de los textos del juego (canvas).
// Para usar una fuente pixelada: copia el archivo a public/fonts/, decláralo con @font-face
// en style.css y pon su nombre aquí, por ejemplo: '"Pixelify Sans", monospace'
export const FONT_FAMILY = "monospace";

// Objeto que Medi lleva sobre la cabeza (engine/carry.js).
//   scale = tamaño del sprite (0.5 = la mitad); gap = separación sobre la cabeza en píxeles;
//   bobAmplitude / bobSpeed = cuánto sube y baja y a qué velocidad (igual que el signo "!");
//   headY = fila del cuadro de Medi (32x32) donde empieza su cabeza.
export const CARRY_UI = {
  scale: 0.8,
  gap: 3,
  bobAmplitude: 2,
  bobSpeed: 5,
  headY: 10,
};

// Transparencia de las paredes cuando Medi está detrás (solo overlays con fade: true).
//   alpha = opacidad de la pared mientras ella está detrás (0 = invisible, 1 = sin transparencia);
//   speed = rapidez del cambio (más alto = más rápido).
export const WALL_FADE = {
  alpha: 0.35,
  speed: 5,
};

// Inventario (HUD), en píxeles de pantalla (320x240).
// slotSize = tamaño de cada espacio (súbelo/bájalo para escalar todo); gap = separación.
// x / y = esquina superior izquierda; null = x centrado y y pegado al borde de abajo.
export const INVENTORY_UI = {
  slots: 4,
  slotSize: 14,
  gap: 2,
  x: null,
  y: null,
};
