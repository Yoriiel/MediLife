// Texto fijo en pantalla (objetivo actual).
// Si la misión tiene varias tareas (TASKS en story/objectives.js), se muestra una línea por tarea
// y las ya cumplidas salen tachadas. "Misión:" va solo en la primera línea y las demás se alinean debajo del texto.

import { FONT_FAMILY } from "../config.js";
import { t } from "../i18n/index.js";
import { getObjective, TASKS } from "../story/objectives.js";
import { hasFlag } from "../story/events.js";

const ROW_H = 12;
const DONE_ALPHA = 0.55;

export function drawHud(ctx) {
  const key = getObjective();
  if (!key) return;

  ctx.font = `8px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";

  const tasks = TASKS[key];
  const rows = tasks
    ? tasks.map((task) => ({ text: t(task.key), done: !!task.done && hasFlag(task.done) }))
    : [{ text: t(key), done: false }];

  // con varias tareas: etiqueta "Misión:" solo en la primera línea; el texto de todas empieza después de ella
  const label = tasks ? t("mission.label") : "";
  const indent = tasks ? Math.ceil(ctx.measureText(label + " ").width) : 0;

  const textW = Math.max(...rows.map((r) => Math.ceil(ctx.measureText(r.text).width)));
  const w = indent + textW + 8;
  const h = rows.length === 1 ? 14 : rows.length * ROW_H + 2;

  ctx.fillStyle = "rgba(59, 35, 20, 0.85)";
  ctx.fillRect(4, 4, w, h);

  rows.forEach((r, i) => {
    const y = rows.length === 1 ? 7 : 4 + 2 + i * ROW_H;
    ctx.globalAlpha = r.done ? DONE_ALPHA : 1;
    ctx.fillStyle = "#f5deb3";
    if (tasks && i === 0) ctx.fillText(label, 8, y);
    ctx.fillText(r.text, 8 + indent, y);
    if (r.done) {
      const lw = Math.ceil(ctx.measureText(r.text).width);
      ctx.fillRect(8 + indent, y + 4, lw, 1); // tachado
    }
    ctx.globalAlpha = 1;
  });
}
