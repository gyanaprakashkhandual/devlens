import { parseInline } from '../parser/inline.js';

function parseTable(lines) {
  const headers = splitCells(lines[0]);
  const alignRow = lines[1];
  const aligns = splitCells(alignRow).map(cell => {
    const c = cell.trim();
    if (c.startsWith(':') && c.endsWith(':')) return 'center';
    if (c.endsWith(':')) return 'right';
    return 'left';
  });

  const headerHtml = headers.map((h, i) => {
    const align = aligns[i] || 'left';
    return `<th align="${align}">${parseInline(h.trim())}</th>`;
  }).join('');

  const bodyLines = lines.slice(2);
  const bodyHtml = bodyLines.map(line => {
    const cells = splitCells(line);
    const tds = cells.map((cell, i) => {
      const align = aligns[i] || 'left';
      return `<td align="${align}">${parseInline(cell.trim())}</td>`;
    }).join('');
    return `<tr>${tds}</tr>`;
  }).join('');

  return `<div class="table-wrapper"><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
}

function splitCells(row) {
  return row.replace(/^\||\|$/g, '').split('|');
}

export { parseTable };