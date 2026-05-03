const ADMONITION_TYPES = {
  'NOTE':      { icon: 'ℹ', label: 'Note' },
  'TIP':       { icon: '💡', label: 'Tip' },
  'IMPORTANT': { icon: '❗', label: 'Important' },
  'WARNING':   { icon: '⚠', label: 'Warning' },
  'DANGER':    { icon: '🔥', label: 'Danger' },
  'CAUTION':   { icon: '⚠', label: 'Caution' },
};

function parseAdmonition(content) {
  const match = content.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|DANGER|CAUTION)\]\s*([\s\S]*)/i);
  if (!match) return null;

  const type = match[1].toUpperCase();
  const body = match[2].trim();
  const info = ADMONITION_TYPES[type] || { icon: 'ℹ', label: type };

  return `<div class="admonition admonition--${type.toLowerCase()}">
    <div class="admonition__title">
      <span>${info.icon}</span>
      <span>${info.label}</span>
    </div>
    <div class="admonition__body">${body}</div>
  </div>`;
}

export { parseAdmonition };