
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
    { sprite: "window-curtains", x: 104, y: 4, layer: "floor" },
    { sprite: "clock", x: 84, y: 12, layer: "floor" },
    { sprite: "rug-red", x: 63, y: 75, layer: "floor" },
    { sprite: "door-side-open", x: 272, y: 112, layer: "floor" }, // puerta al pasillo
    { sprite: "teddy_bear", x: 20, y: 30, sortY: 72 },
    { sprite: "vase_sunflowers", x: 230, y: 140, sortY: 180 },
    { sprite: "wall_shelf_with_plants", x: 200, y: 8, sortY: 72 },
    { sprite: "framed_flower_painting", x: 25, y: 1, sortY: 72 },
    { sprite: "flower-red", x: 80, y: 40},
    { sprite: "umbrella_stan", x: 260, y: 90, solid: [0, 20, 10, 5] },
    { sprite: "long_flower", x: 155, y: 10, sortY: 100 },
    { sprite: "ceramic_vase", x: 20, y: 148, solid: [5, 30, 20, 20] },
    { sprite: "flower_large", x: 26, y: 128, sortY: 200 },

    // muebles
    { sprite: "bed-pink", x: 20, y: 22, solid: [0, 0, 30, 49] },
    { sprite: "nightstand", x: 54, y: 38, solid: [0, 11, 26, 16] },
    { sprite: "lamp", x: 58, y: 19, sortY: 100 },
    { sprite: "chest", x: 23, y: 86, solid: [0, 4, 24, 16] },
    { sprite: "bookshelf", x: 148, y: 20, solid: [0, 21, 48, 14] },
    { sprite: "vanity", x: 200, y: 28, solid: [0, 17, 23, 16] },
    { sprite: "wardrobe", x: 234, y: 14, solid: [0, 28, 35, 17] },
    { sprite: "round-table", x: 216, y: 140, solid: [0, 18, 45, 21] },
    { sprite: "plant", x: 255, y: 160, solid: [0, 20, 16, 11] },
  ],
  // Signo "!" de misión sobre el wardrobe: buscar la bata (misión 3)
  markers: [
    { x: 251, y: 11, mission: "mission3", unless: "bathrobeTaken" },
    // Signo "!" sobre la puerta al pasillo: se ve desde que empieza la misión 1 hasta que toma las salchichas
    { x: 265, y: 133, mission: "mission1", unless: "sausagesTaken" },
  ],
  triggers: [
    // wardrobe: al pararse frente a él (misión 3) pregunta si toma la bata de baño
    { type: "wardrobe", zone: [236, 60, 30, 14], facing: "up" },

    // puerta de la derecha (centrada en la pared): lleva al pasillo, frente a su puerta abierta
    { type: "exit", zone: [272, 112, 16, 32], to: "pasillo", spawn: { x: 235, y: 172 }, facing: "up" },

    // comentarios de Medi al acercarse a un objeto (una sola vez cada uno); zona = [x, y, ancho, alto]
    { type: "text", zone: [80, 48, 26, 22], text: "cuarto.clock", once: true },       // clock
    { type: "text", zone: [18, 164, 42, 26], text: "cuarto.vase", once: true },       // ceramic_vase
    { type: "text", zone: [204, 146, 52, 44], text: "cuarto.sunflowers", once: true }, // vase_sunflowers
    { type: "text", zone: [148, 58, 48, 14], text: "cuarto.bookshelf", once: true },  // bookshelf
    { type: "text", zone: [198, 62, 28, 14], text: "cuarto.vanity", once: true, unless: "showerDone" }, // vanity: ya no sale tras ducharse
  ],
};
