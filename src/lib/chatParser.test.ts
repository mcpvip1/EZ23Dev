import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertBurmeseNumerals,
  normalizeChatMessage,
  parseSingleChatLine,
  parseChatMessage,
} from './chatParser';

test('Burmese numeral conversion', () => {
  assert.equal(convertBurmeseNumerals('၁၂၃၄၅၆၇၈၉၀'), '1234567890');
  assert.equal(convertBurmeseNumerals('၄၃+ ၅၀၀'), '43+ 500');
});

test('Burmese keyword normalization', () => {
  // 'ပတ်လည်' -> '+'
  assert.equal(normalizeChatMessage('43 ပတ်လည် 1000 ks').trim(), '43 + 1000');
  // 'အပူး' -> '//'
  assert.equal(normalizeChatMessage('အပူး 500 ကျပ်').trim(), '// 500');
  // 'ပါဝါ' -> '**'
  assert.equal(normalizeChatMessage('ပါဝါ 1000').trim(), '** 1000');
  // 'နက္ခတ်' -> 'n'
  assert.equal(normalizeChatMessage('နက္ခတ် 500').trim(), 'n 500');
});

test('parseSingleChatLine with various standard formats', () => {
  // Code = Amount
  const r1 = parseSingleChatLine('43+ = 1000', 0);
  assert.equal(r1.status, 'valid');
  assert.equal(r1.normalizedCode, '43+');
  assert.equal(r1.amount, '1000');
  assert.equal(r1.expandedCount, 2); // 43, 34
  assert.equal(r1.rowTotal, 2000);

  // Space separated
  const r2 = parseSingleChatLine('// 500', 1);
  assert.equal(r2.status, 'valid');
  assert.equal(r2.expandedCount, 10); // 00, 11, ... 99

  // Comma-separated list with dash
  const r3 = parseSingleChatLine('12, 34, 56 - 500', 2);
  assert.equal(r3.status, 'valid');
  assert.equal(r3.expandedCount, 3);
  assert.equal(r3.rowTotal, 1500);

  // Burmese text line
  const r4 = parseSingleChatLine('၄၃ ပတ်လည် = ၁၀၀၀ ကျပ်', 3);
  assert.equal(r4.status, 'valid');
  assert.equal(r4.amount, '1000');
  assert.equal(r4.expandedCount, 2);
});

test('parseSingleChatLine noise filtering', () => {
  const g1 = parseSingleChatLine('မင်္ဂလာပါ အစ်ကို', 0);
  assert.equal(g1.status, 'ignored');

  const g2 = parseSingleChatLine('မနက်ခင်း 2D', 1);
  assert.equal(g2.status, 'ignored');

  const g3 = parseSingleChatLine('ကျေးဇူးပါ', 2);
  assert.equal(g3.status, 'ignored');

  const g4 = parseSingleChatLine('Total: 50,000', 3);
  assert.equal(g4.status, 'ignored');
});

test('parseChatMessage full multi-line chat message with report', () => {
  const chatText = `
Ko Aung
မနက်ခင်းအတွက်
43+ = 1000
12 34 56 = 500
// = 1000
5* = 500
ကျေးဇူးတင်ပါတယ်
  `;

  const report = parseChatMessage(chatText);
  assert.equal(report.validCount, 4);
  assert.equal(report.ignoredCount, 3);
  assert.equal(report.warningCount, 0);
  assert.ok(report.totalAmount > 0);
  assert.ok(report.totalRows > 0);
  assert.ok(report.receiptText.includes('OK Thanks!'));
  assert.ok(report.receiptText.includes('43+'));
});
