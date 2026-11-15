export const SOUND_ENABLED_STORAGE_KEY = 'easy2d-sound-enabled';
export const DEFAULT_SOUND_ENABLED = true;

export interface OverLimitSnapshotItem {
  no: string;
  over: number | string;
}

export interface ToneStepSpec {
  type: OscillatorType;
  startFreqHz: number;
  endFreqHz: number;
  startTimeSec: number;
  durationSec: number;
  peakGain: number;
}

/**
 * Parses a stored string value into a boolean sound-enabled flag.
 * Defaults to true unless explicitly set to 'false' or '0'.
 */
export function parseSoundEnabled(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined || raw.trim() === '') {
    return DEFAULT_SOUND_ENABLED;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'off') {
    return false;
  }
  return true;
}

/**
 * Loads the persisted audio feedback setting from localStorage.
 */
export function loadSoundEnabled(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_SOUND_ENABLED;
  }
  try {
    return parseSoundEnabled(window.localStorage.getItem(SOUND_ENABLED_STORAGE_KEY));
  } catch {
    return DEFAULT_SOUND_ENABLED;
  }
}

/**
 * Saves the audio feedback setting to localStorage.
 */
export function saveSoundEnabled(enabled: boolean): boolean {
  const next = Boolean(enabled);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SOUND_ENABLED_STORAGE_KEY, String(next));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}

/**
 * Determines whether a board state change should trigger the distinct 'over-limit'
 * notification sound. Returns true when any number newly crosses the limit OR when
 * an already over-limit number has its excess ('over') exposure increased.
 */
export function shouldTriggerOverLimitSound(
  prevOverLimit: ReadonlyArray<OverLimitSnapshotItem>,
  nextOverLimit: ReadonlyArray<OverLimitSnapshotItem>,
): boolean {
  if (nextOverLimit.length === 0) return false;
  const prevMap = new Map<string, number>();
  for (const item of prevOverLimit) {
    prevMap.set(item.no, Number(item.over) || 0);
  }
  for (const item of nextOverLimit) {
    const nextOver = Number(item.over) || 0;
    if (nextOver <= 0) continue;
    const prevOver = prevMap.get(item.no);
    if (prevOver === undefined || nextOver > prevOver) {
      return true;
    }
  }
  return false;
}

/**
 * Returns the deterministic Web Audio synthesis specification for each sound kind.
 */
export function getSoundSynthesisSpec(kind: 'click' | 'overLimit'): ToneStepSpec[] {
  if (kind === 'click') {
    // Crisp, subtle tactile click: fast downward pitch envelope (1150 Hz -> 340 Hz in 38ms)
    return [
      {
        type: 'triangle',
        startFreqHz: 1150,
        endFreqHz: 340,
        startTimeSec: 0,
        durationSec: 0.038,
        peakGain: 0.14,
      },
    ];
  }

  // Distinct two-tone rising notification chime for over-limit alerts
  return [
    {
      type: 'sine',
      startFreqHz: 880,
      endFreqHz: 880,
      startTimeSec: 0,
      durationSec: 0.085,
      peakGain: 0.16,
    },
    {
      type: 'triangle',
      startFreqHz: 1318.5,
      endFreqHz: 1318.5,
      startTimeSec: 0.09,
      durationSec: 0.16,
      peakGain: 0.18,
    },
  ];
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playSteps(steps: ToneStepSpec[]): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    for (const step of steps) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = step.type;
      const t0 = now + step.startTimeSec;
      const t1 = t0 + step.durationSec;

      osc.frequency.setValueAtTime(step.startFreqHz, t0);
      if (step.endFreqHz !== step.startFreqHz) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, step.endFreqHz), t1);
      }

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(step.peakGain, t0 + Math.min(0.006, step.durationSec * 0.2));
      gain.gain.exponentialRampToValueAtTime(0.0001, t1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t0);
      osc.stop(t1 + 0.005);
    }
  } catch {
    // Gracefully ignore audio context restrictions in headless/restricted environments
  }
}

/**
 * Plays a subtle, crisp 'click' sound on successful bet/carry entry.
 */
export function playEntryClickSound(enabled: boolean = true): void {
  if (!enabled) return;
  playSteps(getSoundSynthesisSpec('click'));
}

/**
 * Plays a distinct two-tone notification sound when a bet triggers or increases an 'over-limit' alert.
 */
export function playOverLimitAlertSound(enabled: boolean = true): void {
  if (!enabled) return;
  playSteps(getSoundSynthesisSpec('overLimit'));
}
