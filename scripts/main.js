import { MODULE_ID, DELAYS } from "./core/const.js";
import { registerSettings } from "./settings.js";
import { initializeChatAvatars } from "./core/chat-avatar.js";
import { randomSelectToken, clearCaches } from "./features/divine-selection/divine-selection.js";
import { initializeCriticalTables } from "./features/critical-tables/critical-tables.js";
import { clearCache } from "./core/cache.js";

let lastKeyTime = 0;
let hotkeyCache = null;

Hooks.on("updateSetting", (setting) => {
  if (setting.key === `${MODULE_ID}.deityConfig` || setting.key === `${MODULE_ID}.customMessages`) {
    clearCaches();
  }
  if (setting.key.startsWith(`${MODULE_ID}.criticalTables`)) {
    clearCache();
  }
});

Hooks.once("init", registerSettings);

Hooks.on("ready", () => {
  hotkeyCache = game.settings.get(MODULE_ID, "activationKey").toLowerCase();
  initializeChatAvatars();
  initializeCriticalTables();
  
  window.addEventListener("keydown", (ev) => {
    if (
      !game.user.isGM ||
      ev.repeat ||
      Date.now() - lastKeyTime < DELAYS.HOTKEY_COOLDOWN ||
      ev.key.toLowerCase() !== hotkeyCache ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(ev.target.tagName)
    )
      return;
    lastKeyTime = Date.now();
    randomSelectToken();
  });
});
