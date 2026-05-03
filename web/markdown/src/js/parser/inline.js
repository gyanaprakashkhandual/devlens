import { escapeHtml } from './utils.js';
import { emojiMap } from '../extensions/emoji.js';

function parseInline(text) {
  let result = text;

  result = result.replace(/\\([\\`*_{}\[\]()#+\-.!~^=|>])/g, (_, ch) => `&#x200B;ESCAPED_${ch.charCodeAt(0)}_END`);

  result = result.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);

  result = result.replace(/\$([^$\n]+)\$/g, (_, math) => `<span class="math-inline">${escapeHtml(math)}</span>`);

  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const [url, ...titleParts] = src.split(/ "(.+)"$/);
    const title = titleParts.length ? ` title="${escapeHtml(titleParts.join(''))}"` : '';
    return `<img src="${escapeHtml(url.trim())}" alt="${escapeHtml(alt)}"${title}>`;
  });

  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, href) => {
    const match = href.match(/^([^"]+?)(?:\s+"([^"]*)")?$/);
    const url = match ? match[1].trim() : href;
    const title = match && match[2] ? ` title="${escapeHtml(match[2])}"` : '';
    const isExternal = /^https?:\/\//.test(url);
    const rel = isExternal ? ' rel="noopener noreferrer"' : '';
    const target = isExternal ? ' target="_blank"' : '';
    return `<a href="${escapeHtml(url)}"${title}${rel}${target}>${parseInlineNoLinks(linkText)}</a>`;
  });

  result = result.replace(/<(https?:\/\/[^>]+)>/g, (_, url) => {
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
  });

  result = result.replace(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g, (_, email) => {
    return `<a href="mailto:${email}">${email}</a>`;
  });

  result = result.replace(/\*\*\*([^*]+)\*\*\*/g, (_, t) => `<strong><em>${t}</em></strong>`);
  result = result.replace(/___([^_]+)___/g, (_, t) => `<strong><em>${t}</em></strong>`);
  result = result.replace(/\*\*([^*]+)\*\*/g, (_, t) => `<strong>${t}</strong>`);
  result = result.replace(/__([^_]+)__/g, (_, t) => `<strong>${t}</strong>`);
  result = result.replace(/\*([^*\n]+)\*/g, (_, t) => `<em>${t}</em>`);
  result = result.replace(/_([^_\n]+)_/g, (_, t) => `<em>${t}</em>`);

  result = result.replace(/~~([^~]+)~~/g, (_, t) => `<del>${t}</del>`);

  result = result.replace(/==([^=]+)==/g, (_, t) => `<mark>${t}</mark>`);

  result = result.replace(/\^([^^]+)\^/g, (_, t) => `<sup>${t}</sup>`);

  result = result.replace(/~([^~]+)~/g, (_, t) => `<sub>${t}</sub>`);

  result = result.replace(/<kbd>([^<]+)<\/kbd>/g, (_, t) => `<kbd>${escapeHtml(t)}</kbd>`);

  result = result.replace(/:([a-z0-9_+-]+):/g, (match, code) => {
    return emojiMap[code] ? `<span class="emoji" title=":${code}:">${emojiMap[code]}</span>` : match;
  });

  result = result.replace(/  \n/g, '<br>');
  result = result.replace(/\\\n/g, '<br>');

  result = result.replace(/&#x200B;ESCAPED_(\d+)_END/g, (_, code) => escapeHtml(String.fromCharCode(parseInt(code))));

  return result;
}

function parseInlineNoLinks(text) {
  let result = text;
  result = result.replace(/\*\*([^*]+)\*\*/g, (_, t) => `<strong>${t}</strong>`);
  result = result.replace(/\*([^*\n]+)\*/g, (_, t) => `<em>${t}</em>`);
  result = result.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);
  return result;
}

export { parseInline };