function highlightHTML(code) {
  let result = escapeHtml(code);

  result = result.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>');
  result = result.replace(/(&lt;!DOCTYPE[^&]*&gt;)/gi, '<span class="hl-keyword">$1</span>');
  result = result.replace(
    /(&lt;\/?)([\w-]+)((?:\s+[\w:-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s&>]+))?)*\s*\/?)(&gt;)/g,
    (_, open, tag, attrs, close) => {
      const highlightedAttrs = attrs.replace(
        /(\s+)([\w:-]+)(\s*=\s*)("([^"]*)"|'([^']*)'|([^\s&>]+))/g,
        (_, sp, name, eq, val) => `${sp}<span class="hl-attr">${name}</span>${eq}<span class="hl-value">${val}</span>`
      );
      return `${open}<span class="hl-tag">${tag}</span>${highlightedAttrs}${close}`;
    }
  );

  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export { highlightHTML };