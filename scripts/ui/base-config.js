import { MODULE_ID } from "../core/const.js";
import { createFormContainer } from "./form-utils.js";

export class BaseConfigForm extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    tag: "form",
    window: { resizable: false },
    position: { width: 800, height: 600 },
  };

  static PARTS = { form: {} };

  constructor() {
    super();
    this.emptySlotCount = 5;
  }

  async _renderHTML() {
    return { form: this._prepareHTML() };
  }

  async _replaceHTML(result, content) {
    content.innerHTML = result.form;
  }

  _onRender() {
    super._onRender();
    if (this.tempFormData) {
      setTimeout(() => {
        Object.entries(this.tempFormData).forEach(([key, value]) => {
          const element = this.element.querySelector(`[name="${key}"]`);
          if (element) element.value = value;
        });
        this.tempFormData = null;
      }, 10);
    }
  }

  async _onAddMore(event, target) {
    const form = target.closest("form");
    const inputs = form.querySelectorAll(this._getInputSelector());
    const emptyCount = Array.from(inputs).filter(
      (input) => !input.value.trim()
    ).length;

    if (emptyCount > 0) {
      ui.notifications.warn("Please fill all empty fields before adding more.");
      return;
    }

    this._preserveFormData(form);
    this.emptySlotCount += 5;
    this.render();
  }

  _preserveFormData(form) {
    const formData = new FormData(form);
    this.tempFormData = {};
    for (const [key, value] of formData.entries()) {
      if (value.trim()) this.tempFormData[key] = value;
    }
  }

  _createFooterButtons(saveLabel) {
    return `
      <button type="button" data-action="addMore" style="margin-right: 10px;">Add 5 More</button>
      <button type="button" data-action="save">${saveLabel}</button>
    `;
  }

  async _onSave(event, target) {
    const form = target.closest("form");
    const formData = new FormData(form);
    const result = this._processSaveData(formData);

    if (result.error) {
      ui.notifications.warn(result.error);
      return;
    }

    await game.settings.set(MODULE_ID, result.settingKey, result.data);
    this.emptySlotCount = 5;
    this.close();
  }

  _prepareHTML() {
    throw new Error("Must implement _prepareHTML");
  }
  _getInputSelector() {
    throw new Error("Must implement _getInputSelector");
  }
  _processSaveData(formData) {
    throw new Error("Must implement _processSaveData");
  }
}
