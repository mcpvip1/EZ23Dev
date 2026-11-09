import { useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { useLang } from '../i18n';
import type { Person } from '../lib/db';
import type { EntryRow } from '../lib/types';
import { fmt } from '../lib/types';
import { ConfirmDialog } from './Dialogs';

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
  /** Inline row editor (original LoadGroupBox / txtNoEdit + txtAmtEdit). */
  onEditRow: (id: string, code: string, amount: string) => boolean;
  onClear: () => void;
  onSave: () => void;
  accent: 'indigo' | 'amber';
  /** Ref so F3 (Fighter) / F6 (Carry) can focus the code box. */
  codeInputRef?: MutableRefObject<HTMLInputElement | null>;
  /** Ref to the person text box — the original F3/F6 focus cboF/cboO (D16). */
  personSelectRef?: MutableRefObject<HTMLInputElement | null>;
  /** Extra small fields shown above the Carry grid (Ft / No / Tk). */
  extraTop?: React.ReactNode;
  /** "Order" toggles grid sort; "..." browses this person's saved codes. */
  onOrder: () => void;
  onDots: () => void;
  /** Open smart chat ingestion dialog */
  onOpenChatIngest?: () => void;
}

/**
 * Original grid display for exclusion codes (MDIMain.cs:6898-6907,
 * gF/gO Cells[1]): "-" is shown as " (-) " EXCEPT when it sits in the
 * first two characters, which the original returns verbatim — so "12-34"
 * shows as "12 (-) 34" but "1-2" stays "1-2", exactly as the original.
 * (A probe once flagged "1-2" as wrong; it is not — the decompiled
 * IIf branch preserves the prefix dash by design.)
 * The stored codeNo keeps the plain "-" form.
 */
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

/**
 * Entry panel in the original EASY main-screen style: person dropdown +
 * Order + "..." on top, grid (# / No / Amount), code + amount inputs,
 * commission/rate, total, Save / Clear.
 *
 * Keyboard loop — decompiled from MDIMain.cs (txtNoF/txtAmtF/gF and the
 * txtNoO/txtAmtO/gO mirrors, plus MDIMain_KeyDown):
 * - Enter in the code box: code present + amount empty -> focus the amount
 *   box; both present -> add the row and focus returns to the code box.
 * - Enter in the amount box: empty/zero code or amount -> focus the code
 *   box; otherwise add the row, clear both boxes, focus the code box.
 * - "." in the amount box -> back to the code box (suppress the key).
 * - Up in the code box (1-2 digit code, amount present) -> submit (add).
 * - Down in the code box (2-digit code, amount present) -> append "+" to
 *   the code and submit (add with reverse).
 * - F3 (Fighter) / F6 (Carry) or "." in the code box -> save (cmdSaveF/O).
 * - Del in the grid -> delete the selected row; F2 in the grid (or the
 *   code box) -> open the inline row editor for the selected/last row;
 *   double-click a row also opens it.
 * F3/F6 pressed anywhere else (e.g. in the amount box) are handled by the
 * form-level handler in App.tsx, which focuses the person dropdown.
 */
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

  // Keep track of the last known valid person number from the people list
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

  /** Add one code+amount (the txtAmtF/txtAmtO Enter path). */
  const submit = (codeVal: string, amountVal: string): boolean => {
    const trimmedPerson = p.personNo.trim();
    if (trimmedPerson && !p.people.some((x) => x.no === trimmedPerson)) {
      setAskNewPersonNo(trimmedPerson);
      return false;
    }
    if (!codeVal.trim() || !amountVal.trim() || amountVal.trim() === '0') {
      // Original: empty/zero -> back to the code box, nothing added.
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
    if (!ok) return; // keep the editor open on an invalid code/amount
    setEditId(null);
    focusCode();
  };

  const saveKey = p.side === 'bet' ? 'F3' : 'F6';

  const onCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!code.trim()) return; // original txtNoF: empty code -> nothing
      if (!amount.trim()) {
        focusAmount(); // never silently does nothing
        return;
      }
      submit(code, amount);
    } else if (e.key === 'ArrowUp') {
      // Original: 1- or 2-digit code + amount present -> submit.
      const len = code.trim().length;
      if ((len === 1 || len === 2) && amount.trim()) {
        e.preventDefault();
        submit(code, amount);
      }
    } else if (e.key === 'ArrowDown') {
      // Original: 2-digit code + amount present -> append "+" and submit.
      if (code.trim().length === 2 && amount.trim()) {
        e.preventDefault();
        const next = `${code.trim()}+`;
        setCode(next);
        submit(next, amount);
      }
    } else if (e.key === saveKey || e.key === '.') {
      // Original txtNoF/txtNoO: F3/F6 or "." saves (and clears the code box).
      e.preventDefault();
      e.stopPropagation();
      setCode('');
      p.onSave();
    } else if (e.key === 'F2') {
      e.preventDefault();
      e.stopPropagation();
      openEditor(selectedId);
    }
  };

  const onAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit(code, amount);
    } else if (e.key === '.') {
      // Original txtAmtF/txtAmtO: "." (main or numpad) -> back to code box.
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

  const accentBtn = p.accent === 'indigo' ? 'btn-primary' : 'btn-amber';
  const yellowInput = 'input-yellow';



  const topAccent = p.accent === 'indigo' ? 'border-t-2 border-t-indigo-600' : 'border-t-2 border-t-amber-600';

  return (
    <section className={`card flex flex-1 flex-col overflow-hidden ${topAccent}`}>
      {/* Person row: dropdown + Order + Browse (original top row) */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-1.5 py-1">
        <input
          ref={(el) => {
            internalPersonRef.current = el;
            if (p.personSelectRef) p.personSelectRef.current = el;
          }}
          type="text"
          list={`person-datalist-${p.side}`}
          className="input-yellow h-8 min-w-0 flex-1 px-2 text-sm font-bold"
          placeholder={p.side === 'bet' ? 'Fighter No. (e.g. 1)' : 'Owner No. (e.g. 1)'}
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
          className={`btn btn-sm h-8 min-h-0 px-2.5 text-xs ${sortMode === 'code' ? 'btn-primary' : 'btn-outline'}`}
          aria-pressed={sortMode === 'code'}
          title={t('entry.orderTitle')}
        >
          {t('entry.order')}
        </button>
        <button
          type="button"
          onClick={p.onDots}
          className="btn btn-outline btn-sm h-8 min-h-0 px-2.5 text-xs"
          title={t('entry.browseTitle')}
        >
          {t('entry.browse')}
        </button>
        {p.onOpenChatIngest && (
          <button
            type="button"
            onClick={p.onOpenChatIngest}
            className="btn btn-sm h-8 min-h-0 bg-indigo-600 px-2.5 text-xs font-bold text-white hover:bg-indigo-700"
            title="Smart Chat Message Ingestion (Viber / Telegram / SMS)"
          >
            📥 Chat
          </button>
        )}
      </div>

      {p.extraTop}

      {/* Commission / rate — Enter in Com moves to Rate, Enter in Rate moves to the code box (original txtCommissionF/txtRateF). */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-2 py-1">
        <label className="flex items-center gap-1 text-xs font-medium text-slate-600">
          {t('entry.com')}
          <input
            ref={comRef}
            type="number"
            className="input h-7 w-14 px-1.5 py-0.5 text-xs font-semibold"
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
        <label className="flex items-center gap-1 text-xs font-medium text-slate-600">
          {t('entry.rate')}
          <input
            ref={rateRef}
            type="number"
            className="input h-7 w-14 px-1.5 py-0.5 text-xs font-semibold"
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
        <span className={`ml-auto rounded px-1.5 py-0.5 text-xs font-extrabold ${p.side === 'bet' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
          {p.side === 'bet' ? t('entry.bet') : t('entry.carry')}
        </span>
      </div>

      {/* Code + amount (the yellow boxes, as in the original) */}
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <input
          ref={(el) => {
            codeRef.current = el;
            if (p.codeInputRef) p.codeInputRef.current = el;
          }}
          className={`${yellowInput} h-9 min-w-0 flex-1 px-2 text-sm uppercase`}
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
          className={`${yellowInput} h-9 w-24 px-2 text-sm`}
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
          className={`btn btn-sm h-9 min-h-0 px-3 text-xs ${accentBtn}`}
        >
          {t('entry.add')}
        </button>
      </div>
      {invalid && <p className="px-2 pb-1 text-xs text-red-600">{t('entry.invalid')}</p>}

      {/* Grid: # / No / Amount (original columns) */}
      <div className="min-h-[150px] flex-1 overflow-y-auto border-t border-slate-200">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100">
            <tr className="text-left text-xs font-semibold text-slate-600">
              <th className="w-8 px-2 py-1">{t('entry.colNum')}</th>
              <th className="px-2 py-1">{t('entry.colNo')}</th>
              <th className="px-2 py-1 text-right">{t('entry.colAmount')}</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {shownRows.map((r, i) => (
              <tr
                key={r.id}
                tabIndex={0}
                onClick={() => setSelectedId(r.id)}
                onDoubleClick={() => openEditor(r.id)}
                onKeyDown={(e) => onGridKeyDown(e, r)}
                className={`cursor-pointer border-t border-slate-100 outline-none focus:bg-indigo-50 ${selectedId === r.id ? 'bg-indigo-100' : ''}`}
              >
                <td className="px-2 py-1 text-xs text-slate-400">{i + 1}</td>
                {editId === r.id ? (
                  <>
                    <td className="px-1 py-1">
                      <input
                        className="input-yellow h-7 w-full px-1.5 text-xs uppercase"
                        value={editCode}
                        autoFocus
                        onChange={(e) => setEditCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            (e.target as HTMLInputElement).closest('tr')?.querySelector<HTMLInputElement>('input[data-edit-amt]')?.focus();
                          } else if (e.key === 'Escape') {
                            e.stopPropagation();
                            setEditId(null);
                            focusCode();
                          }
                        }}
                        aria-label={t('entry.editCode')}
                      />
                    </td>
                    <td className="px-1 py-1 text-right">
                      <input
                        data-edit-amt
                        className="input-yellow h-7 w-20 px-1.5 text-right text-xs"
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
                    <td className="py-1 pr-1 text-right">
                      <button type="button" onClick={saveEditor} className={`btn btn-sm h-7 min-h-0 px-2 ${accentBtn}`} aria-label={t('entry.saveEdit')}>
                        ✓
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-1 font-bold">{formatDisplayCode(r.displayCode)}</td>
                    <td className="px-2 py-1 text-right font-medium tabular-nums">{fmt(r.rowTotal)}</td>
                    <td className="py-1 pr-1 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          p.onDeleteRow(r.id);
                        }}
                        className="btn btn-danger btn-sm h-6 min-h-0 px-1.5 text-[11px]"
                        aria-label={t('entry.deleteRow')}
                      >
                        ✕
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {shownRows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                  {t('entry.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-2.5 py-1">
        <span className="text-xs font-medium text-slate-600">{t('entry.total')}</span>
        <span className="text-base font-extrabold tabular-nums text-slate-900">{fmt(total)}</span>
      </div>
      <div className="flex gap-1.5 bg-slate-50/70 px-2 pb-1.5">
        <button type="button" onClick={p.onSave} className={`btn btn-sm h-8 min-h-0 flex-1 text-xs font-bold ${accentBtn}`}>
          {p.side === 'bet' ? t('entry.saveBet') : t('entry.saveCarry')}
        </button>
        <button type="button" onClick={p.onClear} className="btn btn-ghost btn-sm h-8 min-h-0 px-3 text-xs">
          {t('entry.clear')}
        </button>
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
