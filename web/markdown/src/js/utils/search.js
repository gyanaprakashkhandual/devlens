let matches = [];
let currentIndex = 0;
let originalContent = '';

function initSearch(container) {
  const searchBar = document.querySelector('.search-bar');
  const searchInput = document.querySelector('.search-bar input');
  const searchCount = document.querySelector('.search-bar__count');
  const prevBtn = document.getElementById('search-prev');
  const nextBtn = document.getElementById('search-next');
  const closeBtn = document.getElementById('search-close');

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      searchBar.classList.add('open');
      searchInput.focus();
      searchInput.select();
    }
    if (e.key === 'Escape') {
      closeSearch(container, searchBar, searchInput, searchCount);
    }
    if (e.key === 'Enter' && searchBar.classList.contains('open')) {
      e.shiftKey ? goToPrev(searchCount) : goToNext(searchCount);
    }
  });

  searchInput.addEventListener('input', () => {
    performSearch(container, searchInput.value, searchCount);
  });

  prevBtn?.addEventListener('click', () => goToPrev(searchCount));
  nextBtn?.addEventListener('click', () => goToNext(searchCount));
  closeBtn?.addEventListener('click', () => closeSearch(container, searchBar, searchInput, searchCount));
}

function performSearch(container, query, countEl) {
  clearHighlights(container);
  matches = [];
  currentIndex = 0;

  if (!query.trim()) {
    updateCount(countEl, 0, 0);
    return;
  }

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while (node = walker.nextNode()) {
    if (!node.parentElement.closest('script,style,.code-block__toolbar')) {
      nodes.push(node);
    }
  }

  const regex = new RegExp(escapeRegex(query), 'gi');

  nodes.forEach(textNode => {
    const text = textNode.textContent;
    const parent = textNode.parentNode;
    if (!regex.test(text)) return;
    regex.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let last = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      const mark = document.createElement('mark');
      mark.className = 'search-highlight';
      mark.textContent = match[0];
      frag.appendChild(mark);
      matches.push(mark);
      last = match.index + match[0].length;
    }
    frag.appendChild(document.createTextNode(text.slice(last)));
    parent.replaceChild(frag, textNode);
  });

  if (matches.length) {
    highlightCurrent();
    updateCount(countEl, 1, matches.length);
  } else {
    updateCount(countEl, 0, 0);
  }
}

function goToNext(countEl) {
  if (!matches.length) return;
  currentIndex = (currentIndex + 1) % matches.length;
  highlightCurrent();
  updateCount(countEl, currentIndex + 1, matches.length);
}

function goToPrev(countEl) {
  if (!matches.length) return;
  currentIndex = (currentIndex - 1 + matches.length) % matches.length;
  highlightCurrent();
  updateCount(countEl, currentIndex + 1, matches.length);
}

function highlightCurrent() {
  matches.forEach((m, i) => m.style.outline = i === currentIndex ? '2px solid orange' : '');
  matches[currentIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearHighlights(container) {
  container.querySelectorAll('.search-highlight').forEach(el => {
    const text = document.createTextNode(el.textContent);
    el.parentNode.replaceChild(text, el);
  });
  container.normalize();
}

function closeSearch(container, bar, input, countEl) {
  bar.classList.remove('open');
  input.value = '';
  clearHighlights(container);
  matches = [];
  updateCount(countEl, 0, 0);
}

function updateCount(el, current, total) {
  if (!el) return;
  el.textContent = total ? `${current} / ${total}` : total === 0 && current === 0 ? 'No results' : '';
  if (current === 0 && total === 0) setTimeout(() => { el.textContent = ''; }, 2000);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export { initSearch };