const STORAGE_KEY = 'md-reader-theme';

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(saved || preferred);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function getTheme() {
  return document.documentElement.getAttribute('data-theme');
}

export { initTheme, toggleTheme, getTheme };