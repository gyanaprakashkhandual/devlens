function initFileLoader(onLoad) {
  const input = document.getElementById('file-input');
  const dropOverlay = document.querySelector('.drop-overlay');

  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) readFile(file, onLoad);
    input.value = '';
  });

  document.addEventListener('dragenter', e => {
    e.preventDefault();
    if (hasMarkdownFile(e.dataTransfer)) {
      dropOverlay.classList.add('active');
    }
  });

  document.addEventListener('dragover', e => {
    e.preventDefault();
  });

  document.addEventListener('dragleave', e => {
    if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
      dropOverlay.classList.remove('active');
    }
  });

  document.addEventListener('drop', e => {
    e.preventDefault();
    dropOverlay.classList.remove('active');
    const file = e.dataTransfer.files[0];
    if (file && isMarkdownFile(file)) {
      readFile(file, onLoad);
    }
  });
}

function readFile(file, onLoad) {
  const reader = new FileReader();
  reader.onload = e => onLoad(e.target.result, file.name);
  reader.readAsText(file, 'UTF-8');
}

function isMarkdownFile(file) {
  return /\.(md|markdown|txt|mdx)$/i.test(file.name) || file.type === 'text/markdown' || file.type === 'text/plain';
}

function hasMarkdownFile(dt) {
  if (!dt || !dt.items) return false;
  return Array.from(dt.items).some(item => item.kind === 'file');
}

export { initFileLoader };