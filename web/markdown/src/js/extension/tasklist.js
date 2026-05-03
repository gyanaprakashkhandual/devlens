import { parseInline } from '../parser/inline.js';

function parseTaskList(lines, ordered) {
  const hasTask = lines.some(l => /^\s*[-*+] \[[ xX]\]/.test(l));
  if (hasTask) return buildTaskList(lines);
  return buildList(lines, ordered);
}

function buildTaskList(lines) {
  const items = [];
  let current = null;

  for (const line of lines) {
    if (line.trim() === '') continue;
    const match = line.match(/^(\s*)[-*+] \[( |x|X)\] (.*)$/);
    if (match) {
      if (current) items.push(current);
      current = {
        checked: match[2].toLowerCase() === 'x',
        content: match[3],
        indent: match[1].length,
        children: []
      };
    } else if (current && /^\s{2,}/.test(line)) {
      current.children.push(line.trim());
    } else {
      const plain = line.match(/^(\s*)[-*+] (.*)$/);
      if (plain) {
        if (current) items.push(current);
        current = { checked: false, content: plain[2], indent: plain[1].length, children: [], plain: true };
      }
    }
  }
  if (current) items.push(current);

  const liItems = items.map(item => {
    const checkedClass = item.checked ? ' checked' : '';
    const checkbox = item.plain ? '' : `<input type="checkbox" class="task-checkbox" ${item.checked ? 'checked' : ''} disabled>`;
    return `<li class="task-item${checkedClass}">${checkbox}<span>${parseInline(item.content)}</span></li>`;
  }).join('');

  return `<ul class="task-list">${liItems}</ul>`;
}

function buildList(lines, ordered) {
  const tag = ordered ? 'ol' : 'ul';
  const itemRegex = /^(\s*)([-*+]|\d+[.)]) (.*)/;
  const root = { children: [], indent: -1 };
  const stack = [root];

  for (const line of lines) {
    if (line.trim() === '') continue;
    const match = line.match(itemRegex);
    if (!match) continue;

    const indent = match[1].length;
    const content = match[3];
    const node = { content, indent, children: [] };

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  function render(node, depth) {
    if (!node.children.length) return '';
    const t = (ordered && depth === 0) ? 'ol' : 'ul';
    const items = node.children.map(child => {
      const nested = child.children.length ? render(child, depth + 1) : '';
      return `<li>${parseInline(child.content)}${nested}</li>`;
    }).join('');
    return `<${t}>${items}</${t}>`;
  }

  return render(root, 0);
}

export { parseTaskList };