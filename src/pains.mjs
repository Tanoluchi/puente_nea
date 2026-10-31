// The pains band scrolls slowly in one row; a hidden copy of the chips makes the loop seamless.
// Moving content longer than 5 s must be pausable (WCAG 2.2.2): hover and keyboard focus pause it
// in CSS, and on touch screens a tap pauses and resumes.
const band = document.querySelector('.pains-band');
const track = document.getElementById('pains-track');
const viewport = band?.querySelector('.pains-viewport');

if (band && track && viewport && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  [...track.children].forEach(item => {
    const copy = item.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.append(copy);
  });
  band.classList.add('is-moving');
  viewport.addEventListener('click', () => {
    if (matchMedia('(hover: none)').matches) band.classList.toggle('is-paused');
  });
}
