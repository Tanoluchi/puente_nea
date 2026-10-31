import { initSoftware } from "./figures/software.mjs";
import { initAuto } from "./figures/auto.mjs";
import { initAi } from "./figures/ai.mjs";
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // SMIL ignores the CSS reduced-motion rules: freeze every SVG timeline at its first frame
  if (reduce) document.querySelectorAll('svg').forEach(s => { s.pauseAnimations?.(); s.setCurrentTime?.(0); });

  // Nav border on scroll
  const nav = document.querySelector('.nav');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 10), { passive: true });

  // Hero word reveal
  const h1 = document.getElementById('hero-title');
  const walk = (node, i = { n: 0 }) => {
    [...node.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(w => {
          if (!w.trim()) { frag.append(w); return; }
          const s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true');
          s.style.animationDelay = (i.n++ * 70) + 'ms'; s.textContent = w; frag.append(s);
        });
        c.replaceWith(frag);
      } else walk(c, i);
    });
  };
  walk(h1);

  // Reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  document.querySelectorAll('.reveal, .process').forEach(el => io.observe(el));

  // Hotspots: tap toggles on touch
  document.querySelectorAll('.spot button').forEach(b => b.addEventListener('click', () => b.parentElement.classList.toggle('open')));


  initSoftware();
  initAuto();
  initAi();
})();
