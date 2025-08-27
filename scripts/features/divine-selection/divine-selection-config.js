import { MODULE_ID } from "../../core/const.js";
import { DeityConfigForm } from "./deity-config.js";
import { MessageConfigForm } from "./message-config.js";

export class DivineSelectionConfig extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: "divine-selection-config",
    tag: "dialog",
    window: { title: "Configure Divine Selection", resizable: false },
    position: { width: 400, height: "auto" },
    actions: {
      openDeityConfig: DivineSelectionConfig.prototype._onOpenDeityConfig,
      openMessageConfig: DivineSelectionConfig.prototype._onOpenMessageConfig,
    },
  };

  static PARTS = {
    form: {
      template: `modules/${MODULE_ID}/templates/divine-selection-config.hbs`,
    },
  };

  async _onOpenDeityConfig() {
    new DeityConfigForm().render(true);
  }

  async _onOpenMessageConfig() {
    new MessageConfigForm().render(true);
  }
}
