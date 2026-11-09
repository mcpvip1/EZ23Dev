/**
 * Board Near-Limit & Over-Limit Split Analyzer ("ကာငွေအကြံပြုချက်")
 *
 * Analyzes the 00–99 board (including saved exposure + unsaved entry rows)
 * for numbers nearing or exceeding the limit, and computes balanced
 * Fighter (ထိုးငွေ) / Owner Carry (ပို့ငွေ / ကာငွေ) splits for one-click hedging.
 */

import { pad2, reverseNo } from '../shared-vendor/expand.js';
import { roundUpToTen } from '../shared-vendor/board.js';

export type SplitUrgency = 'OVER_LIMIT' | 'NEAR_LIMIT' | 'HIGH_ACTIVE';

export interface SuggestedSplitItem {
  /** 2-digit number, e.g. "43" */
  no: string;
  /** Reverse 2-digit number, e.g. "34" */
  reverseNo: string;
  /** Current total exposure (saved board + unsaved fighter - unsaved carry) */
  currentExposure: number;
  /** Saved board exposure alone */
  savedExposure: number;
  /** Unsaved fighter entry exposure on this number */
  unsavedFighterExposure: number;
  /** Percentage of limit used (0 - 100+) */
  limitPct: number;
  /** Classification */
  urgency: SplitUrgency;
  /** Recommended safe amount to retain on Fighter / Book side */
  fighterSplit: number;
  /** Recommended hedge amount (ကာငွေ) to pass to Owner Carry side */
  ownerSplit: number;
  /** Optional reverse-balance top-up for paired hedging */
  reverseExposure: number;
}

export interface SuggestSplitsAnalysis {
  limit: number;
  nearThresholdPct: number;
  safeTargetPct: number;
  items: SuggestedSplitItem[];
  totalCurrentExposure: number;
  totalFighterSplit: number;
  totalOwnerSplit: number;
  overLimitCount: number;
  nearLimitCount: number;
}

export interface AnalyzeBoardOptions {
  /** Near-limit detection threshold as ratio of limit (default 0.70 = 70% of limit) */
  nearThresholdRatio?: number;
  /** Safe retention target as ratio of limit (default 0.75 = 75% of limit kept, rest hedged to Owner) */
  safeTargetRatio?: number;
  /** Unsaved Fighter entry numbers (optional) */
  unsavedFighter?: Array<{ no: string; amount: number }>;
  /** Unsaved Owner Carry entry numbers (optional) */
  unsavedCarry?: Array<{ no: string; amount: number }>;
}

/**
 * Analyze the 00–99 board for numbers nearing or exceeding `limit` and
 * compute recommended Fighter / Owner Carry splits.
 */
export function analyzeBoardSplits(
  savedBoard: number[],
  limit: number,
  options: AnalyzeBoardOptions = {},
): SuggestSplitsAnalysis {
  const effectiveLimit = limit > 0 ? limit : 40000;
  const nearThresholdRatio = options.nearThresholdRatio ?? 0.7;
  const safeTargetRatio = options.safeTargetRatio ?? 0.75;

  const unsavedF = new Array<number>(100).fill(0);
  const unsavedC = new Array<number>(100).fill(0);

  for (const r of options.unsavedFighter ?? []) {
    const idx = Number(r.no);
    if (Number.isInteger(idx) && idx >= 0 && idx <= 99) {
      unsavedF[idx] += r.amount;
    }
  }
  for (const r of options.unsavedCarry ?? []) {
    const idx = Number(r.no);
    if (Number.isInteger(idx) && idx >= 0 && idx <= 99) {
      unsavedC[idx] += r.amount;
    }
  }

  const effectiveBoard = new Array<number>(100).fill(0);
  for (let i = 0; i < 100; i++) {
    effectiveBoard[i] = (savedBoard[i] ?? 0) + unsavedF[i] - unsavedC[i];
  }

  const nearCutoff = effectiveLimit * nearThresholdRatio;
  const safeTargetAmount = Math.max(0, Math.floor((effectiveLimit * safeTargetRatio) / 10) * 10);

  const candidates: SuggestedSplitItem[] = [];
  const fallbackActive: SuggestedSplitItem[] = [];

  for (let i = 0; i < 100; i++) {
    const exp = effectiveBoard[i];
    if (exp <= 0) continue;

    const no = pad2(i);
    const rev = reverseNo(no);
    const revIdx = Number(rev);
    const revExp = effectiveBoard[revIdx] ?? 0;
    const limitPct = Math.round((exp / effectiveLimit) * 100);

    if (exp >= nearCutoff) {
      const urgency: SplitUrgency = exp > effectiveLimit ? 'OVER_LIMIT' : 'NEAR_LIMIT';
      // If exposure exceeds safeTargetAmount, hedge the excess above safeTargetAmount.
      // If nearCutoff < safeTargetAmount and exp is between them, hedge 25% of exposure to Owner.
      const rawOwner =
        exp > safeTargetAmount
          ? exp - safeTargetAmount
          : Math.max(10, Math.round((exp * 0.25) / 10) * 10);
      const ownerSplit = Math.min(exp, roundUpToTen(rawOwner));
      const fighterSplit = Math.max(0, exp - ownerSplit);

      candidates.push({
        no,
        reverseNo: rev,
        currentExposure: exp,
        savedExposure: savedBoard[i] ?? 0,
        unsavedFighterExposure: unsavedF[i],
        limitPct,
        urgency,
        fighterSplit,
        ownerSplit,
        reverseExposure: revExp,
      });
    } else {
      // Fallback active numbers if no numbers have reached nearCutoff yet:
      // suggest a balanced 70% Fighter / 30% Owner Carry split on the highest active numbers.
      const ownerSplit = Math.min(exp, roundUpToTen(Math.max(10, Math.round(exp * 0.3))));
      const fighterSplit = Math.max(0, exp - ownerSplit);
      fallbackActive.push({
        no,
        reverseNo: rev,
        currentExposure: exp,
        savedExposure: savedBoard[i] ?? 0,
        unsavedFighterExposure: unsavedF[i],
        limitPct,
        urgency: 'HIGH_ACTIVE',
        fighterSplit,
        ownerSplit,
        reverseExposure: revExp,
      });
    }
  }

  const sortByExposureDesc = (a: SuggestedSplitItem, b: SuggestedSplitItem) =>
    b.currentExposure - a.currentExposure || a.no.localeCompare(b.no);

  candidates.sort(sortByExposureDesc);
  fallbackActive.sort(sortByExposureDesc);

  const items = candidates.length > 0 ? candidates : fallbackActive.slice(0, 8);

  const overLimitCount = items.filter((x) => x.urgency === 'OVER_LIMIT').length;
  const nearLimitCount = items.filter((x) => x.urgency === 'NEAR_LIMIT').length;
  const totalCurrentExposure = items.reduce((s, x) => s + x.currentExposure, 0);
  const totalFighterSplit = items.reduce((s, x) => s + x.fighterSplit, 0);
  const totalOwnerSplit = items.reduce((s, x) => s + x.ownerSplit, 0);

  return {
    limit: effectiveLimit,
    nearThresholdPct: Math.round(nearThresholdRatio * 100),
    safeTargetPct: Math.round(safeTargetRatio * 100),
    items,
    totalCurrentExposure,
    totalFighterSplit,
    totalOwnerSplit,
    overLimitCount,
    nearLimitCount,
  };
}
