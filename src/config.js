// Constantes globales del juego

export const TILE = 16;      // tamaño de cada tile en píxeles
export const VIEW_W = 320;   // resolución lógica (20 tiles)
export const VIEW_H = 240;   // resolución lógica (15 tiles)

// Fuente de los textos del juego (canvas).
export const FONT_FAMILY = "monospace";

// Objeto que Medi lleva sobre la cabeza (engine/carry.js).
export const CARRY_UI = {
  scale: 0.8,
  gap: 3,
  bobAmplitude: 2,
  bobSpeed: 5,
  headY: 10,
};

// Transparencia de las paredes cuando Medi está detrás (solo overlays con fade: true).
export const WALL_FADE = {
  alpha: 0.35,
  speed: 5,
};

// Inventario (HUD), en píxeles de pantalla (320x240).
export const INVENTORY_UI = {
  slots: 4,
  slotSize: 14,
  gap: 2,
  x: null,
  y: null,
};
