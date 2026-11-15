import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatContinuousCodeInput,
  computeLiveEntryPreview,
  getDynamicKeyBarItems,
  toggleReverseAllCode,
} from './smartEntry';
import { expandEntryList } from '../shared-vendor/expand';

describe('Continuous 2-Digit Typing & Smart Backspace', () => {
  it('automatically groups continuous digits into 2-digit pairs separated by dots', () => {
    assert.equal(formatContinuousCodeInput('1', ''), '1');
    assert.equal(formatContinuousCodeInput('12', '1'), '12');
    assert.equal(formatContinuousCodeInput('123', '12'), '12.3');
    assert.equal(formatContinuousCodeInput('12.34', '12.3'), '12.34');
    assert.equal(formatContinuousCodeInput('1234567890', ''), '12.34.56.78.90');
    assert.equal(formatContinuousCodeInput('၁၂၃၄၅၆၇၈၉၀', ''), '12.34.56.78.90');
  });

  it('cleanly removes auto-inserted dots on Backspace', () => {
    // When "12.3" has "3" deleted -> browser passes "12.", smart backspace removes "." -> "12"
    assert.equal(formatContinuousCodeInput('12.', '12.3'), '12');
    assert.equal(formatContinuousCodeInput('12.34.', '12.34.5'), '12.34');
  });

  it('supports One-Tap Reverse All (+ အားလုံးပတ်လည်) and expands all pairs as R', () => {
    const reversed = toggleReverseAllCode('12.34.56.78.90');
    assert.equal(reversed, '12.34.56.78.90+');

    const rows = expandEntryList(reversed, '1000');
    assert.equal(rows.length, 5);
    assert.deepEqual(
      rows.map((r) => r.displayCode),
      ['12 R', '34 R', '56 R', '78 R', '90 R'],
    );
    assert.equal(
      rows.reduce((s, r) => s + r.numbers.length, 0),
      10,
    );
    assert.equal(
      rows.reduce((s, r) => s + r.rowTotal, 0),
      10000,
    );
  });

  it('computes the Live Green Preview Bar with exact count and total Ks', () => {
    const preview = computeLiveEntryPreview('12.34.56.78.90', '1000');
    assert.ok(preview);
    assert.equal(preview.count, 5);
    assert.equal(preview.totalAmount, 5000);
    assert.equal(preview.summaryText, '✓ 12.34.56.78.90 | 5 ကွက် · 5,000 Ks');

    const previewNoAmt = computeLiveEntryPreview('12.34.56.78.90', '');
    assert.ok(previewNoAmt);
    assert.equal(previewNoAmt.count, 5);
    assert.equal(previewNoAmt.summaryText, '✓ 12.34.56.78.90 | 5 ကွက်');
  });
});

describe('Context-Aware Dynamic Key Bar', () => {
  it('shows standalone sets when နံပါတ် is empty', () => {
    const items = getDynamicKeyBarItems('', 'code');
    assert.deepEqual(
      items.map((i) => i.fullLabel),
      [
        '// အပူး (10)',
        '** ပါဝါ (10)',
        '*/ ညီကို (20)',
        '/* နက္ခတ် (10)',
        '++ စုံစုံ (25)',
        '-- မမ (25)',
        '+- စုံမ (25)',
        '-+ မစုံ (25)',
      ],
    );
  });

  it('shows 1-digit pattern keys when 1 digit is typed (e.g. 5)', () => {
    const items = getDynamicKeyBarItems('5', 'code');
    assert.deepEqual(
      items.map((i) => i.fullLabel),
      [
        '5/ ထိပ်စီး (10)',
        '/5 နောက်ပိတ် (10)',
        '5+ အပါ (19)',
        '5* ဘရိတ် (10)',
        '+/5 စုံကပ် (10)',
        '-/5 မကပ် (10)',
      ],
    );
  });

  it('shows 2-digit keys when 2 digits are typed (e.g. 12 and 05)', () => {
    const items12 = getDynamicKeyBarItems('12', 'code');
    assert.deepEqual(
      items12.map((i) => i.fullLabel),
      ['12+ ပတ်လည် (2)', '12. ဆက်ရိုက်ရန်', '12/ ထိပ်-နောက်ကပ်'],
    );

    const items05 = getDynamicKeyBarItems('05', 'code');
    assert.deepEqual(
      items05.map((i) => i.fullLabel),
      ['05+ ပတ်လည် (2)', '05. ဆက်ရိုက်ရန်', '05/ ထိပ်-နောက်ကပ်', '0+5 အကျော် (20)'],
    );
  });

  it('shows 3+ digit keys when 12.3 or 12.34 is typed', () => {
    const items1234 = getDynamicKeyBarItems('12.34', 'code');
    assert.deepEqual(
      items1234.map((i) => i.fullLabel),
      [
        '+ အားလုံးပတ်လည်',
        '123+ အခွေ (6 ကွက်)',
        '123++ အပူးပါအခွေ (9)',
        '1234+ အခွေ (12 ကွက်)',
        '12/34 ကပ်',
      ],
    );
  });

  it('does not switch to quick amount presets when ပမာဏ (Amount) is focused', () => {
    const items = getDynamicKeyBarItems('12.34', 'amount', '1000');
    assert.deepEqual(
      items.map((i) => i.fullLabel),
      [
        '+ အားလုံးပတ်လည်',
        '123+ အခွေ (6 ကွက်)',
        '123++ အပူးပါအခွေ (9)',
        '1234+ အခွေ (12 ကွက်)',
        '12/34 ကပ်',
      ],
    );
  });
});
