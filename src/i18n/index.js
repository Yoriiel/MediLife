// Idiomas del juego. Para añadir uno: crea su archivo y regístralo en `languages`.

import es from "./es.js";
import en from "./en.js";

const languages = { es, en };
const STORAGE_KEY = "medilife-lang";

let current = "en";

try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && languages[saved]) current = saved;
} catch (e) {
  // sin almacenamiento: se queda en español
}

// Devuelve el texto de una clave en el idioma activo
export function t(key) {
  return languages[current][key] ?? languages.es[key] ?? key;
}

export function getLanguage() {
  return current;
}

// El menú principal llamará a esta función con "es" o "en"
export function setLanguage(lang) {
  if (!languages[lang]) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    // ignorar
  }
}

export function toggleLanguage() {
  const codes = Object.keys(languages);
  setLanguage(codes[(codes.indexOf(current) + 1) % codes.length]);
}
