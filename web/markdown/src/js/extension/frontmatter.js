function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { meta: null, body: raw };

  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { meta: null, body: raw };

  const yamlBlock = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trim();
  const meta = {};

  for (const line of yamlBlock.split('\n')) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      meta[key] = val;
    }
  }

  return { meta, body };
}

function renderFrontmatter(meta) {
  if (!meta || Object.keys(meta).length === 0) return '';
  const rows = Object.entries(meta)
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join('');
  return `<div class="frontmatter-card"><table><tbody>${rows}</tbody></table></div>`;
}

export { parseFrontmatter, renderFrontmatter };