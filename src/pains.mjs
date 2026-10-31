// The pains band scrolls slowly in one row; a hidden copy of the chips makes the loop seamless.
const band = document.querySelector('.pains-band');
const track = document.getElementById('pains-track');
const toggle = band?.querySelector('.pains-toggle');

if (band && track && toggle && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  [...track.children].forEach(item => {
    const copy = item.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.append(copy);
  });
  band.classList.add('is-moving');
  // moving content longer than 5 s needs a pause control (WCAG 2.2.2); hover alone misses touch and keyboard
  toggle.addEventListener('click', () => {
    toggle.setAttribute('aria-pressed', String(band.classList.toggle('is-paused')));
  });
}
