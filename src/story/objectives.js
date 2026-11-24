// Objetivo (misión) actual

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
