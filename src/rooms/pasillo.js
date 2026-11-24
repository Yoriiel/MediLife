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

    // pared del fondo: puerta 1 y puerta 2, con cuadros entre ellas
    { sprite: "door-closed", x: 62, y: 24, layer: "floor" },
    { sprite: "door-closed", x: 222, y: 24, layer: "floor" },
    { sprite: "picture-a", x: 112, y: 16, layer: "floor" },
    { sprite: "picture-b", x: 192, y: 16, layer: "floor" },
    { sprite: "tiny_cuckoo_clock", x: 152, y: 16, layer: "floor" },

    //Objetos del suelo
    { sprite: "wicker_laundry_basket", x: 275, y: 90, solid: [0, 10, 20, 10] },
    { sprite: "plant_stan", x: 20, y: 20, solid: [5, 30, 20, 20] },
    { sprite: "monstera", x: 20, y: 160, solid: [0, 20, 20, 10] },
    { sprite: "small_bonsai_tree", x: 260, y: 145, solid: [6, 30, 20, 10] },
    { sprite: "macrame_hanging_plant", x: 275, y: 8, solid: [5, 30, 20, 20] },


    // escalera en el piso: sólida, salvo el descanso de la izquierda (10 px), que es la entrada.
    { sprite: "stairs-floor", x: 115, y: 65, layer: "floor",
      solid: [[0, 0, 10, 5], [0, 31, 10, 5], [10, 0, 75, 36]] },

    // paredes laterales: una puerta cerrada por lado, centrada
    { sprite: "door-side-closed", x: 0, y: 112, layer: "floor" },   // puerta 3 (izquierda)
    { sprite: "door-side-closed", x: 304, y: 112, layer: "floor" }, // puerta 4 (derecha)

    // pared de abajo: puerta 5 cerrada (izquierda) y la puerta de Medi, abierta (derecha)
    { sprite: "door-bottom-closed", x: 64, y: 192, layer: "floor" },
    { sprite: "door-bottom-open", x: 224, y: 192, layer: "floor" },
  ],
    // Signo "!" de misión sobre la escalera
  markers: [
   // Signo "!" sobre la escalera a la plantabaja: se ve desde que empieza la misión 1 hasta que toma las salchichas
    { x: 112, y: 85, mission: "mission1", unless: "sausagesTaken" },
  ],
  triggers: [
    // puertas cerradas (no dejan entrar: solo muestran texto)
    { type: "text", zone: [62, 64, 36, 12], text: "door.1" },   // puerta 1 (fondo izquierda)
    { type: "text", zone: [222, 64, 36, 12], text: "door.2" },  // puerta 2 (fondo derecha)
    { type: "text", zone: [16, 112, 12, 32], text: "door.3" },  // puerta 3 (lateral izquierda)
    { type: "text", zone: [292, 112, 12, 32], text: "door.4" }, // puerta 4 (lateral derecha)
    { type: "text", zone: [64, 178, 32, 14], text: "door.5" },  // puerta 5 (abajo izquierda)

    // escalera: solo se baja entrando por la izquierda (el descanso)
    { type: "exit", zone: [118, 71, 8, 24], to: "plantabaja", spawn: { x: 45, y: 110 }, facing: "left" },

    // puerta 6: de vuelta al cuarto de Medi
    { type: "exit", zone: [224, 192, 32, 16], to: "cuarto", spawn: { x: 256, y: 125 }, facing: "left" },

    // comentarios de Medi al acercarse a un objeto (una sola vez cada uno); zona = [x, y, ancho, alto]
    { type: "text", zone: [256, 95, 40, 24], text: "pasillo.laundry", once: true }, // wicker_laundry_basket
    { type: "text", zone: [16, 66, 44, 22], text: "pasillo.plants", once: true },   // plant_stan
  ],
};
