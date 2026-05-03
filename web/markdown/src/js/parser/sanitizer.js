const ALLOWED_TAGS = new Set([
  'a','abbr','b','blockquote','br','caption','cite','code','col','colgroup',
  'dd','del','details','dfn','div','dl','dt','em','figure','figcaption',
  'h1','h2','h3','h4','h5','h6','hr','i','img','ins','kbd','li','mark',
  'ol','p','pre','q','s','section','small','span','strong','sub','summary',
  'sup','table','tbody','td','tfoot','th','thead','tr','u','ul','video',
  'audio','source','iframe'
]);

const ALLOWED_ATTRS = {
  'a':       ['href','title','target','rel'],
  'img':     ['src','alt','title','width','height','align'],
  'video':   ['src','controls','width','height','autoplay','loop','muted','poster'],
  'audio':   ['src','controls','autoplay','loop','muted'],
  'source':  ['src','type'],
  'iframe':  ['src','width','height','frameborder','allowfullscreen','allow','title'],
  'td':      ['align','colspan','rowspan'],
  'th':      ['align','colspan','rowspan','scope'],
  'col':     ['span','width'],
  'details': ['open'],
  '*':       ['id','class','title','data-lang','align']
};

function sanitize(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}

function sanitizeNode(node) {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        const frag = document.createDocumentFragment();
        while (child.firstChild) frag.appendChild(child.firstChild);
        node.replaceChild(frag, child);
        continue;
      }
      const allowed = [...(ALLOWED_ATTRS[tag] || []), ...(ALLOWED_ATTRS['*'] || [])];
      const attrs = Array.from(child.attributes);
      for (const attr of attrs) {
        if (!allowed.includes(attr.name)) {
          child.removeAttribute(attr.name);
        }
        if (attr.name === 'href' || attr.name === 'src') {
          const val = attr.value.trim().toLowerCase();
          if (val.startsWith('javascript:') || val.startsWith('data:text')) {
            child.removeAttribute(attr.name);
          }
        }
      }
      sanitizeNode(child);
    }
  }
}

export { sanitize };