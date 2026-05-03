function parseFootnotes(text) {
  const definitions = [];
  const defMap = {};

  const cleaned = text.replace(/^\[\^([^\]]+)\]:\s*(.+)$/gm, (_, key, val) => {
    defMap[key] = val.trim();
    return '';
  });

  let counter = 0;
  const result = cleaned.replace(/\[\^([^\]]+)\]/g, (_, key) => {
    counter++;
    if (!defMap[key]) defMap[key] = key;
    definitions.push(defMap[key]);
    return `<sup><a class="footnote-ref" id="fnref-${counter}" href="#fn-${counter}" aria-label="Footnote ${counter}">[${counter}]</a></sup>`;
  });

  const orderedDefs = [];
  let c2 = 0;
  result.replace(/\[\^([^\]]+)\]/g, (_, key) => {
    c2++;
    orderedDefs.push(defMap[key] || key);
  });

  return { text: result, definitions: orderedDefs };
}

export { parseFootnotes };