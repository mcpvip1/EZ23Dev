import { useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { useLang } from '../i18n';
import type { Person } from '../lib/db';
import type { EntryRow } from '../lib/types';
import { fmt } from '../lib/types';
import { ConfirmDialog } from './Dialogs';
import { Icon8 } from './Icons8';

interface Props {
  side: 'bet' | 'carry';
  people: Person[];
  personNo: string;
  onPersonChange: (no: string) => void;
  onAddNewPerson?: (side: 'fighter' | 'owner', no: string) => void;
  commission: number;
  rate: number;
  onCommissionChange: (v: number) => void;
  onRateChange: (v: number) => void;
  rows: EntryRow[];
  onAdd: (code: string, amount: string) => boolean;
  onDeleteRow: (id: string) => void;
  onEditRow: (id: string, code: string, amount: string) => boolean;
  onClear: () => void;
  onSave: () => void;
  accent: 'indigo' | 'amber';
  codeInputRef?: MutableRefObject<HTMLInputElement | null>;
  personSelectRef?: MutableRefObject<HTMLInputElement | null>;
  extraTop?: React.ReactNode;
  onOrder: () => void;
  onDots: () => void;
  onOpenChatIngest?: () => void;
}

export function formatDisplayCode(text: string): string {
  const dash = (s: string) => s.split('-').join(' (-) ');
  if (text.includes('F-') || text.includes('B-')) {
    return text.slice(0, 4) + dash(text.slice(4));
  }
  if (text.slice(0, 2).includes('-')) {
    return text.slice(0, 2) + dash(text.slice(2));
  }
  return dash(text);
}

export default function EntryPanel(p: Props) {
  const { t } = useLang();
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [sortMode, setSortMode] = useState<'entry' | 'code'>('entry');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editAmt, setEditAmt] = useState('');
  const codeRef = useRef<HTMLInputElement | null>(null);
  const amountRef = useRef<HTMLInputElement | null>(null);
  const comRef = useRef<HTMLInputElement | null>(null);
  const rateRef = useRef<HTMLInputElement | null>(null);
  const internalPersonRef = useRef<HTMLInputElement | null>(null);
  const total = p.rows.reduce((s, r) => s + r.rowTotal, 0);

  const [askNewPersonNo, setAskNewPersonNo] = useState<string | null>(null);
  const lastValidPersonNo = useRef(p.personNo);

  if (p.people.some((x) => x.no === p.personNo && x.no.trim() !== '')) {
    lastValidPersonNo.current = p.personNo;
  }

  const focusCode = () => {
    codeRef.current?.focus();
    codeRef.current?.select();
  };
  const focusAmount = () => {
    amountRef.current?.focus();
    amountRef.current?.select();
  };

  const submit = (codeVal: string, amountVal: string): boolean => {
    const trimmedPerson = p.personNo.trim();
    if (trimmedPerson && !p.people.some((x) => x.no === trimmedPerson)) {
      setAskNewPersonNo(trimmedPerson);
      return false;
    }
    if (!codeVal.trim() || !amountVal.trim() || amountVal.trim() === '0') {
      focusCode();
      return false;
    }
    const ok = p.onAdd(codeVal, amountVal);
    if (!ok) {
      setInvalid(true);
      focusCode();
      return false;
    }
    setInvalid(false);
    setCode('');
    setAmount('');
    focusCode();
    return true;
  };

  const openEditor = (id: string | null) => {
    const row = p.rows.find((r) => r.id === id) ?? p.rows[p.rows.length - 1];
    if (!row) return;
    setSelectedId(row.id);
    setEditId(row.id);
    setEditCode(row.codeNo);
    setEditAmt(row.amountText);
  };

  const saveEditor = () => {
    if (!editId) return;
    const ok = p.onEditRow(editId, editCode, editAmt);
    if (!ok) return;
    setEditId(null);
    focusCode();
  };

  const saveKey = p.side === 'bet' ? 'F3' : 'F6';

  const onCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!code.trim()) return;
      if (!amount.trim()) {
        focusAmount();
        return;
      }
      submit(code, amount);
    } else if (e.key === 'ArrowUp') {
      const len = code.trim().length;
      if ((len === 1 || len === 2) && amount.trim()) {
        e.preventDefault();
        submit(code, amount);
      }
    } else if (e.key === 'ArrowDown') {
      if (code.trim().length === 2 && amount.trim()) {
        e.preventDefault();
        const next = `${code.trim()}+`;
        setCode(next);
        submit(next, amount);
      }
    } else if (e.key === saveKey || e.key === '.') {
      e.preventDefault();
      e.stopPropagation();
      setCode('');
      p.onSave();
    }
  };

  const onAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit(code, amount);
    } else if (e.key === '.') {
      e.preventDefault();
      e.stopPropagation();
      focusCode();
    }
  };

  const onGridKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, row: EntryRow) => {
    if (e.key === 'Delete') {
      e.preventDefault();
      p.onDeleteRow(row.id);
      setSelectedId(null);
    } else if (e.key === 'F2' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      openEditor(row.id);
    }
  };

  const shownRows = useMemo(
    () => (sortMode === 'code' ? [...p.rows].sort((a, b) => a.displayCode.localeCompare(b.displayCode)) : p.rows),
    [p.rows, sortMode],
  );

  const isIndigo = p.accent === 'indigo';
  const accentBtn = isIndigo ? 'btn-primary' : 'btn-amber';

  return (
    <section className="card flex h-full min-h-0 flex-1 flex-col overflow-hidden border-slate-300">
      {/* Top Person Selection & Actions Bar */}
      <div
        className={`flex shrink-0 items-center gap-1 xl:gap-1.5 border-b px-1.5 xl:px-2 py-1 xl:py-1.5 ${
          isIndigo
            ? 'border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white'
            : 'border-amber-100 bg-gradient-to-r from-amber-50/70 via-slate-50 to-white'
        }`}
      >
        <input
          ref={(el) => {
            internalPersonRef.current = el;
            if (p.personSelectRef) p.personSelectRef.current = el;
          }}
          type="text"
          list={`person-datalist-${p.side}`}
          className="input-yellow h-7 min-w-0 flex-1 px-2 font-mono text-[13.5px] font-extrabold"
          placeholder={p.side === 'bet' ? 'Fighter No.' : 'Owner No.'}
          value={p.personNo}
          onChange={(e) => {
            p.onPersonChange(e.target.value);
            setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const trimmed = p.personNo.trim();
              if (!trimmed) {
                focusCode();
                return;
              }
              const exists = p.people.some((x) => x.no === trimmed);
              if (exists) {
                focusCode();
              } else {
                setAskNewPersonNo(trimmed);
              }
            }
          }}
          onBlur={() => {
            const trimmed = p.personNo.trim();
            if (!trimmed) {
              p.onPersonChange(lastValidPersonNo.current);
            }
          }}
          aria-label={p.side === 'bet' ? t('entry.fighter') : t('entry.owner')}
        />
        <datalist id={`person-datalist-${p.side}`}>
          {p.people.map((person) => (
            <option key={person.id} value={person.no}>
              {person.no}{person.name ? ` — ${person.name}` : ''}
            </option>
          ))}
        </datalist>

        <button
          type="button"
          onClick={() => {
            setSortMode((m) => (m === 'entry' ? 'code' : 'entry'));
            p.onOrder();
          }}
          className={`btn btn-sm h-7 min-h-0 shrink-0 gap-1 px-1.5 text-[12.5px] font-bold whitespace-nowrap ${
            sortMode === 'code' ? 'btn-primary' : 'btn-outline'
          }`}
          aria-pressed={sortMode === 'code'}
          title={t('entry.orderTitle')}
        >
          <Icon8 name="sort" size={12} />
          <span>{t('entry.order')}</span>
        </button>

        <button
          type="button"
          onClick={p.onDots}
          className="btn btn-outline btn-sm h-7 min-h-0 shrink-0 gap-1 px-1.5 text-[12.5px] font-bold whitespace-nowrap"
          title={t('entry.browseTitle')}
        >
          <Icon8 name="browse" size={12} />
          <span>{t('entry.browse')}</span>
        </button>

        {p.onOpenChatIngest && (
          <button
            type="button"
            onClick={p.onOpenChatIngest}
            className="btn btn-primary btn-sm h-7 min-h-0 shrink-0 gap-1 px-1.5 text-[12.5px] font-bold whitespace-nowrap"
            title="Copy — Paste & Import Bets (Ctrl+I)"
          >
            <Icon8 name="clipboard" size={12} />
            <span>Copy</span>
          </button>
        )}
      </div>

      {p.extraTop}

      {/* Commission / Rate Metadata Row */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-2 py-1">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-800">
            <span>{t('entry.com')}</span>
            <input
              ref={comRef}
              type="number"
              className="input h-6 w-12 xl:w-13 px-1.5 py-0 font-mono text-[13px] font-extrabold text-slate-900"
              value={p.commission}
              onChange={(e) => p.onCommissionChange(Number(e.target.value) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  rateRef.current?.focus();
                  rateRef.current?.select();
                }
              }}
            />
          </label>
          <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-800">
            <span>{t('entry.rate')}</span>
            <input
              ref={rateRef}
              type="number"
              className="input h-6 w-12 xl:w-13 px-1.5 py-0 font-mono text-[13px] font-extrabold text-slate-900"
              value={p.rate}
              onChange={(e) => p.onRateChange(Number(e.target.value) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  focusCode();
                }
              }}
            />
          </label>
        </div>

        <span
          className={`text-[13.5px] font-extrabold tracking-tight ${
            p.side === 'bet' ? 'text-indigo-700' : 'text-amber-700'
          }`}
        >
          {p.side === 'bet' ? t('entry.bet') : t('entry.carry')}
        </span>
      </div>

      {/* Code + Amount Operator Command Bar */}
      <div className="flex shrink-0 items-center gap-1.5 bg-white px-2 py-1 xl:py-1.5">
        <input
          ref={(el) => {
            codeRef.current = el;
            if (p.codeInputRef) p.codeInputRef.current = el;
          }}
          className="input-yellow h-7 xl:h-8 min-w-0 flex-1 px-2 font-mono text-[14px] uppercase"
          placeholder={t('entry.codePlaceholder')}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setInvalid(false);
          }}
          onKeyDown={onCodeKeyDown}
          aria-label={p.side === 'bet' ? t('entry.fighterCode') : t('entry.carryCode')}
        />
        <input
          ref={amountRef}
          className="input-yellow h-7 xl:h-8 w-22 xl:w-25 px-2 font-mono text-[14px] tabular-nums"
          placeholder={t('entry.amountPlaceholder')}
          inputMode="numeric"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setInvalid(false);
          }}
          onKeyDown={onAmountKeyDown}
          aria-label={t('entry.amount')}
        />
        <button
          type="button"
          onClick={() => submit(code, amount)}
          className={`btn btn-sm h-7 xl:h-8 min-h-0 gap-1 px-2.5 xl:px-3 text-[13.5px] font-bold whitespace-nowrap ${accentBtn}`}
        >
          <Icon8 name="plus" size={12} />
          <span>{t('entry.add')}</span>
        </button>
      </div>
      {invalid && <p className="shrink-0 px-2.5 pb-1 text-[13px] font-semibold text-rose-600">{t('entry.invalid')}</p>}

      {/* Active Entry Grid: # / No / Amount */}
      <div className="min-h-[60px] flex-1 overflow-y-auto border-t border-slate-200/90 bg-white">
        <table className="w-full text-[13.5px]">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur-xs">
            <tr className="text-left text-[13px] font-extrabold text-slate-800">
              <th className="w-9 px-2.5 py-1 font-mono">{t('entry.colNum')}</th>
              <th className="px-2 py-1">{t('entry.colNo')}</th>
              <th className="px-2.5 py-1 text-right">{t('entry.colAmount')}</th>
              <th className="w-7" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shownRows.map((r, i) => (
              <tr
                key={r.id}
                tabIndex={0}
                onClick={() => setSelectedId(r.id)}
                onDoubleClick={() => openEditor(r.id)}
                onKeyDown={(e) => onGridKeyDown(e, r)}
                className={`cursor-pointer outline-none transition-colors focus:bg-indigo-50/70 ${
                  selectedId === r.id ? 'bg-indigo-50 font-semibold' : 'hover:bg-slate-50/80'
                }`}
              >
                <td className="px-2.5 py-1 font-mono text-[13px] text-slate-500">{i + 1}</td>
                {editId === r.id ? (
                  <>
                    <td className="px-1.5 py-1">
                      <input
                        className="input-yellow h-7 w-full px-1.5 font-mono text-[13.5px] uppercase"
                        value={editCode}
                        autoFocus
                        onChange={(e) => setEditCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            (e.target as HTMLInputElement)
                              .closest('tr')
                              ?.querySelector<HTMLInputElement>('input[data-edit-amt]')
                              ?.focus();
                          } else if (e.key === 'Escape') {
                            e.stopPropagation();
                            setEditId(null);
                            focusCode();
                          }
                        }}
                        aria-label={t('entry.editCode')}
                      />
                    </td>
                    <td className="px-1.5 py-1 text-right">
                      <input
                        data-edit-amt
                        className="input-yellow h-7 w-20 px-1.5 text-right font-mono text-[13.5px]"
                        value={editAmt}
                        inputMode="numeric"
                        onChange={(e) => setEditAmt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            saveEditor();
                          } else if (e.key === 'Escape') {
                            e.stopPropagation();
                            setEditId(null);
                            focusCode();
                          }
                        }}
                        aria-label={t('entry.editAmount')}
                      />
                    </td>
                    <td className="py-1 pr-1.5 text-right">
                      <button
                        type="button"
                        onClick={saveEditor}
                        className={`btn btn-sm h-7 min-h-0 px-2 ${accentBtn}`}
                        aria-label={t('entry.saveEdit')}
                      >
                        <Icon8 name="checkmark" size={14} />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-1 font-mono text-[13.5px] font-bold text-slate-900">
                      {formatDisplayCode(r.displayCode)}
                    </td>
                    <td className="px-2.5 py-1 text-right font-mono text-[13.5px] font-bold tabular-nums text-slate-900">
                      {fmt(r.rowTotal)}
                    </td>
                    <td className="py-1 pr-1.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          p.onDeleteRow(r.id);
                        }}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        aria-label={t('entry.deleteRow')}
                      >
                        <Icon8 name="close" size={14} />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {shownRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-[13.5px] font-medium text-slate-500">
                  {t('entry.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Total & Save Bar */}
      <div className="mt-auto shrink-0 border-t border-slate-200/90 bg-slate-50/80 px-2.5 py-1 xl:py-1.5">
        <div className="mb-1 flex items-baseline justify-between px-0.5">
          <span className="text-[13.5px] font-bold text-slate-800">{t('entry.total')}</span>
          <span className="font-mono text-[15px] font-black tabular-nums text-slate-900">
            {fmt(total)}
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={p.onSave}
            className={`btn btn-sm h-7 xl:h-8 min-h-0 flex-1 gap-1.5 text-[13.5px] font-bold ${accentBtn}`}
          >
            <Icon8 name="save" size={14} />
            <span>{p.side === 'bet' ? t('entry.saveBet') : t('entry.saveCarry')}</span>
          </button>
          <button
            type="button"
            onClick={p.onClear}
            className="btn btn-outline btn-sm h-7 xl:h-8 min-h-0 gap-1 px-3 text-[13.5px] font-bold"
          >
            <Icon8 name="clear" size={12} />
            <span>{t('entry.clear')}</span>
          </button>
        </div>
      </div>

      {askNewPersonNo && (
        <ConfirmDialog
          title={t('entry.saveNewTitle', { side: p.side === 'bet' ? t('entry.fighter') : t('entry.owner') })}
          message={t('entry.askSaveNew', {
            side: p.side === 'bet' ? t('entry.fighter') : t('entry.owner'),
            no: askNewPersonNo,
          })}
          confirmLabel={t('dialog.confirmOk')}
          cancelLabel={t('dialog.confirmCancel')}
          onConfirm={() => {
            const num = askNewPersonNo;
            setAskNewPersonNo(null);
            p.onAddNewPerson?.(p.side === 'bet' ? 'fighter' : 'owner', num);
            setTimeout(() => focusCode(), 50);
          }}
          onCancel={() => {
            setAskNewPersonNo(null);
            p.onPersonChange(lastValidPersonNo.current);
            setTimeout(() => {
              internalPersonRef.current?.focus();
              internalPersonRef.current?.select();
            }, 50);
          }}
        />
      )}
    </section>
  );
}
