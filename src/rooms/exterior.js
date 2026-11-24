

const COLS = 38;
const ROWS = 20;
const ROW = ".".repeat(COLS);

export const CATS = [
  { id: "pacho", x: 270, y: 186 },    // gato negro con blanco
  { id: "conejito", x: 335, y: 220 }, // gato blanco
];

const CAT_W = 32; // tamaño de cada cuadro del sprite
const CAT_H = 32;
const CAT_FEET = 24; // fila del sprite donde están las patas

// animación: la cola se mueve sin parar (cada gato a su compás), ordenada por profundidad con Medi
const catAnimations = CATS.map((c, i) => ({
  image: `rooms/cat-${c.id}`,
  x: c.x - CAT_W / 2,
  y: c.y - CAT_FEET,
  frameW: CAT_W,
  frameH: CAT_H,
  frames: 2,
  frameMs: 450,
  phase: i * 230,
  sortY: c.y,
}));

// colisión: el cuerpo del gato (Medi no lo atraviesa; se detiene frente a él)
const catSolids = CATS.map((c) => [c.x - 8, c.y - 6, 16, 6]);

export default {
  id: "exterior",
  name: "Exterior",
  background: "rooms/exterior",
  // justo frente a la puerta de la casa (la caja de pies de Medi mide 10x6).
  // OJO: debe quedar FUERA de la zona de la puerta de regreso (si no, se dispara al aparecer).
  spawn: { x: 314, y: 176 },
  map: Array.from({ length: ROWS }, () => ROW),

  solids: [
    // ── Casa (el tejado es en pendiente: varias franjas verticales; la base llega hasta y=170) ──
    [222, 108, 6, 62],  // esquina izquierda baja del tejado
    [228, 98, 5, 72],
    [233, 82, 12, 88],
    [245, 70, 13, 100],
    [238, 66, 20, 32],  // chimenea
    [258, 60, 12, 110],
    [270, 50, 20, 120], // cumbrera
    [290, 60, 32, 110],
    [322, 72, 31, 98],  // lado derecho

    // ── Cerca ──
    [185, 96, 8, 136],  // izquierda
    [185, 97, 40, 10],  // arriba, a la izquierda de la casa
    [353, 97, 39, 10],  // arriba, a la derecha de la casa
    [385, 97, 8, 135],  // derecha
    [195, 224, 127, 8], // abajo, a la izquierda del camino
    [330, 224, 62, 8],  // abajo, a la derecha del camino

    // ── Cajas y barriles junto a la casa ──
    [217, 161, 17, 16],
    [227, 176, 14, 20],
    [361, 150, 11, 15],
    [349, 178, 14, 20],

    // ── Rocas y piedras ──
    [155, 50, 28, 38],  // roca grande clara (izquierda)
    [198, 26, 24, 16],
    [58, 42, 19, 15],
    [121, 152, 16, 13],
    [359, 36, 19, 19],
    [428, 42, 25, 26],
    [519, 40, 20, 18],
    [518, 120, 17, 11],
    [548, 114, 46, 52], // roca grande clara (derecha)
    [433, 226, 16, 13],
    [472, 283, 19, 14],
    [342, 284, 24, 25],
    [284, 274, 43, 46], // roca grande (abajo)
    [149, 248, 19, 14],
    [113, 291, 30, 28],
    [259, 291, 13, 11],

    // ── Hongos, troncos cortados y el pozo ──
    [168, 88, 15, 14],
    [60, 88, 13, 18],
    [327, 70, 23, 17],
    [499, 90, 29, 28],
    [344, 229, 19, 22],
    [279, 200, 18, 19],
    [147, 184, 30, 31],
    [106, 110, 27, 20],
    [426, 118, 19, 22],
    [586, 90, 12, 10],
    [437, 182, 24, 20],
    [407, 150, 24, 26], // pozo

    // ── Arbustos y plantas grandes ──
    [83, 133, 25, 22],
    [201, 56, 19, 17],
    [464, 112, 29, 28],
    [546, 203, 28, 31],
    [404, 197, 24, 22],
    [354, 210, 12, 12],
    [214, 203, 36, 26],
    [119, 218, 19, 14],
    [274, 230, 28, 22],
    [259, 242, 11, 10],
    [158, 294, 38, 26],

    // ── Espantapájaros ──
    [455, 100, 16, 16],

    // ── Árboles: solo el tronco ──
    [22, 104, 16, 10],  // roble (izquierda)
    [100, 80, 18, 8],   // roble grande (arriba)
    [153, 157, 16, 10], // manzano pequeño
    [308, 46, 18, 9],   // roble (arriba, junto al tejado)
    [393, 106, 20, 12], // árbol redondo grande
    [472, 58, 30, 14],  // pino azulado (base)
    [544, 100, 16, 8],  // árbol redondo (derecha)
    [564, 58, 22, 12],  // manzano (arriba a la derecha)
    [25, 190, 18, 8],   // roble (abajo a la izquierda)
    [99, 208, 15, 8],   // árbol redondo claro (abajo a la izquierda)
    [200, 291, 18, 10], // árbol grande (abajo, junto al camino)
    [404, 297, 16, 11], // manzano (abajo a la derecha)
    [498, 190, 22, 12], // árbol grande (derecha)

    // ── Los gatos ──
    ...catSolids,
  ],

  // Copas y cabezas que tapan a Medi cuando pasa por detrás (sortY = base del tronco)
  overlays: [
    { x: 3, y: 53, w: 58, h: 60, sortY: 114 },    // roble (izquierda)
    { x: 77, y: 20, w: 70, h: 70, sortY: 89 },    // roble grande (arriba)
    { x: 135, y: 112, w: 50, h: 56, sortY: 168 }, // manzano pequeño
    { x: 291, y: 0, w: 64, h: 56, sortY: 56 },    // roble (arriba, junto al tejado)
 // { x: 370, y: 48, w: 60, h: 72, sortY: 119 },  // árbol redondo grande
    { x: 468, y: 33, w: 38, h: 40, sortY: 72 },   // pino azulado
    { x: 534, y: 65, w: 38, h: 44, sortY: 109 },  // árbol redondo (derecha)
    { x: 553, y: 5, w: 56, h: 66, sortY: 71 },    // manzano (arriba a la derecha)
    { x: 13, y: 162, w: 40, h: 36, sortY: 198 },  // roble (abajo a la izquierda)
    { x: 87, y: 174, w: 39, h: 43, sortY: 217 },  // árbol redondo claro
    { x: 182, y: 241, w: 52, h: 61, sortY: 302 }, // árbol grande (abajo)
    { x: 386, y: 247, w: 50, h: 62, sortY: 309 }, // manzano (abajo a la derecha)
    { x: 475, y: 130, w: 70, h: 73, sortY: 203 }, // árbol grande (derecha)
    { x: 440, y: 68, w: 50, h: 48, sortY: 116 },  // espantapájaros (cabeza y brazos)
  ],

  // Animaciones del exterior: el humo de la chimenea (6 cuadros de 48x48, 150 ms cada uno) y la cola de los gatos.
  // El fondo (exterior.png) ya viene SIN humo; el dibujo del humo trae también la chimenea y el tejado detrás.
  // sortY = base de la casa (humo) o línea de las patas (gatos).
  animations: [
    { image: "rooms/exterior-smoke", x: 224, y: 32, frameW: 48, frameH: 48, frames: 6, frameMs: 150, sortY: 170 },
    ...catAnimations, // la cola de los gatos
  ],

  objects: [],

  // Objetos para recoger (engine/pickups.js). La llave flota sobre el arbusto de abajo a la izquierda del jardín
  // (su sólido es [214, 203, 36, 26], en "Arbustos y plantas grandes") y solo se ve mientras Medi lo toca.
  //   x, y = esquina del sprite de 16x16 en reposo (la parte visible de la llave queda ~2 px sobre la copa del arbusto)
  //   touch = zona que hay que tocar; margin = tolerancia en píxeles
  pickups: [
    { id: "key", sprite: "key", x: 224, y: 205, touch: [214, 203, 36, 26], margin: 2, unless: "keyTaken" },
  ],

  triggers: [
    // puerta de la casa: vuelve a entrar a la planta baja (aparece justo arriba de la puerta de la calle)
    { type: "exit", zone: [306, 168, 28, 9], to: "plantabaja", spawn: { x: 227, y: 168 }, facing: "up" },
  ],
};
