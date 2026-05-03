const JS_KEYWORDS = /\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|of|return|static|super|switch|this|throw|try|typeof|var|void|while|with|yield|async|await|from|as|interface|type|enum|implements|declare|abstract|namespace|module|keyof|infer|never|unknown|any|boolean|number|string|symbol|object|undefined|null|true|false)\b/g;

const JS_BUILTINS = /\b(Array|Object|String|Number|Boolean|RegExp|Date|Math|JSON|Promise|Set|Map|WeakMap|WeakSet|Symbol|Proxy|Reflect|Error|TypeError|RangeError|console|document|window|process|module|require|exports|globalThis|setTimeout|setInterval|clearTimeout|clearInterval|fetch|URL|URLSearchParams|FormData|Blob|File|Event|EventTarget|Node|Element|HTMLElement|parseInt|parseFloat|isNaN|isFinite|encodeURIComponent|decodeURIComponent)\b/g;

function highlightJS(code) {
  let result = escapeHtml(code);

  result = result.replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>');
  result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
  result = result.replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="hl-string">$1</span>');
  result = result.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-string">$1</span>');
  result = result.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-string">$1</span>');
  result = result.replace(/(\/(?:[^/\\\n]|\\.)+\/[gimsuy]*)/g, '<span class="hl-regex">$1</span>');
  result = result.replace(/\b(\d+\.?\d*(?:e[+-]?\d+)?|0x[\da-fA-F]+|0b[01]+|0o[0-7]+)\b/g, '<span class="hl-number">$1</span>');
  result = result.replace(JS_KEYWORDS, '<span class="hl-keyword">$1</span>');
  result = result.replace(JS_BUILTINS, '<span class="hl-builtin">$1</span>');
  result = result.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, '<span class="hl-function">$1</span>');

  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export { highlightJS };