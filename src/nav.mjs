// Below 900px the section links live behind the menu button (disclosure pattern).
const nav = document.querySelector('.nav');
const button = nav?.querySelector('.menu-toggle');
const menu = document.getElementById('nav-menu');

if (button && menu) {
  const set = open => { button.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); };
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => { if (event.target.closest('a')) set(false); });
  document.addEventListener('click', event => { if (nav.classList.contains('open') && !nav.contains(event.target)) set(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) { set(false); button.focus(); }
  });
  matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) set(false); });
}
