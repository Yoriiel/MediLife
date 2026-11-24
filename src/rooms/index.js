// Registro de todas las habitaciones.

import cuarto from "./cuarto.js";
import exterior from "./exterior.js";
import pasillo from "./pasillo.js";
import plantabaja from "./plantabaja.js";

export const rooms = {
  [cuarto.id]: cuarto,
  [exterior.id]: exterior,
  [pasillo.id]: pasillo,
  [plantabaja.id]: plantabaja,
};

export const START_ROOM = "cuarto"; // habitación inicial
