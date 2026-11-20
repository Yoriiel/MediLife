// Música de fondo. Respeta los ajustes de settings.js (activada/desactivada y volumen) al instante.
//   playMusic("menu" | "game" | "ending") -> pone esa pista (en bucle, salvo que se indique otra cosa; si ya suena, no la reinicia)
//   stopMusic(fade)             -> la detiene (fade = segundos de fundido de salida, opcional)
//   initAudio()                 -> llamar una vez: desbloquea el audio con la primera tecla o clic
//                                  (los navegadores no dejan sonar nada antes de que la jugadora interactúe)
//
// Pistas: pon los archivos en public/audio/ y escribe aquí su ruta.
// Mientras una pista no exista (o la ruta sea null) simplemente no suena nada y el juego sigue normal.
// Por pista: volume = volumen propio (0 a 1, se multiplica por el volumen general); loop = false para que suene una vez.

import { getSettings, onSettingsChange } from "./settings.js";

const TRACKS = {
  menu: { src: "/audio/menu.mp3" },
  game: { src: "/audio/game.mp3" },
  ending: { src: "/audio/endingsong.mp3", volume: 0.4 }, // canción de los créditos
};

let current = null; // { name, el }
let initialized = false;

function apply() {
  if (!current) return;
  const { musicOn, volume } = getSettings();
  current.el.volume = Math.min(1, volume * current.volume);
  if (!musicOn) {
    current.el.pause();
    return;
  }
  const p = current.el.play();
  if (p && p.catch) p.catch(() => {}); // sin interacción todavía o pista inexistente: se reintenta luego
}

export function playMusic(name) {
  if (current && current.name === name) {
    apply();
    return;
  }
  stopMusic();
  const def = TRACKS[name];
  if (!def || !def.src) return;
  const el = new Audio(def.src);
  el.loop = def.loop !== false;
  current = { name, el, volume: def.volume ?? 1 };
  apply();
}

export function stopMusic(fade = 0) {
  if (!current) return;
  const { el } = current;
  current = null;
  if (fade <= 0) {
    el.pause();
    return;
  }
  // fundido de salida: baja el volumen poco a poco y luego pausa
  const start = el.volume;
  const t0 = performance.now();
  const id = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / (fade * 1000));
    el.volume = start * (1 - k);
    if (k >= 1) {
      clearInterval(id);
      el.pause();
    }
  }, 50);
}

export function initAudio() {
  if (initialized) return;
  initialized = true;
  onSettingsChange((name) => {
    if (name === "musicOn" || name === "volume") apply();
  });
  // el primer gesto de la jugadora desbloquea el audio
  const unlock = () => {
    if (current && current.el.paused) apply();
  };
  window.addEventListener("keydown", unlock);
  window.addEventListener("pointerdown", unlock);
}
