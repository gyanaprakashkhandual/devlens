function highlightJSON(code) {
  let result = escapeHtml(code);

  result = result.replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="hl-property">$1</span>:');
  result = result.replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="hl-string">$1</span>');
  result = result.replace(/\b(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, '<span class="hl-number">$1</span>');
  result = result.replace(/\b(true|false)\b/g, '<span class="hl-boolean">$1</span>');
  result = result.replace(/\b(null)\b/g, '<span class="hl-null">$1</span>');
  result = result.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');

  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export { highlightJSON };