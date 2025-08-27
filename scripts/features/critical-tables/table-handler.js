import { MODULE_ID, DELAYS } from "../../core/const.js";
import { getColors, createStyledCard, sanitizeText } from "../../core/utils.js";
import { showDiceAnimation } from "./dice-utils.js";
import { checkButtonPermission } from "./roll-utils.js";
import { getCached, setCached } from "../../core/cache.js";

export async function addTableButton(message, rollData) {
  const config = game.settings.get(MODULE_ID, "criticalTablesConfig");
  const options = game.settings.get(MODULE_ID, "criticalTablesOptions");
  const tableKey = `${rollData.category}${rollData.isCrit ? "Crit" : "Fumble"}`;
  const tableUuid = config[tableKey];

  if (!tableUuid) return;

  try {
    const table = await getTableFromCache(tableUuid);
    if (!table?.documentName || table.documentName !== "RollTable") return;

    const colors = getColors(rollData.isCrit);
    const title = createTitle(rollData);

    const content = options.fastForward
      ? await createAutoRollContent(table, title, colors)
      : createButtonTemplate(title, colors, rollData, tableUuid, table.name);

    ChatMessage.create({
      content,
      speaker: rollData.speaker,
      flags: { fatebringer: { processedByMidi: rollData.processedByMidi } },
    });
  } catch (error) {
    console.error("Failed to process table:", error);
  }
}

export function setupChatListeners() {
  document.addEventListener("click", async (event) => {
    let target = event.target;

    if (!target?.classList?.contains("crit-fumble-roll-btn")) {
      target = target.closest(".crit-fumble-roll-btn");
    }

    if (!target) return;

    event.preventDefault();
    event.stopPropagation();

    const message = game.messages?.get(
      target.closest(".message")?.dataset?.messageId
    );
    if (!message) return;

    const rollData = parseRollDataFromMessage(message);
    if (rollData && !checkButtonPermission(rollData, game.user.id)) {
      ui.notifications.warn(
        rollData.actor
          ? "Only the character owner or GM can roll this table"
          : "Permission denied"
      );
      return;
    }

    const tableUuid = target.dataset.tableUuid;
    if (!tableUuid) return ui.notifications.error("No table UUID found");

    try {
      const table = await getTableFromCache(tableUuid);
      if (table?.documentName === "RollTable") {
        await rollTableAndUpdate(table, target);
      } else {
        ui.notifications.error("Invalid table");
      }
    } catch {
      ui.notifications.error("Failed to roll table");
    }
  });
}

async function rollTableAndUpdate(table, button) {
  const message = game.messages?.get(
    button.closest(".message")?.dataset?.messageId
  );
  if (!message) {
    ui.notifications.error("Could not find original message");
    return;
  }

  try {
    button.disabled = true;
    button.style.opacity = "0.7";
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rolling...';

    const result = await table.roll();
    await showDiceAnimation(result.roll);

    button.textContent = "✓ Rolled!";

    const rolledValue = result.total || result.roll?.total || 0;
    const resultText = result.results
      .map((r) => r.text || r.getChatText())
      .join(", ");
    const isCrit = message.content.includes("#4CAF50");
    const colors = getColors(isCrit);
    const titleMatch = message.content.match(/<h4[^>]*>([^<]+)<\/h4>/);
    const title = sanitizeText(titleMatch?.[1] || "Roll Result");

    await message.update({
      content: createResultTemplate(title, colors, rolledValue, resultText),
    });
  } catch (error) {
    ui.notifications.error("Failed to roll table");
    button.disabled = false;
    button.style.opacity = "1";
    button.innerHTML = `<i class="fas fa-dice"></i> Roll ${
      table.name || "Table"
    }`;
  }
}
async function getTableFromCache(tableUuid) {
  const cacheKey = `table_${tableUuid}`;
  let table = getCached(cacheKey);

  if (!table) {
    table = await fromUuid(tableUuid);
    if (table?.documentName === "RollTable") {
      setCached(cacheKey, table);
    }
  }
  return table;
}

async function createAutoRollContent(table, title, colors) {
  const result = await table.roll();
  await showDiceAnimation(result.roll);

  const rolledValue = result.total || result.roll?.total || 0;
  const resultText = result.results
    .map((r) => r.text || r.getChatText())
    .join(", ");

  return createResultTemplate(title, colors, rolledValue, resultText);
}

function createTitle(rollData) {
  const name = rollData.speaker?.alias || "Someone";
  const rollTypes = {
    save: "saving throw",
    ability: "ability check",
    melee: "melee attack",
    ranged: "ranged attack",
    spell: "spell attack",
    manual: "manual roll",
  };

  if (rollData.category === "manual" && rollData.dieInfo) {
    return `${name} rolled ${rollData.dieInfo.value} out of d${rollData.dieInfo.faces} on ${rollTypes.manual}!`;
  }

  const isAbilitySave =
    rollData.category === "save" || rollData.category === "ability";
  const action = isAbilitySave
    ? rollData.isCrit
      ? "critically succeeded on"
      : "critically failed"
    : rollData.isCrit
    ? "critically hit"
    : "fumbled";
  const preposition = isAbilitySave ? "" : "with";

  return `${name} ${action} ${preposition} ${
    rollTypes[rollData.category]
  }!`.replace(/\s+/g, " ");
}

function createResultTemplate(title, colors, rolledValue, resultText) {
  const content = `<div style="background: rgba(${colors.bg}, 0.1); padding: 10px; margin: 5px; border-radius: 5px;">
    <p style="text-align: center; margin: 5px 0;"><strong>Rolled</strong></p>
    <h4 style="text-align: center; margin: 5px 0; color: ${colors.border};"><strong>${rolledValue}</strong></h4>
    <p style="text-align: center; margin: 15px 0 5px 0;"><strong>Effect</strong></p>
    <div style="text-align: center; margin: 5px 0;">${resultText}</div>
  </div>`;
  return createStyledCard(title, colors, content);
}

function createButtonTemplate(title, colors, rollData, tableUuid, tableName) {
  const content = `<div style="text-align: center;">
    <button class="crit-fumble-roll-btn" data-table-uuid="${tableUuid}" 
            style="display: block; padding: 8px 16px; margin: 5px auto; background: ${colors.border}; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px; height: auto;">
      <i class="fas fa-dice"></i> Roll ${tableName}
    </button>
  </div>`;
  return createStyledCard(title, colors, content);
}

function parseRollDataFromMessage(message) {
  const actor = message.speaker?.actor
    ? game.actors.get(message.speaker.actor)
    : null;
  return { actor, speaker: message.speaker };
}
