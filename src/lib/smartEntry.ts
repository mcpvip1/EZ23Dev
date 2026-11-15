import { expandEntryList } from '../shared-vendor/expand';

export interface LiveEntryPreview {
  valid: boolean;
  displayInput: string;
  count: number;
  rowCount: number;
  totalAmount: number | null;
  expandedPreviewCodes: string[];
  summaryText: string;
}

export interface DynamicKeyItem {
  id: string;
  codeToken: string;
  label: string;
  fullLabel: string;
  targetField: 'code' | 'amount';
  nextValue: string;
  moveFocusTo: 'code' | 'amount';
  active?: boolean;
}

const BURMESE_DIGIT_MAP: Readonly<Record<string, string>> = {
  '၀': '0',
  '၁': '1',
  '၂': '2',
  '၃': '3',
  '၄': '4',
  '၅': '5',
  '၆': '6',
  '၇': '7',
  '၈': '8',
  '၉': '9',
};

export function normalizeBurmeseDigits(input: string): string {
  return input.replace(/[၀-၉]/g, (ch) => BURMESE_DIGIT_MAP[ch] ?? ch);
}

/**
 * Groups a string of digits into 2-digit pairs separated by dots:
 * "1234567890" -> "12.34.56.78.90"
 * "123" -> "12.3"
 * "12" -> "12"
 */
export function groupTwoDigitPairs(digits: string): string {
  const clean = digits.replace(/\D/g, '');
  if (clean.length <= 2) return clean;
  const pairs: string[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    pairs.push(clean.slice(i, i + 2));
  }
  return pairs.join('.');
}

/**
 * Formats continuous digit typing in the နံပါတ် input into dot-separated 2-digit pairs
 * while handling Smart Backspace across auto-inserted dots and preserving pattern operators.
 */
export function formatContinuousCodeInput(nextRaw: string, prevRaw: string = ''): string {
  const normalized = normalizeBurmeseDigits(nextRaw);
  const prevNorm = normalizeBurmeseDigits(prevRaw);

  if (normalized === '') return '';

  // Smart Backspace:
  // 1) If previous value was e.g. "12.3" and user pressed Backspace -> browser gives "12."
  //    Cleanly remove the auto-inserted dot to leave "12".
  if (
    prevNorm.length === normalized.length + 1 &&
    /\.\d$/.test(prevNorm) &&
    normalized.endsWith('.') &&
    prevNorm.slice(0, -1) === normalized
  ) {
    return normalized.slice(0, -1);
  }

  // 2) If previous value ended with an explicit dot e.g. "12." and user pressed Backspace -> "12"
  //    Cleanly remove the dot AND preceding digit -> "1" if it was a multi-pair trailing dot,
  //    or leave "12" if they just wanted to remove the trailing dot.
  if (
    prevNorm.length === normalized.length + 1 &&
    prevNorm.endsWith('.') &&
    prevNorm.slice(0, -1) === normalized &&
    normalized.includes('.')
  ) {
    return normalized;
  }

  // Preserve explicit pattern codes that do not use dot grouping:
  // e.g. "//", "**", "*/", "/*", "++", "--", "+-", "-+", "5/", "/5", "5+", "5*", "+/5", "-/5",
  // "0+2", "12/34", "123+", "123++", "1234+" (when set without dots)
  if (!normalized.includes('.')) {
    if (
      /^\d{3,}\+{1,2}$/.test(normalized) ||
      /[/*\-]/.test(normalized) ||
      /^\+/.test(normalized) ||
      /^0\+\d$/.test(normalized) ||
      /^\d[+*\/]$/.test(normalized) ||
      /^\d{2}\+$/.test(normalized)
    ) {
      return normalized;
    }
  }

  // Allow user or key-bar to place an explicit trailing dot after 2 digits ("12.")
  if (/^\d{2}\.$/.test(normalized)) {
    return normalized;
  }

  // Continuous digits (with optional existing dots and optional trailing "+")
  if (/^[0-9.]+(\+)?$/.test(normalized)) {
    const hasTrailingPlus = normalized.endsWith('+');
    const digits = normalized.replace(/\D/g, '');
    if (digits.length === 0) return normalized;
    const grouped = groupTwoDigitPairs(digits);
    return hasTrailingPlus ? `${grouped}+` : grouped;
  }

  return normalized;
}

/**
 * Toggles or applies One-Tap Reverse All (+ အားလုံးပတ်လည်) on a 2-digit sequence.
 * E.g. "12.34.56.78.90" -> "12.34.56.78.90+"
 * If odd number of digits like "12.3", groups complete pairs or converts to "12.3+".
 */
export function toggleReverseAllCode(code: string): string {
  const trimmed = normalizeBurmeseDigits(code.trim());
  if (!trimmed) return '';
  if (trimmed.endsWith('+')) {
    const withoutPlus = trimmed.replace(/\++$/, '');
    const digits = withoutPlus.replace(/\D/g, '');
    return digits.length >= 3 ? groupTwoDigitPairs(digits) : withoutPlus;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 2) {
    // If there is an incomplete trailing single digit (e.g. "12.34.5"), drop or keep complete pairs
    const evenDigits =
      digits.length > 2 && digits.length % 2 === 1 ? digits.slice(0, -1) : digits;
    return `${groupTwoDigitPairs(evenDigits)}+`;
  }
  return `${trimmed}+`;
}

/**
 * Computes the Live Green Preview Bar state for the current code and amount.
 * E.g. "✓ 12.34.56.78.90 | 5 ကွက် · 5,000 Ks"
 */
export function computeLiveEntryPreview(code: string, amount: string): LiveEntryPreview | null {
  const cleanCode = normalizeBurmeseDigits(code.trim());
  if (!cleanCode) return null;

  const cleanAmt = normalizeBurmeseDigits(amount.trim());
  const hasValidTypedAmt = cleanAmt !== '' && cleanAmt !== '0';
  const probeAmt = hasValidTypedAmt ? cleanAmt : '1000';

  const expanded = expandEntryList(cleanCode, probeAmt);
  if (expanded.length === 0) return null;

  // Total expanded numbers (ကွက်)
  const count = expanded.reduce((sum, row) => {
    // For single row with totalCount override or standard numbers list
    return sum + row.numbers.length;
  }, 0);
  if (count === 0) return null;

  const totalAmount = hasValidTypedAmt
    ? expanded.reduce((sum, row) => sum + row.rowTotal, 0)
    : null;

  const displayInput = /^\d{2}\.$/.test(cleanCode) ? cleanCode.slice(0, 2) : cleanCode.toUpperCase();
  const expandedPreviewCodes = expanded.map((r) => r.displayCode);

  const formattedTotal =
    totalAmount !== null ? ` · ${totalAmount.toLocaleString('en-US')} Ks` : '';
  const summaryText = `✓ ${displayInput} | ${count} ကွက်${formattedTotal}`;

  return {
    valid: true,
    displayInput,
    count,
    rowCount: expanded.length,
    totalAmount,
    expandedPreviewCodes,
    summaryText,
  };
}

/**
 * Context-Aware Dynamic Key Bar generator.
 * Adapts to what the operator is typing in နံပါတ် (Code).
 * Never switches to quick amount presets when ပမာဏ (Amount) is focused.
 */
export function getDynamicKeyBarItems(
  code: string,
  _activeField: 'code' | 'amount' = 'code',
  _amount: string = '',
): DynamicKeyItem[] {
  const cleanCode = normalizeBurmeseDigits(code.trim());

  // Extract pure digits when checking digit count
  const isPureDigitsOrDots = /^[0-9.]+(\+{1,2})?$/.test(cleanCode);
  const rawDigits = isPureDigitsOrDots ? cleanCode.replace(/\D/g, '') : '';

  // 1. When နံပါတ် is Empty (or currently holds a standalone 2-symbol set)
  if (cleanCode === '' || ['//', '**', '*/', '/*', '++', '--', '+-', '-+'].includes(cleanCode)) {
    const standalone = [
      { token: '//', label: 'အပူး (10)' },
      { token: '**', label: 'ပါဝါ (10)' },
      { token: '*/', label: 'ညီကို (20)' },
      { token: '/*', label: 'နက္ခတ် (10)' },
      { token: '++', label: 'စုံစုံ (25)' },
      { token: '--', label: 'မမ (25)' },
      { token: '+-', label: 'စုံမ (25)' },
      { token: '-+', label: 'မစုံ (25)' },
    ];
    return standalone.map((item) => ({
      id: `empty-${item.token}`,
      codeToken: item.token,
      label: item.label,
      fullLabel: `${item.token} ${item.label}`,
      targetField: 'code',
      nextValue: item.token,
      moveFocusTo: 'amount',
      active: cleanCode === item.token,
    }));
  }

  // 2. When 1 Digit is Typed (e.g. "5", or a 1-digit pattern like "5/", "/5", "5+", "5*", "+/5", "-/5")
  const singleDigitMatch =
    rawDigits.length === 1
      ? rawDigits
      : /^([0-9])[/*+]$|^\/([0-9])$|^[+-]\/([0-9])$/.exec(cleanCode)?.slice(1).find(Boolean) ?? null;

  if (singleDigitMatch && rawDigits.length <= 1) {
    const d = singleDigitMatch;
    const oneDigitItems = [
      { token: `${d}/`, label: 'ထိပ်စီး (10)' },
      { token: `/${d}`, label: 'နောက်ပိတ် (10)' },
      { token: `${d}+`, label: 'အပါ (19)' },
      { token: `${d}*`, label: 'ဘရိတ် (10)' },
      { token: `+/${d}`, label: 'စုံကပ် (10)' },
      { token: `-/${d}`, label: 'မကပ် (10)' },
    ];
    return oneDigitItems.map((item) => ({
      id: `d1-${item.token}`,
      codeToken: item.token,
      label: item.label,
      fullLabel: `${item.token} ${item.label}`,
      targetField: 'code',
      nextValue: item.token,
      moveFocusTo: 'amount',
      active: cleanCode === item.token,
    }));
  }

  // 3. When 2 Digits are Typed (e.g. "12", "12+", "12.", "12/", or "0+k")
  const skipMatch = /^0\+([2-9])$/.exec(cleanCode);
  if (rawDigits.length === 2 || skipMatch || /^\d{2}\/$/.test(cleanCode)) {
    const dd = skipMatch ? `0${skipMatch[1]}` : rawDigits.slice(0, 2);
    const items: DynamicKeyItem[] = [
      {
        id: `d2-rev-${dd}`,
        codeToken: `${dd}+`,
        label: 'ပတ်လည် (2)',
        fullLabel: `${dd}+ ပတ်လည် (2)`,
        targetField: 'code',
        nextValue: `${dd}+`,
        moveFocusTo: 'amount',
        active: cleanCode === `${dd}+`,
      },
      {
        id: `d2-dot-${dd}`,
        codeToken: `${dd}.`,
        label: 'ဆက်ရိုက်ရန်',
        fullLabel: `${dd}. ဆက်ရိုက်ရန်`,
        targetField: 'code',
        nextValue: `${dd}.`,
        moveFocusTo: 'code',
        active: cleanCode === `${dd}.`,
      },
      {
        id: `d2-kap-${dd}`,
        codeToken: `${dd}/`,
        label: 'ထိပ်-နောက်ကပ်',
        fullLabel: `${dd}/ ထိပ်-နောက်ကပ်`,
        targetField: 'code',
        nextValue: `${dd}/`,
        moveFocusTo: 'code',
        active: cleanCode === `${dd}/`,
      },
    ];

    if (dd[0] === '0') {
      const k = dd[1] >= '2' && dd[1] <= '9' ? dd[1] : '2';
      items.push({
        id: `d2-skip-0+${k}`,
        codeToken: `0+${k}`,
        label: 'အကျော် (20)',
        fullLabel: `0+${k} အကျော် (20)`,
        targetField: 'code',
        nextValue: `0+${k}`,
        moveFocusTo: 'amount',
        active: cleanCode === `0+${k}`,
      });
    }

    return items;
  }

  // 4. When 3+ Digits are Typed (e.g. "12.3", "12.34", "12.34.56.78.90", "123+", "12/34")
  const slashDigits = cleanCode.includes('/') ? cleanCode.replace(/\D/g, '') : rawDigits;
  if (slashDigits.length >= 3) {
    const d3 = slashDigits.slice(0, 3);
    const d4 = slashDigits.length >= 4 ? slashDigits.slice(0, 4) : `${d3}4`;
    const kapLeft = slashDigits.slice(0, 2);
    const kapRight = slashDigits.length >= 4 ? slashDigits.slice(2, 4) : slashDigits.slice(2);
    const revAllValue = toggleReverseAllCode(cleanCode);
    const isRevAllActive = cleanCode.includes('.') && cleanCode.endsWith('+');

    const items: DynamicKeyItem[] = [
      {
        id: 'd3plus-rev-all',
        codeToken: '+',
        label: 'အားလုံးပတ်လည်',
        fullLabel: '+ အားလုံးပတ်လည်',
        targetField: 'code',
        nextValue: revAllValue,
        moveFocusTo: 'code',
        active: isRevAllActive,
      },
      {
        id: `d3plus-kwe3-${d3}`,
        codeToken: `${d3}+`,
        label: 'အခွေ (6 ကွက်)',
        fullLabel: `${d3}+ အခွေ (6 ကွက်)`,
        targetField: 'code',
        nextValue: `${d3}+`,
        moveFocusTo: 'amount',
        active: cleanCode === `${d3}+`,
      },
      {
        id: `d3plus-kwe3p-${d3}`,
        codeToken: `${d3}++`,
        label: 'အပူးပါအခွေ (9)',
        fullLabel: `${d3}++ အပူးပါအခွေ (9)`,
        targetField: 'code',
        nextValue: `${d3}++`,
        moveFocusTo: 'amount',
        active: cleanCode === `${d3}++`,
      },
      {
        id: `d3plus-kwe4-${d4}`,
        codeToken: `${d4}+`,
        label: 'အခွေ (12 ကွက်)',
        fullLabel: `${d4}+ အခွေ (12 ကွက်)`,
        targetField: 'code',
        nextValue: `${d4}+`,
        moveFocusTo: 'amount',
        active: cleanCode === `${d4}+`,
      },
      {
        id: `d3plus-kap-${kapLeft}-${kapRight}`,
        codeToken: `${kapLeft}/${kapRight}`,
        label: 'ကပ်',
        fullLabel: `${kapLeft}/${kapRight} ကပ်`,
        targetField: 'code',
        nextValue: `${kapLeft}/${kapRight}`,
        moveFocusTo: 'amount',
        active: cleanCode === `${kapLeft}/${kapRight}`,
      },
    ];

    // If 5+ digits (e.g. 5-digit အခွေ = 20 ကွက်), also offer full N-digit အခွေ when <= 7 digits
    if (slashDigits.length >= 5 && slashDigits.length <= 7) {
      const k = slashDigits.length;
      items.splice(4, 0, {
        id: `d3plus-kweN-${slashDigits}`,
        codeToken: `${slashDigits}+`,
        label: `အခွေ (${k * (k - 1)} ကွက်)`,
        fullLabel: `${slashDigits}+ အခွေ (${k * (k - 1)} ကွက်)`,
        targetField: 'code',
        nextValue: `${slashDigits}+`,
        moveFocusTo: 'amount',
        active: cleanCode === `${slashDigits}+`,
      });
    }

    return items;
  }

  return [];
}
