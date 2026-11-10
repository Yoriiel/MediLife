// Estado del mundo: habitación actual y cambios de habitación con fundido

import { rooms, START_ROOM } from "../rooms/index.js";
import { player, placePlayer } from "../entities/player.js";
import { fadeToBlack, fadeFromBlack } from "./fade.js";

let current = rooms[START_ROOM];
let transitioning = false;

export function getCurrentRoom() {
  return current;
}

export function isTransitioning() {
  return transitioning;
}

// Va a otra habitación: fundido a negro, cambio, fundido de vuelta
//   spawn:  { x, y } donde aparece (si no se da, usa el de la habitación)
//   facing: "up" | "down" | "left" | "right" hacia dónde mira al llegar
export function goToRoom(roomId, spawn, facing) {
  if (transitioning || !rooms[roomId]) return;
  transitioning = true;

  fadeToBlack(0.25, () => {
    current = rooms[roomId];
    placePlayer(spawn || current.spawn);
    if (facing) player.facing = facing;
    fadeFromBlack(0.25, () => {
      transitioning = false;
    });
  });
}
