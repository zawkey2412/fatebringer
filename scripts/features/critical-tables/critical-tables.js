import { ROLL_CATEGORIES } from "../../core/const.js";
import {
  detectRollCategory,
  getCategory,
  isAttackOrDamageRoll,
  shouldTrigger,
  shouldTriggerForCategory,
} from "./roll-detection.js";
import { setupChatListeners } from "./table-handler.js";
import { getUsedRoll, checkPermission, processRoll, isCriticalHit, getCriticalThreshold } from "./roll-utils.js";

export { CriticalTablesConfig } from "./critical-tables-config.js";

function onMidiAttackComplete(workflow) {
  if (!workflow?.attackRoll && !workflow?.item) return;
  if (!shouldTrigger(workflow.actor)) return;

  const isCrit = !!workflow.isCritical;
  const isFumble = !!workflow.isFumble;
  if (!isCrit && !isFumble) return;

  const attackRoll = workflow.attackRoll;
  const d20Die = attackRoll?.dice?.find(d => d.faces === 20);
  const naturalRoll = d20Die ? getUsedRoll(d20Die, attackRoll) : (isCrit ? getCriticalThreshold(workflow.actor, workflow.item) : 1);

  processRoll({
    actor: workflow.actor,
    category: getCategory(workflow.item),
    isCrit,
    isFumble,
    naturalRoll,
    speaker: ChatMessage.getSpeaker({ actor: workflow.actor }),
    processedByMidi: true,
  }, null);
}

function onChatMessage(message) {
  if (message.flags?.fatebringer?.processedByMidi) return;
  if (message.flags?.fatebringer?.criticalTablesProcessed) return;
  if (isAttackOrDamageRoll(message)) return;

  const rollData = parseMessageRoll(message);
  if (!rollData) return;

  if (shouldTriggerForCategory(rollData) && checkPermission(rollData, game.user.id)) {
    message.setFlag("fatebringer", "criticalTablesProcessed", true);
    processRoll(rollData, message);
  }
}

function parseMessageRoll(message) {
  const roll = message.rolls?.[0];
  if (!roll) return null;

  const category = detectRollCategory(message, roll);
  if (!category) return null;

  const die = category === ROLL_CATEGORIES.MANUAL ? roll.dice?.[0] : roll.dice?.find(d => d.faces === 20);
  if (!die?.results?.length) return null;

  const actor = message.speaker?.actor ? game.actors.get(message.speaker.actor) : null;
  const naturalRoll = getUsedRoll(die, roll);
  
  const isCrit = category === ROLL_CATEGORIES.MANUAL 
    ? naturalRoll === die.faces 
    : actor ? isCriticalHit(naturalRoll, actor, null) : naturalRoll === 20;
  const isFumble = naturalRoll === 1;
  
  if (!isCrit && !isFumble) return null;

  return {
    actor, category, isCrit, isFumble, naturalRoll,
    speaker: message.speaker,
    dieInfo: category === ROLL_CATEGORIES.MANUAL ? { value: naturalRoll, faces: die.faces } : null,
  };
}

export function initializeCriticalTables() {
  Hooks.on("midi-qol.AttackRollComplete", onMidiAttackComplete);
  Hooks.on("createChatMessage", onChatMessage);
  setupChatListeners();
}
