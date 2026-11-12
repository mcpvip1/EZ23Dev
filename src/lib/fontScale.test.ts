import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampFontScale,
  DEFAULT_FONT_SCALE,
  FONT_SCALE_PRESETS,
  fontScaleToCssVars,
  MAX_FONT_SCALE,
  MIN_FONT_SCALE,
} from './fontScale';

test('clampFontScale bounds values within [85, 130] and handles invalid inputs', () => {
  assert.equal(clampFontScale(100), 100);
  assert.equal(clampFontScale(115), 115);
  assert.equal(clampFontScale(50), MIN_FONT_SCALE);
  assert.equal(clampFontScale(180), MAX_FONT_SCALE);
  assert.equal(clampFontScale(NaN), DEFAULT_FONT_SCALE);
  assert.equal(clampFontScale(Infinity), DEFAULT_FONT_SCALE);
});

test('fontScaleToCssVars computes exact ratio and root font-size in px', () => {
  assert.deepEqual(fontScaleToCssVars(100), {
    clampedPct: 100,
    scaleRatio: '1.00',
    rootFontSizePx: '16px',
  });
  assert.deepEqual(fontScaleToCssVars(115), {
    clampedPct: 115,
    scaleRatio: '1.15',
    rootFontSizePx: '18.4px',
  });
  assert.deepEqual(fontScaleToCssVars(90), {
    clampedPct: 90,
    scaleRatio: '0.90',
    rootFontSizePx: '14.4px',
  });
});

test('FONT_SCALE_PRESETS are all within valid bounds', () => {
  for (const preset of FONT_SCALE_PRESETS) {
    assert.equal(clampFontScale(preset), preset);
  }
});
