// Texto fijo en pantalla (objetivo actual)

import { FONT_FAMILY } from "../config.js";
import { t } from "../i18n/index.js";
import { getObjective } from "../story/objectives.js";

export function drawHud(ctx) {
  const key = getObjective();
  if (!key) return;

  const text = t(key);
  ctx.font = `8px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  const w = Math.ceil(ctx.measureText(text).width) + 8;

  ctx.fillStyle = "rgba(59, 35, 20, 0.85)";
  ctx.fillRect(4, 4, w, 14);
  ctx.fillStyle = "#f5deb3";
  ctx.fillText(text, 8, 7);
}
