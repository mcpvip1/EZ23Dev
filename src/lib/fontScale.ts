export const FONT_SCALE_STORAGE_KEY = 'easy2d-font-scale';
export const MIN_FONT_SCALE = 85;
export const MAX_FONT_SCALE = 130;
export const DEFAULT_FONT_SCALE = 100;
export const FONT_SCALE_STEP = 5;
export const FONT_SCALE_PRESETS = [90, 100, 110, 120] as const;

/**
 * Clamps a font scale percentage into [MIN_FONT_SCALE, MAX_FONT_SCALE].
 * Falls back to DEFAULT_FONT_SCALE (100) for NaN or non-finite inputs.
 */
export function clampFontScale(pct: number): number {
  if (!Number.isFinite(pct)) return DEFAULT_FONT_SCALE;
  const rounded = Math.round(pct);
  return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, rounded));
}

/**
 * Computes the CSS custom property ratio and root html font-size (px)
 * for a given font scale percentage.
 */
export function fontScaleToCssVars(pct: number): {
  clampedPct: number;
  scaleRatio: string;
  rootFontSizePx: string;
} {
  const clampedPct = clampFontScale(pct);
  const ratio = clampedPct / 100;
  const rootPx = 16 * ratio;
  return {
    clampedPct,
    scaleRatio: ratio.toFixed(2),
    rootFontSizePx: `${Number(rootPx.toFixed(2))}px`,
  };
}

/**
 * Applies the font scale percentage directly to document.documentElement
 * so all rem-based and CSS-variable-backed UI text scales immediately.
 */
export function applyFontScaleToDocument(pct: number): number {
  const { clampedPct, scaleRatio, rootFontSizePx } = fontScaleToCssVars(pct);
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.style.setProperty('--ui-font-scale', scaleRatio);
    document.documentElement.style.fontSize = rootFontSizePx;
    document.documentElement.setAttribute('data-font-scale', String(clampedPct));
  }
  return clampedPct;
}

/**
 * Loads the persisted font scale percentage from localStorage (defaults to 100%).
 */
export function loadFontScale(): number {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_FONT_SCALE;
    const raw = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    if (!raw) return DEFAULT_FONT_SCALE;
    return clampFontScale(Number(raw));
  } catch {
    return DEFAULT_FONT_SCALE;
  }
}

/**
 * Saves the font scale percentage to localStorage and applies it to the document.
 */
export function saveFontScale(pct: number): number {
  const clamped = applyFontScaleToDocument(pct);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(clamped));
    }
  } catch {
    // Ignore storage quota errors in restricted environments
  }
  return clamped;
}
