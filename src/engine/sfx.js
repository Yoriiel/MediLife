// Efectos de sonido (sin música). Usan el volumen general de settings.js.

import { getSettings, onSettingsChange } from "./settings.js";

// volume = volumen propio de cada sonido (0 a 1), se multiplica por el volumen general
const SFX = {
  typing:     { src: "/audio/escritura.wav",   volume: 0.5 },
  meow:       { src: "/audio/gatos1.mp3",      volume: 1 },
  meow2:      { src: "/audio/gatos2.mp3",      volume: 1 }, // maullido al salir de casa y al acariciar
  purr:       { src: "/audio/purringcat.mp3",  volume: 0.8 },
  fridge:     { src: "/audio/refri.mp3",       volume: 1 },
  bathrobe:   { src: "/audio/bathrobe.mp3",    volume: 1 },
  eat:        { src: "/audio/eat.mp3",         volume: 1 },
  horn:       { src: "/audio/horn.mp3",        volume: 1 },
  birthday:   { src: "/audio/cancionhb.mp3",   volume: 1 },
  kiss:       { src: "/audio/kiss.mp3",        volume: 1 }, // menú de Yori: Besar
  slap:       { src: "/audio/slap.mp3",        volume: 1 }, // menú de Yori: Slap
  bite:       { src: "/audio/bite.mp3",        volume: 1 }, // menú de Yori: Morder
  paper:      { src: "/audio/dibujosound.mp3", volume: 1 }, // hoja de papel: al salir el dibujo del cofre
};

const audios = {};
const playingCount = {}; // cuántas copias de cada sonido están sonando ahora mismo
let typingEl = null;
const purrEls = {}; // un ronroneo por gato

// Precarga todos los sonidos al importar este archivo
for (const [name, def] of Object.entries(SFX)) {
  const el = new Audio(def.src);
  el.preload = "auto";
  audios[name] = el;
}

function level(name) {
  return Math.min(1, Math.max(0, SFX[name].volume * getSettings().volume));
}

// Nevera: suena una sola vez por cada vez que se saca comida (salchichas, pizza, plátano, pepino)
export function playFridge() {
  playSfx("fridge");
}

// ¿Está sonando este sonido ahora mismo? (desde que empieza hasta que termina)
export function isSfxPlaying(name) {
  return (playingCount[name] || 0) > 0;
}

export function playSfx(name) {
  const base = audios[name];
  if (!base) return;
  const play = () => {
    const el = base.cloneNode(); // copia: así dos sonidos iguales se superponen
    el.volume = level(name);
    playingCount[name] = (playingCount[name] || 0) + 1;
    let counted = true;
    const done = () => {
      if (!counted) return;
      counted = false;
      playingCount[name] = Math.max(0, (playingCount[name] || 1) - 1);
    };
    el.addEventListener("ended", done);
    el.addEventListener("error", done);
    const p = el.play();
    if (p && p.catch) p.catch(done); // sin interacción todavía: no suena, así que tampoco cuenta
  };
  play();
}

// Escritura: suena mientras se escribe el cuadro y se corta al terminar
export function startTyping() {
  if (!typingEl) typingEl = audios.typing.cloneNode();
  if (!typingEl.paused) return;
  typingEl.currentTime = 0;
  typingEl.volume = level("typing");
  const p = typingEl.play();
  if (p && p.catch) p.catch(() => {});
}

export function stopTyping() {
  if (!typingEl || typingEl.paused) return;
  typingEl.pause();
  typingEl.currentTime = 0;
}

// Ronroneo: un solo audio por gato; acariciarlo otra vez lo reinicia en lugar de apilarlo
export function playPurr(id) {
  if (!purrEls[id]) purrEls[id] = audios.purr.cloneNode();
  const el = purrEls[id];
  el.currentTime = 0;
  el.volume = level("purr");
  const p = el.play();
  if (p && p.catch) p.catch(() => {});
}

// Si cambia el volumen mientras suenan la escritura o los ronroneos, se ajusta al instante
onSettingsChange((name) => {
  if (name !== "volume") return;
  if (typingEl) typingEl.volume = level("typing");
  for (const el of Object.values(purrEls)) el.volume = level("purr");
});
