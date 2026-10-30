import { attachDemos } from './demos.mjs';

const menu = document.querySelector('.menu-toggle');
const links = document.querySelector('.nav-links');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  links.classList.toggle('open', open);
});
links.addEventListener('click', event => {
  if (event.target.closest('a')) {
    menu.setAttribute('aria-expanded', 'false');
    links.classList.remove('open');
  }
});

document.querySelectorAll('[data-hotspot]').forEach(button => {
  button.setAttribute('aria-label', button.dataset.hotspot);
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-hotspot]').forEach(other => other.setAttribute('aria-pressed', String(button === other)));
    document.querySelector('#hotspot-note').textContent = button.dataset.hotspot;
  });
});

attachDemos(document);
