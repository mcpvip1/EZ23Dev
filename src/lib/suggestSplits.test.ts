import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeBoardSplits } from './suggestSplits.ts';

test('analyzeBoardSplits returns empty items on an all-zero board', () => {
  const board = new Array<number>(100).fill(0);
  const res = analyzeBoardSplits(board, 40000);
  assert.equal(res.items.length, 0);
  assert.equal(res.totalOwnerSplit, 0);
  assert.equal(res.totalFighterSplit, 0);
});

test('analyzeBoardSplits detects NEAR_LIMIT and OVER_LIMIT numbers and calculates balanced splits', () => {
  const board = new Array<number>(100).fill(0);
  // 43 is nearing limit (36,000 out of 40,000 = 90%)
  board[43] = 36000;
  // 88 is over limit (52,000 out of 40,000 = 130%)
  board[88] = 52000;
  // 12 is small (5,000)
  board[12] = 5000;

  const res = analyzeBoardSplits(board, 40000, {
    nearThresholdRatio: 0.7,
    safeTargetRatio: 0.75, // safe target = 30,000
  });

  assert.equal(res.items.length, 2);
  assert.equal(res.overLimitCount, 1);
  assert.equal(res.nearLimitCount, 1);

  const item88 = res.items[0];
  assert.equal(item88.no, '88');
  assert.equal(item88.urgency, 'OVER_LIMIT');
  assert.equal(item88.fighterSplit, 30000);
  assert.equal(item88.ownerSplit, 22000);
  assert.equal(item88.fighterSplit + item88.ownerSplit, 52000);

  const item43 = res.items[1];
  assert.equal(item43.no, '43');
  assert.equal(item43.urgency, 'NEAR_LIMIT');
  assert.equal(item43.fighterSplit, 30000);
  assert.equal(item43.ownerSplit, 6000);
  assert.equal(item43.fighterSplit + item43.ownerSplit, 36000);
});

test('analyzeBoardSplits incorporates unsaved fighter entry rows and falls back to active numbers when below threshold', () => {
  const board = new Array<number>(100).fill(0);
  const res = analyzeBoardSplits(board, 40000, {
    unsavedFighter: [
      { no: '25', amount: 20000 },
      { no: '52', amount: 20000 },
    ],
  });

  assert.equal(res.items.length, 2);
  assert.equal(res.items[0].urgency, 'HIGH_ACTIVE');
  assert.equal(res.items[0].currentExposure, 20000);
  assert.equal(res.items[0].fighterSplit + res.items[0].ownerSplit, 20000);
  assert.ok(res.items[0].ownerSplit > 0);
});
