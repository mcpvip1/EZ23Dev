/**
 * EASY 2D web — Unit Sales dialog (audit item #10).
 *
 * Replaces the view-only `UnitSalesDialog` that lived in Dialogs.tsx.
 * Same props interface as the old call site, plus `onSaved` (called
 * after a successful Save so the parent reloads).
 *
 * Mirrors the original `UnitSales` form:
 *  - Load: per-number sales for the current day/session (`gT`, hidden
 *    in the original) from `bet` rows, and the distribution grid (`g`,
 *    visible): one row per distinct amount — count of numbers sitting
 *    at that amount — plus the zero row first (count of numbers with no
 *    bets, amount 0). The third column is an editable amount to add.
 *  - Save (`btnSave_Click`): for every number whose current amount
 *    matches a distribution row with a non-zero top-up, insert a Bet
 *    row + a BetCode row for customer `'X'` (commission/rate from
 *    Calc), all under one new GroupID (MAX(GroupID) from betcode + 1).
 *    No confirm in the original, none here. After saving the original
 *    closes with DialogResult OK — so this calls `onSaved()` and then
 *    `onClose()`.
 *  - Copy (`btnCopy_Click`): copies one `Amt->No` line per distribution
 *    row — the unit amount, `->`, the count of numbers at that amount —
 *    in grid order (zero row first), CRLF-separated. The dialog stays
 *    open. Cancel / ✕ / backdrop closes without saving.
 *
 * The write path reuses exactly the Bet-row shapes `App.tsx`'s
 * `saveSide('bet')` writes (`SavedCode` + `DetailRow` via
 * `dbPutMany('codes' | 'details')`), with personNo `'X'` and no
 * `people` row — the original inserts customer 'X' with no Fighter
 * master row either.
 */
import { useMemo, useState } from 'react';
import type { AllData, DetailRow, SavedCode, Session } from '../lib/db';
import { dbPutMany, nowStamp, uid } from '../lib/db';
import { fmt } from '../lib/types';
import { Modal } from './Dialogs';
import { useLang } from '../i18n';

export interface UnitSalesDialogProps {
  data: AllData;
  betDay: string;
  session: Session;
  onClose: () => void;
  onSaved: () => void;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

export function UnitSalesDialog(p: UnitSalesDialogProps) {
  const { t } = useLang();
  // Per-number sales this session (original gT, from `bet` rows).
  const perNo = useMemo(() => {
    const m = new Map<string, number>();
    p.data.details
      .filter((d) => d.side === 'bet' && d.betDay === p.betDay && d.session === p.session)
      .forEach((d) => m.set(d.no, (m.get(d.no) ?? 0) + d.amount));
    return m;
  }, [p.data, p.betDay, p.session]);

  // Distribution rows (original g): { amt, count }, amount ascending,
  // zero row first — exactly the original's `order by a.amt` with the
  // 0-amount row (100 - numbers with bets) prepended.
  const dist = useMemo(() => {
    const counts = new Map<number, number>();
    for (let i = 0; i < 100; i++) {
      const n = String(i).padStart(2, '0');
      const amt = perNo.get(n) ?? 0;
      counts.set(amt, (counts.get(amt) ?? 0) + 1);
    }
    return [...counts.entries()].map(([amt, count]) => ({ amt, count })).sort((a, b) => a.amt - b.amt);
  }, [perNo]);

  const total = [...perNo.values()].reduce((a, b) => a + b, 0);

  // Editable top-up per distribution row (original g column 3, "Amount").
  const [topUps, setTopUps] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const topUpFor = (amt: number): number => {
    const v = Number(topUps[amt] ?? '');
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
  };

  const save = async () => {
    if (busy) return;
    // Original: one BetCode + Bet row per number whose amount matches a
    // distribution row with a non-zero top-up; one shared GroupID.
    const commission = p.data.settings?.commission ?? 16;
    const rate = p.data.settings?.rate ?? 80;
    const betCodes = p.data.codes.filter((c) => c.side === 'bet');
    const groupId = betCodes.reduce((m, c) => Math.max(m, c.groupId), 0) + 1;
    let sno = betCodes.reduce((m, c) => Math.max(m, c.sno), 0);
    const now = Date.now();
    const stamp = nowStamp();
    const codes: SavedCode[] = [];
    const details: DetailRow[] = [];
    for (let i = 0; i < 100; i++) {
      const no = String(i).padStart(2, '0');
      const amt = perNo.get(no) ?? 0;
      const topUp = topUpFor(amt);
      if (topUp <= 0) continue;
      sno += 1;
      codes.push({
        id: uid(),
        side: 'bet',
        betDay: p.betDay,
        session: p.session,
        personNo: 'X',
        displayCode: no,
        codeNo: no,
        amountText: String(topUp),
        rowTotal: topUp,
        commission,
        rate,
        groupId,
        sno,
        betDateTime: stamp,
        updatedAt: now,
      });
      details.push({
        id: uid(),
        side: 'bet',
        betDay: p.betDay,
        session: p.session,
        personNo: 'X',
        no,
        amount: topUp,
        commission,
        rate,
        sno,
        groupId,
        updatedAt: now,
      });
    }
    if (codes.length === 0) {
      setMsg(t('unitsales.msgEnterFirst'));
      return;
    }
    setBusy(true);
    try {
      await dbPutMany('codes', codes);
      await dbPutMany('details', details);
    } catch {
      setBusy(false);
      setMsg(t('unitsales.msgSaveFailed'));
      return;
    }
    // Original closes with DialogResult OK after saving.
    p.onSaved();
    p.onClose();
  };

  const copy = async () => {
    // Original btnCopy_Click: `Unit -> Count` per grid row, CRLF lines.
    const text = dist.map((r) => `${r.amt}->${r.count}`).join('\r\n');
    const ok = await copyText(text);
    setMsg(ok ? t('unitsales.msgCopied', { n: dist.length }) : t('unitsales.msgCopyFailed'));
  };

  return (
    <Modal title={t('unitsales.title', { day: p.betDay, session: p.session })} onClose={p.onClose} wide>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs font-medium text-slate-600">{t('unitsales.note', { total: fmt(total) })}</p>
        <span className="rounded bg-teal-100 px-2.5 py-0.5 font-mono text-xs font-extrabold text-teal-900">
          Total: {fmt(total)}
        </span>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* Left: 00-99 Sales Matrix */}
        <section className="card overflow-hidden border-t-2 border-t-slate-700">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700">
            00–99 Sales Matrix
          </div>
          <div className="p-2">
            <div className="grid grid-cols-5 gap-1 text-xs sm:grid-cols-10">
              {Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0')).map((n) => {
                const v = perNo.get(n) ?? 0;
                return (
                  <div
                    key={n}
                    className={`flex flex-col items-center justify-center rounded border px-1 py-1 font-mono ${
                      v > 0
                        ? 'border-amber-300 bg-amber-50 font-extrabold text-slate-900'
                        : 'border-slate-100 bg-slate-50/50 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500">{n}</span>
                    <span className="text-[11px] tabular-nums">{fmt(v)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right: Distribution & Bulk Top-Up Table */}
        <section className="card flex flex-col overflow-hidden border-t-2 border-t-teal-600">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-1.5">
            <h3 className="text-xs font-extrabold text-slate-800">{t('unitsales.distTitle')}</h3>
            <span className="rounded bg-teal-100 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-800">
              {dist.length} tiers
            </span>
          </div>
          <div className="max-h-72 flex-1 overflow-y-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 font-bold text-slate-600">
                <tr>
                  <th className="px-3 py-2">{t('unitsales.colCount')}</th>
                  <th className="px-3 py-2 text-right">{t('unitsales.colUnit')}</th>
                  <th className="px-3 py-2 text-right">{t('unitsales.colAdd')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dist.map((r) => (
                  <tr key={r.amt} className="hover:bg-slate-50">
                    <td className="px-3 py-1.5 font-mono font-semibold text-slate-700">{r.count} nos</td>
                    <td className="px-3 py-1.5 text-right font-mono font-extrabold tabular-nums text-slate-900">
                      {fmt(r.amt)}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <input
                        type="number"
                        min={0}
                        className="input-yellow h-7 w-24 px-2 text-right font-mono text-xs font-bold tabular-nums"
                        value={topUps[r.amt] ?? ''}
                        placeholder="0"
                        onChange={(e) => setTopUps((prev) => ({ ...prev, [r.amt]: e.target.value }))}
                        aria-label={t('unitsales.addAmountLabel', { amt: r.amt })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {msg && (
        <p className="mt-3 rounded-md bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800" role="status">
          {msg}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-[11px] text-slate-400">{t('unitsales.foot')}</p>
        <div className="flex gap-2">
          <button type="button" onClick={p.onClose} className="btn btn-ghost h-8 min-h-0 px-3 text-xs">
            {t('unitsales.cancel')}
          </button>
          <button type="button" onClick={() => void copy()} className="btn btn-outline h-8 min-h-0 px-3.5 text-xs font-bold">
            {t('unitsales.copy')}
          </button>
          <button type="button" disabled={busy} onClick={() => void save()} className="btn btn-teal h-8 min-h-0 px-4 text-xs font-bold">
            {t('unitsales.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
