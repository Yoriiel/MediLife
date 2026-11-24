// Zonas activables de cada habitación (room.triggers):

import { say } from "./dialogue.js";
import { goToRoom } from "./world.js";
import { startShower, startWardrobe } from "../story/scene4.js";
import { startFridge } from "../story/scene2.js";
import { startPizzaFridge, startMoreFridge } from "../story/scene3.js";
import { getObjective } from "../story/objectives.js";
import { hasFlag } from "../story/events.js";
import { openChest } from "../story/chest.js";

let lastRoomId = null;
const inside = {};
const fired = {};

export function updateTriggers(room, player) {
  if (room.id !== lastRoomId) {
    lastRoomId = room.id;
    for (const k in inside) delete inside[k];
  }

  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;

  (room.triggers || []).forEach((t, i) => {
    const id = `${room.id}:${i}`;
    const [zx, zy, zw, zh] = t.zone;
    const now = cx >= zx && cx <= zx + zw && cy >= zy && cy <= zy + zh;
    const was = inside[id];
    inside[id] = now;
    if (!now || was) return;

    if (t.type === "exit") {
      // salida solo disponible con esa misión activa, o (si hay afterFlag) cuando esa marca ya pasó
      if (t.mission && getObjective() !== t.mission && !(t.afterFlag && hasFlag(t.afterFlag))) return;
      goToRoom(t.to, t.spawn, t.facing);
    } else if (t.type === "text") {
      if (t.unless && hasFlag(t.unless)) return; // esa marca ya pasó: no se muestra (ni se gasta el "once")
      if (t.once && fired[id]) return;
      fired[id] = true;
      say(t.text);
    } else if (t.type === "shower") {
      // sin la misión 3, sin la bata o si ya se duchó, no ocurre nada
      if (getObjective() !== "mission3" || !hasFlag("bathrobeTaken") || hasFlag("showerDone")) return;
      player.facing = t.facing || "down"; // hacia dónde mira al empezar
      startShower();
    } else if (t.type === "wardrobe") {
      if (getObjective() !== "mission3" || hasFlag("bathrobeTaken")) return; // sin la misión 3 (o ya la tomó), no pasa nada
      player.facing = t.facing || "up"; // mira hacia el wardrobe
      startWardrobe();
    } else if (t.type === "chest") {
      player.facing = t.facing || "up"; // mira hacia el cofre
      openChest();
    } else if (t.type === "fridgePizza") {
      if (getObjective() !== "mission2" || hasFlag("pizzaTaken")) return; // sin la misión 2 (o ya la tomó), no pasa nada
      player.facing = t.facing || "up"; // mira hacia la nevera
      startPizzaFridge();
    } else if (t.type === "fridgeMore") {
      // solo en la misión 2, tras comerse la pizza ("Quiero un poco más") y mientras no haya tomado el plátano y el pepino
      if (getObjective() !== "mission2" || !hasFlag("wantsMore") || hasFlag("moreTaken")) return;
      player.facing = t.facing || "up"; // mira hacia la nevera
      startMoreFridge();
    } else if (t.type === "fridge") {
      if (getObjective() !== "mission1" || hasFlag("sausagesTaken")) return; // sin misión (o ya las tomó), no pasa nada
      player.facing = t.facing || "up"; // mira hacia la nevera
      startFridge();
    }
  });
}
