import { parseBlock } from './block.js';
import { sanitize } from './sanitizer.js';
import { parseFrontmatter } from '../extensions/frontmatter.js';
import { parseFootnotes } from '../extensions/footnotes.js';

function parse(raw) {
  const { meta, body } = parseFrontmatter(raw);
  const { text, definitions } = parseFootnotes(body);
  let html = parseBlock(text);
  if (definitions.length) {
    html += renderFootnoteDefs(definitions);
  }
  const safe = sanitize(html);
  return { html: safe, meta };
}

function renderFootnoteDefs(defs) {
  const items = defs.map((d, i) =>
    `<li id="fn-${i + 1}">${d} <a class="footnote-backref" href="#fnref-${i + 1}" aria-label="Back to content">↩</a></li>`
  ).join('');
  return `<section class="footnotes"><p class="footnotes-title">Footnotes</p><ol>${items}</ol></section>`;
}

export { parse };