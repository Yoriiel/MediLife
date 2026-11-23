// Pantalla de bienvenida (negro + texto) antes del menú principal; solo se ve una vez por sesión.
// needsIntro() / startIntro() / updateIntro() -> true al pasar al menú / drawIntro(ctx)

import { FONT_FAMILY, VIEW_W, VIEW_H } from "../config.js";
import { t } from "../i18n/index.js";
import { playMusic } from "../engine/audio.js";

const SEEN_KEY = "medilife-intro-seen"; // sessionStorage: sobrevive al recargar (Salir al menú principal)
const BLINK = { min: 0.2, max: 0.6, period: 2.6 }; // opacidad del aviso y segundos por parpadeo
const EVENTS = ["keydown", "pointerup", "touchend", "click"];

let triggered = false;

export function needsIntro() {
  try {
    return sessionStorage.getItem(SEEN_KEY) !== "1";
  } catch (e) {
    return true;
  }
}

// Cualquier tecla, clic o toque continúa; la música se pide dentro del gesto para que el navegador la deje sonar
function onGesture(e) {
  if (e.type === "keydown" && (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.key === "Escape")) return;
  triggered = true;
  playMusic("menu");
}

export function startIntro() {
  triggered = false;
  for (const name of EVENTS) window.addEventListener(name, onGesture);
}

// Devuelve true una sola vez, cuando ya se puede pasar al menú principal
export function updateIntro() {
  if (!triggered) return false;
  for (const name of EVENTS) window.removeEventListener(name, onGesture);
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch (e) {
    // sin almacenamiento: se mostrará de nuevo al recargar
  }
  return true;
}

export function drawIntro(ctx) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText(t("intro.line1"), VIEW_W / 2, 95);
  ctx.fillText(t("intro.line2"), VIEW_W / 2, 113);

  // aviso en celular/tablet (body.touch) o en PC; parpadea lento y medio opaco
  const k = 0.5 + 0.5 * Math.sin(((performance.now() / 1000) * 2 * Math.PI) / BLINK.period);
  ctx.globalAlpha = BLINK.min + (BLINK.max - BLINK.min) * k;
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillText(t(document.body.classList.contains("touch") ? "intro.hintTouch" : "intro.hintPc"), VIEW_W / 2, 145);
  ctx.restore();
}
