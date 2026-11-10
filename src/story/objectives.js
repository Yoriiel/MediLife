// Objetivo (misión) actual: guarda la clave de texto, no el texto,
// para que se traduzca solo al cambiar de idioma.

let current = null;

export function setObjective(key) {
  current = key;
}

export function getObjective() {
  return current;
}
