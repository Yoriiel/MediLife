// Controles táctiles: la cruceta y el botón A simulan teclas (ver setVirtualKey en input.js).
// Nunca se usa stopPropagation: el primer toque también debe desbloquear el audio.

import { setVirtualKey, releaseVirtualKeys } from "./input.js";

const DIR_KEYS = { up: "arrowup", down: "arrowdown", left: "arrowleft", right: "arrowright" };
const DEAD_ZONE = 0.15; // fracción del tamaño de la cruceta sin dirección
const AXIS_RATIO = 0.38; // un eje cuenta si pasa de esta fracción de la distancia (permite diagonales)

// Bloquea zoom (pellizco y doble toque, que Safari iOS no evita con el meta viewport) y selección/copiado
function blockBrowserGestures() {
  const stop = (e) => e.preventDefault();
  for (const name of ["gesturestart", "gesturechange", "gestureend"]) document.addEventListener(name, stop); // pellizco en Safari iOS
  document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  let lastEnd = 0; // doble toque rápido = zoom: se cancela el segundo
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastEnd < 350) e.preventDefault();
    lastEnd = now;
  }, { passive: false });
  for (const name of ["selectstart", "copy", "cut", "dragstart"]) document.addEventListener(name, stop);
}

// onLayoutChange: se llama al activar los controles para recalcular el tamaño del canvas
export function initTouchControls(onLayoutChange) {
  blockBrowserGestures();
  const dpad = document.getElementById("dpad");
  const actionBtn = document.getElementById("action-btn");
  if (!dpad || !actionBtn) return;

  // --- Detección de dispositivo táctil ---
  let active = false;
  const activate = () => {
    if (active) return;
    active = true;
    document.body.classList.add("touch");
    if (onLayoutChange) onLayoutChange();
  };
  if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) activate();
  // Respaldo: cualquier toque real en la ventana también los activa
  window.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") activate();
  });

  // --- Cruceta ---
  const arrows = {};
  dpad.querySelectorAll(".arrow").forEach((a) => (arrows[a.dataset.dir] = a));
  const state = { up: false, down: false, left: false, right: false };
  let dpadPointer = null; // el dedo que maneja la cruceta

  // Cambia una dirección solo si es distinta (tecla virtual + clase "on")
  const setDir = (dir, on) => {
    if (state[dir] === on) return;
    state[dir] = on;
    setVirtualKey(DIR_KEYS[dir], on);
    if (arrows[dir]) arrows[dir].classList.toggle("on", on);
  };

  // Vector del centro de la cruceta al dedo -> direcciones activas
  const updateDpad = (e) => {
    const r = dpad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy);
    const live = dist >= DEAD_ZONE * r.width;
    setDir("right", live && dx > AXIS_RATIO * dist);
    setDir("left", live && dx < -AXIS_RATIO * dist);
    setDir("down", live && dy > AXIS_RATIO * dist);
    setDir("up", live && dy < -AXIS_RATIO * dist);
  };

  const releaseDpad = () => {
    dpadPointer = null;
    for (const dir in state) setDir(dir, false);
  };

  dpad.addEventListener("pointerdown", (e) => {
    if (dpadPointer !== null) return; // ya hay un dedo en la cruceta
    dpadPointer = e.pointerId;
    try {
      dpad.setPointerCapture(e.pointerId); // deslizar fuera de la cruceta sigue contando
    } catch (err) {}
    updateDpad(e);
  });
  dpad.addEventListener("pointermove", (e) => {
    if (e.pointerId === dpadPointer) updateDpad(e);
  });
  const endDpad = (e) => {
    if (e.pointerId === dpadPointer) releaseDpad();
  };
  dpad.addEventListener("pointerup", endDpad);
  dpad.addEventListener("pointercancel", endDpad);
  dpad.addEventListener("lostpointercapture", endDpad);

  // --- Botón de acción (= barra espaciadora) ---
  let actionPointer = null;
  const releaseAction = () => {
    actionPointer = null;
    setVirtualKey(" ", false);
    actionBtn.classList.remove("on");
  };
  actionBtn.addEventListener("pointerdown", (e) => {
    if (actionPointer !== null) return;
    actionPointer = e.pointerId;
    try {
      actionBtn.setPointerCapture(e.pointerId);
    } catch (err) {}
    setVirtualKey(" ", true);
    actionBtn.classList.add("on");
  });
  const endAction = (e) => {
    if (e.pointerId === actionPointer) releaseAction();
  };
  actionBtn.addEventListener("pointerup", endAction);
  actionBtn.addEventListener("pointercancel", endAction);
  actionBtn.addEventListener("lostpointercapture", endAction);

  // --- Seguridad ---
  // Sin menú contextual al mantener presionado
  dpad.addEventListener("contextmenu", (e) => e.preventDefault());
  actionBtn.addEventListener("contextmenu", (e) => e.preventDefault());

  // Si la ventana pierde el foco, se sueltan todas las teclas para que Medi no quede caminando
  const releaseAll = () => {
    releaseVirtualKeys();
    dpadPointer = null;
    actionPointer = null;
    for (const dir in state) state[dir] = false;
    dpad.querySelectorAll(".on").forEach((el) => el.classList.remove("on"));
    actionBtn.classList.remove("on");
  };
  window.addEventListener("blur", releaseAll);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseAll();
  });
}
