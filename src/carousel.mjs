// Services carousel: native scroll-snap row driven by two arrows and a progress bar. No autoplay.
const EDGE = 4; // px of slack so sub-pixel scroll positions still count as the ends

export function carouselState({ scrollLeft, scrollWidth, clientWidth }) {
  const max = scrollWidth - clientWidth;
  return {
    atStart: scrollLeft < EDGE,
    atEnd: scrollLeft > max - EDGE,
    thumbWidth: clientWidth / scrollWidth * 100,
    thumbLeft: scrollLeft / scrollWidth * 100,
  };
}

export function initCarousel() {
  const track = document.querySelector('.svc-track');
  if (!track) return;
  const prev = document.querySelector('.svc-prev');
  const next = document.querySelector('.svc-next');
  const thumb = document.querySelector('.svc-prog i');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');

  const update = () => {
    const s = carouselState(track);
    // a focused arrow that is about to go disabled would drop keyboard focus: hand it to the other one
    if (s.atEnd && !s.atStart && document.activeElement === next) { prev.disabled = false; prev.focus(); }
    if (s.atStart && !s.atEnd && document.activeElement === prev) { next.disabled = false; next.focus(); }
    prev.disabled = s.atStart;
    next.disabled = s.atEnd;
    thumb.style.width = s.thumbWidth + '%';
    thumb.style.left = s.thumbLeft + '%';
  };
  const go = dir => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = track.firstElementChild.getBoundingClientRect().width + gap;
    track.scrollBy({ left: dir * step, behavior: calm.matches ? 'auto' : 'smooth' });
  };

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
}
