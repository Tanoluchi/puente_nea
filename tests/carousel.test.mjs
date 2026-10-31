import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carouselState } from '../src/carousel.mjs';

const dims = (scrollLeft, scrollWidth = 2000, clientWidth = 500) => carouselState({ scrollLeft, scrollWidth, clientWidth });

test('at the start the previous arrow is off and the bar sits at the left', () => {
  assert.deepEqual(dims(0), { atStart: true, atEnd: false, thumbWidth: 25, thumbLeft: 0 });
});

test('mid-scroll both arrows are on and the bar follows scrollLeft', () => {
  assert.deepEqual(dims(750), { atStart: false, atEnd: false, thumbWidth: 25, thumbLeft: 37.5 });
});

test('at the end the next arrow is off and the bar reaches the right edge', () => {
  const s = dims(1500);
  assert.equal(s.atEnd, true);
  assert.equal(s.atStart, false);
  assert.equal(s.thumbLeft + s.thumbWidth, 100);
});

test('sub-pixel scroll positions still count as the ends', () => {
  assert.equal(dims(3).atStart, true);
  assert.equal(dims(1497).atEnd, true);
});

test('content that fits turns both arrows off and fills the bar', () => {
  assert.deepEqual(dims(0, 500, 500), { atStart: true, atEnd: true, thumbWidth: 100, thumbLeft: 0 });
});
