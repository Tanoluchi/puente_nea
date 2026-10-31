// Hero bridge drawn as a dot matrix from the original illustration, behind the headline.
// It builds once per page load (scattered dots organise: pylons, cables, deck, details) and then
// only breathes, glitches now and then, carries data pulses along the deck and follows the cursor.
const SRC = './assets/hero-puente-v2.jpg';
// Rows 0-337 hold the four software panels and their connectors; the crop keeps the whole bridge:
// both ends, both pylons with their cable fans, the deck, the river and the sun.
const CROP = { x: 0, y: 338, w: 1942, h: 424 };
// Leftover connector stubs of the removed panels (source px); painted over before sampling.
const STUBS = [{ x: 299, y: 338, w: 15, h: 100 }, { x: 1089, y: 338, w: 16, h: 110 }, { x: 1604, y: 338, w: 18, h: 132 }];
const CREAM = [252, 248, 239];
const LEVELS = 4; // LED-like radius steps
const DELAY = 250, SPAN = 1900, TRAVEL = 1300; // build: ranks start over SPAN ms, each dot travels TRAVEL ms
export const BUILD_END = DELAY + SPAN + TRAVEL;

// Dot size from how far a pixel is from the cream paper; faint guide lines fall under the threshold.
export function dotOf(r, g, b) {
  const dist = Math.hypot(r - CREAM[0], g - CREAM[1], b - CREAM[2]);
  return { size: Math.min(1, Math.max(0, (dist - 40) / 180)), warm: r > b };
}

// Mean ink of an nx×ny block of RGBA pixels (stride = row width in pixels); the dot area follows it.
export function cellAt(data, stride, x0, y0, nx, ny = nx) {
  let sum = 0, warm = 0, count = 0;
  for (let y = y0; y < y0 + ny; y++) for (let x = x0; x < x0 + nx; x++) {
    const k = (y * stride + x) * 4;
    if (data[k + 3] === undefined) continue;
    const dot = dotOf(data[k], data[k + 1], data[k + 2]);
    sum += dot.size; warm += dot.warm ? dot.size : -dot.size; count++;
  }
  return { size: count ? sum / count : 0, warm: warm >= 0 };
}

// Quantized radius level, 0 (no dot) to LEVELS, and its radius for a given horizontal pitch.
export const levelOf = size => (size < .06 ? 0 : Math.min(LEVELS, Math.ceil(size * LEVELS)));
const STEP = [0, .3, .55, .78, 1];
export const radiusOf = (level, pitch) => pitch * .6 * STEP[level];

const clamp01 = v => Math.min(1, Math.max(0, v));
const ease = u => (u < .5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);

// Build progress 0-1 of a dot by structure rank (0 = first) at t ms; monotonic, 1 for every rank from BUILD_END on.
export const buildProgress = (rank, t) => ease(clamp01((t - DELAY - rank * SPAN) / TRAVEL));

// Build order 0-1: pylons (long warm vertical runs), then cables, then the deck, then water and details.
export function structureRank({ run, deck, warm, jitter }) {
  if (!warm) return .85 + .15 * jitter;
  if (run >= 10) return .25 * jitter;
  if (deck) return .6 + .25 * jitter;
  return .28 + .3 * jitter;
}

// Dots behind the copy are dimmed, not removed, so the bridge stays complete and the text stays legible:
// at .22 alpha the warm and cool dots keep every text colour of the hero above WCAG AA (4.5:1) on both themes.
// Zones are padded text boxes {l, r, t, b}; inside one a dot gets COPY_FLOOR, ramping back to 1 over COPY_RAMP px.
export const COPY_FLOOR = .22, COPY_RAMP = 40;
export const COPY_ALPHA = [1, .5, COPY_FLOOR]; // alpha factor per band; the last band is what sits under the text
export const COPY_SCALE = [1, .9, .85];
export function copyFade(x, y, r, zones) {
  let d = Infinity;
  for (const z of zones) d = Math.min(d, Math.hypot(Math.max(z.l - x, 0, x - z.r), Math.max(z.t - y, 0, y - z.b)) - r);
  const u = clamp01(d / COPY_RAMP);
  return COPY_FLOOR + (1 - COPY_FLOOR) * u * u * (3 - 2 * u);
}
export const bandOf = f => (f < .3 ? 2 : f < .7 ? 1 : 0);

// Deterministic noise in [0, 1)
export function hash(i, seed) {
  const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Glitch {start, dur, r0, r1, seed}: a band of rows r0-r1 dissolves, some rows shift, then everything is back.
export function glitchEnv(t, g) {
  const u = (t - g.start) / g.dur;
  return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u);
}
const inBand = (row, g) => row >= g.r0 && row <= g.r1;
export function glitchShift(row, t, g, maxPx) {
  const env = glitchEnv(t, g);
  if (!env || !maxPx || !inBand(row, g) || hash(row, g.seed) > .55) return 0;
  const px = Math.round(maxPx * env * (.4 + .6 * hash(row, g.seed + 2)));
  return (hash(row, g.seed + 1) > .5 ? px : -px) || 0;
}
export const glitchHidden = (row, i, t, g) => {
  const env = glitchEnv(t, g);
  return env > 0 && inBand(row, g) && hash(i * 31 + row, g.seed + 3) < env * .45;
};
export const glitchFlicker = (t, g) => (glitchEnv(t, g) > 0 && Math.floor((t - g.start) / 50) % 3 === 1 ? .5 : 1);
export const nextGlitchDelay = r => 5000 + 4000 * r;

// Position of a data pulse along the deck [x0, x1]; dir 1 goes right, -1 goes left.
export function pulsePos(t, dir, x0, x1, period, phase) {
  const f = (((t / period + phase) % 1) + 1) % 1;
  return dir > 0 ? x0 + (x1 - x0) * f : x1 - (x1 - x0) * f;
}

// The whole source scaled to the box width (never cropped): the bridge always shows both ends.
export const fitRect = (sw, sh, bw) => ({ x: 0, w: bw, h: bw * sh / sw });

export function initHeroDots() {
  const canvas = document.querySelector('.hero-dots');
  const copy = document.querySelector('.hero-copy');
  const title = document.getElementById('hero-title');
  if (!canvas || !copy || !title) return;
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = !still && matchMedia('(hover: hover) and (pointer: fine)').matches;
  const stats = location.search.includes('herostats'); // draw cost and glitch flag on the canvas dataset, for measuring only
  const img = new Image();
  let cells = [], colors = {}, pitch = 5, rowH = 8, mobile = false, zones = [], bridgeRows = [0, 1];
  let deck = null, clock = 0, glitch = null, nextGlitch = 0, raf = 0, last = 0, inView = false, cost = 0;
  const cursor = { x: -1e4, y: -1e4, tx: 0, ty: 0, px: 0, py: 0 }; // canvas px, target and eased parallax

  const readColors = () => {
    const s = getComputedStyle(canvas);
    const v = name => s.getPropertyValue(name).trim();
    colors = { warm: v('--terra'), cool: v('--river-ink'), hot: v('--terra-ink') };
  };

  // text boxes the bridge must stay quiet behind; re-measured every frame while the entrance animation runs
  const measureZones = () => {
    const box = canvas.getBoundingClientRect(), pad = 14;
    const text = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
    const rects = [copy.querySelector('.eyebrow'), ...copy.querySelectorAll('.btn')].filter(Boolean).map(el => el.getBoundingClientRect());
    rects.push(text(title), text(copy.querySelector('.lead')));
    zones = rects.filter(r => r.width).map(r => ({ l: r.left - box.left - pad, r: r.right - box.left + pad, t: r.top - box.top - pad, b: r.bottom - box.top + pad }));
    return text(title);
  };

  const layout = () => {
    const box = canvas.getBoundingClientRect();
    if (!box.width) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const titleBox = measureZones();
    // scanline grid: tighter across than down; finer on phones so the small bridge keeps its detail
    mobile = box.width < 640;
    [pitch, rowH] = mobile ? [4, 6] : box.width < 1024 ? [5, 7] : box.width < 1600 ? [5, 8] : [6, 9];
    // the whole bridge fits the width; behind the headline on tablet and desktop, under the copy on phones
    const fit = fitRect(CROP.w, CROP.h, box.width);
    const w = Math.ceil(fit.w), h = Math.ceil(fit.h);
    const wanted = mobile ? box.height - h - 24 : (titleBox.top + titleBox.bottom) / 2 - box.top - h * .22;
    const top = Math.round(Math.max(0, Math.min(wanted, box.height - h)));
    const cols = Math.ceil(w / pitch), rows = Math.ceil(h / rowH);
    bridgeRows = [Math.floor(top / rowH), Math.floor(top / rowH) + rows];
    // render the crop at CSS size, then average each cell (true halftone: thin cables keep small dots)
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const o = off.getContext('2d', { willReadFrequently: true });
    o.fillStyle = `rgb(${CREAM})`;
    o.fillRect(0, 0, w, h);
    o.drawImage(img, CROP.x, CROP.y, CROP.w, CROP.h, 0, 0, w, h);
    const f = w / CROP.w;
    for (const m of STUBS) o.fillRect(m.x * f, (m.y - CROP.y) * f, m.w * f, m.h * f);
    const data = o.getImageData(0, 0, w, h).data;
    const lvl = new Uint8Array(cols * rows), warm = new Uint8Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const dot = cellAt(data, w, i * pitch, j * rowH, Math.min(pitch, w - i * pitch), Math.min(rowH, h - j * rowH));
      lvl[j * cols + i] = levelOf(dot.size ** .7); // lifts thin cables, which scale down to a few percent of a cell
      warm[j * cols + i] = dot.warm ? 1 : 0;
    }
    // vertical runs of warm dots tell pylons from cables; the busiest warm row is the deck
    const ink = k => lvl[k] && warm[k];
    const run = new Uint16Array(cols * rows), perRow = new Uint16Array(rows);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows;) {
      if (!ink(j * cols + i)) { j++; continue; }
      let k = j;
      while (k < rows && ink(k * cols + i)) { perRow[k]++; k++; }
      for (let m = j; m < k; m++) run[m * cols + i] = k - j;
      j = k;
    }
    const deckRow = perRow.indexOf(Math.max(...perRow));
    let x0 = Infinity, x1 = -Infinity;
    cells = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      if (!lvl[k]) continue;
      const x = i * pitch + pitch / 2, y = top + j * rowH + rowH / 2, onDeck = !!warm[k] && Math.abs(j - deckRow) <= 1;
      if (onDeck) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
      cells.push({
        x, y, row: bridgeRows[0] + j, idx: k, lvl: lvl[k], warm: warm[k], deck: onDeck,
        rank: structureRank({ run: run[k] * rowH / 8, deck: onDeck, warm: !!warm[k], jitter: .5 * (x / w) + .5 * hash(k, 1) }),
        sx: hash(k, 2) * box.width, sy: hash(k, 3) * box.height, drift: (hash(k, 4) - .5) * 36,
      });
    }
    deck = x1 > x0 ? { x0, x1 } : null;
    glitch = null;
  };

  const newGlitch = t => {
    const span = mobile ? 4 : 7, r0 = bridgeRows[0] + Math.floor(Math.random() * Math.max(1, bridgeRows[1] - bridgeRows[0] - span));
    return { start: t, dur: mobile ? 320 : 460, r0, r1: r0 + span, seed: Math.random() * 100 };
  };

  // one batch (Path2D) per band × bright × level × colour × pulse, so a frame is a few dozen fills
  const key = (band, bright, lvl, warm, hot) => band + 3 * (bright + 2 * (lvl - 1 + LEVELS * (warm + 2 * hot)));

  const draw = t => {
    const t0 = stats ? performance.now() : 0;
    const motion = !still, built = !motion || t >= BUILD_END;
    const amb = motion ? clamp01((t - BUILD_END) / 1500) : 0; // ambient motion fades in as the build ends
    if (motion && built && !glitch && t >= nextGlitch) glitch = newGlitch(t);
    if (glitch && t > glitch.start + glitch.dur) { glitch = null; nextGlitch = t + nextGlitchDelay(Math.random()); }
    if (stats) { canvas.dataset.glitch = glitch ? '1' : ''; canvas.dataset.zones = JSON.stringify(zones.map(z => [z.l, z.t, z.r, z.b].map(Math.round))); }
    const shiftMax = mobile ? 0 : 6;
    const paths = [];
    const pulses = motion && built && deck ? [1, -1].map((d, n) => pulsePos(t, d, deck.x0, deck.x1, 4200, n * .5)) : [];
    const reach = Math.max(28, Math.min(64, (deck ? deck.x1 - deck.x0 : 0) * .05));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const c of cells) {
      let x = c.x, y = c.y, grow = 1;
      if (!built) {
        const p = buildProgress(c.rank, t);
        const appear = clamp01(t / 600 - hash(c.idx, 5) * .7);
        grow = (.3 + .7 * p) * appear;
        if (grow <= 0) continue;
        const bend = Math.sin(Math.PI * p) * c.drift;
        x = c.sx + (c.x - c.sx) * p + bend;
        y = c.sy + (c.y - c.sy) * p;
      }
      // breathing: a slow wave runs across the structure, a few percent of size and brightness
      const wave = amb * Math.sin(c.x * .03 + c.y * .012 - t / 1100);
      let scale = 1 + .09 * wave, bright = wave > .45, hot = 0;
      if (glitch) {
        if (!mobile && glitchHidden(c.row, c.idx, t, glitch)) continue;
        x += glitchShift(c.row, t, glitch, shiftMax);
      }
      if (fine) {
        x += cursor.px; y += cursor.py; // one offset for every dot, so neighbours never cross
        const d = Math.hypot(x - cursor.x, y - cursor.y);
        if (d < 70) { scale *= 1 + .6 * (1 - d / 70); bright = true; }
      }
      if (c.deck) for (const px of pulses) {
        const k = 1 - Math.abs(x - px) / reach;
        if (k > 0) { scale *= 1 + (mobile ? .3 : .55) * k; if (k > .55) hot = 1; bright = true; }
      }
      let r = radiusOf(c.lvl, pitch) * grow * scale;
      // behind the text: smaller and much fainter, wherever the dot is right now (build, glitch, parallax)
      const band = bandOf(copyFade(x, y, r, zones));
      r *= COPY_SCALE[band];
      if (band === COPY_ALPHA.length - 1) {
        if (!built) continue; // dots in flight stay out of the text; they would overlap and stack alpha
        r = Math.min(r, pitch * .48); // once built, dots under the text never touch, so their alphas never add up
        hot = 0; // the darker pulse colour would cost the eyebrow its contrast
      }
      if (r < .3) continue;
      const k = key(band, bright ? 1 : 0, c.lvl, c.warm, hot);
      const path = paths[k] ||= new Path2D();
      path.moveTo(x + r, y);
      path.arc(x, y, r, 0, Math.PI * 2);
    }
    const flicker = glitch ? glitchFlicker(t, glitch) : 1;
    paths.forEach((path, k) => {
      const band = k % 3, q = (k - band) / 3, bright = q & 1, lv = ((q >> 1) % LEVELS) + 1, warm = (q >> 1) / LEVELS | 0;
      const hot = warm >> 1, isWarm = (warm & 1) || hot;
      // smaller (farther) dots are dimmer; cool water sits behind the warm structure
      const a = hot ? 1 : (.55 + .45 * lv / LEVELS) * (isWarm ? 1 : .75) + (bright ? .15 : 0);
      ctx.globalAlpha = Math.min(1, a) * COPY_ALPHA[band] * flicker;
      ctx.fillStyle = hot ? colors.hot : isWarm ? colors.warm : colors.cool;
      ctx.fill(path);
    });
    ctx.globalAlpha = 1;
    if (stats) canvas.dataset.drawMs = (cost = cost * .9 + (performance.now() - t0) * .1).toFixed(2);
  };

  // ~30 fps is enough for slow ambient motion and halves the work on weak phones
  const frame = now => {
    raf = requestAnimationFrame(frame);
    const dt = now - last;
    if (dt < 33) return;
    last = now;
    clock += Math.min(dt, 100); // paused time does not count, so the build always plays on screen and only once
    if (clock < 2400) measureZones(); // text is still rising into place
    cursor.px += (cursor.tx * 6 - cursor.px) * .1;
    cursor.py += (cursor.ty * 3 - cursor.py) * .1;
    draw(clock);
  };
  const sync = () => {
    const run = inView && !document.hidden && !still;
    if (run && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  const redraw = () => { layout(); if (still) draw(0); };

  img.addEventListener('load', () => {
    readColors();
    layout();
    if (still) { draw(0); return; }
    nextGlitch = BUILD_END + nextGlitchDelay(Math.random());
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }).observe(canvas);
    document.addEventListener('visibilitychange', sync);
    if (fine) {
      addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const b = canvas.getBoundingClientRect();
        cursor.x = e.clientX - b.left; cursor.y = e.clientY - b.top;
        cursor.tx = (e.clientX / innerWidth - .5) * 2; cursor.ty = (e.clientY / innerHeight - .5) * 2;
      }, { passive: true });
      document.documentElement.addEventListener('pointerleave', () => { cursor.x = cursor.y = -1e4; cursor.tx = cursor.ty = 0; });
    }
  }, { once: true });
  img.src = SRC;

  new ResizeObserver(() => { if (img.naturalWidth) redraw(); }).observe(canvas);
  document.fonts?.ready.then(() => { if (img.naturalWidth) redraw(); });
  new MutationObserver(() => { readColors(); if (still) draw(0); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
