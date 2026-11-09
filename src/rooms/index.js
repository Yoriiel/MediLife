// Registro de todas las habitaciones.
// Para añadir una: crea su archivo en esta carpeta, impórtalo y agrégalo aquí.

import cuarto from "./cuarto.js";

export const rooms = {
  [cuarto.id]: cuarto,
};

export const START_ROOM = "cuarto";
