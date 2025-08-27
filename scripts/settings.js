import { MODULE_ID } from "./core/const.js";
import { DivineSelectionConfig } from "./features/divine-selection/divine-selection-config.js";
import { CriticalTablesConfig } from "./features/critical-tables/critical-tables.js";

const SETTINGS = {
  activationKey: {
    name: "FATEBRINGER.Hotkey",
    hint: "FATEBRINGER.HotkeyHint",
    scope: "world",
    config: true,
    type: String,
    default: "z",
  },
  deityConfig: {
    name: "Deity Configuration",
    hint: "Configure divine beings, their titles, and avatar images",
    scope: "world",
    config: false,
    type: Object,
    default: { names: [], titles: [], avatars: [] },
  },
  customMessages: {
    name: "Custom Messages",
    hint: "Configure divine intervention messages",
    scope: "world",
    config: false,
    type: Array,
    default: [
      "By divine will, {name} is chosen by {title}.",
      "Fortune favors {name} this day, blessed by {title}.",
      "The hand of fate guides {name}, through {title}'s grace.",
      "The sacred will of {title} chooses {name}.",
      "By {title}'s eternal wisdom, {name} is chosen.",
    ],
  },
  criticalTablesConfig: {
    name: "Critical Tables Configuration",
    hint: "Configure roll tables for critical hits and fumbles",
    scope: "world",
    config: false,
    type: Object,
    default: {
      meleeCrit: "", meleeFumble: "", rangedCrit: "", rangedFumble: "",
      spellCrit: "", spellFumble: "", abilityCrit: "", abilityFumble: "",
      saveCrit: "", saveFumble: "", manualCrit: "", manualFumble: ""
    },
  },
  criticalTablesOptions: {
    name: "Critical Tables Options",
    hint: "Configure critical tables behavior options",
    scope: "world",
    config: false,
    type: Object,
    default: {
      playersOnly: false,
      checkAttacks: false,
      checkSaves: false,
      checkAbility: false,
      checkManualRolls: false,
      fastForward: false,
    },
  },
};

const MENUS = {
  divineSelectionConfigMenu: {
    name: "Configure Divine Selection",
    label: "Configure Divine Selection",
    hint: "Configure deities and divine intervention messages",
    icon: "fas fa-hand-sparkles",
    type: DivineSelectionConfig,
    restricted: true,
  },
  criticalTablesConfigMenu: {
    name: "Configure Critical Tables",
    label: "Configure Critical Tables",
    hint: "Configure roll tables for critical hits and fumbles",
    icon: "fas fa-dice-d20",
    type: CriticalTablesConfig,
    restricted: true,
  },
};

export function registerSettings() {
  Object.entries(SETTINGS).forEach(([key, config]) => {
    game.settings.register(MODULE_ID, key, config);
  });
  
  Object.entries(MENUS).forEach(([key, config]) => {
    game.settings.registerMenu(MODULE_ID, key, config);
  });
}
