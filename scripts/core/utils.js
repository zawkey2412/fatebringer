import { COLORS } from "./const.js";

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function formatTokenNames(tokens) {
  if (tokens.length === 1) return tokens[0];
  if (tokens.length === 2) return tokens.join(" and ");
  return tokens.slice(0, -1).join(", ") + ", and " + tokens[tokens.length - 1];
}

export function getColors(isCrit) {
  return isCrit ? COLORS.CRIT : COLORS.FUMBLE;
}

export function createStyledCard(title, colors, content) {
  return `<div style="border: 2px solid ${colors.border}; padding: 10px; margin: 5px; border-radius: 5px; background: rgba(${colors.bg}, 0.1);">
    <h4 style="text-align: center; margin: 0 0 10px 0;">${title}</h4>
    ${content}
  </div>`;
}

export function sanitizeText(text) {
  return text.replace(/[<>"'&]/g, "");
}
