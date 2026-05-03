import { escapeHtml, slugify } from './utils.js';
import { parseInline } from './inline.js';
import { parseTable } from '../extensions/table.js';
import { parseAdmonition } from '../extensions/admonition.js';
import { parseTaskList } from '../extensions/tasklist.js';

const headingCounters = {};

function getHeadingId(text) {
  const slug = slugify(text);
  if (headingCounters[slug] === undefined) {
    headingCounters[slug] = 0;
  } else {
    headingCounters[slug]++;
  }
  return headingCounters[slug] === 0 ? slug : `${slug}-${headingCounters[slug]}`;
}

function parseBlock(markdown) {
  Object.keys(headingCounters).forEach(k => delete headingCounters[k]);

  const lines = markdown.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') { i++; continue; }

    if (/^`{3,}/.test(line)) {
      const fence = line.match(/^(`{3,})(.*)/);
      const lang = fence[2].trim();
      const fenceChar = fence[1];
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(fenceChar)) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: 'code', lang, content: codeLines.join('\n') });
      continue;
    }

    if (/^\${2}/.test(line)) {
      const mathLines = [];
      i++;
      while (i < lines.length && !/^\${2}/.test(lines[i])) {
        mathLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: 'math', content: mathLines.join('\n') });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, content: heading[2].trim() });
      i++;
      continue;
    }

    if (/^[-*_]{3,}$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    if (line.startsWith('> ') || line === '>') {
      const quoteLines = [];
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', content: quoteLines.join('\n') });
      continue;
    }

    if (/^\|.+\|/.test(line) && i + 1 < lines.length && /^\|[-| :]+\|$/.test(lines[i + 1])) {
      const tableLines = [];
      while (i < lines.length && /^\|.+\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'table', lines: tableLines });
      continue;
    }

    if (/^(\s*)([-*+]|\d+[.)]) /.test(line)) {
      const listLines = [];
      const indent = line.match(/^(\s*)/)[1].length;
      while (i < lines.length) {
        const curr = lines[i];
        if (curr.trim() === '') {
          if (i + 1 < lines.length && /^(\s*)([-*+]|\d+[.)]) /.test(lines[i + 1])) {
            listLines.push('');
            i++;
            continue;
          }
          break;
        }
        if (curr.trim() !== '' && !/^(\s*)([-*+]|\d+[.)]) /.test(curr) && curr.match(/^(\s*)/)[1].length <= indent && !/^\s+/.test(curr)) break;
        listLines.push(curr);
        i++;
      }
      const isOrdered = /^\s*\d+[.)] /.test(listLines[0]);
      blocks.push({ type: 'list', ordered: isOrdered, lines: listLines });
      continue;
    }

    if (/^<[a-zA-Z]/.test(line.trim())) {
      const htmlLines = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== '') {
        htmlLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'html', content: htmlLines.join('\n') });
      continue;
    }

    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,6}\s|`{3}|>|\||[-*_]{3,}$|\s*([-*+]|\d+\.)\s)/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      blocks.push({ type: 'paragraph', content: paraLines.join(' ') });
    }
  }

  return blocks.map(renderBlock).join('\n');
}

function renderBlock(block) {
  switch (block.type) {
    case 'heading': {
      const text = parseInline(block.content);
      const plain = block.content.replace(/[*_`~\[\]]/g, '');
      const id = getHeadingId(plain);
      return `<h${block.level} id="${id}"><a class="heading-anchor" href="#${id}" aria-hidden="true">#</a>${text}</h${block.level}>`;
    }
    case 'paragraph': {
      const admonition = parseAdmonition(block.content);
      if (admonition) return admonition;
      return `<p>${parseInline(block.content)}</p>`;
    }
    case 'code': {
      if (block.lang === 'mermaid') {
        return `<div class="mermaid-block"><pre>${escapeHtml(block.content)}</pre></div>`;
      }
      return `<pre class="code-block" data-lang="${escapeHtml(block.lang)}"><code class="language-${escapeHtml(block.lang)}">${escapeHtml(block.content)}</code></pre>`;
    }
    case 'math': {
      return `<div class="math-block">${escapeHtml(block.content)}</div>`;
    }
    case 'hr': {
      return `<hr>`;
    }
    case 'blockquote': {
      const admonitionHtml = parseAdmonition(block.content);
      if (admonitionHtml) return admonitionHtml;
      return `<blockquote>${parseBlock(block.content)}</blockquote>`;
    }
    case 'table': {
      return parseTable(block.lines);
    }
    case 'list': {
      return parseTaskList(block.lines, block.ordered);
    }
    case 'html': {
      return block.content;
    }
    default:
      return '';
  }
}

function parseList(lines, ordered) {
  const tag = ordered ? 'ol' : 'ul';
  const itemRegex = /^(\s*)([-*+]|\d+[.)]) (.*)/;
  const items = [];
  let current = null;

  for (const line of lines) {
    if (line.trim() === '') {
      if (current) current.content += '\n';
      continue;
    }
    const match = line.match(itemRegex);
    if (match) {
      if (current) items.push(current);
      current = { indent: match[1].length, content: match[3], children: [] };
    } else if (current) {
      current.content += ' ' + line.trim();
    }
  }
  if (current) items.push(current);

  let html = `<${tag}>`;
  for (const item of items) {
    html += `<li>${parseInline(item.content.trim())}</li>`;
  }
  html += `</${tag}>`;
  return html;
}

export { parseBlock };