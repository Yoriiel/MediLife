// Ajustes del jugador (los comparten el menú principal y el menú de pausa).
//   getSettings()            -> { musicOn, volume, particles }  (solo lectura: para cambiar usa setSetting)
//   setSetting(nombre, valor)-> cambia un ajuste, lo guarda en localStorage y avisa a quien escuche
//   onSettingsChange(fn)     -> fn(nombre, valor) se llama cada vez que cambia un ajuste
//   resetSettings()          -> vuelve a los valores por defecto
// El idioma NO está aquí: lo maneja i18n/index.js (setLanguage / toggleLanguage / getLanguage).

const STORAGE_KEY = "medilife-settings";

export const DEFAULT_SETTINGS = {
  musicOn: true,    // música activada
  volume: 0.6,      // volumen de la música, de 0 a 1
  particles: true,  // corazones y destellos
};

const settings = { ...DEFAULT_SETTINGS };
const listeners = [];

function clean(name, value) {
  if (name === "volume") {
    const v = Number(value);
    return Number.isFinite(v) ? Math.min(1, Math.max(0, Math.round(v * 100) / 100)) : DEFAULT_SETTINGS.volume;
  }
  return !!value;
}

// Carga lo guardado (si hay); ignora claves desconocidas
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  for (const name of Object.keys(DEFAULT_SETTINGS)) {
    if (name in saved) settings[name] = clean(name, saved[name]);
  }
} catch (e) {
  // sin almacenamiento o datos dañados: se quedan los valores por defecto
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // ignorar
  }
}

export function getSettings() {
  return settings;
}

export function setSetting(name, value) {
  if (!(name in DEFAULT_SETTINGS)) return;
  const v = clean(name, value);
  if (settings[name] === v) return;
  settings[name] = v;
  save();
  for (const fn of listeners) fn(name, v);
}

export function onSettingsChange(fn) {
  listeners.push(fn);
}

export function resetSettings() {
  for (const name of Object.keys(DEFAULT_SETTINGS)) setSetting(name, DEFAULT_SETTINGS[name]);
}
