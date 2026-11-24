// Progreso de la historia (qué ya pasó, qué se desbloqueó).
// Solo se accede por setFlag / hasFlag.

const flags = {};

export function setFlag(name, value = true) {
  flags[name] = value;
}

export function hasFlag(name) {
  return !!flags[name];
}
