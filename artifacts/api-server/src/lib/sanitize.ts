import sanitizeHtml from "sanitize-html";

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeText(input: string, maxLength = 10000): string {
  const trimmed = input.trim().slice(0, maxLength);
  return sanitizeHtml(trimmed, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "recursiveEscape",
  });
}

export function sanitizeForEmail(input: string): string {
  return escapeHtml(sanitizeText(input));
}
