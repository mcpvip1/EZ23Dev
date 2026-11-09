import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDeviceFingerprint,
  decideBootAction,
  generateDeviceId,
  isUntouchedLegacySeedState,
  summarizePlatform,
} from './deviceDetect.ts';
import type { DeviceEnvironmentInfo, DeviceProfile } from './deviceDetect.ts';

const sampleEnvWin: DeviceEnvironmentInfo = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
  platform: 'Win32',
  screenResolution: '1920x1080',
  colorDepth: 24,
  timezone: 'Asia/Yangon',
  language: 'my-MM',
  hardwareConcurrency: 8,
  isStandalone: false,
};

const sampleEnvMacStandalone: DeviceEnvironmentInfo = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15',
  platform: 'MacIntel',
  screenResolution: '1440x900',
  colorDepth: 30,
  timezone: 'Asia/Yangon',
  language: 'en-US',
  hardwareConcurrency: 10,
  isStandalone: true,
};

test('computeDeviceFingerprint produces deterministic hashes per device hardware profile', () => {
  const fp1 = computeDeviceFingerprint(sampleEnvWin);
  const fp2 = computeDeviceFingerprint({ ...sampleEnvWin });
  const fpMac = computeDeviceFingerprint(sampleEnvMacStandalone);

  assert.equal(fp1, fp2);
  assert.match(fp1, /^FP-[0-9A-F]{6}-[0-9A-F]{6}$/);
  assert.notEqual(fp1, fpMac);
  assert.equal(summarizePlatform(sampleEnvWin), 'Windows · Chrome');
  assert.equal(summarizePlatform(sampleEnvMacStandalone), 'macOS · Standalone App');
});

test('generateDeviceId formats structured E2D-XXXX-XXXX-XXXX identifiers', () => {
  const fp = computeDeviceFingerprint(sampleEnvWin);
  const id1 = generateDeviceId(fp, 'seed-alpha');
  const id2 = generateDeviceId(fp, 'seed-beta');

  assert.match(id1, /^E2D-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
  assert.notEqual(id1, id2);
  // First segment encodes the hardware fingerprint prefix
  assert.equal(id1.slice(0, 8), id2.slice(0, 8));
});

test('isUntouchedLegacySeedState detects uninitialized legacy seed vs real user data', () => {
  const legacyFighters = ['1', '8', '9', '10', '11', '12', '00', '000', '111', '222', '41+', '3'];
  const legacyOwners = ['1', '2', '3', '4', '5', '111'];

  assert.equal(
    isUntouchedLegacySeedState({
      codesCount: 0,
      detailsCount: 0,
      luckyCount: 0,
      fighterNos: legacyFighters,
      ownerNos: legacyOwners,
    }),
    true,
  );

  // If user has placed even 1 bet, it is NOT untouched
  assert.equal(
    isUntouchedLegacySeedState({
      codesCount: 1,
      detailsCount: 2,
      luckyCount: 0,
      fighterNos: legacyFighters,
      ownerNos: legacyOwners,
    }),
    false,
  );

  // Clean empty database is not legacy seed
  assert.equal(
    isUntouchedLegacySeedState({
      codesCount: 0,
      detailsCount: 0,
      luckyCount: 0,
      fighterNos: [],
      ownerNos: [],
    }),
    false,
  );
});

test('decideBootAction routes new devices to FRESH_START and existing users to NORMAL_START', () => {
  const fpA = computeDeviceFingerprint(sampleEnvWin);
  const fpB = computeDeviceFingerprint(sampleEnvMacStandalone);
  const sampleProfile: DeviceProfile = {
    key: 'device_profile',
    deviceId: generateDeviceId(fpA, 'init'),
    fingerprintHash: fpA,
    platformSummary: 'Windows · Chrome',
    isStandalone: false,
    firstSeenAt: 1700000000000,
    lastSeenAt: 1700000000000,
    bootCount: 1,
    lastBootMode: 'FRESH_START',
    bootReason: 'new_device',
    authKey: null,
    licenseStatus: 'unconfigured',
    updatedAt: 1700000000000,
  };

  // Case 1: Brand new user / new device (no profile, no data) -> FRESH_START
  const resNew = decideBootAction({
    localProfile: null,
    dbProfile: null,
    currentFingerprint: fpA,
    hasTransactionalData: false,
    hasCustomUserRecords: false,
    isLegacySeedOnly: false,
  });
  assert.deepEqual(resNew, { action: 'FRESH_START', reason: 'new_device' });

  // Case 2: Old user with existing transactional data -> NORMAL_START even if localProfile was cleared
  const resExistingBets = decideBootAction({
    localProfile: null,
    dbProfile: null,
    currentFingerprint: fpA,
    hasTransactionalData: true,
    hasCustomUserRecords: true,
    isLegacySeedOnly: false,
  });
  assert.deepEqual(resExistingBets, { action: 'NORMAL_START', reason: 'existing_user_data' });

  // Case 3: Untouched legacy seed.json with no profile -> FRESH_START
  const resLegacy = decideBootAction({
    localProfile: null,
    dbProfile: null,
    currentFingerprint: fpA,
    hasTransactionalData: false,
    hasCustomUserRecords: false,
    isLegacySeedOnly: true,
  });
  assert.deepEqual(resLegacy, { action: 'FRESH_START', reason: 'legacy_uninitialized_seed' });

  // Case 4: Returning recognized device -> NORMAL_START
  const resReturning = decideBootAction({
    localProfile: sampleProfile,
    dbProfile: sampleProfile,
    currentFingerprint: fpA,
    hasTransactionalData: false,
    hasCustomUserRecords: false,
    isLegacySeedOnly: false,
  });
  assert.deepEqual(resReturning, { action: 'NORMAL_START', reason: 'returning_device' });

  // Case 5: Different device fingerprint with zero user records -> FRESH_START
  const resNewDeviceFp = decideBootAction({
    localProfile: sampleProfile,
    dbProfile: null,
    currentFingerprint: fpB,
    hasTransactionalData: false,
    hasCustomUserRecords: false,
    isLegacySeedOnly: false,
  });
  assert.deepEqual(resNewDeviceFp, { action: 'FRESH_START', reason: 'fingerprint_mismatch_empty' });
});
