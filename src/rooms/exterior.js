// Exterior: la casa vista por fuera (jardín, cerca, camino y árboles).
// El fondo es una sola imagen ya armada (public/rooms/exterior.png, 608x320 = 38x20 tiles).
// Es más grande que la pantalla (320x240): la cámara sigue a Medi (ver getRoomOffset en renderer.js).
//
// Por ahora todo el mapa es caminable (solo los bordes de la imagen frenan a Medi).
// Las colisiones (casa, cerca, árboles, rocas...) y la profundidad llegan en una parte siguiente.

const COLS = 38;
const ROWS = 20;
const ROW = ".".repeat(COLS);

export default {
  id: "exterior",
  name: "Exterior",
  background: "rooms/exterior",
  // justo frente a la puerta de la casa (la caja de pies de Medi mide 10x6)
  spawn: { x: 314, y: 176 },
  map: Array.from({ length: ROWS }, () => ROW),
  objects: [],
  triggers: [],
};
