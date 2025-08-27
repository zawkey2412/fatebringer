import { MODULE_ID } from "../../core/const.js";
import { shuffleArray, formatTokenNames } from "../../core/utils.js";

let configCache = null;
let messagesCache = null;

const getConfig = () =>
  configCache || (configCache = game.settings.get(MODULE_ID, "deityConfig"));
const getMessages = () =>
  messagesCache ||
  (messagesCache = game.settings.get(MODULE_ID, "customMessages"));

export function clearCaches() {
  configCache = null;
  messagesCache = null;
}

export class TokenSelectionDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: "fatebringer-selection",
    tag: "dialog",
    window: { title: "Divine Selection", resizable: false },
    position: { width: 400, height: "auto" },
    actions: {
      select: TokenSelectionDialog.prototype._onSelect,
      cancel: TokenSelectionDialog.prototype._onCancel,
    },
  };

  static PARTS = {
    form: { template: `modules/${MODULE_ID}/templates/selection-dialog.hbs` },
  };

  constructor(tokens) {
    super();
    this.tokens = tokens;
  }

  _prepareContext() {
    const options = [];
    for (let i = 1; i <= this.tokens.length; i++) {
      options.push({ value: i, label: i });
    }
    return { tokens: this.tokens, options };
  }

  async _onSelect(event, target) {
    const form = target.closest("form");
    const count = parseInt(form.querySelector("select[name='count']").value);
    const selected = shuffleArray(this.tokens).slice(0, count);
    await createDivineMessage(selected);
    this.close();
  }

  _onCancel() {
    this.close();
  }
}

const createDivineMessage = async (tokens) => {
  const config = getConfig();
  const messages = getMessages();

  if (config.names.length === 0) {
    ui.notifications.warn(
      "No deities configured. Please add deities in module settings."
    );
    return;
  }

  const chosenIndex = Math.floor(Math.random() * config.names.length);
  const messageIndex = Math.floor(Math.random() * messages.length);

  const enrichedNames = await Promise.all(
    tokens.map((token) =>
      TextEditor.enrichHTML(token.name || "unnamed token", { secrets: false })
    )
  );
  const names = formatTokenNames(
    enrichedNames.map((name) => `<strong>${name}</strong>`)
  );

  const content = messages[messageIndex]
    .replace("{name}", names)
    .replace("{title}", config.titles[chosenIndex]);

  canvas.tokens.releaseAll();
  canvas.tokens.placeables.forEach((token) =>
    token.setTarget(false, { releaseOthers: false })
  );
  tokens.forEach((token) => {
    token.control({ releaseOthers: false });
    token.setTarget(true, { releaseOthers: false });
  });

  await ChatMessage.create({
    content,
    speaker: ChatMessage.getSpeaker({ alias: config.names[chosenIndex] }),
    user: game.user.id,
    flags: { [MODULE_ID]: { avatar: config.avatars[chosenIndex] } },
  });
};

export const randomSelectToken = async () => {
  if (!game.user.isGM) return;

  const controlled = canvas.tokens.controlled;
  if (controlled.length < 1) {
    ui.notifications.warn("Select at least 1 token first.");
    return;
  }

  new TokenSelectionDialog(controlled).render(true);
};
