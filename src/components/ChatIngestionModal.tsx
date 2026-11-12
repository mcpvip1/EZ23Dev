import { useState, useMemo, useEffect, useRef } from 'react';
import { parseChatMessage } from '../lib/chatParser';
import type { Person } from '../lib/db';
import type { EntryRow } from '../lib/types';
import { makeEntryRow } from '../lib/types';
import { expandCode, expandEntryList } from '../shared-vendor/expand';
import { useLang } from '../i18n';
import { Icon8 } from './Icons8';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  currentFighterNo: string;
  onApplyToFighterGrid: (rows: EntryRow[], fighterNo?: string) => void;
  onDirectSave?: (rows: EntryRow[], fighterNo: string, receiptText: string) => void;
}

const SAMPLE_PRESETS = [
  {
    id: 'standard',
    labelEn: 'Standard',
    labelMy: 'ပုံမှန်ပုံစံ',
    text: `43+ = 1000
12 34 56 = 500
// = 2000
5/ = 1000
/7 = 1000
8* = 500`,
  },
  {
    id: 'viber',
    labelEn: 'Burmese Viber',
    labelMy: 'မြန်မာစာပုံစံ',
    text: `Ko Aung (AM)
၄၃ ပတ်လည် = ၁၀၀၀
အပူး = ၂၀၀၀ ကျပ်
ပါဝါ = ၁၀၀၀
၁၂ ၃၄ ၅၆ = ၅၀၀
ကျေးဇူးတင်ပါတယ် အစ်ကို`,
  },
  {
    id: 'shorthand',
    labelEn: 'Shorthand',
    labelMy: 'အတိုကောက်ပုံစံ',
    text: `12-500
34:1000
56 500
a 1000
** 2000
43+ 500/500`,
  },
];

export default function ChatIngestionModal({
  isOpen,
  onClose,
  people,
  currentFighterNo,
  onApplyToFighterGrid,
  onDirectSave,
}: Props) {
  const { lang } = useLang();
  const [chatText, setChatText] = useState(SAMPLE_PRESETS[0].text);
  const [selectedFighter, setSelectedFighter] = useState(currentFighterNo || '1');
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'issues'>('all');
  const [activePreset, setActivePreset] = useState<string>('standard');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (currentFighterNo) {
      setSelectedFighter(currentFighterNo);
    }
  }, [currentFighterNo]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 20);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const report = useMemo(() => {
    return parseChatMessage(chatText);
  }, [chatText]);

  const fighters = useMemo(() => {
    return people.filter((p) => p.side === 'fighter');
  }, [people]);

  if (!isOpen) return null;

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setChatText(text);
        setActivePreset('');
        setPasteNotice(lang === 'my' ? 'Clipboard မှ ကူးထည့်ပြီးပါပြီ' : 'Pasted from clipboard');
        setTimeout(() => setPasteNotice(null), 2000);
      }
    } catch {
      textareaRef.current?.focus();
      setPasteNotice(
        lang === 'my'
          ? 'စာသားကွက်ထဲတွင် Ctrl+V နှိပ်၍ ကူးထည့်ပါ'
          : 'Press Ctrl+V inside the text pad to paste',
      );
      setTimeout(() => setPasteNotice(null), 3000);
    }
  };

  const handleCopyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(report.receiptText);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleDeleteLine = (lineIndexInRaw: number) => {
    const rawLines = chatText.split(/\r?\n/);
    const nonEmptyIndices: number[] = [];
    rawLines.forEach((l, idx) => {
      if (l.trim()) nonEmptyIndices.push(idx);
    });
    const targetRawIdx = nonEmptyIndices[lineIndexInRaw];
    if (targetRawIdx !== undefined) {
      rawLines.splice(targetRawIdx, 1);
      setChatText(rawLines.join('\n'));
    }
  };

  const convertToEntryRows = (): EntryRow[] => {
    const validLines = report.lines.filter((l) => l.status === 'valid');
    const newRows: EntryRow[] = [];

    for (const line of validLines) {
      const expansions = expandEntryList(line.normalizedCode, line.amount);
      if (expansions.length > 0) {
        for (const exp of expansions) {
          newRows.push(makeEntryRow(exp, line.amount));
        }
      } else {
        const single = expandCode(line.normalizedCode, line.amount);
        if (single) {
          newRows.push(makeEntryRow(single, line.amount));
        }
      }
    }

    return newRows;
  };

  const handleApplyToGrid = () => {
    const rows = convertToEntryRows();
    if (rows.length === 0) return;
    onApplyToFighterGrid(rows, selectedFighter);
    onClose();
  };

  const handleDirectSave = () => {
    const rows = convertToEntryRows();
    if (rows.length === 0) return;
    if (onDirectSave) {
      onDirectSave(rows, selectedFighter, report.receiptText);
    } else {
      onApplyToFighterGrid(rows, selectedFighter);
    }
    onClose();
  };

  const issuesCount = report.warningCount + report.ignoredCount;

  const displayedLines = report.lines
    .map((line, originalIndex) => ({ line, originalIndex }))
    .filter(({ line }) => {
      if (filterMode === 'valid') return line.status === 'valid';
      if (filterMode === 'issues') return line.status !== 'valid';
      return true;
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-2 sm:p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl">
        {/* ---- Institutional Dark Slate Header ---- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 ring-1 ring-slate-700">
              <Icon8 name="clipboard" size={20} />
            </div>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h2 id="copy-modal-title" className="font-mono text-lg font-black tracking-tight text-white">
                Copy
              </h2>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-sm font-bold text-slate-200 leading-snug">
                {lang === 'my'
                  ? 'Viber, Telegram, SMS စာသားများမှ ထိုးငွေ အလိုအလျောက် ကူးယူခြင်း'
                  : 'Paste & parse bet lists from Viber, Telegram, SMS & Messenger'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Target Fighter Selector right in the header bar */}
            <label className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Icon8 name="users" size={16} />
              <span className="whitespace-nowrap">{lang === 'my' ? 'ဖိုက်တာ:' : 'Fighter:'}</span>
              <input
                id="target-fighter"
                list="copy-fighter-datalist"
                value={selectedFighter}
                onChange={(e) => setSelectedFighter(e.target.value)}
                placeholder="1"
                className="h-8 w-28 rounded-md border border-amber-400/90 bg-[#fef9c3] px-2.5 font-mono text-sm font-extrabold text-slate-950 focus:border-amber-300 focus:bg-white focus:outline-none"
              />
              <datalist id="copy-fighter-datalist">
                {fighters.length === 0 ? (
                  <option value="1">Fighter 1</option>
                ) : (
                  fighters.map((f) => (
                    <option key={f.id} value={f.no}>
                      {f.no}{f.name ? ` — ${f.name}` : ''}
                    </option>
                  ))
                )}
              </datalist>
            </label>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Close dialog"
            >
              <Icon8 name="close" size={18} />
            </button>
          </div>
        </div>

        {/* ---- Unified Ledger Summary & Filter Strip ---- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-100/90 px-4 py-2.5">
          {/* Left: Clean unboxed tabular metrics with crisp Myanmar font sizing */}
          <div className="flex flex-wrap items-center gap-3.5 text-[13.5px]">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-slate-700">
                {lang === 'my' ? 'အတည်ပြု အတန်း:' : 'Valid Rows:'}
              </span>
              <span className="font-mono text-base font-black tabular-nums text-indigo-700">
                {report.validCount}
              </span>
              <span className="font-bold text-slate-600">
                ({report.totalRows} {lang === 'my' ? 'ကွက်' : 'nos'})
              </span>
            </div>

            <span className="text-slate-300" aria-hidden="true">|</span>

            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-slate-700">
                {lang === 'my' ? 'စုစုပေါင်း ထိုးငွေ:' : 'Total Stake:'}
              </span>
              <span className="font-mono text-base font-black tabular-nums text-emerald-700">
                {report.totalAmount.toLocaleString()}
              </span>
              <span className="font-mono text-xs font-extrabold text-slate-600">Ks</span>
            </div>

            <span className="text-slate-300" aria-hidden="true">|</span>

            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-slate-700">
                {lang === 'my' ? 'သတိပေး / ကျော်:' : 'Warnings / Skipped:'}
              </span>
              <span
                className={`font-mono text-base font-black tabular-nums ${
                  report.warningCount > 0 ? 'text-amber-600' : 'text-slate-800'
                }`}
              >
                {report.warningCount}
              </span>
              <span className="font-bold text-slate-600">
                / {report.ignoredCount} {lang === 'my' ? 'ကျော်' : 'skip'}
              </span>
            </div>
          </div>

          {/* Right: Interactive Filter Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-300/80 bg-slate-200/80 p-1">
            {(
              [
                { id: 'all', label: lang === 'my' ? 'အားလုံး' : 'All', count: report.lines.length },
                { id: 'valid', label: lang === 'my' ? 'အမှန်' : 'Valid', count: report.validCount },
                { id: 'issues', label: lang === 'my' ? 'စစ်ရန်' : 'Issues', count: issuesCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-[13px] font-extrabold transition-colors ${
                  filterMode === tab.id
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono text-xs font-black tabular-nums text-indigo-700">
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ---- Split-Pane Workbench: Left Source Pad | Right Live Parsed Table ---- */}
        <div className="grid min-h-[400px] flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
          {/* Left Pane (5 cols): Source Clipboard Pad */}
          <div className="flex flex-col border-b border-slate-200 bg-slate-50/60 lg:col-span-5 lg:border-b-0 lg:border-r">
            {/* Pad Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3.5 py-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[13.5px] font-extrabold text-slate-900">
                  {lang === 'my' ? 'ကူးထည့်ရန် စာသားကွက်' : 'Source Text Pad'}
                </span>
                {pasteNotice && (
                  <span className="text-xs font-bold text-indigo-600">
                    · {pasteNotice}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="btn btn-outline btn-sm h-7 min-h-0 gap-1.5 border-indigo-200 bg-indigo-50/80 px-2.5 text-[13px] font-bold text-indigo-900 hover:border-indigo-400 hover:bg-indigo-100"
                >
                  <Icon8 name="clipboard" size={13} />
                  <span>{lang === 'my' ? 'ကူးထည့် (Paste)' : 'Paste'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChatText('');
                    setActivePreset('');
                    textareaRef.current?.focus();
                  }}
                  className="btn btn-outline btn-sm h-7 min-h-0 gap-1 px-2.5 text-[13px] font-bold text-slate-700 hover:text-rose-700"
                >
                  <Icon8 name="clear" size={12} />
                  <span>{lang === 'my' ? 'ရှင်းရန်' : 'Clear'}</span>
                </button>
              </div>
            </div>

            {/* Sample Preset Selector Strip */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 bg-slate-100/70 px-3.5 py-2 text-[13px]">
              <span className="font-extrabold text-slate-700">
                {lang === 'my' ? 'နမူနာပုံစံ:' : 'Examples:'}
              </span>
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setChatText(preset.text);
                    setActivePreset(preset.id);
                  }}
                  className={`rounded-md px-2.5 py-1 text-[13px] font-bold transition-colors ${
                    activePreset === preset.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {lang === 'my' ? preset.labelMy : preset.labelEn}
                </button>
              ))}
            </div>

            {/* Monospace + Padauk Operator Input Pad */}
            <div className="flex flex-1 flex-col p-3">
              <textarea
                ref={textareaRef}
                value={chatText}
                onChange={(e) => {
                  setChatText(e.target.value);
                  setActivePreset('');
                }}
                placeholder={
                  lang === 'my'
                    ? 'Viber / Telegram / SMS မှ ထိုးငွေစာသားများကို ဤနေရာတွင် ကူးထည့်ပါ (Ctrl+V)...\nဥပမာ -\n43+ = 1000\n12 34 56 = 500\n၄၃ ပတ်လည် = ၁၀၀၀'
                    : 'Paste Viber / Telegram / SMS bet lines here (Ctrl+V)...\ne.g.\n43+ = 1000\n12 34 56 = 500\n// = 2000'
                }
                className="min-h-[220px] w-full flex-1 resize-none rounded-lg border border-amber-300/90 bg-[#fefce8] p-3.5 font-mono text-[15px] font-bold leading-relaxed text-slate-950 shadow-inner focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            {/* Compact Syntax Guide Footer */}
            <div className="border-t border-slate-200/90 bg-white px-3.5 py-2.5 text-[13px] text-slate-700">
              <div className="flex flex-wrap items-center gap-1.5 font-bold text-slate-900 leading-relaxed">
                <Icon8 name="idea" size={15} />
                <span className="shrink-0 whitespace-nowrap">
                  {lang === 'my' ? 'အလိုအလျောက် ပြောင်းလဲမှု:' : 'Auto-Conversion:'}
                </span>
                <span className="font-mono text-[13px] font-bold text-slate-800">
                  ၀-၉ → 0-9 · ပတ်လည် → + · အပူး → // · ပါဝါ → ** · ညီကို → */
                </span>
              </div>
            </div>
          </div>

          {/* Right Pane (7 cols): Live Parsed Ledger Table & Receipt */}
          <div className="flex flex-col bg-white lg:col-span-7">
            {/* Full-bleed Financial Verification Table */}
            <div className="max-h-[320px] flex-1 overflow-y-auto">
              {displayedLines.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 px-4 text-center text-sm text-slate-500">
                  <Icon8 name="clipboard" size={30} />
                  <span className="font-bold text-slate-700">
                    {lang === 'my'
                      ? 'ကူးထည့်ထားသော ထိုးငွေစာရင်း မရှိသေးပါ'
                      : 'No matching parsed lines to display'}
                  </span>
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-[14px]">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100/95 text-[13.5px] font-extrabold text-slate-800 whitespace-nowrap">
                    <tr>
                      <th className="w-7 px-2 py-2.5 font-mono">#</th>
                      <th className="px-2 py-2.5">
                        {lang === 'my' ? 'မူရင်းစာသား' : 'Source Line'}
                      </th>
                      <th className="px-2 py-2.5">
                        {lang === 'my' ? 'ကုဒ်' : 'Code'}
                      </th>
                      <th className="px-2 py-2.5 text-right">
                        {lang === 'my' ? 'နှုန်း' : 'Unit'}
                      </th>
                      <th className="px-2 py-2.5 text-right">
                        {lang === 'my' ? 'အကွက်' : 'Nos'}
                      </th>
                      <th className="px-2 py-2.5 text-right">
                        {lang === 'my' ? 'စုစုပေါင်း' : 'Total'}
                      </th>
                      <th className="px-2 py-2.5 text-right">
                        {lang === 'my' ? 'အခြေအနေ' : 'Status'}
                      </th>
                      <th className="w-7 px-1.5 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedLines.map(({ line, originalIndex }, idx) => (
                      <tr
                        key={line.id}
                        className={`transition-colors hover:bg-slate-50/90 ${
                          line.status === 'valid'
                            ? 'text-slate-900'
                            : line.status === 'warning'
                              ? 'bg-amber-50/60 text-amber-950'
                              : 'bg-slate-50/60 text-slate-500'
                        }`}
                      >
                        <td className="px-2 py-2 font-mono text-xs font-bold text-slate-400 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="max-w-[155px] truncate px-2 py-2 font-mono text-[14px] font-bold text-slate-800" title={line.rawLine}>
                          {line.rawLine}
                        </td>
                        <td className="px-2 py-2 font-mono text-[14px] font-extrabold text-indigo-950 whitespace-nowrap">
                          {line.status === 'valid' ? (
                            line.normalizedCode
                          ) : line.status === 'warning' ? (
                            <span className="font-sans text-[13px] font-bold text-amber-700" title={line.message}>
                              {lang === 'my' ? 'ကုဒ်/ပမာဏ ပြန်စစ်ပါ' : line.message || 'Check syntax'}
                            </span>
                          ) : (
                            <span className="font-sans text-[13px] font-semibold text-slate-400">
                              {lang === 'my' ? 'စာသား (ကျော်သည်)' : 'Ignored text'}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-[14px] font-bold tabular-nums text-slate-800 whitespace-nowrap">
                          {line.status === 'valid' ? Number(line.amountNum).toLocaleString() : '—'}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-[14px] font-bold tabular-nums text-slate-700 whitespace-nowrap">
                          {line.status === 'valid' ? `${line.expandedCount}` : '—'}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-[14px] font-black tabular-nums text-emerald-700 whitespace-nowrap">
                          {line.status === 'valid' ? line.rowTotal.toLocaleString() : '—'}
                        </td>
                        <td className="px-2 py-2 text-right text-[13.5px] font-extrabold whitespace-nowrap">
                          {line.status === 'valid' && (
                            <span className="text-emerald-700">
                              ● {lang === 'my' ? 'အမှန်' : 'Valid'}
                            </span>
                          )}
                          {line.status === 'warning' && (
                            <span className="text-amber-700">
                              ▲ {lang === 'my' ? 'စစ်ရန်' : 'Check'}
                            </span>
                          )}
                          {line.status === 'ignored' && (
                            <span className="text-slate-500">
                              — {lang === 'my' ? 'ကျော်' : 'Skip'}
                            </span>
                          )}
                        </td>
                        <td className="px-1.5 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(originalIndex)}
                            title={lang === 'my' ? 'ဤအတန်းကို ဖယ်ရှားရန်' : 'Remove line'}
                            className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Icon8 name="close" size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Reply Receipt Bar */}
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/90 px-3.5 py-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2 text-[13.5px]">
                <span className="shrink-0 font-extrabold text-slate-800">
                  {lang === 'my' ? 'ပြန်ပို့ရန် ပြေစာ:' : 'Reply Receipt:'}
                </span>
                <span className="truncate font-mono text-[13px] font-bold text-slate-700">
                  {report.receiptText.replace(/\n/g, ' · ')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyReceipt}
                className="btn btn-outline btn-sm h-8 min-h-0 shrink-0 gap-1.5 bg-white px-3 text-[13px] font-extrabold text-slate-900 hover:border-indigo-400 hover:text-indigo-700"
              >
                <Icon8 name={copiedReceipt ? 'checkmark' : 'clipboard'} size={14} />
                <span>
                  {copiedReceipt
                    ? lang === 'my'
                      ? 'ကူးပြီးပါပြီ'
                      : 'Copied!'
                    : lang === 'my'
                      ? 'ပြေစာ ကူးရန်'
                      : 'Copy Receipt'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ---- Institutional Command Footer ---- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-100 px-4 py-3">
          <div className="text-[13.5px] font-bold text-slate-700">
            {report.validCount > 0 ? (
              <span>
                {lang === 'my' ? (
                  <>
                    ဖိုက်တာ <strong className="font-mono text-sm font-black text-slate-950">{selectedFighter}</strong> အတွက်{' '}
                    <strong className="font-mono text-sm font-black text-indigo-700">{report.validCount} တန်း</strong> ({report.totalRows} ကွက်) · စုစုပေါင်း{' '}
                    <strong className="font-mono text-sm font-black text-emerald-700">{report.totalAmount.toLocaleString()} Ks</strong> ထည့်သွင်းရန် အသင့်ရှိပါသည်။
                  </>
                ) : (
                  <>
                    Ready: <strong className="font-mono text-sm font-black text-indigo-700">{report.validCount} entries</strong> ({report.totalRows} nos) ·{' '}
                    <strong className="font-mono text-sm font-black text-emerald-700">{report.totalAmount.toLocaleString()} Ks</strong> → Fighter{' '}
                    <strong className="font-mono text-sm font-black text-slate-950">{selectedFighter}</strong>
                  </>
                )}
              </span>
            ) : (
              <span className="font-bold text-amber-700">
                {lang === 'my'
                  ? 'ထည့်သွင်းနိုင်သော ထိုးငွေအတန်း မရှိသေးပါ — စာသားကွက်ထဲတွင် ကုဒ်နှင့် ပမာဏ စစ်ဆေးပါ။'
                  : 'No valid bet lines detected yet — check code and amount format.'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline h-9 min-h-0 gap-1.5 bg-white px-3.5 text-[13.5px] font-extrabold text-slate-800"
            >
              <Icon8 name="close" size={14} />
              <span>{lang === 'my' ? 'ပိတ်ရန်' : 'Cancel'}</span>
            </button>
            <button
              type="button"
              disabled={report.validCount === 0}
              onClick={handleApplyToGrid}
              className="btn btn-primary h-9 min-h-0 gap-1.5 bg-indigo-600 px-4 text-[13.5px] font-extrabold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Icon8 name="inbox" size={15} />
              <span>{lang === 'my' ? 'ဖိုက်တာဇယားသို့ ထည့်ရန်' : 'Add to Fighter Grid'}</span>
            </button>
            <button
              type="button"
              disabled={report.validCount === 0}
              onClick={handleDirectSave}
              className="btn btn-teal h-9 min-h-0 gap-1.5 bg-teal-600 px-4 text-[13.5px] font-extrabold text-white hover:bg-teal-700 disabled:opacity-50"
              title={lang === 'my' ? 'တိုက်ရိုက်သိမ်းပြီး ပြေစာကူးယူရန်' : 'Save directly and copy receipt'}
            >
              <Icon8 name="save" size={15} />
              <span>{lang === 'my' ? 'တိုက်ရိုက်သိမ်း & ပြေစာကူးရန်' : 'Save & Copy Receipt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
