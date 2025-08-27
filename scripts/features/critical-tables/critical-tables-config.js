import { MODULE_ID } from "../../core/const.js";
import { BaseConfigForm } from "../../ui/base-config.js";
import { createFormContainer } from "../../ui/form-utils.js";

export class CriticalTablesConfig extends BaseConfigForm {
  static DEFAULT_OPTIONS = {
    ...BaseConfigForm.DEFAULT_OPTIONS,
    id: "critical-tables-config",
    window: { title: "Critical Tables Configuration", resizable: false },
    actions: { save: CriticalTablesConfig.prototype._onSave },
  };

  constructor() {
    super();
    this.emptySlotCount = 0;
  }

  _prepareHTML() {
    const settings = game.settings.get(MODULE_ID, "criticalTablesConfig");
    const options = game.settings.get(MODULE_ID, "criticalTablesOptions");
    let contentHtml = "";

    // Options section
    contentHtml += `<h4>Trigger Options:</h4>`;
    const optionTypes = [
      {
        key: "playersOnly",
        label: "Players Only",
        hint: "Only trigger tables for player-owned actors",
      },
      {
        key: "checkAttacks",
        label: "Check Attack Rolls",
        hint: "Trigger on natural 1s and 20s for attack rolls",
      },
      {
        key: "checkSaves",
        label: "Check Saving Throws",
        hint: "Also trigger on natural 1s and 20s for saving throws",
      },
      {
        key: "checkAbility",
        label: "Check Ability Checks",
        hint: "Also trigger on natural 1s and 20s for ability checks",
      },
      {
        key: "checkManualRolls",
        label: "Check Manual Rolls",
        hint: "Also trigger on min/max values for manual dice rolls",
      },
      {
        key: "fastForward",
        label: "Fast Forward",
        hint: "Automatically roll tables instead of showing buttons",
      },
    ];

    optionTypes.forEach(({ key, label, hint }) => {
      contentHtml += `
        <div style="margin-bottom: 10px;">
          <label>
            <input type="checkbox" name="${key}" ${
        options[key] ? "checked" : ""
      }>
            ${label}
          </label>
          <p style="font-size: 11px; color: #666; margin: 2px 0 0 20px;">${hint}</p>
        </div>
      `;
    });

    // Tables section
    contentHtml += `<h4 style="margin-top: 20px;">Roll Tables:</h4>`;
    const tableTypes = [
      { key: "meleeCrit", label: "Melee Critical" },
      { key: "meleeFumble", label: "Melee Fumble" },
      { key: "rangedCrit", label: "Ranged Critical" },
      { key: "rangedFumble", label: "Ranged Fumble" },
      { key: "spellCrit", label: "Spell Critical" },
      { key: "spellFumble", label: "Spell Fumble" },
      { key: "abilityCrit", label: "Ability Critical" },
      { key: "abilityFumble", label: "Ability Fumble" },
      { key: "saveCrit", label: "Save Critical" },
      { key: "saveFumble", label: "Save Fumble" },
      { key: "manualCrit", label: "Manual Critical" },
      { key: "manualFumble", label: "Manual Fumble" },
    ];

    tableTypes.forEach(({ key, label }) => {
      contentHtml += `
        <div style="margin-bottom: 10px;">
          <label>${label} Table UUID:</label>
          <input type="text" name="${key}" value="${
        settings[key] || ""
      }" style="width: 100%; margin-top: 5px;" placeholder="Paste table UUID here">
        </div>
      `;
    });

    return createFormContainer(
      "Configure Critical Tables:",
      "Configure trigger options and paste roll table UUIDs for different scenarios. Empty table fields will be ignored.",
      contentHtml,
      `<div style="display:flex; width:99%; justify-content: flex-end;">
        <button type="button" data-action="save" class="save-btn">
          <i class="fas fa-save"></i> Save Configuration
        </button>
      </div>`
    );
  }

  _getInputSelector() {
    return 'input[name^="melee"], input[name^="ranged"], input[name^="spell"]';
  }

  async _onSave(event, target) {
    const form = target.closest("form");
    const formData = new FormData(form);
    const config = {};
    const options = {};

    const optionKeys = [
      "playersOnly",
      "checkAttacks",
      "checkSaves",
      "checkAbility",
      "checkManualRolls",
      "fastForward",
    ];
    const tableKeys = [
      "meleeCrit",
      "meleeFumble",
      "rangedCrit",
      "rangedFumble",
      "spellCrit",
      "spellFumble",
      "abilityCrit",
      "abilityFumble",
      "saveCrit",
      "saveFumble",
      "manualCrit",
      "manualFumble",
    ];

    optionKeys.forEach((key) => {
      options[key] = formData.has(key);
    });

    for (const key of tableKeys) {
      const value = formData.get(key)?.toString().trim() || "";
      if (value) {
        try {
          const table = await fromUuid(value);
          if (table?.documentName === "RollTable") {
            config[key] = value;
            ui.notifications.info(`Table validated: ${table.name}`);
          } else {
            ui.notifications.warn(`Invalid table UUID for ${key}`);
            config[key] = "";
          }
        } catch {
          ui.notifications.warn(`Could not resolve UUID for ${key}`);
          config[key] = "";
        }
      } else {
        config[key] = "";
      }
    }

    await game.settings.set(MODULE_ID, "criticalTablesConfig", config);
    await game.settings.set(MODULE_ID, "criticalTablesOptions", options);
    this.close();
  }
}
