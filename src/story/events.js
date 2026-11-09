// Progreso de la historia (qué ya pasó, qué se desbloqueó).
// Por ahora vacío: lo usaremos cuando añadamos diálogos y objetos.

export const flags = {};

export function setFlag(name, value = true) {
  flags[name] = value;
}

export function hasFlag(name) {
  return !!flags[name];
}
