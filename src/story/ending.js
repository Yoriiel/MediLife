// Final del juego: después de la primera acción con Yori (Besar / Slap / Morder), al cerrar su menú
// la pantalla se funde a negro y salen los créditos (engine/credits.js). Solo pasa una vez ("creditsShown").

import { hasFlag, setFlag } from "./events.js";
import { fadeToBlack, fadeFromBlack } from "../engine/fade.js";
import { startCredits } from "../engine/credits.js";
import { playMusic, stopMusic } from "../engine/audio.js";

export function startEnding() {
  if (hasFlag("creditsShown")) return;
  setFlag("creditsShown");
  fadeToBlack(1.2, () => {
    playMusic("ending"); // canción de los créditos (public/audio/endingsong.mp3); su volumen se ajusta en audio.js
    startCredits(() => {
      stopMusic(1.5); // se apaga con un fundido al acabar los créditos
      fadeFromBlack(1.2); // por ahora vuelve al juego; luego saldrá el menú Seguir explorando / Volver al menú
    });
  });
}
