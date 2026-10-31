import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dotOf, coverRect, cellAt } from '../src/hero-dots.mjs';

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

test('coverRect fills the box keeping the aspect and centring on the focus', () => {
  // wide source into a square box: height fits, width overflows and is cropped around focus x
  const r = coverRect(1942, 549, 400, 400, .42);
  assert.equal(Math.round(r.h), 400);
  assert.ok(r.w > 400);
  assert.ok(r.x <= 0 && r.x + r.w >= 400);
  assert.ok(Math.abs((r.x + r.w * .42) - 200) < 1, 'focus lands in the middle');
  // a wider box than the source: width fits
  const wide = coverRect(1942, 549, 2000, 400, .5);
  assert.equal(Math.round(wide.w), 2000);
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
