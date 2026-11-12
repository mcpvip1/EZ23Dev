import test from 'node:test';
import assert from 'node:assert/strict';
import { getBoardCellHeatmap } from './boardHeatmap';

test('getBoardCellHeatmap returns neutral style for zero exposure', () => {
  const res = getBoardCellHeatmap(0, 40000, '#fecdd3');
  assert.equal(res.tier, 'none');
  assert.equal(res.ratio, 0);
  assert.equal(res.backgroundColor, undefined);
});

test('getBoardCellHeatmap scales intensity across low, moderate, high, and over-limit tiers', () => {
  const low = getBoardCellHeatmap(5000, 40000, '#fecdd3');
  assert.equal(low.tier, 'low');
  assert.ok(low.backgroundColor?.startsWith('rgba(79, 70, 229,'));

  const mod = getBoardCellHeatmap(24000, 40000, '#fecdd3');
  assert.equal(mod.tier, 'moderate');
  assert.ok(mod.backgroundColor?.startsWith('rgba(245, 158, 11,'));

  const high = getBoardCellHeatmap(36000, 40000, '#fecdd3');
  assert.equal(high.tier, 'high');
  assert.ok(high.backgroundColor?.startsWith('rgba(249, 115, 22,'));

  const over = getBoardCellHeatmap(45000, 40000, '#fecdd3');
  assert.equal(over.tier, 'over');
  assert.equal(over.backgroundColor, '#fecdd3');
  assert.ok(over.boxShadow?.includes('rgba(225, 29, 72,'));
});

test('getBoardCellHeatmap increases alpha as exposure increases within a tier', () => {
  const low1 = getBoardCellHeatmap(4000, 40000, '#fecdd3');
  const low2 = getBoardCellHeatmap(16000, 40000, '#fecdd3');
  assert.notEqual(low1.backgroundColor, low2.backgroundColor);
});
