export type RiskTier = 'none' | 'negative' | 'low' | 'moderate' | 'high' | 'over';

export interface CellHeatmapStyle {
  tier: RiskTier;
  /** Normalized exposure ratio (v / limit), clamped >= 0 */
  ratio: number;
  /** Inline CSS background color for the 00-99 cell (undefined for 0-value cells) */
  backgroundColor?: string;
  /** Optional subtle inset border/shadow for high-risk & over-limit cells */
  boxShadow?: string;
  /** Tailwind classes for the 2-digit number label */
  noClassName: string;
  /** Tailwind classes for the amount value label */
  valClassName: string;
}

/**
 * Computes the heatmap visual style and risk tier for a single 00–99 board cell
 * based on its current exposure `value` relative to `limit`.
 */
export function getBoardCellHeatmap(
  value: number,
  limit: number,
  overHighlightColor: string,
): CellHeatmapStyle {
  if (value === 0) {
    return {
      tier: 'none',
      ratio: 0,
      backgroundColor: undefined,
      noClassName: 'text-slate-600 font-bold',
      valClassName: 'text-slate-400 font-semibold',
    };
  }

  if (value < 0) {
    return {
      tier: 'negative',
      ratio: 0,
      backgroundColor: 'rgba(14, 165, 233, 0.10)',
      noClassName: 'text-sky-800 font-extrabold',
      valClassName: 'text-rose-600 font-extrabold',
    };
  }

  const safeLimit = limit > 0 ? limit : 1;
  const ratio = value / safeLimit;

  if (value > limit) {
    const overRatio = Math.min(2, ratio);
    const borderAlpha = (0.35 + (overRatio - 1) * 0.35).toFixed(2);
    return {
      tier: 'over',
      ratio,
      backgroundColor: overHighlightColor,
      boxShadow: `inset 0 0 0 1px rgba(225, 29, 72, ${borderAlpha})`,
      noClassName: 'text-rose-950 font-black',
      valClassName: 'text-slate-950 font-black',
    };
  }

  // Tier 1: Low exposure (0 < ratio < 0.45) -> Subtle Indigo/Sky tint (alpha 0.06 -> 0.16)
  if (ratio < 0.45) {
    const t = ratio / 0.45;
    const alpha = (0.06 + t * 0.10).toFixed(3);
    return {
      tier: 'low',
      ratio,
      backgroundColor: `rgba(79, 70, 229, ${alpha})`,
      noClassName: 'text-indigo-700 font-extrabold',
      valClassName: 'text-slate-900 font-extrabold',
    };
  }

  // Tier 2: Moderate exposure (0.45 <= ratio < 0.75) -> Warm Amber tint (alpha 0.14 -> 0.28)
  if (ratio < 0.75) {
    const t = (ratio - 0.45) / 0.30;
    const alpha = (0.14 + t * 0.14).toFixed(3);
    return {
      tier: 'moderate',
      ratio,
      backgroundColor: `rgba(245, 158, 11, ${alpha})`,
      boxShadow: 'inset 0 0 0 1px rgba(217, 119, 6, 0.18)',
      noClassName: 'text-amber-950 font-extrabold',
      valClassName: 'text-slate-950 font-black',
    };
  }

  // Tier 3: High / Near-limit exposure (0.75 <= ratio <= 1.0) -> High-alert Orange-Rose tint (alpha 0.24 -> 0.38)
  const t = (ratio - 0.75) / 0.25;
  const alpha = (0.24 + t * 0.14).toFixed(3);
  return {
    tier: 'high',
    ratio,
    backgroundColor: `rgba(249, 115, 22, ${alpha})`,
    boxShadow: 'inset 0 0 0 1px rgba(234, 88, 12, 0.28)',
    noClassName: 'text-orange-950 font-black',
    valClassName: 'text-slate-950 font-black',
  };
}
