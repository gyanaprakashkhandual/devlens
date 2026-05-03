const PY_KEYWORDS = /\b(False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/g;
const PY_BUILTINS = /\b(abs|all|any|bin|bool|bytearray|bytes|callable|chr|classmethod|compile|complex|delattr|dict|dir|divmod|enumerate|eval|exec|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip)\b/g;

function highlightPython(code) {
  let result = escapeHtml(code);

  result = result.replace(/(#[^\n]*)/g, '<span class="hl-comment">$1</span>');
  result = result.replace(/("""[\s\S]*?"""|\'\'\'[\s\S]*?\'\'\')/g, '<span class="hl-string">$1</span>');
  result = result.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="hl-string">$1</span>');
  result = result.replace(/\b(\d+\.?\d*(?:e[+-]?\d+)?|0x[\da-fA-F]+|0b[01]+|0o[0-7]+)\b/g, '<span class="hl-number">$1</span>');
  result = result.replace(PY_KEYWORDS, '<span class="hl-keyword">$1</span>');
  result = result.replace(PY_BUILTINS, '<span class="hl-builtin">$1</span>');
  result = result.replace(/\bdef\s+([a-zA-Z_]\w*)/g, 'def <span class="hl-function">$1</span>');
  result = result.replace(/\bclass\s+([a-zA-Z_]\w*)/g, 'class <span class="hl-type">$1</span>');
  result = result.replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g, '<span class="hl-function">$1</span>');
  result = result.replace(/@([a-zA-Z_]\w*)/g, '<span class="hl-attr">@$1</span>');

  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export { highlightPython };