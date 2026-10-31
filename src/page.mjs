// Shared by every page: nav border on scroll, reveal on scroll and, when the page shows one, its figure demo.
import { initSoftware } from './figures/software.mjs';
import { initAuto } from './figures/auto.mjs';
import { initAi } from './figures/ai.mjs';

const FIGURES = { software: initSoftware, auto: initAuto, ai: initAi };

export function initPage() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // SMIL ignores the CSS reduced-motion rules: freeze every SVG timeline at its first frame
  if (reduce) document.querySelectorAll('svg').forEach(s => { s.pauseAnimations?.(); s.setCurrentTime?.(0); });

  // Nav border on scroll
  const nav = document.querySelector('.nav');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 10), { passive: true });

  // Reveal on scroll: once per element, small stagger by position among siblings
  const items = document.querySelectorAll('.reveal, .reveal-items, .process');
  items.forEach(el => {
    const i = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
    el.style.setProperty('--d', Math.min(.3, .06 * i) + 's');
    if (el.classList.contains('reveal-items')) [...el.children].forEach((c, n) => c.style.setProperty('--d', (.2 + .06 * n) + 's'));
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .01 });
  // tells the <head> fallback the reveal is running; without it the hidden state is lifted after 3s
  document.documentElement.classList.add('reveal-ready');
  items.forEach(el => {
    // already on screen at load: show right away, no motion
    if (el.getBoundingClientRect().top < innerHeight * .92) el.classList.add('in', 'instant');
    else io.observe(el);
  });

  FIGURES[document.querySelector('[data-figure]')?.dataset.figure]?.();
}

// Every page loads this module; the home then adds its hero and the three demos on top.
initPage();
