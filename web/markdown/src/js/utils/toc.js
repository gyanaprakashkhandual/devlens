let observer = null;

function buildTOC(container, sidebar) {
  const headings = container.querySelectorAll('h1, h2, h3');
  const list = sidebar.querySelector('.toc-list');
  const empty = sidebar.querySelector('.sidebar__empty');

  if (!list) return;

  list.innerHTML = '';

  if (headings.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  headings.forEach(h => {
    const level = parseInt(h.tagName[1]);
    const text = h.textContent.replace('#', '').trim();
    const id = h.id;

    const item = document.createElement('li');
    item.className = `toc-item toc-item--h${level}`;

    const link = document.createElement('a');
    link.href = `#${id}`;
    link.className = 'toc-link';
    link.textContent = text;

    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', `#${id}`);
      }
      if (window.innerWidth <= 900) {
        sidebar.classList.remove('open');
        document.querySelector('.sidebar__overlay')?.classList.remove('visible');
      }
    });

    item.appendChild(link);
    list.appendChild(item);
  });

  setupScrollSpy(headings, list);
}

function setupScrollSpy(headings, list) {
  if (observer) observer.disconnect();

  const links = list.querySelectorAll('.toc-link');
  const headingIds = Array.from(headings).map(h => h.id);

  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, {
    rootMargin: '-10% 0px -80% 0px',
    threshold: 0
  });

  headings.forEach(h => observer.observe(h));
}

function clearTOC(sidebar) {
  const list = sidebar.querySelector('.toc-list');
  const empty = sidebar.querySelector('.sidebar__empty');
  if (list) list.innerHTML = '';
  if (empty) empty.style.display = 'block';
  if (observer) { observer.disconnect(); observer = null; }
}

export { buildTOC, clearTOC };