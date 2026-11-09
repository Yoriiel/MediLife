// Cada habitación exporta su mapa y sus datos.
// Leyenda del mapa:
//   #  pared (sólida)
//   .  piso
// Más adelante: D (puerta), objetos interactivos, muebles...

export default {
  id: "cuarto",
  name: "Cuarto de prueba",
  spawn: { x: 150, y: 110 }, // dónde aparece el jugador al entrar
  map: [
    "####################",
    "#..................#",
    "#..................#",
    "#..................#",
    "#..................#",
    "#..................#",
    "#..................#",
    "#..................#",
    "#..................#",
    "#..................#",
    "#..................#",
    "#..................#",
    "#..................#",
    "#..................#",
    "####################",
  ],
};
