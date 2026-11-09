import { useState, useMemo, useEffect } from 'react';
import { parseChatMessage } from '../lib/chatParser';
import type { Person } from '../lib/db';
import type { EntryRow } from '../lib/types';
import { makeEntryRow } from '../lib/types';
import { expandCode, expandEntryList } from '../shared-vendor/expand';
import { Icon8 } from './Icons8';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  currentFighterNo: string;
  onApplyToFighterGrid: (rows: EntryRow[], fighterNo?: string) => void;
  onDirectSave?: (rows: EntryRow[], fighterNo: string, receiptText: string) => void;
}

const SAMPLE_CHATS = [
  {
    title: 'Standard Format',
    text: `43+ = 1000
12 34 56 = 500
// = 2000
5/ = 1000
/7 = 1000
8* = 500`,
  },
  {
    title: 'Burmese Viber Chat',
    text: `Ko Aung (AM)
၄၃ ပတ်လည် = ၁၀၀၀
အပူး = ၂၀၀၀ ကျပ်
ပါဝါ = ၁၀၀၀
၁၂ ၃၄ ၅၆ = ၅၀၀
ကျေးဇူးတင်ပါတယ် အစ်ကို`,
  },
  {
    title: 'Quick Messenger Shorthand',
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
  const [chatText, setChatText] = useState(SAMPLE_CHATS[0].text);
  const [selectedFighter, setSelectedFighter] = useState(currentFighterNo || '1');
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'issues'>('all');

  useEffect(() => {
    if (currentFighterNo) {
      setSelectedFighter(currentFighterNo);
    }
  }, [currentFighterNo]);

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
      }
    } catch {
      // Fallback
      alert('Please paste directly into the text box using Ctrl+V or right click.');
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

  const displayedLines = report.lines.filter((l) => {
    if (filterMode === 'valid') return l.status === 'valid';
    if (filterMode === 'issues') return l.status !== 'valid';
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-ingest-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 px-5 py-3 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl font-bold shadow-inner">
              <Icon8 name="inbox" size={24} />
            </span>
            <div>
              <h2 id="chat-ingest-title" className="text-lg font-bold tracking-tight">
                Smart Chat Message Ingestion
              </h2>
              <p className="text-xs text-indigo-100">
                Auto-parses raw Viber, Telegram, SMS & Messenger bets • Converts Burmese numerals & keywords
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
            aria-label="Close dialog"
          >
            <Icon8 name="close" size={18} />
          </button>
        </div>

        {/* Quick Sample Chips & Fighter Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Sample Presets:</span>
            {SAMPLE_CHATS.map((s) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setChatText(s.text)}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition"
              >
                {s.title}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="target-fighter" className="text-xs font-bold text-slate-700">
              Target Fighter:
            </label>
            <select
              id="target-fighter"
              value={selectedFighter}
              onChange={(e) => setSelectedFighter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-yellow-50 px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {fighters.map((f) => (
                <option key={f.id} value={f.no}>
                  Fighter {f.no} {f.name ? `— ${f.name}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Area: Left Input, Right Parsed Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto flex-1 min-h-[380px]">
          {/* Left Column: Raw Chat Textarea */}
          <div className="md:col-span-5 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Raw Chat Text (Paste Here)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                >
                  <Icon8 name="clipboard" size={13} />
                  <span>Paste Clipboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChatText('')}
                  className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Paste raw Viber / Telegram / SMS messages here...&#10;e.g.&#10;12, 34 = 1000&#10;43+ = 500&#10;// = 2000&#10;၄၃ ပတ်လည် = ၁၀၀၀"
              className="flex-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm leading-relaxed text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none min-h-[220px]"
            />

            <div className="mt-3 flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-2 text-[11px] text-indigo-900 leading-normal">
              <Icon8 name="idea" size={16} className="mt-0.5 shrink-0" />
              <span>
                <strong>Smart Parser Features:</strong> Automatically converts Burmese digits (၀-၉), translates terms like <code className="bg-indigo-100 px-1 rounded">ပတ်လည်</code> to reverse <code className="bg-indigo-100 px-1 rounded">+</code>, <code className="bg-indigo-100 px-1 rounded">အပူး</code> to <code className="bg-indigo-100 px-1 rounded">//</code>, and ignores greetings/footers.
              </span>
            </div>
          </div>

          {/* Right Column: Live Parsed Breakdown */}
          <div className="md:col-span-7 flex flex-col p-4 bg-white">
            {/* KPI Stats Bar */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                <span className="block text-[11px] font-semibold text-slate-500">Valid Entries</span>
                <span className="text-xl font-extrabold text-indigo-700">
                  {report.validCount}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({report.totalRows} nos)
                  </span>
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                <span className="block text-[11px] font-semibold text-slate-500">Grand Total Stake</span>
                <span className="text-xl font-extrabold text-emerald-600">
                  {report.totalAmount.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500">Ks</span>
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                <span className="block text-[11px] font-semibold text-slate-500">Issues / Ignored</span>
                <span className="text-xl font-extrabold text-amber-600">
                  {report.warningCount}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    / {report.ignoredCount} skip
                  </span>
                </span>
              </div>
            </div>

            {/* Table Filters */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Parsed Verification Breakdown
              </span>
              <div className="flex gap-1">
                {(['all', 'valid', 'issues'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFilterMode(mode)}
                    className={`rounded px-2 py-0.5 text-xs font-semibold capitalize transition ${
                      filterMode === mode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Parsed Lines List */}
            <div className="flex-1 overflow-y-auto max-h-[260px] border border-slate-200 rounded-xl">
              {displayedLines.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-xs text-slate-400 italic">
                  No lines found for filter &apos;{filterMode}&apos;
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-2.5 w-8">#</th>
                      <th className="py-1.5 px-2">Code / Shorthand</th>
                      <th className="py-1.5 px-2 text-right">Unit Amt</th>
                      <th className="py-1.5 px-2 text-center">Numbers</th>
                      <th className="py-1.5 px-2 text-right">Total Ks</th>
                      <th className="py-1.5 px-2 text-center w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedLines.map((line, idx) => (
                      <tr
                        key={line.id}
                        className={`hover:bg-slate-50 transition ${
                          line.status === 'valid'
                            ? ''
                            : line.status === 'warning'
                            ? 'bg-amber-50/70'
                            : 'bg-slate-50/80 text-slate-400'
                        }`}
                      >
                        <td className="py-2 px-2.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-2 font-mono font-bold text-slate-800">
                          {line.status === 'valid' ? (
                            <span>{line.normalizedCode}</span>
                          ) : (
                            <span className="line-through text-slate-400">{line.rawLine}</span>
                          )}
                          {line.message && (
                            <span className="block text-[10px] font-normal text-amber-700">
                              {line.message}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {line.status === 'valid' ? line.amount : '-'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {line.status === 'valid' ? (
                            <span className="inline-block rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                              {line.expandedCount} nos
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700">
                          {line.status === 'valid' ? line.rowTotal.toLocaleString() : '-'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {line.status === 'valid' && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Valid
                            </span>
                          )}
                          {line.status === 'warning' && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              Check
                            </span>
                          )}
                          {line.status === 'ignored' && (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              Skip
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Generated Receipt Preview Bar */}
            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2 overflow-hidden text-xs text-slate-600">
                <span className="font-bold text-slate-800 shrink-0">Receipt Copy:</span>
                <span className="truncate font-mono text-[11px] text-slate-500">
                  {report.receiptText.replace(/\n/g, ' • ')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyReceipt}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-100 transition"
              >
                <Icon8 name={copiedReceipt ? 'checkmark' : 'clipboard'} size={14} />
                <span>{copiedReceipt ? 'Copied!' : 'Copy Receipt'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-100 px-5 py-3">
          <div className="text-xs text-slate-500">
            {report.validCount > 0 ? (
              <span>
                Ready to import <strong className="text-indigo-700 font-bold">{report.validCount} valid entries</strong> ({report.totalRows} expanded numbers) totaling{' '}
                <strong className="text-emerald-700 font-bold">{report.totalAmount.toLocaleString()} Ks</strong> for Fighter {selectedFighter}.
              </span>
            ) : (
              <span className="text-amber-700">No valid bet lines found. Please check syntax.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-sm text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={report.validCount === 0}
              onClick={handleApplyToGrid}
              className="btn btn-primary btn-sm gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs disabled:opacity-50"
            >
              <Icon8 name="inbox" size={14} />
              <span>Import into Fighter Grid</span>
            </button>
            <button
              type="button"
              disabled={report.validCount === 0}
              onClick={handleDirectSave}
              className="btn btn-teal btn-sm gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs disabled:opacity-50"
              title="Save directly as a new bet group in database and copy receipt"
            >
              <Icon8 name="lightning" size={14} />
              <span>Instant Save & Copy Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
