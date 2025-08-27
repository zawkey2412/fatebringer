import { MODULE_ID } from "./const.js";

let debounceTimer = null;

const updateAvatar = (messageId, avatar) => {
  const img = document.querySelector(
    `[data-message-id="${messageId}"] .message-sender img`
  );
  if (img && img.src !== avatar) {
    img.src = avatar;
    img.style.display = "block";
  }
};

export function initializeChatAvatars() {
  Hooks.on("renderChatMessage", (message) => {
    const avatar = message.flags?.[MODULE_ID]?.avatar;
    if (!avatar) return;

    updateAvatar(message.id, avatar);
    setTimeout(() => updateAvatar(message.id, avatar), 50);
    setTimeout(() => updateAvatar(message.id, avatar), 200);
  });

  Hooks.on("renderChatLog", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const messages = game.messages.contents;
      for (let i = 0; i < messages.length; i++) {
        const avatar = messages[i].flags?.[MODULE_ID]?.avatar;
        if (avatar) updateAvatar(messages[i].id, avatar);
      }
    }, 100);
  });
}
