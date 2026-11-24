import { isSfxPlaying } from "./sfx.js";

// Sprites que bailan (el pastel y Medi no)
const DANCERS = ["yori", "mamusik", "kiana", "papusik", "teia"];

// height = altura máxima del salto en píxeles (sube a 1 o 2 y baja); hopsPerSecond = saltos por segundo
const DANCE = { height: 2, hopsPerSecond: 2 };

export function getDanceOffset(sprite) {
  if (!DANCERS.includes(sprite) || !isSfxPlaying("birthday")) return 0;
  const t = performance.now() / 1000;
  return -Math.round(DANCE.height * Math.abs(Math.sin(Math.PI * DANCE.hopsPerSecond * t)));
}
