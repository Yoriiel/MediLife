// Planta baja (PROVISIONAL): una sala sencilla para poder bajar y volver a subir.
// Aquí irá después la sala real de la escena 5.

const WALL = "#".repeat(20);
const ROW = "#" + ".".repeat(18) + "#";

export default {
  id: "sala",
  name: "Sala (provisional)",
  wallRows: 4,
  spawn: { x: 155, y: 76 },
  map: [
    WALL, WALL, WALL, WALL,
    ROW, ROW, ROW, ROW, ROW, ROW, ROW, ROW, ROW, ROW,
    WALL,
  ],
  objects: [
    { sprite: "rug-red", x: 121, y: 120, layer: "floor" },
    { sprite: "stairs", x: 141, y: 6, layer: "floor" },
    { sprite: "round-table", x: 48, y: 150, solid: [0, 18, 45, 21] },
    { sprite: "plant", x: 24, y: 184, solid: [0, 20, 16, 11] },
    { sprite: "plant", x: 280, y: 184, solid: [0, 20, 16, 11] },
  ],
  triggers: [
    // aviso de que esta sala todavía no está hecha (solo la primera vez)
    { type: "text", zone: [16, 64, 288, 160], text: "sala.placeholder", once: true },
    // escalera: sube al pasillo
    { type: "exit", zone: [146, 64, 28, 8], to: "pasillo", spawn: { x: 96, y: 78 }, facing: "left" },
  ],
};
