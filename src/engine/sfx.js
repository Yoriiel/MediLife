// Efectos de sonido (sin música). Usan el volumen general de settings.js.
//   playSfx("nombre")           -> suena una vez; se puede llamar seguido y se superponen
//   playSfx("nombre", retraso)  -> igual, pero empieza tras `retraso` segundos
//   isSfxPlaying("nombre")       -> true mientras ese sonido esté sonando (ej. la canción: engine/dance.js)
//   startTyping() / stopTyping() -> sonido de escritura de los cuadros de texto (lo maneja dialogue.js)
//   startLoop("nombre") / stopLoop("nombre", fade) -> sonido en bucle (ej. la ducha); stopLoop lo apaga con un fundido corto
//   playPurr("id")               -> ronroneo de un gato; si ya estaba sonando, se reinicia (no se acumula)
//   setWalking(true/false)       -> pasos de Medi en bucle mientras camina (lo llama main.js cada cuadro)
// Para añadir un sonido: copia el archivo a public/audio/ y agrégalo en SFX.

import { getSettings, onSettingsChange } from "./settings.js";

// volume = volumen propio de cada sonido (0 a 1), se multiplica por el volumen general
const SFX = {
  typing:     { src: "/audio/escritura.wav",   volume: 0.5 },
  meow:       { src: "/audio/gatos1.mp3",      volume: 1 },
  meow2:      { src: "/audio/gatos2.mp3",      volume: 1 }, // maullido al salir de casa y al acariciar
  purr:       { src: "/audio/purringcat.mp3",  volume: 0.8 },
  fridge:     { src: "/audio/refri.mp3",       volume: 1 },
  closet:     { src: "/audio/closet.mp3",      volume: 1 },
  bathrobe:   { src: "/audio/bathrobe.mp3",    volume: 1 },
  eat:        { src: "/audio/eat.mp3",         volume: 1 },
  walk:       { src: "/audio/walk.mp3",        volume: 0.6 },
  horn:       { src: "/audio/horn.mp3",        volume: 1 },
  birthday:   { src: "/audio/cancionhb.mp3",   volume: 1 },
  kiss:       { src: "/audio/kiss.mp3",        volume: 1 }, // menú de Yori: Besar
  slap:       { src: "/audio/slap.mp3",        volume: 1 }, // menú de Yori: Slap
  bite:       { src: "/audio/bite.mp3",        volume: 1 }, // menú de Yori: Morder
};

const audios = {};
const playingCount = {}; // cuántas copias de cada sonido están sonando ahora mismo
let typingEl = null;
let walkEl = null;
const purrEls = {}; // un ronroneo por gato
const loops = {};   // sonidos en bucle (ducha)

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

export function playSfx(name, delay = 0) {
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
  if (delay > 0) setTimeout(play, delay * 1000);
  else play();
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

// Bucle: suena sin parar hasta stopLoop (la duración del archivo no importa)
export function startLoop(name) {
  if (!audios[name]) return;
  let el = loops[name];
  if (!el) {
    el = audios[name].cloneNode();
    el.loop = true;
    loops[name] = el;
  }
  clearInterval(el.fadeTimer);
  el.fadeTimer = null;
  el.currentTime = 0;
  el.volume = level(name);
  const p = el.play();
  if (p && p.catch) p.catch(() => {});
}

// Apaga el bucle bajando el volumen en `fade` segundos
export function stopLoop(name, fade = 0.4) {
  const el = loops[name];
  if (!el || el.paused) return;
  clearInterval(el.fadeTimer);
  const steps = 8;
  const from = el.volume;
  let i = 0;
  el.fadeTimer = setInterval(() => {
    i++;
    el.volume = Math.max(0, from * (1 - i / steps));
    if (i >= steps) {
      clearInterval(el.fadeTimer);
      el.fadeTimer = null;
      el.pause();
      el.currentTime = 0;
    }
  }, (fade * 1000) / steps);
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

// Pasos: en bucle mientras Medi camina; al detenerse se cortan y vuelven al inicio
export function setWalking(on) {
  if (on) {
    if (!walkEl) {
      walkEl = audios.walk.cloneNode();
      walkEl.loop = true;
    }
    if (!walkEl.paused) return;
    walkEl.volume = level("walk");
    const p = walkEl.play();
    if (p && p.catch) p.catch(() => {});
  } else if (walkEl && !walkEl.paused) {
    walkEl.pause();
    walkEl.currentTime = 0;
  }
}

// Si cambia el volumen mientras suenan la escritura o los pasos, se ajusta al instante
onSettingsChange((name) => {
  if (name !== "volume") return;
  if (typingEl) typingEl.volume = level("typing");
  if (walkEl) walkEl.volume = level("walk");
  for (const el of Object.values(purrEls)) el.volume = level("purr");
  for (const [n, el] of Object.entries(loops)) if (!el.fadeTimer) el.volume = level(n);
});
