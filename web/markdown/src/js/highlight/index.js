import { highlightJS } from './languages/javascript.js';
import { highlightPython } from './languages/python.js';
import { highlightHTML } from './languages/html.js';
import { highlightCSS } from './languages/css.js';
import { highlightBash } from './languages/bash.js';
import { highlightJSON } from './languages/json.js';
import { highlightGeneric } from './languages/generic.js';

const LANG_MAP = {
  'javascript': highlightJS, 'js': highlightJS,
  'typescript': highlightJS, 'ts': highlightJS,
  'jsx': highlightJS, 'tsx': highlightJS,
  'python': highlightPython, 'py': highlightPython,
  'html': highlightHTML, 'xml': highlightHTML, 'svg': highlightHTML,
  'css': highlightCSS, 'scss': highlightCSS, 'sass': highlightCSS,
  'bash': highlightBash, 'sh': highlightBash, 'shell': highlightBash,
  'zsh': highlightBash, 'fish': highlightBash,
  'json': highlightJSON, 'jsonc': highlightJSON,
};

function highlight(code, lang) {
  const fn = LANG_MAP[lang.toLowerCase()] || highlightGeneric;
  try { return fn(code); } catch { return escapeForHighlight(code); }
}

function escapeForHighlight(code) {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function applyHighlighting(container) {
  const blocks = container.querySelectorAll('pre.code-block');
  blocks.forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;

    const lang = pre.dataset.lang || '';
    const rawCode = code.textContent;
    const highlighted = highlight(rawCode, lang);
    const lines = highlighted.split('\n');
    const showLines = lines.length > 3;

    const toolbar = document.createElement('div');
    toolbar.className = 'code-block__toolbar';

    const langBadge = document.createElement('span');
    langBadge.className = 'code-block__lang';
    langBadge.textContent = lang || 'text';

    const actions = document.createElement('div');
    actions.className = 'code-block__actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-block__copy';
    copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(rawCode).then(() => {
        copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
          copyBtn.classList.remove('copied');
        }, 2000);
      });
    });

    actions.appendChild(copyBtn);
    toolbar.appendChild(langBadge);
    toolbar.appendChild(actions);

    const body = document.createElement('div');
    body.className = 'code-block__body';

    if (showLines) {
      body.classList.add('code-block--lined');
      const lineHtml = lines.map((line, i) =>
        `<div class="code-line"><span class="code-line__num">${i + 1}</span><span class="code-line__content">${line || ' '}</span></div>`
      ).join('');
      body.innerHTML = `<code class="language-${lang}">${lineHtml}</code>`;
    } else {
      body.innerHTML = `<code class="language-${lang}">${highlighted}</code>`;
    }

    pre.innerHTML = '';
    pre.classList.remove('code-block');
    pre.className = 'code-block';
    pre.appendChild(toolbar);
    pre.appendChild(body);
  });
}

export { highlight, applyHighlighting };