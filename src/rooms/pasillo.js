
const WALL = "#".repeat(20);
const ROW = "#" + ".".repeat(18) + "#";
const BOTTOM = "#".repeat(14) + "dd" + "#".repeat(4); // puerta de Medi (columnas 14-15): se camina, se ve negro

export default {
  id: "pasillo",
  name: "Pasillo",
  wallRows: 4,
  spawn: { x: 235, y: 172 }, // justo frente a la puerta del cuarto de Medi
  map: [
    WALL, WALL, WALL, WALL,
    ROW, ROW, ROW, ROW, ROW, ROW, ROW, ROW,
    BOTTOM,
  ],
  objects: [
    // alfombra (debajo de la escalera)
    { sprite: "rug-red", x: 121, y: 122, layer: "floor" },

    // pared del fondo: puerta 1 y puerta 2, con cuadros entre ellas
    { sprite: "door-closed", x: 62, y: 24, layer: "floor" },
    { sprite: "door-closed", x: 222, y: 24, layer: "floor" },
    { sprite: "picture-a", x: 112, y: 16, layer: "floor" },
    { sprite: "picture-b", x: 192, y: 16, layer: "floor" },

    // escalera en el piso: sólida, salvo el descanso de la izquierda (10 px), que es la entrada.
    // Zonas sólidas: riel de arriba y de abajo del descanso + todo el cuerpo de la escalera.
    { sprite: "stairs-floor", x: 115, y: 65, layer: "floor",
      solid: [[0, 0, 10, 5], [0, 31, 10, 5], [10, 0, 75, 36]] },

    // paredes laterales: una puerta cerrada por lado, centrada
    { sprite: "door-side-closed", x: 0, y: 112, layer: "floor" },   // puerta 3 (izquierda)
    { sprite: "door-side-closed", x: 304, y: 112, layer: "floor" }, // puerta 4 (derecha)

    // pared de abajo: puerta 5 cerrada (izquierda) y la puerta de Medi, abierta (derecha)
    { sprite: "door-bottom-closed", x: 64, y: 192, layer: "floor" },
    { sprite: "door-bottom-open", x: 224, y: 192, layer: "floor" },
  ],
  triggers: [
    // puertas cerradas (no dejan entrar: solo muestran texto)
    { type: "text", zone: [62, 64, 36, 12], text: "door.1" },   // puerta 1 (fondo izquierda)
    { type: "text", zone: [222, 64, 36, 12], text: "door.2" },  // puerta 2 (fondo derecha)
    { type: "text", zone: [16, 112, 12, 32], text: "door.3" },  // puerta 3 (lateral izquierda)
    { type: "text", zone: [292, 112, 12, 32], text: "door.4" }, // puerta 4 (lateral derecha)
    { type: "text", zone: [64, 178, 32, 14], text: "door.5" },  // puerta 5 (abajo izquierda)

    // escalera: solo se baja entrando por la izquierda (el descanso). Lleva a la planta baja,
    // junto a la escalera del nicho (a su derecha, mirándola)
    { type: "exit", zone: [118, 71, 8, 24], to: "plantabaja", spawn: { x: 72, y: 98 }, facing: "left" },

    // puerta 6: de vuelta al cuarto de Medi
    { type: "exit", zone: [224, 192, 32, 16], to: "cuarto", spawn: { x: 256, y: 125 }, facing: "left" },
  ],
};
