// Filas de "Opciones" compartidas por el menú principal y el menú de pausa:
// música (ON/OFF), volumen (barra), partículas (ON/OFF) e idioma.

import { t, toggleLanguage } from "../i18n/index.js";
import { getSettings, setSetting } from "../engine/settings.js";

export function buildOptionsItems() {
  return [
    {
      type: "toggle",
      label: () => t("options.music"),
      get: () => getSettings().musicOn,
      set: (v) => setSetting("musicOn", v),
    },
    {
      type: "slider",
      label: () => t("options.volume"),
      get: () => getSettings().volume,
      set: (v) => setSetting("volume", v),
      dim: () => !getSettings().musicOn, // apagada la música, la barra se ve atenuada
    },
    {
      type: "toggle",
      label: () => t("options.particles"),
      get: () => getSettings().particles,
      set: (v) => setSetting("particles", v),
    },
    {
      type: "choice",
      label: () => t("options.language"),
      value: () => t("lang.name"),
      onChange: () => toggleLanguage(), // por ahora solo hay dos idiomas: alterna entre ellos
    },
  ];
}
