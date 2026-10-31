// Hero bridge drawn as a dot matrix from the original illustration, behind the headline.
const SRC = './assets/hero-puente-v2.jpg';
// Rows 0-259 hold the four software panels; the crop keeps the pylons, deck, river and sun.
const CROP = { x: 0, y: 300, w: 1942, h: 460 };
const CREAM = [252, 248, 239];
const BUILD_MS = 1400; // left-to-right build on load, once

// Dot size from how far a pixel is from the cream paper; faint guide lines fall under the threshold.
export function dotOf(r, g, b) {
  const dist = Math.hypot(r - CREAM[0], g - CREAM[1], b - CREAM[2]);
  return { size: Math.min(1, Math.max(0, (dist - 40) / 180)), warm: r > b };
}

// Mean ink of an n×n block of RGBA pixels (stride = row width in pixels); the dot area follows it.
export function cellAt(data, stride, x0, y0, n) {
  let sum = 0, warm = 0, count = 0;
  for (let y = y0; y < y0 + n; y++) for (let x = x0; x < x0 + n; x++) {
    const k = (y * stride + x) * 4;
    if (data[k + 3] === undefined) continue;
    const dot = dotOf(data[k], data[k + 1], data[k + 2]);
    sum += dot.size; warm += dot.warm ? dot.size : -dot.size; count++;
  }
  return { size: count ? sum / count : 0, warm: warm >= 0 };
}

// Like object-fit: cover, cropping around a horizontal focus point (0-1 of the source width).
export function coverRect(sw, sh, bw, bh, fx = .5) {
  const scale = Math.max(bw / sw, bh / sh);
  const w = sw * scale, h = sh * scale;
  const x = Math.min(0, Math.max(bw - w, bw / 2 - w * fx));
  return { x, y: (bh - h) / 2, w, h };
}

export function initHeroDots() {
  const canvas = document.querySelector('.hero-dots');
  const copy = document.querySelector('.hero-copy');
  if (!canvas || !copy) return;
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const img = new Image();
  let cells = [], colors = {}, cell = 8, width = 0, start = 0, raf = 0, last = 0;

  const readColors = () => {
    const s = getComputedStyle(canvas);
    colors = { warm: s.getPropertyValue('--terra').trim(), cool: s.getPropertyValue('--river-ink').trim() };
  };

  const layout = () => {
    const box = canvas.getBoundingClientRect();
    if (!box.width) return;
    width = box.width;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = box.width < 640 ? 6 : box.width < 1024 ? 7 : 8;
    const w = Math.ceil(box.width), h = Math.ceil(box.height);
    const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
    // render the crop at CSS size, then average each cell (true halftone: thin cables keep small dots)
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const o = off.getContext('2d', { willReadFrequently: true });
    o.fillStyle = `rgb(${CREAM})`;
    o.fillRect(0, 0, w, h);
    const r = coverRect(CROP.w, CROP.h, w, h, box.width < 640 ? .42 : .55);
    o.drawImage(img, CROP.x, CROP.y, CROP.w, CROP.h, r.x, r.y, r.w, r.h);
    const data = o.getImageData(0, 0, w, h).data;
    // no dots behind the copy, so the headline and lead stay legible
    const c = copy.getBoundingClientRect();
    const avoid = { l: c.left - box.left - 24, r: c.right - box.left + 24, t: c.top - box.top - 24, b: c.bottom - box.top + 16 };
    const fade = (x, y) => {
      const d = Math.hypot(Math.max(avoid.l - x, 0, x - avoid.r), Math.max(avoid.t - y, 0, y - avoid.b));
      return Math.min(1, d / 48); // clear behind the copy, ramping back over 48px
    };
    cells = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const dot = cellAt(data, w, i * cell, j * cell, Math.min(cell, w - i * cell, h - j * cell));
      if (dot.size < .06) continue;
      const x = i * cell + cell / 2, y = j * cell + cell / 2;
      cells.push({ x, y, size: dot.size * fade(x, y), warm: dot.warm });
    }
  };

  const draw = t => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const warm of [true, false]) {
      ctx.beginPath();
      for (const c of cells) {
        if (c.warm !== warm) continue;
        const grow = still ? 1 : Math.min(1, Math.max(0, (t - c.x / width * BUILD_MS) / 400));
        const wave = still ? 1 : .82 + .18 * Math.sin(c.x * .045 + c.y * .02 - t / 900);
        const r = cell * .5 * Math.sqrt(c.size) * grow * wave;
        if (r < .3) continue;
        ctx.moveTo(c.x + r, c.y);
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      }
      ctx.globalAlpha = warm ? 1 : .7;
      ctx.fillStyle = warm ? colors.warm : colors.cool;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  // ~30 fps is enough for a slow wave and halves the work on weak phones
  const frame = now => {
    raf = requestAnimationFrame(frame);
    if (now - last < 33) return;
    last = now;
    draw(now - start);
  };
  const play = () => { if (!still && !raf) raf = requestAnimationFrame(frame); };
  const pause = () => { cancelAnimationFrame(raf); raf = 0; };
  const redraw = () => { layout(); if (still) draw(0); };

  img.addEventListener('load', () => {
    readColors();
    layout();
    start = performance.now();
    if (still) { draw(0); return; }
    // only animate while the hero is on screen
    new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause())).observe(canvas);
  }, { once: true });
  img.src = SRC;

  new ResizeObserver(() => { if (img.naturalWidth) redraw(); }).observe(canvas);
  document.fonts?.ready.then(() => { if (img.naturalWidth) redraw(); });
  new MutationObserver(() => { readColors(); if (still) draw(0); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
