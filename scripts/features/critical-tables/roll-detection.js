import { MODULE_ID, ROLL_CATEGORIES } from "../../core/const.js";
import { getCached, setCached } from "../../core/cache.js";

export function detectRollCategory(message, roll) {
  const text = `${message.content?.toLowerCase() || ""} ${message.flavor?.toLowerCase() || ""}`;
  const rollType = message.flags?.dnd5e?.roll?.type;

  if (rollType === "save") return ROLL_CATEGORIES.SAVE;
  if (rollType === "skill" || rollType === "ability") return ROLL_CATEGORIES.ABILITY;
  if (text.includes("saving throw") || text.includes(" save")) return ROLL_CATEGORIES.SAVE;
  if (isAbilityCheck(text)) return ROLL_CATEGORIES.ABILITY;
  if (roll.dice?.[0] && !roll.dice.find((d) => d.faces === 20)) return ROLL_CATEGORIES.MANUAL;

  return null;
}

export function getCategory(item) {
  if (item?.type === "spell") return ROLL_CATEGORIES.SPELL;
  if (item?.type === "weapon" && item?.system?.properties?.has?.("amm"))
    return ROLL_CATEGORIES.RANGED;
  return mapActionType(item?.system?.actionType || "mwak") || ROLL_CATEGORIES.MELEE;
}

export function isAttackOrDamageRoll(message) {
  const text = `${message.content?.toLowerCase() || ""} ${message.flavor?.toLowerCase() || ""}`;
  const rollType = message.flags?.dnd5e?.roll?.type;

  return (
    text.includes("attack") ||
    text.includes("damage") ||
    text.includes("to hit") ||
    rollType === "attack" ||
    rollType === "damage"
  );
}

export function shouldTrigger(actor) {
  const options = getOptionsFromCache();
  return actor && options.checkAttacks && (!options.playersOnly || actor.hasPlayerOwner);
}

export function shouldTriggerForCategory(rollData) {
  const options = getOptionsFromCache();
  const { category, actor } = rollData;

  if (options.playersOnly && (!actor || !actor.hasPlayerOwner)) return false;

  const categoryMap = {
    save: options.checkSaves,
    ability: options.checkAbility,
    manual: options.checkManualRolls
  };
  
  return categoryMap[category] || false;
}

function isAbilityCheck(text) {
  const abilityKeywords = [
    "ability check", "skill check", "acrobatics", "athletics", "deception", "history",
    "insight", "intimidation", "investigation", "medicine", "nature", "perception",
    "performance", "persuasion", "religion", "sleight", "stealth", "survival", "arcana", "animal handling"
  ];
  return abilityKeywords.some(keyword => text.includes(keyword));
}

function getOptionsFromCache() {
  const cacheKey = `options_${MODULE_ID}`;
  let options = getCached(cacheKey);
  
  if (!options) {
    options = game.settings.get(MODULE_ID, "criticalTablesOptions");
    setCached(cacheKey, options, 60000);
  }
  
  return options;
}

function mapActionType(actionType) {
  const typeMap = {
    mwak: ROLL_CATEGORIES.MELEE,
    msak: ROLL_CATEGORIES.SPELL,
    rwak: ROLL_CATEGORIES.RANGED,
    rsak: ROLL_CATEGORIES.SPELL,
    save: ROLL_CATEGORIES.SPELL,
    heal: ROLL_CATEGORIES.SPELL,
    abil: ROLL_CATEGORIES.MANUAL,
    util: ROLL_CATEGORIES.MANUAL,
  };
  return typeMap[actionType] || ROLL_CATEGORIES.MELEE;
}
