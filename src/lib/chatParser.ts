/**
 * Smart Chat Message Ingestion & Normalizer for Myanmar 2D Bets
 * Supports Viber, Telegram, SMS, Facebook Messenger copy-pastes:
 * - Burmese numerals (၀-၉) -> (0-9)
 * - Burmese lottery terminology (ပတ်လည်, အပူး, ပါဝါ, နက္ခတ်, ညီကို)
 * - Delimiters (=, -, :, spaces, commas, tabs)
 * - Multi-code lists (e.g. "12, 34, 56 = 500")
 * - Split amounts (e.g. "43+ 500/500")
 * - Noise filtering (greetings, totals, currency suffixes)
 */

import { expandCode, expandEntryList } from '../shared-vendor/expand';

export interface ParsedChatBet {
  id: string;
  rawLine: string;
  normalizedCode: string;
  amount: string;
  amountNum: number;
  status: 'valid' | 'warning' | 'ignored';
  message?: string;
  expandedCount: number;
  expandedNumbers: { no: string; amount: number }[];
  rowTotal: number;
}

export interface ChatParseReport {
  lines: ParsedChatBet[];
  totalRows: number;
  totalAmount: number;
  validCount: number;
  warningCount: number;
  ignoredCount: number;
  customerTag?: string;
  receiptText: string;
}

const BURMESE_DIGIT_MAP: Record<string, string> = {
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

export function convertBurmeseNumerals(text: string): string {
  return text.replace(/[၀-၉]/g, (ch) => BURMESE_DIGIT_MAP[ch] ?? ch);
}

/**
 * Normalizes Burmese lottery jargon and strips common chat conversational noise.
 */
export function normalizeChatMessage(rawText: string): string {
  let text = convertBurmeseNumerals(rawText);

  // Replace common Burmese lottery terms with EASY 2D shorthand equivalents
  text = text
    .replace(/(?:ပတ်လည်|ခွေ|ရံ)/gi, '+')
    .replace(/(?:အပူး|ပူး)/gi, '//')
    .replace(/(?:ပါဝါ|ပါဝ)/gi, '**')
    .replace(/(?:နက္ခတ်|နခတ်)/gi, 'n')
    .replace(/(?:ညီအစ်ကို|ညီကို)/gi, '*/')
    .replace(/(?:အကြီး|အကြီးထိပ်)/gi, 'z')
    .replace(/(?:အသေး|အသေးထိပ်)/gi, 'a');

  // Strip currency words: ks, k, kyats, ကျပ်, ကျပ်တိတိ, /-
  text = text.replace(/(?:ks|kyats?|ကျပ်တိတိ|ကျပ်|\/-)/gi, '');

  return text;
}

const NOISE_LINE_PATTERNS = [
  /^(?:မနက်|ညနေ|မနက်ခင်း|ညနေခင်း|am|pm|today|date)/i,
  /^(?:မင်္ဂလာပါ|ဟဲလို|hello|hi|brother|bro|အစ်ကို|ကို|ဆရာ|ko\s+)/i,
  /^(?:ကျေးဇူး|ကျေးဇူးပါ|ကျေးဇူးတင်ပါတယ်|ok|thanks|ok\s*thanks)/i,
  /^(?:စုစုပေါင်း|total|all\s*total|net|sum)/i,
  /^[=\-_*~#]{3,}$/,
];

function isNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  for (const pattern of NOISE_LINE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  // Lines with no numbers at all are treated as greetings, names, or non-bet text
  if (!/\d/.test(convertBurmeseNumerals(trimmed))) {
    return true;
  }
  return false;
}

/**
 * Parse a single chat line into bet code and amount
 */
export function parseSingleChatLine(rawLine: string, index: number): ParsedChatBet {
  const trimmed = rawLine.trim();
  const id = `chat-line-${index}-${Date.now().toString(36)}`;

  if (isNoiseLine(trimmed)) {
    return {
      id,
      rawLine,
      normalizedCode: '',
      amount: '',
      amountNum: 0,
      status: 'ignored',
      message: 'Ignored chat greeting / customer name / header / footer',
      expandedCount: 0,
      expandedNumbers: [],
      rowTotal: 0,
    };
  }

  // Normalize Burmese digits & keywords
  const normalized = normalizeChatMessage(trimmed);

  // Remove commas in numbers: e.g. "10,000" -> "10000"
  const cleanLine = normalized.replace(/(\d),(\d)/g, '$1$2').trim();

  // Match patterns:
  // 1) <code(s)> = <amount>   (e.g. "12 34 56 = 1000", "43+ = 500")
  // 2) <code(s)> - <amount>   (e.g. "43+ - 1000")
  // 3) <code(s)> : <amount>   (e.g. "43+ : 1000")
  // 4) <code(s)> <amount>     (e.g. "43+ 1000", "12 34 500")
  // 5) <amount> = <code(s)>   (e.g. "1000 = 43+")
  let codePart = '';
  let amtPart = '';

  const sepMatch = cleanLine.match(/^(.+?)\s*([=:~-])\s*(\d+(?:\/\d+)?)$/);
  if (sepMatch) {
    codePart = sepMatch[1].trim();
    amtPart = sepMatch[3].trim();
  } else {
    // Reverse separator pattern: 1000 = 43+
    const revMatch = cleanLine.match(/^(\d+(?:\/\d+)?)\s*([=:~-])\s*(.+)$/);
    if (revMatch) {
      amtPart = revMatch[1].trim();
      codePart = revMatch[3].trim();
    } else {
      // Space separated: last token is amount if it's numeric or numeric split
      const tokens = cleanLine.split(/\s+/);
      if (tokens.length >= 2) {
        const last = tokens[tokens.length - 1];
        if (/^\d+(\/\d+)?$/.test(last)) {
          amtPart = last;
          codePart = tokens.slice(0, -1).join(' ');
        }
      }
    }
  }

  if (!codePart || !amtPart) {
    return {
      id,
      rawLine,
      normalizedCode: cleanLine,
      amount: '',
      amountNum: 0,
      status: 'warning',
      message: 'Could not distinguish bet code and amount',
      expandedCount: 0,
      expandedNumbers: [],
      rowTotal: 0,
    };
  }

  // Clean codePart: replace commas with spaces and collapse spaces around + / * -
  let cleanCode = codePart
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // If there's a space before a modifier like '+', e.g. "43 +", collapse to "43+"
  cleanCode = cleanCode.replace(/(\d)\s+\+/g, '$1+');

  const amtNum = amtPart.includes('/')
    ? amtPart.split('/').reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0)
    : parseInt(amtPart, 10) || 0;

  if (amtNum <= 0) {
    return {
      id,
      rawLine,
      normalizedCode: cleanCode,
      amount: amtPart,
      amountNum: 0,
      status: 'warning',
      message: 'Amount must be greater than zero',
      expandedCount: 0,
      expandedNumbers: [],
      rowTotal: 0,
    };
  }

  // Attempt expansion using expandEntryList (handles both single codes and space-separated lists)
  try {
    const expansions = expandEntryList(cleanCode, amtPart);
    if (expansions.length === 0) {
      // Try single expandCode
      const single = expandCode(cleanCode, amtPart);
      if (single && single.numbers.length > 0) {
        return {
          id,
          rawLine,
          normalizedCode: single.codeNo,
          amount: amtPart,
          amountNum: amtNum,
          status: 'valid',
          expandedCount: single.numbers.length,
          expandedNumbers: [...single.numbers],
          rowTotal: single.rowTotal,
        };
      }

      return {
        id,
        rawLine,
        normalizedCode: cleanCode,
        amount: amtPart,
        amountNum: amtNum,
        status: 'warning',
        message: `Unknown lottery pattern or code '${cleanCode}'`,
        expandedCount: 0,
        expandedNumbers: [],
        rowTotal: 0,
      };
    }

    const allNumbers = expansions.flatMap((e) => e.numbers);
    const sumRowTotal = expansions.reduce((acc, e) => acc + e.rowTotal, 0);

    return {
      id,
      rawLine,
      normalizedCode: cleanCode,
      amount: amtPart,
      amountNum: amtNum,
      status: 'valid',
      expandedCount: allNumbers.length,
      expandedNumbers: allNumbers,
      rowTotal: sumRowTotal,
    };
  } catch (err) {
    return {
      id,
      rawLine,
      normalizedCode: cleanCode,
      amount: amtPart,
      amountNum: amtNum,
      status: 'warning',
      message: `Error expanding code: ${String(err)}`,
      expandedCount: 0,
      expandedNumbers: [],
      rowTotal: 0,
    };
  }
}

/**
 * Parses full chat message text (multi-line) and generates parse report + receipt text.
 */
export function parseChatMessage(fullText: string): ChatParseReport {
  const rawLines = fullText.split(/\r?\n/);
  const parsedLines: ParsedChatBet[] = [];
  let detectedCustomer: string | undefined;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    if (!rawLine.trim()) continue;
    const parsed = parseSingleChatLine(rawLine, i);
    parsedLines.push(parsed);

    if (parsed.status === 'ignored' && !detectedCustomer && rawLine.trim().length <= 30) {
      const trimmed = rawLine.trim();
      if (!isNoiseLine(trimmed) || /^(?:ko\s+|ကို|အစ်ကို)/i.test(trimmed)) {
        detectedCustomer = trimmed;
      }
    }
  }

  let totalRows = 0;
  let totalAmount = 0;
  let validCount = 0;
  let warningCount = 0;
  let ignoredCount = 0;

  for (const line of parsedLines) {
    if (line.status === 'valid') {
      validCount++;
      totalRows += line.expandedCount;
      totalAmount += line.rowTotal;
    } else if (line.status === 'warning') {
      warningCount++;
    } else {
      ignoredCount++;
    }
  }

  // Generate standardized response receipt for Viber / Telegram / SMS
  const validLines = parsedLines.filter((l) => l.status === 'valid');
  const linesSummary = validLines
    .map((l) => `${l.normalizedCode} = ${l.amount}`)
    .join('\n');

  const receiptText =
    validLines.length > 0
      ? `OK Thanks!\n${linesSummary}\n---\nTotal: ${totalAmount.toLocaleString()} Ks (${totalRows} nos)`
      : 'OK Thanks!';

  return {
    lines: parsedLines,
    totalRows,
    totalAmount,
    validCount,
    warningCount,
    ignoredCount,
    customerTag: detectedCustomer,
    receiptText,
  };
}
