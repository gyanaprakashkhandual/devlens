const CSS_PROPS = /\b(align-items|align-content|align-self|animation|appearance|background|border|bottom|box-shadow|box-sizing|color|content|cursor|display|fill|flex|float|font|gap|grid|height|justify|left|letter-spacing|line-height|list-style|margin|max-height|max-width|min-height|min-width|object-fit|opacity|outline|overflow|padding|pointer-events|position|resize|right|stroke|text|top|transform|transition|user-select|vertical-align|visibility|white-space|width|word-break|z-index)[-\w]*/g;

function highlightCSS(code) {
  let result = escapeHtml(code);

  result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
  result = result.replace(/(@[\w-]+)/g, '<span class="hl-keyword">$1</span>');
  result = result.replace(/([.#]?[\w-]+(?:\s*[+>~]\s*[\w-]+)*)\s*(?=\{)/g, '<span class="hl-selector">$1</span>');
  result = result.replace(CSS_PROPS, '<span class="hl-property">$&</span>');
  result = result.replace(/:\s*(#[\da-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g, ': <span class="hl-value">$1</span>');
  result = result.replace(/:\s*(\d+\.?\d*(?:px|em|rem|vh|vw|%|s|ms|deg|fr)?)\b/g, ': <span class="hl-number">$1</span>');
  result = result.replace(/:\s*("([^"]*)"|'([^']*)')/g, ': <span class="hl-string">$1</span>');
  result = result.replace(/\b(inherit|initial|unset|auto|none|normal|bold|italic|flex|grid|block|inline|absolute|relative|fixed|sticky)\b/g, '<span class="hl-builtin">$1</span>');
  result = result.replace(/(--[\w-]+)/g, '<span class="hl-variable">$1</span>');

  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export { highlightCSS };