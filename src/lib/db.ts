/**
 * EASY 2D web — local-first storage (IndexedDB, plain wrapper, no deps).
 *
 * Tables mirror the original Access DB (ANALYSIS §9.2) in simplified form:
 *  - people: Fighter / Owner master data (No, commission %, rate)
 *  - codes: one row per typed code (BetCode / CarryCode)
 *  - details: one row per expanded 2D number (Bet / Carry)
 *  - lucky: draw results keyed by BetDay + AM/PM
 *  - templates / groups: copy-paste snippets and named pattern packs
 *  - settings: Calc row (limit / commission / rate) + DeviceProfile row
 *
 * Auto-Detect Startup Behavior:
 *  - If the user is new or opens from a new device -> 100% Fresh Start
 *    (all stores start clean and empty, default Calc settings).
 *  - If the user is an existing user with data -> starts normally and
 *    preserves all existing records.
 */
import seedJson from '../seed.json';
import {
  collectBrowserEnvironment,
  computeDeviceFingerprint,
  decideBootAction,
  generateDeviceId,
  isUntouchedLegacySeedState,
  readLocalDeviceProfile,
  summarizePlatform,
  writeLocalDeviceProfile,
} from './deviceDetect';
import type { BootReason, DeviceProfile } from './deviceDetect';

export type Session = 'AM' | 'PM';
export type Side = 'bet' | 'carry';

export interface Person {
  id: string; // `F:<no>` or `O:<no>`
  side: 'fighter' | 'owner';
  no: string;
  name: string;
  commission: number;
  rate: number;
  updatedAt: number;
}

export interface SavedCode {
  id: string;
  side: Side;
  betDay: string; // YYYY-MM-DD
  session: Session;
  personNo: string;
  displayCode: string;
  codeNo: string;
  amountText: string;
  rowTotal: number;
  commission: number;
  rate: number;
  groupId: number;
  sno: number;
  betDateTime: string;
  /** Set when a saved row was changed in Browse (Bet.cs sets edited=1). */
  edited?: boolean;
  updatedAt: number;
}

export interface DetailRow {
  id: string;
  side: Side;
  betDay: string;
  session: Session;
  personNo: string;
  no: string; // 2-digit number, e.g. "62"
  amount: number;
  commission: number;
  rate: number;
  sno: number;
  groupId: number;
  updatedAt: number;
}

export interface Lucky {
  key: string; // `${betDay}|${session}`
  betDay: string;
  session: Session;
  no: string;
  noR: string;
  updatedAt: number;
}

export interface TemplateItem {
  no: number;
  text: string;
  updatedAt: number;
}

export interface GroupPack {
  name: string;
  rows: { code: string; amount: string }[];
  updatedAt: number;
}

export interface CalcSettings {
  key: 'calc';
  limit: number;
  commission: number;
  rate: number;
  updatedAt: number;
}

export interface AllData {
  people: Person[];
  codes: SavedCode[];
  details: DetailRow[];
  lucky: Lucky[];
  templates: TemplateItem[];
  groups: GroupPack[];
  settings: CalcSettings | null;
  deviceProfile?: DeviceProfile | null;
}

const DB_NAME = 'easy2d';
const DB_VERSION = 1;
const STORES = ['people', 'codes', 'details', 'lucky', 'templates', 'groups', 'settings'] as const;
type StoreName = (typeof STORES)[number];

/**
 * Storage fallback. Some hosting frames (sandboxed / opaque-origin webviews)
 * make IndexedDB throw, error, or — worst — never answer at all, which used
 * to leave the app stuck on its loading screen forever. The first storage
 * probe therefore runs with a timeout and a blocked handler; if IndexedDB
 * does not answer cleanly, every operation below is served from an in-memory
 * copy instead, so the app always loads and works for the session (entries
 * are then kept only while the page stays open). When IndexedDB works, the
 * in-memory copy is never used and existing on-device data is untouched.
 */
const KEY_FIELD: Record<StoreName, string> = {
  people: 'id',
  codes: 'id',
  details: 'id',
  lucky: 'key',
  templates: 'no',
  groups: 'name',
  settings: 'key',
};
const memStores = new Map<StoreName, Map<string, unknown>>(
  STORES.map((s) => [s, new Map<string, unknown>()]),
);
let storageMode: 'unknown' | 'idb' | 'memory' = 'unknown';
let storageProbe: Promise<'idb' | 'memory'> | null = null;

/** True once the app has fallen back to in-memory storage for this session. */
export function usingMemoryStorage(): boolean {
  return storageMode === 'memory';
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    let settled = false;
    const fail = (e: unknown) => {
      if (!settled) {
        settled = true;
        dbPromise = null;
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    // A blocked or ignored open must never hang the app: give up after 1.5s.
    const timer = setTimeout(() => fail(new Error('IndexedDB open timed out')), 1500);
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (e) {
      clearTimeout(timer);
      fail(e);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('people')) db.createObjectStore('people', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('codes')) db.createObjectStore('codes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('details')) db.createObjectStore('details', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('lucky')) db.createObjectStore('lucky', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('templates')) db.createObjectStore('templates', { keyPath: 'no' });
      if (!db.objectStoreNames.contains('groups')) db.createObjectStore('groups', { keyPath: 'name' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
    };
    req.onsuccess = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        const db = req.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      }
    };
    req.onerror = () => {
      clearTimeout(timer);
      fail(req.error ?? new Error('IndexedDB open failed'));
    };
    req.onblocked = () => {
      clearTimeout(timer);
      fail(new Error('IndexedDB open blocked'));
    };
  });
  return dbPromise;
}

/** One-time probe: resolve to 'idb' only if a real open + read succeeds. */
function probeStorage(): Promise<'idb' | 'memory'> {
  if (!storageProbe) {
    storageProbe = (async () => {
      try {
        const db = await openDb();
        await new Promise<void>((resolve, reject) => {
          const t = db.transaction('people', 'readonly');
          const r = t.objectStore('people').getAll();
          r.onsuccess = () => resolve();
          r.onerror = () => reject(r.error);
          t.onerror = () => reject(t.error);
        });
        storageMode = 'idb';
        return 'idb';
      } catch {
        storageMode = 'memory';
        return 'memory';
      }
    })();
  }
  return storageProbe;
}

async function useMemory(): Promise<boolean> {
  return (await probeStorage()) === 'memory';
}

function memKey(store: StoreName, value: unknown): string {
  const rec = value as Record<string, unknown>;
  return String(rec[KEY_FIELD[store]]);
}

function tx<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.onerror = () => reject(t.error);
      }),
  );
}

export async function dbGetAll<T>(store: StoreName): Promise<T[]> {
  if (await useMemory()) return [...(memStores.get(store)!.values() as Iterable<T>)];
  return tx<T[]>(store, 'readonly', (s) => s.getAll());
}

export async function dbPut<T>(store: StoreName, value: T): Promise<void> {
  if (await useMemory()) {
    memStores.get(store)!.set(memKey(store, value), value);
    return;
  }
  await tx(store, 'readwrite', (s) => s.put(value as never));
}

export async function dbPutMany<T>(store: StoreName, values: T[]): Promise<void> {
  if (await useMemory()) {
    const m = memStores.get(store)!;
    values.forEach((v) => m.set(memKey(store, v), v));
    return;
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(store, 'readwrite');
    const s = t.objectStore(store);
    values.forEach((v) => s.put(v as never));
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function dbDelete(store: StoreName, key: IDBValidKey): Promise<void> {
  if (await useMemory()) {
    memStores.get(store)!.delete(String(key));
    return;
  }
  await tx(store, 'readwrite', (s) => s.delete(key));
}

export async function dbClear(store: StoreName): Promise<void> {
  if (await useMemory()) {
    memStores.get(store)!.clear();
    return;
  }
  await tx(store, 'readwrite', (s) => s.clear());
}

/**
 * Browse helpers (Bet.cs / Carry.cs): detail rows are keyed to their
 * code row by (side, sno) — sno is unique per side across the whole
 * database (App saveSide takes max(sno)+1), so deleting by sno removes
 * exactly one code's numbers.
 */
export async function deleteDetailsForSno(side: Side, sno: number): Promise<void> {
  const rows = (await dbGetAll<DetailRow>('details')).filter((d) => d.side === side && d.sno === sno);
  for (const r of rows) await dbDelete('details', r.id);
}

/** Delete one saved code row and all of its detail rows. */
export async function deleteSavedCode(code: SavedCode): Promise<void> {
  await dbDelete('codes', code.id);
  await deleteDetailsForSno(code.side, code.sno);
}

/**
 * Save an edited code row (Bet.cs cmdEditSave_Click): update the code
 * row itself (new displayCode/codeNo/amountText/rowTotal/betDateTime,
 * edited=1), drop its old detail rows and insert the re-expanded ones.
 * The caller builds `newDetails` with the code's sno/groupId/person.
 */
export async function updateSavedCode(code: SavedCode, newDetails: DetailRow[]): Promise<void> {
  await dbPut('codes', { ...code, edited: true, updatedAt: Date.now() });
  await deleteDetailsForSno(code.side, code.sno);
  if (newDetails.length > 0) await dbPutMany('details', newDetails);
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const h = d.getHours();
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${h12}:${p(d.getMinutes())} ${ampm}`;
}

export function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function sessionFromClock(): Session {
  // Original default session: hour < 13 -> AM, 13:00 and later -> PM.
  return new Date().getHours() < 13 ? 'AM' : 'PM';
}

const DEFAULT_CALC: Omit<CalcSettings, 'updatedAt'> = {
  key: 'calc',
  limit: seedJson.calc?.limit ?? 40000,
  commission: seedJson.calc?.commission ?? 16,
  rate: seedJson.calc?.rate ?? 80,
};

/**
 * Wipe all local stores and initialize a 100% clean Fresh Start state
 * for a new user or a newly detected device.
 */
export async function resetToFreshStart(reason: BootReason = 'new_device'): Promise<DeviceProfile> {
  const now = Date.now();
  await Promise.all([
    dbClear('people'),
    dbClear('codes'),
    dbClear('details'),
    dbClear('lucky'),
    dbClear('templates'),
    dbClear('groups'),
    dbClear('settings'),
  ]);

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem('easy2d-closedays');
    } catch {
      // Ignore storage errors
    }
  }

  const env = collectBrowserEnvironment();
  const fp = computeDeviceFingerprint(env);
  const existingLocal = readLocalDeviceProfile();
  const deviceId =
    existingLocal && existingLocal.fingerprintHash === fp
      ? existingLocal.deviceId
      : generateDeviceId(fp);

  const profile: DeviceProfile = {
    key: 'device_profile',
    deviceId,
    fingerprintHash: fp,
    platformSummary: summarizePlatform(env),
    isStandalone: env.isStandalone,
    firstSeenAt: now,
    lastSeenAt: now,
    bootCount: 1,
    lastBootMode: 'FRESH_START',
    bootReason: reason,
    authKey: existingLocal?.authKey ?? null,
    licenseStatus: existingLocal?.licenseStatus ?? 'unconfigured',
    updatedAt: now,
  };

  await dbPut('settings', {
    ...DEFAULT_CALC,
    updatedAt: now,
  } as CalcSettings);
  await dbPut('settings', profile);
  writeLocalDeviceProfile(profile);

  return profile;
}

/**
 * Auto-detect whether this browser/device is a new user/device (Fresh Start)
 * or an existing returning user with data (Normal Start).
 */
export async function autoDetectAndInitialize(): Promise<{ profile: DeviceProfile; isFreshStart: boolean }> {
  const env = collectBrowserEnvironment();
  const currentFingerprint = computeDeviceFingerprint(env);
  const localProfile = readLocalDeviceProfile();
  const all = await loadAll();
  const dbProfile = all.deviceProfile ?? null;

  const hasTransactionalData = all.codes.length > 0 || all.details.length > 0 || all.lucky.length > 0;
  const fighterNos = all.people.filter((p) => p.side === 'fighter').map((p) => p.no);
  const ownerNos = all.people.filter((p) => p.side === 'owner').map((p) => p.no);
  const isLegacySeedOnly = isUntouchedLegacySeedState({
    codesCount: all.codes.length,
    detailsCount: all.details.length,
    luckyCount: all.lucky.length,
    fighterNos,
    ownerNos,
  });
  const hasCustomUserRecords =
    !isLegacySeedOnly && (all.people.length > 0 || all.templates.length > 0 || all.groups.length > 0);

  const decision = decideBootAction({
    localProfile,
    dbProfile,
    currentFingerprint,
    hasTransactionalData,
    hasCustomUserRecords,
    isLegacySeedOnly,
  });

  if (decision.action === 'FRESH_START') {
    const profile = await resetToFreshStart(decision.reason);
    return { profile, isFreshStart: true };
  }

  // Returning user / existing data -> start normally and preserve all records!
  const now = Date.now();
  if (!all.settings) {
    await dbPut('settings', {
      ...DEFAULT_CALC,
      updatedAt: now,
    } as CalcSettings);
  }

  const baseProfile = localProfile ?? dbProfile;
  const profile: DeviceProfile = {
    key: 'device_profile',
    deviceId: baseProfile?.deviceId ?? generateDeviceId(currentFingerprint),
    fingerprintHash: currentFingerprint,
    platformSummary: summarizePlatform(env),
    isStandalone: env.isStandalone,
    firstSeenAt: baseProfile?.firstSeenAt ?? now,
    lastSeenAt: now,
    bootCount: (baseProfile?.bootCount ?? 0) + 1,
    lastBootMode: 'RETURNING_USER',
    bootReason: decision.reason,
    authKey: baseProfile?.authKey ?? null,
    licenseStatus: baseProfile?.licenseStatus ?? 'unconfigured',
    updatedAt: now,
  };

  await dbPut('settings', profile);
  writeLocalDeviceProfile(profile);

  return { profile, isFreshStart: false };
}

/** Backwards-compatible alias that runs the auto-detect startup flow. */
export async function seedIfEmpty(): Promise<void> {
  await autoDetectAndInitialize();
}

/** Optional helper to load legacy sample master data (fighters/owners/templates/groups) on demand. */
export async function loadSampleMasterData(): Promise<void> {
  const now = Date.now();
  const seedPeople: Person[] = [
    ...(seedJson.fighters as { no: string; name: string; commission: number; rate: number }[]).map((f) => ({
      id: `F:${f.no}`,
      side: 'fighter' as const,
      no: f.no,
      name: f.name ?? '',
      commission: f.commission,
      rate: f.rate,
      updatedAt: now,
    })),
    ...(seedJson.owners as { no: string; name: string; commission: number; rate: number }[]).map((o) => ({
      id: `O:${o.no}`,
      side: 'owner' as const,
      no: o.no,
      name: o.name ?? '',
      commission: o.commission,
      rate: o.rate,
      updatedAt: now,
    })),
  ];
  await dbPutMany('people', seedPeople);
  await dbPutMany(
    'templates',
    (seedJson.templates as { no: number; text: string }[]).map((t) => ({ ...t, updatedAt: now })),
  );
  await dbPutMany(
    'groups',
    (seedJson.groups as { name: string; rows: { code: string; amount: string }[] }[]).map((g) => ({ ...g, updatedAt: now })),
  );
}

export async function loadAll(): Promise<AllData> {
  const [people, codes, details, lucky, templates, groups, rawSettings] = await Promise.all([
    dbGetAll<Person>('people'),
    dbGetAll<SavedCode>('codes'),
    dbGetAll<DetailRow>('details'),
    dbGetAll<Lucky>('lucky'),
    dbGetAll<TemplateItem>('templates'),
    dbGetAll<GroupPack>('groups'),
    dbGetAll<CalcSettings | DeviceProfile>('settings'),
  ]);
  const calc = (rawSettings.find((s) => s.key === 'calc') as CalcSettings | undefined) ?? null;
  const deviceProfile =
    (rawSettings.find((s) => s.key === 'device_profile') as DeviceProfile | undefined) ??
    readLocalDeviceProfile();
  return { people, codes, details, lucky, templates, groups, settings: calc, deviceProfile };
}

/**
 * §9.3 worked-example fixture — loads ONLY these numbers into the separate
 * test session date 2024-04-11 (never seeded by default):
 *  Fighter 12 AM: 55,000, no win (draw 62) -> Net 46,750
 *  Fighter 12 PM: 51,950, WinAmt 250 on 82 -> Net 24,157.5
 *  Draws: AM 62 (reverse 26), PM 82 (reverse 28).
 * PM detail rows: 82 x 250 (the winner) + 55 x 51,700 = 51,950.
 * AM detail rows: 55 x 55,000 (no row on 62, so no win).
 */
export async function loadFixture(): Promise<void> {
  const now = Date.now();
  const day = '2024-04-11';
  // Ensure Fighter 12 exists so settlement verify works even from a fresh start
  await dbPut('people', {
    id: 'F:12',
    side: 'fighter',
    no: '12',
    name: '',
    commission: 15,
    rate: 80,
    updatedAt: now,
  });
  const mk = (side: Side, session: Session, personNo: string, no: string, amount: number, sno: number, groupId: number): DetailRow => ({
    id: `fixture-${day}-${session}-${sno}`,
    side,
    betDay: day,
    session,
    personNo,
    no,
    amount,
    commission: 15,
    rate: 80,
    sno,
    groupId,
    updatedAt: now,
  });
  const details: DetailRow[] = [
    mk('bet', 'AM', '12', '55', 55000, 1, 1),
    mk('bet', 'PM', '12', '82', 250, 2, 2),
    mk('bet', 'PM', '12', '55', 51700, 3, 2),
  ];
  const codes: SavedCode[] = [
    { id: `fixture-code-${day}-AM-1`, side: 'bet', betDay: day, session: 'AM', personNo: '12', displayCode: '55', codeNo: '55', amountText: '55000', rowTotal: 55000, commission: 15, rate: 80, groupId: 1, sno: 1, betDateTime: `${day} 10:00 AM`, updatedAt: now },
    { id: `fixture-code-${day}-PM-2`, side: 'bet', betDay: day, session: 'PM', personNo: '12', displayCode: '82', codeNo: '82', amountText: '250', rowTotal: 250, commission: 15, rate: 80, groupId: 2, sno: 2, betDateTime: `${day} 4:00 PM`, updatedAt: now },
    { id: `fixture-code-${day}-PM-3`, side: 'bet', betDay: day, session: 'PM', personNo: '12', displayCode: '55', codeNo: '55', amountText: '51700', rowTotal: 51700, commission: 15, rate: 80, groupId: 2, sno: 3, betDateTime: `${day} 4:00 PM`, updatedAt: now },
  ];
  const lucky: Lucky[] = [
    { key: `${day}|AM`, betDay: day, session: 'AM', no: '62', noR: '26', updatedAt: now },
    { key: `${day}|PM`, betDay: day, session: 'PM', no: '82', noR: '28', updatedAt: now },
  ];
  await dbPutMany('details', details);
  await dbPutMany('codes', codes);
  await dbPutMany('lucky', lucky);
}

export type DeleteScope = 'sales' | 'carry' | 'salesCarryLucky' | 'lucky' | 'fighter' | 'owner' | 'all';

/**
 * Bulk delete, mirroring the original Delete form: a date bound
 * ("Up to" <= date, or "From" >= date) applies to the sales/carry/lucky
 * scopes; 'fighter'/'owner' delete that side's master rows plus their
 * codes/details; 'all' wipes codes, details, lucky and people (templates,
 * groups and settings are kept). Returns the number of rows removed.
 */
export async function deleteScope(betDay: string, mode: 'upto' | 'from', scope: DeleteScope): Promise<number> {
  const inBound = (d: string) => (mode === 'upto' ? d <= betDay : d >= betDay);
  let n = 0;
  const all = await loadAll();
  const del = async (store: StoreName, key: IDBValidKey) => {
    await dbDelete(store, key);
    n++;
  };
  if (scope === 'sales' || scope === 'salesCarryLucky' || scope === 'all') {
    for (const c of all.codes.filter((c) => c.side === 'bet' && (scope === 'all' || inBound(c.betDay)))) await del('codes', c.id);
    for (const d of all.details.filter((d) => d.side === 'bet' && (scope === 'all' || inBound(d.betDay)))) await del('details', d.id);
  }
  if (scope === 'carry' || scope === 'salesCarryLucky' || scope === 'all') {
    for (const c of all.codes.filter((c) => c.side === 'carry' && (scope === 'all' || inBound(c.betDay)))) await del('codes', c.id);
    for (const d of all.details.filter((d) => d.side === 'carry' && (scope === 'all' || inBound(d.betDay)))) await del('details', d.id);
  }
  if (scope === 'lucky' || scope === 'salesCarryLucky' || scope === 'all') {
    for (const l of all.lucky.filter((l) => scope === 'all' || inBound(l.betDay))) await del('lucky', l.key);
  }
  if (scope === 'fighter' || scope === 'all') {
    for (const p of all.people.filter((x) => x.side === 'fighter')) await del('people', p.id);
  }
  if (scope === 'owner' || scope === 'all') {
    for (const p of all.people.filter((x) => x.side === 'owner')) await del('people', p.id);
  }
  return n;
}

/** Import merge: replace/merge by id, latest updatedAt wins. Returns counts. */
export async function importData(data: AllData): Promise<{ added: number; updated: number; skipped: number }> {
  let added = 0;
  let updated = 0;
  let skipped = 0;
  const merge = async <T extends { updatedAt: number }>(store: StoreName, items: T[], keyOf: (v: T) => IDBValidKey) => {
    const existing = await dbGetAll<T>(store);
    const byKey = new Map<string, T>(existing.map((v) => [String(keyOf(v)), v]));
    for (const item of items) {
      const k = String(keyOf(item));
      const old = byKey.get(k);
      if (!old) {
        await dbPut(store, item);
        added++;
      } else if ((item.updatedAt ?? 0) >= (old.updatedAt ?? 0)) {
        await dbPut(store, item);
        updated++;
      } else {
        skipped++;
      }
    }
  };
  await merge('people', data.people ?? [], (v) => v.id);
  await merge('codes', data.codes ?? [], (v) => v.id);
  await merge('details', data.details ?? [], (v) => v.id);
  await merge('lucky', data.lucky ?? [], (v) => v.key);
  await merge('templates', data.templates ?? [], (v) => v.no);
  await merge('groups', data.groups ?? [], (v) => v.name);
  if (data.settings) {
    const allSettings = await dbGetAll<CalcSettings | DeviceProfile>('settings');
    const cur = allSettings.find((s) => s.key === 'calc') as CalcSettings | undefined;
    if (!cur || (data.settings.updatedAt ?? 0) >= (cur.updatedAt ?? 0)) {
      await dbPut('settings', { ...data.settings, key: 'calc' });
    }
  }
  return { added, updated, skipped };
}
