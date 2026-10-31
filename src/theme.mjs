// The <head> script already set data-theme before paint; this only wires the nav toggle.
const root = document.documentElement;
const buttons = document.querySelectorAll('.theme-toggle');
const sync = () => buttons.forEach(button => button.setAttribute('aria-pressed', String(root.dataset.theme === 'dark')));

sync();
buttons.forEach(button => button.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch { /* storage blocked: the choice lasts for this page only */ }
  sync();
}));
