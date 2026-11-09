/**
 * Standalone Web App — Device & User Auto-Detect Engine
 *
 * Automatically detects whether the user is:
 *  1. New user or opening from a new device -> triggers a 100% Fresh Start
 *     (all tables clean and empty, default calc settings, new DeviceProfile).
 *  2. Returning user with existing data or initialized device -> starts
 *     normally and preserves all data.
 *
 * Also provisions a structured DeviceProfile (`deviceId`, `fingerprintHash`,
 * `isStandalone`, `authKey` hook) stored in both `localStorage` and IndexedDB
 * so the future License / Auth Server integration can authenticate the device
 * without changing storage schemas.
 */

export interface DeviceEnvironmentInfo {
  userAgent: string;
  platform: string;
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  language: string;
  hardwareConcurrency: number;
  isStandalone: boolean;
}

export type BootReason =
  | 'new_device'
  | 'fingerprint_mismatch_empty'
  | 'legacy_uninitialized_seed'
  | 'existing_user_data'
  | 'returning_device'
  | 'manual_reset';

export interface DeviceProfile {
  key: 'device_profile';
  deviceId: string;
  fingerprintHash: string;
  platformSummary: string;
  isStandalone: boolean;
  firstSeenAt: number;
  lastSeenAt: number;
  bootCount: number;
  lastBootMode: 'FRESH_START' | 'RETURNING_USER';
  bootReason: BootReason;
  /** Reserved hook for future Auth Key & Auth Server License verification */
  authKey: string | null;
  licenseStatus: 'unconfigured' | 'active' | 'expired' | 'pending';
  updatedAt: number;
}

export const DEVICE_STORAGE_KEY = 'easy2d.device.profile.v1';

/** FNV-1a 32-bit hash helper for deterministic fingerprint segments. */
function fnv1aHex(input: string, seed = 0x811c9dc5): string {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).toUpperCase().padStart(8, '0');
}

/** Extract a concise, human-readable OS + Browser summary from User-Agent. */
export function summarizePlatform(env: Pick<DeviceEnvironmentInfo, 'userAgent' | 'platform' | 'isStandalone'>): string {
  const ua = env.userAgent || '';
  let os = 'Desktop';
  if (/Windows/i.test(ua) || /Win/i.test(env.platform)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac/i.test(ua) || /Mac/i.test(env.platform)) os = 'macOS';
  else if (/Linux/i.test(ua) || /Linux/i.test(env.platform)) os = 'Linux';

  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';

  const mode = env.isStandalone ? 'Standalone App' : browser;
  return `${os} · ${mode}`;
}

/**
 * Compute a deterministic hardware/browser fingerprint hash from stable traits.
 * Used to detect when storage is opened on a different device and to bind
 * future Auth Server license keys.
 */
export function computeDeviceFingerprint(env: DeviceEnvironmentInfo): string {
  const canonical = [
    env.platform.trim().toLowerCase(),
    env.screenResolution.trim().toLowerCase(),
    String(env.colorDepth || 24),
    env.timezone.trim().toLowerCase(),
    env.language.trim().toLowerCase(),
    String(env.hardwareConcurrency || 4),
    summarizePlatform(env).toLowerCase(),
  ].join('|');

  const partA = fnv1aHex(canonical, 0x811c9dc5);
  const partB = fnv1aHex(canonical, 0x9e3779b9);
  return `FP-${partA.slice(0, 6)}-${partB.slice(0, 6)}`;
}

/**
 * Generate a structured Device ID (`E2D-XXXX-XXXX-XXXX`) where the first block
 * encodes the hardware fingerprint prefix and the remaining blocks uniquely
 * identify this installation.
 */
export function generateDeviceId(fingerprintHash: string, randomSeed?: string): string {
  const fpClean = fingerprintHash.replace(/[^A-Z0-9]/gi, '').slice(2, 6).toUpperCase().padEnd(4, '0');
  const entropy =
    randomSeed ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
  const seg2 = fnv1aHex(entropy, 0x811c9dc5).slice(0, 4);
  const seg3 = fnv1aHex(entropy, 0x01000193).slice(0, 4);
  return `E2D-${fpClean}-${seg2}-${seg3}`;
}

/** Collect current browser/device environment traits safely. */
export function collectBrowserEnvironment(): DeviceEnvironmentInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      userAgent: 'Server/Test',
      platform: 'Node',
      screenResolution: '1440x900',
      colorDepth: 24,
      timezone: 'Asia/Yangon',
      language: 'my',
      hardwareConcurrency: 4,
      isStandalone: false,
    };
  }
  const isStandalone =
    (typeof window.matchMedia === 'function' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches)) ||
    Boolean((navigator as unknown as { standalone?: boolean }).standalone);

  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    timezone = 'UTC';
  }

  const scr = typeof window.screen !== 'undefined' ? window.screen : { width: 1440, height: 900, colorDepth: 24 };
  return {
    userAgent: navigator.userAgent || '',
    platform: navigator.platform || '',
    screenResolution: `${scr.width || 0}x${scr.height || 0}`,
    colorDepth: scr.colorDepth || 24,
    timezone,
    language: navigator.language || 'my',
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
    isStandalone,
  };
}

/**
 * Detect whether the database only contains untouched legacy seed.json records
 * (from before the auto-detect feature was introduced) and zero real user bets.
 */
export function isUntouchedLegacySeedState(params: {
  codesCount: number;
  detailsCount: number;
  luckyCount: number;
  fighterNos: string[];
  ownerNos: string[];
}): boolean {
  if (params.codesCount > 0 || params.detailsCount > 0 || params.luckyCount > 0) {
    return false;
  }
  if (params.fighterNos.length === 0 && params.ownerNos.length === 0) {
    return false;
  }
  // Legacy seed.json had exactly 12 fighters including "41+", "000", "111", "222"
  // and 6 owners including "111".
  const legacySignatureFighters = ['41+', '000', '111', '222'];
  const hasAllLegacyFighters = legacySignatureFighters.every((no) => params.fighterNos.includes(no));
  return hasAllLegacyFighters && params.fighterNos.length === 12 && params.ownerNos.length === 6;
}

export interface BootDecisionInput {
  localProfile: DeviceProfile | null;
  dbProfile: DeviceProfile | null;
  currentFingerprint: string;
  hasTransactionalData: boolean;
  hasCustomUserRecords: boolean;
  isLegacySeedOnly: boolean;
}

export interface BootDecisionResult {
  action: 'FRESH_START' | 'NORMAL_START';
  reason: BootReason;
}

/**
 * Pure decision function for startup auto-detection:
 *  - If the user has existing transactional data (bets, carry, lucky draws),
 *    ALWAYS start normally (`NORMAL_START`) so existing work is never lost.
 *  - If the database only contains untouched legacy seed data and no initialized
 *    device profile, trigger `FRESH_START` to clear out the dummy seed.
 *  - If no device profile exists in localStorage or IndexedDB (and no custom user
 *    records exist), the user is new or on a new device -> `FRESH_START`.
 *  - If a device profile exists, check if the device fingerprint matches or if
 *    the user already has custom records -> `NORMAL_START`.
 */
export function decideBootAction(input: BootDecisionInput): BootDecisionResult {
  // 1. Old/existing user with saved transactional data -> always start normally
  if (input.hasTransactionalData) {
    return { action: 'NORMAL_START', reason: 'existing_user_data' };
  }

  // 2. Untouched legacy seed.json from before auto-detect -> clean fresh start
  if (input.isLegacySeedOnly && !input.localProfile && !input.dbProfile) {
    return { action: 'FRESH_START', reason: 'legacy_uninitialized_seed' };
  }

  const activeProfile = input.localProfile ?? input.dbProfile;

  // 3. Brand new user or opening on a new device with no profile & no custom data
  if (!activeProfile) {
    if (input.hasCustomUserRecords && !input.isLegacySeedOnly) {
      return { action: 'NORMAL_START', reason: 'existing_user_data' };
    }
    return { action: 'FRESH_START', reason: 'new_device' };
  }

  // 4. Profile exists, but opened on a different hardware fingerprint with zero data
  if (
    activeProfile.fingerprintHash &&
    activeProfile.fingerprintHash !== input.currentFingerprint &&
    !input.hasCustomUserRecords
  ) {
    return { action: 'FRESH_START', reason: 'fingerprint_mismatch_empty' };
  }

  // 5. Returning recognized device
  return { action: 'NORMAL_START', reason: 'returning_device' };
}

export function readLocalDeviceProfile(): DeviceProfile | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeviceProfile;
    if (!parsed || typeof parsed.deviceId !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLocalDeviceProfile(profile: DeviceProfile): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors in restricted frames
  }
}
