// Constantes globales del juego

export const TILE = 16;      // tamaño de cada tile en píxeles
export const VIEW_W = 320;   // resolución lógica (20 tiles)
export const VIEW_H = 240;   // resolución lógica (15 tiles)

// Fuente de los textos del juego (canvas).
// Para usar una fuente pixelada: copia el archivo a public/fonts/, decláralo con @font-face
// en style.css y pon su nombre aquí, por ejemplo: '"Pixelify Sans", monospace'
export const FONT_FAMILY = "monospace";

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
