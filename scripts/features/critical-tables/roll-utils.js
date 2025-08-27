export function getUsedRoll(die, roll) {
  if (die.results.length === 1) return die.results[0].result;
  const results = die.results.map(r => r.result);
  return roll.options?.advantageMode === -1 
    ? Math.min(...results) 
    : Math.max(...results);
}

export function checkPermission(rollData, userId) {
  if (!rollData.actor) return true;
  
  const playerOwners = Object.keys(rollData.actor.ownership || {}).filter(id => {
    const user = game.users.find(u => u.id === id);
    return rollData.actor.ownership[id] === 3 && id !== "default" && user && !user.isGM;
  });
  
  const onlineOwner = playerOwners.find(id => 
    game.users.find(u => u.id === id && u.active)
  );
  
  if (playerOwners.length > 0) {
    return playerOwners.includes(userId) || (!onlineOwner && game.user.isGM);
  }
  
  return game.user.isGM;
}

export function checkButtonPermission(rollData, userId) {
  if (!rollData.actor) return true;
  
  const playerOwners = Object.keys(rollData.actor.ownership || {}).filter(id => {
    const user = game.users.find(u => u.id === id);
    return rollData.actor.ownership[id] === 3 && id !== "default" && user && !user.isGM;
  });
  
  const currentUser = game.users.find(u => u.id === userId);
  return playerOwners.includes(userId) || (currentUser && currentUser.isGM);
}

import { DELAYS } from "../../core/const.js";
import { getCached, setCached } from "../../core/cache.js";

export function getCriticalThreshold(actor, item) {
  if (!actor || !item) return 20;
  return item.system?.critical?.threshold || 
         actor.system?.attributes?.critical?.threshold || 20;
}

export function isCriticalHit(naturalRoll, actor, item) {
  return naturalRoll >= getCriticalThreshold(actor, item);
}

export function processRoll(rollData, message = null) {
  if (checkPermission(rollData, game.user.id)) {
    import("./table-handler.js").then(({ addTableButton }) => {
      setTimeout(() => addTableButton(message, rollData), DELAYS.BUTTON_PROCESS);
    });
  }
}
