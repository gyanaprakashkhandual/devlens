const BASH_KEYWORDS = /\b(if|then|else|elif|fi|for|while|do|done|case|esac|in|function|return|exit|break|continue|local|export|readonly|declare|typeset|source|alias|unalias|echo|printf|read|test|true|false|set|unset|shift|getopts|trap|wait|eval|exec)\b/g;
const BASH_BUILTINS = /\b(ls|cd|pwd|mkdir|rmdir|rm|cp|mv|cat|head|tail|grep|sed|awk|find|sort|uniq|wc|cut|tr|chmod|chown|chgrp|ln|touch|which|whereis|type|file|stat|du|df|ps|kill|killall|top|htop|ping|curl|wget|ssh|scp|rsync|git|npm|pip|python|node|ruby|perl|make|cmake|gcc|clang|tar|zip|unzip|gzip|gunzip|sudo|su|env|printenv|history|man|help|clear|reset)\b/g;

function highlightBash(code) {
  let result = escapeHtml(code);

  result = result.replace(/(#[^\n]*)/g, '<span class="hl-comment">$1</span>');
  result = result.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="hl-string">$1</span>');
  result = result.replace(/(\$\{[\w:?+=/-]*\}|\$[\w@#?$!0-9*-]+)/g, '<span class="hl-variable">$1</span>');
  result = result.replace(BASH_KEYWORDS, '<span class="hl-keyword">$1</span>');
  result = result.replace(BASH_BUILTINS, '<span class="hl-builtin">$1</span>');
  result = result.replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>');
  result = result.replace(/(&&|\|\||[|&;<>])/g, '<span class="hl-operator">$1</span>');
  result = result.replace(/^(\s*)([\w-]+)(?=\s*\()/gm, '$1<span class="hl-function">$2</span>');
  result = result.replace(/(--?[\w-]+)/g, '<span class="hl-attr">$1</span>');

  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export { highlightBash };