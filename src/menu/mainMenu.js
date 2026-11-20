// Menú principal: pantalla de inicio con "Jugar" y "Opciones".
//   openMainMenu(onPlay)  -> muestra el menú; onPlay se llama al elegir "Jugar"
//   updateMainMenu()      -> una vez por cuadro
//   drawMainMenu(ctx)     -> dibuja el fondo, el título y el menú

import { FONT_FAMILY, VIEW_W, VIEW_H } from "../config.js";
import { t } from "../i18n/index.js";
import { getImage } from "../engine/assets.js";
import { getSettings } from "../engine/settings.js";
import { createMenu, updateMenu, drawMenu } from "./ui.js";
import { buildOptionsItems } from "./options.js";

const HEART_IMAGE = "particles/heart-small";

// Sprites decorativos del menú (public/menu/); main.js los precarga con MENU_ASSETS
const MENU_SPRITES = [
  "bush-red",
  "flower1-blue", "flower1-red",
  "flower2-magenta", "flower2-pink", "flower2-purple",
  "flower3-pink", "flower3-red",
  "flower4-pink", "flower4-purple",
  "flower9-orange", "flower9-purple", "flower9-red", "flower9-yellow",
  "flower10-purple", "flower10-red",
  "flower13-pink", "flower13-purple", "flower13-yellow",
  "trellis",
  "enredadera",
];
export const MENU_ASSETS = MENU_SPRITES.map((n) => "menu/" + n);

// Contorno de la ventana del menú: color y grosor en píxeles (width: 0 lo quita)
const MENU_FRAME = { color: "#f5deb3", width: 1 };

// Hilera de arbustos en la parte baja: count = cuántos; bottom = separación del borde de abajo en px
const BUSH_ROW = { image: "menu/bush-red", count: 5, bottom: 0 };

// Plantas del menú: img = nombre en public/menu/, x = borde izquierdo, y = base (pie) de la planta.
// Se dibujan en este orden (arriba de la lista = más atrás); front: true = encima de los arbustos.
const MENU_PLANTS = [
  { img: "flower13-purple", x: 34, y: 214 },
  { img: "flower2-purple", x: 70, y: 224 },
  { img: "flower2-pink", x: 152, y: 224 },
  { img: "flower13-yellow", x: 226, y: 214 },
  { img: "flower10-purple", x: 112, y: 214 },
  { img: "flower1-red", x: 204, y: 218 },
  { img: "trellis", x: 4, y: 230 },
  { img: "flower2-magenta", x: 254, y: 230 },
  { img: "flower9-yellow", x: 58, y: 228 },
  { img: "flower13-pink", x: 96, y: 228 },
  { img: "flower9-orange", x: 176, y: 228 },
  { img: "flower10-red", x: 196, y: 230 },
  { img: "flower1-blue", x: 142, y: 222 },
  { img: "flower9-purple", x: 236, y: 228 },
  { img: "flower9-red", x: 40, y: 222 },
  { img: "flower3-pink", x: 14, y: 222, front: true },
  { img: "flower3-red", x: 232, y: 224, front: true },
  { img: "flower4-pink", x: 120, y: 224, front: true },
  { img: "flower4-purple", x: 170, y: 226, front: true },
];

let screen = "main"; // "main" | "options"
let onPlay = null;

function goOptions() {
  screen = "options";
  optionsMenu.index = 0;
}

function goMain() {
  screen = "main";
}

const mainMenu = createMenu({
  y: 108, // altura de los botones (más bajo = número más grande)
  w: 140,
  rowH: 22,
  outline: "#f5deb3", // contorno de los botones
  items: [
    { type: "button", label: () => t("menu.play"), onSelect: () => onPlay && onPlay() },
    { type: "button", label: () => t("menu.options"), onSelect: goOptions },
  ],
});

const optionsMenu = createMenu({
  y: 62,
  w: 190,
  rowH: 20,
  onBack: goMain,
  items: [...buildOptionsItems(), { type: "button", label: () => t("menu.back"), onSelect: goMain }],
});

export function openMainMenu(playCallback) {
  onPlay = playCallback;
  screen = "main";
  mainMenu.index = 0;
}

export function updateMainMenu() {
  updateMenu(screen === "main" ? mainMenu : optionsMenu);
}

// Corazoncitos que suben despacio por el fondo (respetan el ajuste "Partículas")
const hearts = Array.from({ length: 14 }, (_, i) => ({
  x: (i * 61) % VIEW_W,
  y: (i * 47) % VIEW_H,
  speed: 6 + (i % 5) * 2.5,
  phase: i * 1.7,
  alpha: 0.25 + (i % 3) * 0.12,
}));
let lastTime = performance.now();

function drawBackground(ctx, dt) {
  // franjas de color (se ve "pixelado"): de azul noche arriba a morado cálido abajo
  const top = [27, 27, 47];
  const bottom = [74, 38, 62];
  const bands = 15;
  for (let i = 0; i < bands; i++) {
    const k = i / (bands - 1);
    const c = top.map((v, j) => Math.round(v + (bottom[j] - v) * k));
    ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    ctx.fillRect(0, Math.floor((VIEW_H * i) / bands), VIEW_W, Math.ceil(VIEW_H / bands) + 1);
  }

  const img = getImage(HEART_IMAGE);
  if (!img || !getSettings().particles) return;
  const now = performance.now() / 1000;
  for (const h of hearts) {
    h.y -= h.speed * dt;
    if (h.y < -8) h.y = VIEW_H + 8;
    ctx.globalAlpha = h.alpha;
    ctx.drawImage(img, Math.round(h.x + Math.sin(now * 1.5 + h.phase) * 4), Math.round(h.y));
  }
  ctx.globalAlpha = 1;
}

// Enredaderas que cuelgan desde arriba a la derecha: x, y = esquina superior izquierda
// (y negativo = más corta, queda recortada por arriba); flip = espejo horizontal
const MENU_VINES = [
  { x: 238, y: -16 },
  { x: 256, y: 0, flip: true },
  { x: 274, y: -30 },
  { x: 292, y: -6, flip: true },
  { x: 286, y: 42 },
  { x: 244, y: 36, flip: true },
];

function drawVines(ctx) {
  const img = getImage("menu/enredadera");
  if (!img) return;
  for (const v of MENU_VINES) {
    if (!v.flip) {
      ctx.drawImage(img, v.x, v.y);
      continue;
    }
    ctx.save();
    ctx.translate(v.x + img.width, v.y); // espejo: se voltea sobre su propio ancho
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }
}

// Dibuja las plantas de una capa: detrás de los arbustos (front = false) o encima (front = true)
function drawPlants(ctx, front) {
  for (const p of MENU_PLANTS) {
    if (!!p.front !== front) continue;
    const img = getImage("menu/" + p.img);
    if (img) ctx.drawImage(img, p.x, p.y - img.height);
  }
}

// Arbustos repartidos de borde a borde (se solapan un poco si no caben justos)
function drawBushRow(ctx) {
  const img = getImage(BUSH_ROW.image);
  if (!img) return;
  const { count, bottom } = BUSH_ROW;
  const step = count > 1 ? (VIEW_W - img.width) / (count - 1) : 0;
  const y = VIEW_H - img.height - bottom;
  for (let i = 0; i < count; i++) ctx.drawImage(img, Math.round(i * step), y);
}

export function drawMainMenu(ctx) {
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  drawBackground(ctx, dt);
  const isMain = screen === "main"; // las plantas solo van en el menú principal
  if (isMain) drawVines(ctx);
  if (isMain) drawPlants(ctx, false);
  drawBushRow(ctx);
  if (isMain) drawPlants(ctx, true);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (screen === "main") {
    const bob = Math.round(Math.sin(now / 600) * 2);
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    ctx.fillStyle = "#3b2314";
    ctx.fillText("MediLife", VIEW_W / 2 + 2, 62 + bob + 2); // sombra
    ctx.fillStyle = "#f5deb3";
    ctx.fillText("MediLife", VIEW_W / 2, 62 + bob);
  } else {
    ctx.font = `bold 16px ${FONT_FAMILY}`;
    ctx.fillStyle = "#3b2314";
    ctx.fillText(t("options.title"), VIEW_W / 2 + 1, 36 + 1);
    ctx.fillStyle = "#f5deb3";
    ctx.fillText(t("options.title"), VIEW_W / 2, 36);
  }
  ctx.restore();

  drawMenu(ctx, screen === "main" ? mainMenu : optionsMenu);

  if (MENU_FRAME.width > 0) {
    const w = MENU_FRAME.width;
    ctx.save();
    ctx.strokeStyle = MENU_FRAME.color;
    ctx.lineWidth = w;
    ctx.strokeRect(w / 2, w / 2, VIEW_W - w, VIEW_H - w); // borde pegado al límite de la pantalla
    ctx.restore();
  }
}
