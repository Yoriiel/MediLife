
const WALL = "##################";
const ROW = "#................#";
const ROW_DOOR = "#" + ".".repeat(17); // pared derecha abierta: aquí va la puerta

export default {
  id: "cuarto",
  name: "Cuarto de Medi",
  floorTile: "tiles/piso-parquet", // piso de 32x32 (reemplaza floor-wood)
  spawn: { x: 30, y: 75 }, // justo debajo de la cama, entre la cama y el baúl
  map: [
    WALL, WALL, WALL,
    ROW, ROW, ROW, ROW,
    ROW_DOOR, ROW_DOOR,
    ROW, ROW, ROW,
    WALL,
  ],
  objects: [
    // decoración de pared y suelo
    { sprite: "window-curtains", x: 104, y: 8, layer: "floor" },
    { sprite: "clock", x: 84, y: 12, layer: "floor" },
    { sprite: "rug-red", x: 105, y: 95, layer: "floor" },
    { sprite: "door-side-open", x: 272, y: 112, layer: "floor" }, // puerta al pasillo

    // muebles
    { sprite: "bed-pink", x: 20, y: 22, solid: [0, 0, 30, 49] },
    { sprite: "nightstand", x: 54, y: 38, solid: [0, 11, 26, 16] },
    { sprite: "lamp", x: 58, y: 19, sortY: 100 },
    { sprite: "chest", x: 23, y: 86, solid: [0, 4, 24, 16] },
    { sprite: "bookshelf", x: 148, y: 20, solid: [0, 21, 48, 14] },
    { sprite: "vanity", x: 200, y: 28, solid: [0, 17, 23, 16] },
    { sprite: "wardrobe", x: 234, y: 14, solid: [0, 28, 35, 17] },
    { sprite: "round-table", x: 216, y: 140, solid: [0, 18, 45, 21] },
    { sprite: "plant", x: 24, y: 152, solid: [0, 20, 16, 11] },
  ],
  triggers: [
    // puerta de la derecha (centrada en la pared): lleva al pasillo, frente a su puerta abierta
    { type: "exit", zone: [272, 112, 16, 32], to: "pasillo", spawn: { x: 235, y: 172 }, facing: "up" },
  ],
};
