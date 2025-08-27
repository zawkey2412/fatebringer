import { DELAYS } from "../../core/const.js";

export function isDiceSoNiceAvailable() {
  return !!game.dice3d;
}

export async function showDiceAnimation(roll) {
  if (isDiceSoNiceAvailable()) {
    try {
      await game.dice3d.showForRoll(roll, game.user, true);
      return;
    } catch (error) {}
  }
  
  playDiceRollAudio();
  await new Promise(resolve => setTimeout(resolve, DELAYS.DICE_ANIMATION));
}

function playDiceRollAudio() {
  try {
    const audio = new Audio("modules/fatebringer/assets/dice_roll.ogg");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (error) {}
}