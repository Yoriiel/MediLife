
const MAP = [
  "                  ",
  "     ############ ",
  "     ############ ",
  " ################ ",
  " ####............ ",
  " ####............ ",
  " ................ ",
  " ................ ",
  " ................ ",
  " ................ ",
  " ................ ",
  " ................ ",
  "                  ",
];

export default {
  id: "plantabaja",
  name: "Planta baja",
  background: "rooms/planta-baja",

  // Pisos: solo se cambian los píxeles de piso del fondo (floorColors) dentro de cada zona [x, y, ancho, alto]
  floorColors: [[142, 125, 101], [118, 101, 88], [152, 136, 105]],
  floors: [
    { tile: "tiles/piso-bano", zones: [[19, 157, 58, 32]] },
    { tile: "tiles/piso-cocina", zones: [[195, 64, 74, 29], [230, 93, 19, 51]] },
    { tile: "tiles/piso-madera", zones: [[83, 64, 106, 125], [19, 96, 64, 13], [189, 144, 80, 45]] },
  ],
  spawn: { x: 45, y: 110 }, // provisional: sala, a la izquierda de la mesa
  map: MAP,

  // Paredes finas (píxeles de la habitación)
  solids: [
    [15, 16, 4, 176],    // borde exterior izquierdo
    [269, 16, 4, 176],   // borde exterior derecho
    [15, 189, 207, 4],   // borde de abajo, a la izquierda de la puerta de la calle
    [242, 189, 31, 4],   // borde de abajo, a la derecha de la puerta de la calle
    [77, 155, 6, 80],    // pared derecha de la habitación izquierda (baño)
    [80, 64, 3, 32],     // sombra del borde derecho del nicho de la escalera
    [189, 16, 6, 126],   // pared que separa la cocina del resto (hasta la base del muro de la cocina)

    // BASES de los muros: la colisión está en la repisa de abajo (línea azul), no en el borde de arriba.
    [19, 153, 58, 5],    // base del muro del baño (repisa y 153-157)
    [189, 137, 42, 5],   // base del muro de la cocina, a la izquierda del arco (repisa y 137-141)
    [248, 137, 21, 5],   // base del muro de la cocina, a la derecha del arco
  ],

  // Partes del fondo que tapan a la jugadora cuando está detrás del muro
  overlays: [
    { x: 19, y: 109, w: 58, h: 49, sortY: 158, fade: true },   // muro del baño
    { x: 77, y: 109, w: 6, h: 49, sortY: 158, fade: true },    // borde derecho del baño (pared fina): ella pasa por detrás
    { x: 189, y: 93, w: 41, h: 49, sortY: 142, fade: true },   // muro de la cocina, izquierda del arco
    { x: 249, y: 93, w: 20, h: 49, sortY: 142, fade: true },   // muro de la cocina, derecha del arco
  ],

  // Signos "!" de misión: se ven mientras esa misión esté activa (x = centro, y = base del signo)
  markers: [
    { x: 207, y: 26, mission: "mission1", unless: "sausagesTaken" }, // sobre la nevera: tomar las salchichas
    { x: 207, y: 26, mission: "mission2", unless: "pizzaTaken" },    // sobre la nevera: tomar la pizza (misión 2)
    { x: 207, y: 26, mission: "mission2", when: "wantsMore", unless: "moreTaken" }, // sobre la nevera: tomar plátano y pepino
    { x: 232, y: 181, mission: "mission1b" },                          // sobre la puerta de la calle: salir a dárselas
    { x: 45, y: 130, mission: "mission3", when: "bathrobeTaken", unless: "showerDone" }, // sobre la puerta del baño: ducharse (con la bata)
  ],

  objects: [
    // escalera al pasillo: pegada al muro del nicho (arriba alineada con su borde)
    { sprite: "stairs", x: 29, y: 47, solid: [0, 0, 38, 58] },

    // alfombra circular morada (debajo de la mesa)
    { sprite: "rug-purple", x: 92, y: 104, layer: "floor" },

    // mesa redonda (vacía) con sus 4 sillas; el orden de dibujo sale de la base de cada sprite
    { sprite: "dining-chair-top", x: 129, y: 113, solid: [0, 10, 14, 14] },
    { sprite: "dining-chair-left", x: 104, y: 127, sortY: 130, solid: [0, 12, 13, 14] },
    { sprite: "dining-chair-right", x: 156, y: 127, sortY: 130, solid: [0, 12, 13, 14] },
    { sprite: "dining-table", x: 116, y: 127, solid: [1, 6, 39, 29] },
    { sprite: "dining-chair-bottom", x: 129, y: 147, solid: [0, 10, 14, 13] },

    // ───────────── LIVING (zona sobre la mesa redonda; posiciones provisionales) ─────────────

    { sprite: "window-cream", x: 88, y: 26, layer: "floor" },    // ventana en la pared
    { sprite: "framed-landscape", x: 128, y: 30, layer: "floor" }, // cuadro en la pared
    { sprite: "tall-bookshelf", x: 161, y: 26, solid: [0, 30, 29, 18] },
    { sprite: "floor-lamp", x: 86, y: 38, solid: [3, 28, 8, 7] },
    { sprite: "sofa", x: 100, y: 50, solid: [0, 10, 61, 17] },
    { sprite: "coffee-table", x: 114, y: 70, solid: [0, 8, 36, 12] },
    { sprite: "book-stack", x: 120, y: 70, sortY: 111 },         // sobre la mesita
    { sprite: "coffee-mug", x: 135, y: 70, sortY: 111 },         // sobre la mesita
    { sprite: "monster", x: 110, y: 47, sortY: 80,showIf: "showerDone" }, // lata de monster (oculta hasta la sorpresa; sin colisión)

    // ───────────── COCINA ─────────────

    // pared del fondo (suelo y pared de la cocina: x 196-268)
    { sprite: "kitchen-window", x: 210, y: 31, layer: "floor" },                       // ventana sobre el fregadero
    { sprite: "kitchen-shelf", x: 231, y: 28, layer: "floor" },                        // repisa con tazas sobre la estufa

    // alfombra frente a los muebles, centrada en el arco de entrada
    { sprite: "kitchen-rug", x: 222, y: 77, layer: "floor" },

    // muebles contra la pared: fridge (izquierda) y estufa (derecha); su base queda en y=75
    { sprite: "kitchen-fridge", x: 197, y: 30, solid: [0, 29, 21, 12] },
    { sprite: "kitchen-stove", x: 231, y: 50, solid: [0, 6, 36, 11] },
    { sprite: "broom", x: 253, y: 110 }, //Escoba fuera

    // Fiesta sorpresa: showIf = estos objetos están ocultos hasta que esa marca (events.js)
    { sprite: "cake", x: 117, y: 113, sortY: 200, showIf: "showerDone"  }, //cake
    
    { sprite: "yori", x: 117, y: 87, sortY: 140, solid: [15, 26, 5, 5], showIf: "showerDone" }, //yori
    { sprite: "mamusik", x: 93, y: 100, sortY: 200, solid: [15, 20, 5, 20], showIf: "showerDone" }, //mamusik
    { sprite: "kiana", x: 92, y: 138, sortY: 150, solid: [15, 20, 8, 10], showIf: "showerDone" }, //kiana
    { sprite: "papusik", x: 147, y: 130, sortY: 150, solid: [4, 25, 16, 10], showIf: "showerDone" }, //papusik
    { sprite: "teia", x: 145, y: 106, sortY: 150, solid: [15, 20, 5, 10], showIf: "showerDone" }, //teia

    { sprite: "banner_red", x: 253, y: 95, sortY: 200, showIf: "showerDone" }, //party banner red pared derecha
    { sprite: "banner_blue", x: 211, y: 95, sortY: 200, showIf: "showerDone" }, //party banner blue pared derecha
    { sprite: "banner_yellow", x: 193, y: 95, sortY: 200, showIf: "showerDone" }, //party banner yellow pared derecha

    { sprite: "banner_green", x: 172, y: 16, sortY: 200, showIf: "showerDone" }, //party banner green pared izquierda arriba
    { sprite: "banner_red", x: 155, y: 16, sortY: 200, showIf: "showerDone" }, //party banner red pared izquierda arriba
    { sprite: "banner_blue", x: 137, y: 16, sortY: 200, showIf: "showerDone" }, //party banner blue pared izquierda arriba
    { sprite: "banner_yellow", x: 120, y: 16, sortY: 200, showIf: "showerDone" }, //party banner yellow pared izquierda arriba
    { sprite: "banner_red", x: 103, y: 16, sortY: 200, showIf: "showerDone" }, //party banner red pared izquierda arriba
    { sprite: "banner_green", x: 86, y: 16, sortY: 200, showIf: "showerDone" }, //party banner green pared izquierda arriba

    // ───────────── BAÑO (habitación izquierda, cerrada) ─────────────

    { sprite: "bathtub", x: 19, y: 162 },                      // bañera (base y=188)
    { sprite: "toilet", x: 61, y: 143 },                       // inodoro (base y=188)
    { sprite: "bath-duck", x: 64, y: 175, sortY: 190 },        // patito dentro de la bañera
    { sprite: "daisy-vase", x: 63, y: 132, sortY: 200 },       // jarrón de margaritas sobre el tanque del inodoro
    { sprite: "shampoo", x: 31, y: 155, sortY: 200 },          // shampoo sobre el borde trasero de la bañera
    { sprite: "soap-pump", x: 49, y: 156, sortY: 200 },        // jabón líquido junto al shampoo

  ],
  triggers: [
    // pie de la escalera: al llegar frente a ella, sube al pasillo (aparece en el descanso, a la izquierda)
    { type: "exit", zone: [36, 105, 28, 6], to: "pasillo", spawn: { x: 100, y: 80 }, facing: "right" },

    { type: "shower", zone: [45, 132, 22, 18], facing: "down" },

    { type: "exit", zone: [222, 180, 20, 12], to: "exterior", spawn: { x: 314, y: 176 }, facing: "down", mission: "mission1b", afterFlag: "mission1Done" },

    // nevera: al pararse frente a ella (con la misión 1 activa) pregunta si toma las salchichas
    { type: "fridge", zone: [195, 72, 26, 14], facing: "up" },
    // nevera en la misión 2: pregunta "¿Tomar pizza?" (story/scene3.js)
    { type: "fridgePizza", zone: [195, 72, 26, 14], facing: "up" },
    // nevera en la misión 2, después de la pizza: pregunta "¿Tomar plátano y pepino?" (story/scene3.js)
    { type: "fridgeMore", zone: [195, 72, 26, 14], facing: "up" },

    // comentario de Medi al acercarse al librero (una sola vez); zona = [x, y, ancho, alto]
    { type: "text", zone: [160, 76, 34, 16], text: "plantabaja.bookshelf", once: true }, // tall-bookshelf
  ],
};
