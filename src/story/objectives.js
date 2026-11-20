// Objetivo (misión) actual: guarda la clave de texto, no el texto,
// para que se traduzca solo al cambiar de idioma.

// Misiones con varias tareas: el HUD las muestra en líneas y tacha las que ya se cumplieron.
//   key  = clave de texto de la tarea
//   done = nombre de la marca de events.js que la completa (null = la última, sin tachar)
export const TASKS = {
  mission3: [
    { key: "mission3a", done: "bathrobeTaken" }, // buscar la bata de baño en el cuarto
    { key: "mission3b", done: null },            // tomar la ducha abajo
  ],
};

let current = null;

export function setObjective(key) {
  current = key;
}

export function getObjective() {
  return current;
}
