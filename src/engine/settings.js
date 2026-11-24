// Ajustes del jugador (los comparten el menú principal y el menú de pausa).

const STORAGE_KEY = "medilife-settings";

const DEFAULT_SETTINGS = {
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
} catch {
  // sin almacenamiento o datos dañados: se quedan los valores por defecto
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
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
