import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dotOf, fitRect, cellAt, levelOf, radiusOf, buildProgress, structureRank, copyFade, bandOf, COPY_ALPHA, COPY_SCALE, COPY_FLOOR,
  hash, glitchEnv, glitchShift, glitchHidden, glitchFlicker, nextGlitchDelay, pulsePos,
} from '../src/hero-dots.mjs';

test('cream background gives no dot; terracotta gives a large warm dot; river blue gives a cool dot', () => {
  assert.equal(dotOf(252, 248, 239).size, 0);
  const bridge = dotOf(217, 87, 43);
  assert.ok(bridge.size > .8 && bridge.warm);
  const river = dotOf(168, 207, 227);
  assert.ok(river.size > 0 && river.size < bridge.size && !river.warm);
});

test('faint marks below the threshold are dropped so thin guide lines do not speckle the sky', () => {
  assert.equal(dotOf(240, 232, 220).size, 0);
});

test('fitRect scales the whole source to the box width, never cropping the bridge ends', () => {
  for (const bw of [375, 768, 1280, 1920]) {
    const r = fitRect(1942, 424, bw);
    assert.equal(r.x, 0);
    assert.equal(r.w, bw);
    assert.ok(Math.abs(r.h / r.w - 424 / 1942) < 1e-9, 'aspect kept');
  }
});

test('a cell averages its pixels, so thin lines keep a small dot instead of vanishing or filling the cell', () => {
  const n = 8, block = (paint) => {
    const data = new Uint8ClampedArray(n * n * 4);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) data.set([...paint(x, y), 255], (y * n + x) * 4);
    return cellAt(data, n, 0, 0, n);
  };
  const cream = [252, 248, 239], terra = [217, 87, 43];
  assert.equal(block(() => cream).size, 0);
  assert.ok(block(() => terra).size > .95);
  const half = block(x => (x < 4 ? terra : cream));
  assert.ok(half.size > .4 && half.size < .6 && half.warm);
  const line = block(x => (x === 3 ? terra : cream)); // a 1px cable
  assert.ok(line.size > .1 && line.size < .2);
});

test('cells accept a rectangular block, so the grid can have a tighter horizontal than vertical pitch', () => {
  const nx = 4, ny = 8, data = new Uint8ClampedArray(nx * ny * 4);
  for (let k = 0; k < nx * ny; k++) data.set([217, 87, 43, 255], k * 4);
  assert.ok(cellAt(data, nx, 0, 0, nx, ny).size > .95);
});

test('dot radii are quantized to four LED levels and empty cells have none', () => {
  assert.equal(levelOf(0), 0);
  assert.equal(levelOf(.05), 0);
  const levels = new Set([.07, .2, .3, .45, .6, .8, 1].map(s => levelOf(s)));
  assert.deepEqual([...levels].sort(), [1, 2, 3, 4]);
  assert.ok(levelOf(.3) <= levelOf(.6), 'monotonic');
  const radii = [1, 2, 3, 4].map(l => radiusOf(l, 8));
  assert.deepEqual(radii, [...radii].sort((a, b) => a - b));
  assert.equal(new Set(radii).size, 4);
  assert.equal(radiusOf(0, 8), 0);
});

test('build progress is monotonic in time, reaches 1 for every rank by the end, and pylons start before water', () => {
  for (const rank of [0, .25, .5, .75, 1]) {
    let prev = -1;
    for (let t = 0; t <= 5000; t += 50) {
      const p = buildProgress(rank, t);
      assert.ok(p >= prev && p >= 0 && p <= 1);
      prev = p;
    }
    assert.equal(buildProgress(rank, 5000), 1);
    assert.equal(buildProgress(rank, 1e9), 1);
  }
  assert.equal(buildProgress(1, 0), 0);
  assert.ok(buildProgress(0, 900) > buildProgress(1, 900));
});

test('structure rank builds pylons first, then cables, then the deck, then details', () => {
  const at = o => structureRank({ run: 0, deck: false, warm: true, jitter: .5, ...o });
  const pylon = at({ run: 14 }), cable = at({}), deck = at({ deck: true }), water = at({ warm: false });
  assert.ok(pylon < cable && cable < deck && deck < water);
  for (const j of [0, 1]) for (const o of [{ run: 14 }, {}, { deck: true }, { warm: false }]) {
    const r = at({ ...o, jitter: j });
    assert.ok(r >= 0 && r <= 1);
  }
});

test('behind the copy dots are dimmed and shrunk instead of removed, at a capped alpha and size', () => {
  const zones = [{ l: 100, r: 300, t: 50, b: 150 }, { l: 100, r: 300, t: 200, b: 250 }];
  const under = [[200, 100, 4], [100, 50, 2], [299, 249, 4], [200, 225, 4]];
  for (const [x, y, r] of under) {
    const f = copyFade(x, y, r, zones);
    assert.equal(f, COPY_FLOOR);
    assert.ok(f > 0, 'dimmed, not removed');
    assert.ok(COPY_ALPHA[bandOf(f)] <= .25, 'alpha cap under the text');
    assert.ok(COPY_SCALE[bandOf(f)] < 1, 'smaller under the text');
  }
  assert.equal(copyFade(96, 100, 6, zones), COPY_FLOOR, 'a dot whose body reaches in is dimmed');
  assert.equal(copyFade(500, 100, 4, zones), 1);
  assert.equal(bandOf(copyFade(500, 100, 4, zones)), 0);
  assert.equal(copyFade(5, 5, 3, []), 1);
  let prev = 0;
  for (let d = 0; d <= 60; d += 4) {
    const f = copyFade(300 + d, 100, 0, zones);
    assert.ok(f >= prev && f <= 1);
    prev = f;
  }
  assert.ok(COPY_ALPHA.every((a, i) => i === 0 || a < COPY_ALPHA[i - 1]));
});

test('glitch has no effect outside its window and restores exactly afterwards', () => {
  const g = { start: 1000, dur: 400, r0: 10, r1: 22, seed: 7 };
  for (const t of [0, 999, 1400, 1401, 9e6]) {
    assert.equal(glitchEnv(t, g), 0);
    for (let row = 0; row < 40; row++) {
      assert.equal(glitchShift(row, t, g, 6), 0);
      assert.equal(glitchHidden(row, 3, t, g), false);
    }
    assert.equal(glitchFlicker(t, g), 1);
  }
  assert.ok(glitchEnv(1200, g) > .9);
});

test('glitch shifts only some rows of the band, by whole pixels within the cap, and never outside the band', () => {
  const g = { start: 0, dur: 400, r0: 10, r1: 30, seed: 3 };
  const shifts = [];
  for (let row = 0; row < 50; row++) {
    const s = glitchShift(row, 200, g, 6);
    assert.ok(Number.isInteger(s) && Math.abs(s) <= 6);
    if (row < g.r0 || row > g.r1) assert.equal(s, 0);
    else shifts.push(s);
  }
  assert.ok(shifts.some(s => s !== 0) && shifts.some(s => s === 0));
  assert.equal(glitchShift(15, 200, g, 0), 0, 'mobile: no row shifts');
});

test('glitch dissolves part of the band at its peak and flickers briefly', () => {
  const g = { start: 0, dur: 400, r0: 10, r1: 30, seed: 3 };
  let hidden = 0, total = 0;
  for (let i = 0; i < 400; i++) { total++; if (glitchHidden(20, i, 200, g)) hidden++; }
  assert.ok(hidden > total * .1 && hidden < total * .7);
  for (let i = 0; i < 50; i++) assert.equal(glitchHidden(5, i, 200, g), false, 'outside the band');
  const flick = [];
  for (let t = 0; t < 400; t += 20) flick.push(glitchFlicker(t, g));
  assert.ok(Math.min(...flick) < 1 && Math.min(...flick) >= .4);
});

test('glitches come every 5 to 9 seconds and hash is deterministic in [0, 1)', () => {
  for (const r of [0, .5, .999]) {
    const d = nextGlitchDelay(r);
    assert.ok(d >= 5000 && d <= 9000);
  }
  assert.equal(hash(4, 9), hash(4, 9));
  assert.notEqual(hash(4, 9), hash(5, 9));
  for (let i = 0; i < 200; i++) { const h = hash(i, 1); assert.ok(h >= 0 && h < 1); }
});

test('data pulses travel along the deck in both directions and stay inside its ends', () => {
  const x0 = 100, x1 = 900;
  const right = [0, 500, 1000, 1500].map(t => pulsePos(t, 1, x0, x1, 3000, 0));
  const left = [0, 500, 1000, 1500].map(t => pulsePos(t, -1, x0, x1, 3000, 0));
  assert.ok(right.every((x, i) => i === 0 || x > right[i - 1]));
  assert.ok(left.every((x, i) => i === 0 || x < left[i - 1]));
  for (let t = 0; t < 20000; t += 137) for (const d of [1, -1]) {
    const x = pulsePos(t, d, x0, x1, 3000, .3);
    assert.ok(x >= x0 && x <= x1);
  }
});
