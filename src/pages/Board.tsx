import { useEffect, useMemo, useState } from 'react';
import type { OverLimitRow } from '../shared-vendor/index.ts';
import type { DashboardResult } from '../shared-vendor/index.ts';
import type { DetailRow, Person } from '../lib/db';
import type { EntryRow } from '../lib/types';
import { fmt } from '../lib/types';
import { pad2str } from '../lib/format';
import { useLang } from '../i18n';
import EntryPanel from '../components/EntryPanel';
import StatusPanel from '../components/StatusPanel';
import { analyzeBoardSplits } from '../lib/suggestSplits';
import type { SuggestedSplitItem } from '../lib/suggestSplits';
import { SuggestSplitsButton, SuggestSplitsModal } from '../components/SuggestSplitsModal';
import { Icon8 } from '../components/Icons8';
import { getBoardCellHeatmap } from '../lib/boardHeatmap';

export interface BoardProps {
  betDay: string;
  session: 'AM' | 'PM';
  limit: number;
  /** Opens the Limit / Calc popup (D12/D13) — the limit is not edited inline. */
  onOpenCalc: () => void;
  dash: DashboardResult;
  board: number[];
  savedBoard?: number[];
  overLimit: OverLimitRow[];
  savedBetCount: number;
  savedCarryCount: number;
  fighters: Person[];
  owners: Person[];
  fighterNo: string;
  ownerNo: string;
  onFighterChange: (no: string) => void;
  onOwnerChange: (no: string) => void;
  onAddPerson?: (side: 'fighter' | 'owner', no: string) => void;
  fighterCom: number;
  fighterRate: number;
  ownerCom: number;
  ownerRate: number;
  onFighterCom: (v: number) => void;
  onFighterRate: (v: number) => void;
  onOwnerCom: (v: number) => void;
  onOwnerRate: (v: number) => void;
  fighterRows: EntryRow[];
  carryRows: EntryRow[];
  onAddFighter: (code: string, amount: string) => boolean;
  onAddCarry: (code: string, amount: string) => boolean;
  onDeleteFighterRow: (id: string) => void;
  onDeleteCarryRow: (id: string) => void;
  onEditFighterRow: (id: string, code: string, amount: string) => boolean;
  onEditCarryRow: (id: string, code: string, amount: string) => boolean;
  onClearFighter: () => void;
  onClearCarry: () => void;
  onSaveBet: () => void;
  onSaveCarry: () => void;
  onPassAll: () => void;
  onPassOne: (row: OverLimitRow) => void;
  onPassSelected?: (rows: OverLimitRow[]) => void;
  onPassTens: (rows?: OverLimitRow[]) => void;
  onBTbuy?: () => void;
  onCrop?: () => void;
  onBack: () => void;
  onBackOne: () => void;
  lastClipboard: string;
  onCopyLastClipboard?: () => void;
  savedDetails: DetailRow[];
  onRefr: () => void;
  highlight: string;
  autoLetter: string | null;
  commissionPct: number;
  rate: number;
  carryEnabled: boolean;
  onCarryEnabledChange: (v: boolean) => void;
  onOldNumbers: (amount: string) => void;
  onUnitSales: () => void;
  onBrowseFighter: () => void;
  onBrowseCarry: () => void;
  onCopyFighterToCarry: () => void;
  fighterCodeRef: React.RefObject<HTMLInputElement | null>;
  carryCodeRef: React.RefObject<HTMLInputElement | null>;
  fighterPersonRef: React.RefObject<HTMLInputElement | null>;
  carryPersonRef: React.RefObject<HTMLInputElement | null>;
  onOpenChatIngest?: () => void;
  onApplySuggestedSplits?: (items: SuggestedSplitItem[]) => void;
}

function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, '0');
  const h24 = now.getHours();
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${p(h12)}:${p(now.getMinutes())}:${p(now.getSeconds())} ${ampm}`;
}

export default function Board(p: BoardProps) {
  const { t } = useLang();
  const clock = useClock();
  const [selectedOver, setSelectedOver] = useState<Set<string>>(new Set());
  const [overAsc, setOverAsc] = useState(false);
  const [oldAmt, setOldAmt] = useState('1000');
  const [luckChecked, setLuckChecked] = useState(false);
  const [showSuggestSplits, setShowSuggestSplits] = useState(false);

  const fighterTotal = p.fighterRows.reduce((s, r) => s + r.rowTotal, 0);
  const carryTotal = p.carryRows.reduce((s, r) => s + r.rowTotal, 0);

  const unsavedFighterFlat = useMemo(
    () => p.fighterRows.flatMap((r) => r.numbers),
    [p.fighterRows],
  );
  const unsavedCarryFlat = useMemo(
    () => p.carryRows.flatMap((r) => r.numbers),
    [p.carryRows],
  );
  const baseSavedBoard = p.savedBoard ?? p.board;
  const splitAnalysis = useMemo(
    () =>
      analyzeBoardSplits(baseSavedBoard, p.limit, {
        unsavedFighter: unsavedFighterFlat,
        unsavedCarry: unsavedCarryFlat,
      }),
    [baseSavedBoard, p.limit, unsavedFighterFlat, unsavedCarryFlat],
  );

  const overShown = useMemo(
    () => (overAsc ? [...p.overLimit].reverse() : p.overLimit),
    [p.overLimit, overAsc],
  );

  // Column totals for the summary footer row: column j holds numbers j*10 + r.
  const colTotals = useMemo(() => {
    const out: number[] = [];
    for (let j = 0; j < 10; j++) {
      let s = 0;
      for (let r = 0; r < 10; r++) s += p.board[r + j * 10];
      out.push(s);
    }
    return out;
  }, [p.board]);

  const toggleOver = (no: string) => {
    setSelectedOver((prev) => {
      const next = new Set(prev);
      if (next.has(no)) next.delete(no);
      else next.add(no);
      return next;
    });
  };

  const passSelected = () => {
    const rows = p.overLimit.filter((r) => selectedOver.has(r.no));
    if (rows.length > 0) {
      if (p.onPassSelected) p.onPassSelected(rows);
      else rows.forEach((r) => p.onPassOne(r));
    } else if (p.overLimit.length > 0) {
      if (p.onPassSelected) p.onPassSelected([p.overLimit[0]]);
      else p.onPassOne(p.overLimit[0]);
    } else {
      if (p.onPassSelected) p.onPassSelected([]);
      else p.onPassAll();
    }
    setSelectedOver(new Set());
  };

  const passTens = () => {
    const rows = p.overLimit.filter((r) => selectedOver.has(r.no));
    if (rows.length > 0) {
      p.onPassTens(rows);
      setSelectedOver(new Set());
    } else {
      p.onPassTens();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      {/* ---- 00–99 Live Exposure Matrix (with Risk Heatmap) ---- */}
      <section className="card shrink-0 overflow-hidden border-slate-300 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] sm:min-w-full table-fixed border-collapse text-[13.5px]">
            <tbody>
              {Array.from({ length: 10 }, (_, r) => (
                <tr key={r} className="even:bg-slate-50/75">
                  {Array.from({ length: 10 }, (_, j) => {
                    const n = r + j * 10;
                    const v = p.board[n];
                    const heat = getBoardCellHeatmap(v, p.limit, p.highlight);
                    const pct = p.limit > 0 && v > 0 ? Math.round((v / p.limit) * 100) : 0;
                    return (
                      <td
                        key={j}
                        data-risk-tier={heat.tier}
                        title={v !== 0 ? `${pad2str(n)}: ${fmt(v)}${pct > 0 ? ` (${pct}%)` : ''}` : undefined}
                        className="border-r border-b border-slate-300/90 last:border-r-0 px-1.5 sm:px-2.5 py-[3px] 2xl:py-1.5 transition-colors hover:bg-indigo-50/80"
                        style={
                          heat.backgroundColor || heat.boxShadow
                            ? {
                                backgroundColor: heat.backgroundColor,
                                boxShadow: heat.boxShadow,
                              }
                            : undefined
                        }
                      >
                        <span className="flex items-baseline justify-between gap-1 leading-tight">
                          <span className={`font-mono text-[13px] tracking-tight ${heat.noClassName}`}>
                            {pad2str(n)}
                          </span>
                          <span className={`font-mono text-[13.5px] tabular-nums tracking-tight ${heat.valClassName}`}>
                            {v === 0 ? '0' : fmt(v)}
                          </span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Modern Slate-900 Column Totals Footer Row */}
              <tr className="bg-slate-900 text-emerald-300">
                {colTotals.map((tot, j) => (
                  <td
                    key={j}
                    className="border-r border-slate-800 last:border-r-0 px-1.5 sm:px-2.5 py-1 2xl:py-1.5 text-right font-mono text-[13.5px] font-black tabular-nums"
                  >
                    {fmt(tot)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {p.lastClipboard && (
        <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-indigo-200/80 bg-indigo-50/60 px-3 py-1 shadow-2xs">
          <span className="shrink-0 font-mono text-[13px] font-extrabold text-indigo-800">
            {t('board.lastSave')} ·
          </span>
          <span className="min-w-0 flex-1 truncate font-mono text-[13px] font-medium text-slate-800">
            {p.lastClipboard}
          </span>
          <button
            type="button"
            onClick={() => p.onCopyLastClipboard?.()}
            className="btn btn-outline btn-sm h-6 min-h-0 shrink-0 px-2.5 text-[12.5px] font-bold"
          >
            {t('board.lastSaveCopyAgain')}
          </button>
        </div>
      )}

      {/* ---- 4-Column Workspace: Fighter (Pic 1) | Center Controls (Pic 3) | Carry (Pic 2) | Status (Pic 4) ---- */}
      <div className="workspace-grid">
        {/* Column 1: Fighter Entry */}
        <div className="workspace-col-1">
          <EntryPanel
            side="bet"
            people={p.fighters}
            personNo={p.fighterNo}
            onPersonChange={p.onFighterChange}
            commission={p.fighterCom}
            rate={p.fighterRate}
            onCommissionChange={p.onFighterCom}
            onRateChange={p.onFighterRate}
            rows={p.fighterRows}
            onAdd={p.onAddFighter}
            onDeleteRow={p.onDeleteFighterRow}
            onEditRow={p.onEditFighterRow}
            onClear={p.onClearFighter}
            onSave={p.onSaveBet}
            accent="indigo"
            codeInputRef={p.fighterCodeRef}
            personSelectRef={p.fighterPersonRef}
            onOrder={() => undefined}
            onDots={p.onBrowseFighter}
            onOpenChatIngest={p.onOpenChatIngest}
            onAddNewPerson={p.onAddPerson}
          />
        </div>

        {/* Column 2 (Center Control Tower): Over-Limit Monitor + Digital Clock + Transfer Controls */}
        <section className="card workspace-col-2 overflow-visible border-slate-300">
          {/* Over-Limit Header */}
          <div className="flex shrink-0 items-center justify-between rounded-t-xl border-b border-rose-200/80 bg-gradient-to-r from-rose-50/80 via-slate-50 to-white px-2 py-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[13px] font-extrabold text-slate-900 whitespace-nowrap">{t('board.overTitle')}</span>
              <span className="rounded-md bg-rose-100 px-1.5 py-0.5 font-mono text-[12.5px] font-black text-rose-700 tabular-nums">
                {p.overLimit.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedOver(new Set(p.overLimit.map((r) => r.no)))}
              className="btn btn-outline btn-sm h-6 min-h-0 shrink-0 gap-1 px-2 text-[12.5px] font-bold hover:border-indigo-400 hover:text-indigo-700"
            >
              <Icon8 name="checkmark" size={12} />
              <span>{t('board.overAll')}</span>
            </button>
          </div>

          {/* Over-Limit List (ကန့်သတ်ချက် ကျော်သော နံပါတ်) — Tall, High-Contrast & Prominent */}
          <div className="flex min-h-[72px] flex-1 flex-col overflow-y-auto bg-white">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100/95 text-[12.5px] font-extrabold text-slate-800">
                <tr>
                  <th className="px-2.5 py-0.5 text-left">{t('entry.colNo')}</th>
                  <th className="px-2.5 py-0.5 text-right">{t('entry.colAmount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overShown.map((r) => (
                  <tr
                    key={r.no}
                    onClick={() => toggleOver(r.no)}
                    className={`cursor-pointer transition-colors ${
                      selectedOver.has(r.no)
                        ? 'bg-indigo-50 font-extrabold text-indigo-950'
                        : 'text-slate-900 hover:bg-rose-50/50'
                    }`}
                  >
                    <td className="px-2.5 py-1 font-mono text-[13.5px] font-extrabold text-slate-900">{r.no}</td>
                    <td className="px-2.5 py-1 text-right font-mono text-[13.5px] font-black tabular-nums text-rose-600">
                      {r.overHidden}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {overShown.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center px-2 py-2 text-center">
                <span className="rounded-lg border border-slate-200/90 bg-slate-50/90 px-2.5 py-1.5 text-[13px] font-bold text-slate-700 shadow-2xs">
                  {t('board.overEmpty')}
                </span>
              </div>
            )}
          </div>

          {/* Modern Digital Clock & Luck Bar */}
          <div className="flex shrink-0 items-center justify-between border-y border-slate-800 bg-slate-900 px-2.5 py-0.5 2xl:py-1 text-white">
            <div className="flex items-center gap-1.5 font-mono text-[13px] font-extrabold tabular-nums tracking-wider text-amber-300">
              <Icon8 name="clock" size={14} />
              <span>{clock}</span>
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 text-[13px] font-bold text-slate-100 select-none">
              <input
                type="checkbox"
                checked={luckChecked}
                onChange={(e) => setLuckChecked(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
              />
              <span>{t('board.luck')}</span>
            </label>
          </div>

          {/* Compact 5-Row Transfer & Limit Control Pad */}
          <div className="mt-auto flex shrink-0 flex-col gap-[3px] 2xl:gap-1 bg-slate-50/70 p-1 2xl:p-1.5">
            {/* Row 1: Forward Transfers (To Carry / ပို့ငွေ) */}
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={passSelected}
                className="btn btn-outline h-[26px] 2xl:h-7 min-h-0 w-full justify-between border-indigo-200/90 bg-white px-2 text-[13px] font-bold whitespace-nowrap text-indigo-950 transition-all hover:border-indigo-400 hover:bg-indigo-50/70 active:scale-95"
                title={t('board.passSelectedTitle')}
              >
                <span>{t('board.passSelected')}</span>
                <Icon8 name="forward" size={12} />
              </button>
              <button
                type="button"
                onClick={() => {
                  p.onPassAll();
                  setSelectedOver(new Set());
                }}
                className="btn btn-outline h-[26px] 2xl:h-7 min-h-0 w-full justify-between border-indigo-200/90 bg-indigo-50/60 px-2 text-[13px] font-bold whitespace-nowrap text-indigo-950 transition-all hover:border-indigo-400 hover:bg-indigo-100/80 active:scale-95"
                title={t('board.passAllTitle')}
              >
                <span>{t('board.passAll')}</span>
                <Icon8 name="forward-all" size={13} />
              </button>
            </div>

            {/* Row 2: Return Transfers (From Carry / ပြန်ယူ) */}
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={p.onBackOne}
                className="btn btn-outline h-[26px] 2xl:h-7 min-h-0 w-full justify-between border-amber-200/90 bg-white px-2 text-[13px] font-bold whitespace-nowrap text-amber-950 transition-all hover:border-amber-400 hover:bg-amber-50/70 active:scale-95"
                title={t('board.backOneTitle')}
              >
                <Icon8 name="back" size={12} />
                <span>{t('board.backOne')}</span>
              </button>
              <button
                type="button"
                onClick={p.onBack}
                className="btn btn-outline h-[26px] 2xl:h-7 min-h-0 w-full justify-between border-amber-200/90 bg-amber-50/60 px-2 text-[13px] font-bold whitespace-nowrap text-amber-950 transition-all hover:border-amber-400 hover:bg-amber-100/80 active:scale-95"
                title={t('board.backAllTitle')}
              >
                <Icon8 name="back-all" size={13} />
                <span>{t('board.backAll')}</span>
              </button>
            </div>

            {/* Row 3: Tens Rounding + Limit Bulk Optimization (BTbuy / Crop) */}
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={passTens}
                className="btn btn-outline h-[26px] 2xl:h-7 min-h-0 w-full justify-between border-slate-300 bg-white px-1.5 text-[12.5px] font-bold whitespace-nowrap text-slate-900 transition-all hover:border-indigo-300 hover:bg-indigo-50/50 active:scale-95"
                title={t('board.passTensTitle')}
              >
                <span>{t('board.passTens')}</span>
                <Icon8 name="forward-tens" size={12} />
              </button>
              <button
                type="button"
                onClick={() => p.onBTbuy?.()}
                disabled={!p.onBTbuy}
                className="btn btn-outline btn-sm h-[26px] 2xl:h-7 min-h-0 w-full justify-center gap-1 border-slate-300 bg-white px-1.5 text-[12.5px] font-bold whitespace-nowrap text-slate-800 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95"
                title={t('board.btbuyTitle')}
              >
                <Icon8 name="plus" size={11} />
                <span>{t('board.btbuy')}</span>
              </button>
              <button
                type="button"
                onClick={() => p.onCrop?.()}
                disabled={!p.onCrop}
                className="btn btn-outline btn-sm h-[26px] 2xl:h-7 min-h-0 w-full justify-center gap-1 border-slate-300 bg-white px-1.5 text-[12.5px] font-bold whitespace-nowrap text-slate-800 transition-all hover:border-rose-400 hover:bg-rose-50 hover:text-rose-800 active:scale-95"
                title={t('board.cropTitle')}
              >
                <Icon8 name="crop" size={11} />
                <span>{t('board.crop')}</span>
              </button>
            </div>

            {/* Row 4: Suggest Splits ("ကာငွေအကြံပြုချက်") with Hover Recommendation Preview */}
            <SuggestSplitsButton
              analysis={splitAnalysis}
              onOpenModal={() => setShowSuggestSplits(true)}
              onQuickApply={(items) => p.onApplySuggestedSplits?.(items)}
            />

            {/* Row 5: Replay Old Numbers + Unit Sales Side-by-Side */}
            <div className="grid grid-cols-2 gap-1">
              <div className="flex h-[26px] 2xl:h-7 w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15">
                <button
                  type="button"
                  onClick={() => p.onOldNumbers(oldAmt)}
                  className="flex flex-1 items-center justify-center gap-1 border-r border-slate-200 bg-slate-50 px-1.5 text-center text-[12.5px] font-bold whitespace-nowrap text-slate-800 transition-colors hover:bg-slate-100 hover:text-slate-950"
                  title={t('board.oldNoTitle')}
                >
                  <Icon8 name="clock" size={11} />
                  <span>{t('board.oldNo')}</span>
                </button>
                <input
                  className="w-12 bg-white px-1 text-center font-mono text-[12.5px] font-bold tabular-nums text-slate-900 focus:outline-none"
                  value={oldAmt}
                  inputMode="numeric"
                  onChange={(e) => setOldAmt(e.target.value)}
                  aria-label={t('board.oldNoAmountLabel')}
                />
              </div>
              <button
                type="button"
                onClick={p.onUnitSales}
                className="btn btn-outline btn-sm h-[26px] 2xl:h-7 min-h-0 w-full justify-center gap-1 border-slate-300 bg-white px-1.5 text-[12.5px] font-bold whitespace-nowrap text-slate-800 hover:bg-slate-100 hover:text-slate-950"
              >
                <Icon8 name="report" size={11} />
                <span>{t('board.unitSales')}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Column 3: Owner Carry Entry */}
        <div className="workspace-col-3">
          <EntryPanel
            side="carry"
            people={p.owners}
            personNo={p.ownerNo}
            onPersonChange={p.onOwnerChange}
            commission={p.ownerCom}
            rate={p.ownerRate}
            onCommissionChange={p.onOwnerCom}
            onRateChange={p.onOwnerRate}
            rows={p.carryRows}
            onAdd={p.onAddCarry}
            onDeleteRow={p.onDeleteCarryRow}
            onEditRow={p.onEditCarryRow}
            onClear={p.onClearCarry}
            onSave={p.onSaveCarry}
            accent="amber"
            codeInputRef={p.carryCodeRef}
            personSelectRef={p.carryPersonRef}
            onOrder={() => undefined}
            onDots={p.onBrowseCarry}
            onAddNewPerson={p.onAddPerson}
            extraTop={
              <div className="flex shrink-0 items-center justify-between gap-1 border-b border-amber-200/70 bg-amber-50/50 px-1.5 py-1 text-[12px] whitespace-nowrap">
                <label className="flex cursor-pointer items-center gap-1 font-bold text-slate-900">
                  <input
                    type="checkbox"
                    checked={p.carryEnabled}
                    onChange={(e) => p.onCarryEnabledChange(e.target.checked)}
                    className="h-3.5 w-3.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>{t('board.carryLabel')}</span>
                  <span className="font-mono text-[12.5px] font-extrabold tabular-nums text-amber-800">
                    {fmt(carryTotal)}
                  </span>
                </label>
                <div className="flex items-center gap-1 min-w-0 font-semibold text-slate-700">
                  <span className="text-[11.5px]">{p.carryEnabled ? t('board.labelCr') : t('board.labelFt')}</span>
                  <input
                    className="h-5 w-5.5 rounded border border-amber-300 bg-white px-0.5 text-center font-mono text-[11.5px] font-bold text-slate-900"
                    value={p.fighterNo}
                    readOnly
                    aria-label={t('board.carryFighterNo')}
                  />
                  <span className="font-mono text-[11.5px] font-bold text-slate-600">({p.fighterRows.length})</span>
                  <span className="font-mono text-[12px] font-extrabold tabular-nums text-slate-900">{fmt(fighterTotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={p.onCopyFighterToCarry}
                  className="btn btn-outline btn-sm h-6 min-h-0 shrink-0 gap-1 px-1.5 text-[11.5px] font-bold text-amber-900 hover:border-amber-400 hover:bg-amber-100/70"
                  title={t('board.copyFighterToCarryTitle')}
                >
                  <Icon8 name="clipboard" size={11} />
                  <span>{t('board.copyFighterToCarry')}</span>
                </button>
              </div>
            }
          />
        </div>

        {/* Column 4: Financial Status Ledger & AUTO Indicator */}
        <div className="workspace-col-4">
          <StatusPanel
            dash={p.dash}
            limit={p.limit}
            onOpenCalc={p.onOpenCalc}
            commissionPct={p.commissionPct}
            rate={p.rate}
            autoLetter={p.autoLetter}
          />
        </div>
      </div>

      {/* ---- Bottom Command Dock: Sales (F3) / Refresh / Over-Limit Sort / Carry (F6) ---- */}
      <div className="card flex shrink-0 flex-wrap items-center justify-between gap-2 border-slate-300 bg-white px-2.5 py-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => p.fighterPersonRef.current?.focus()}
            className="btn btn-outline btn-sm h-7 min-h-0 gap-1.5 px-2.5 text-[13px] font-bold text-indigo-900 hover:border-indigo-300 hover:bg-indigo-50/50"
          >
            <Icon8 name="users" size={13} />
            <span>{t('board.salesF3')}</span>
          </button>
          <span className="px-2 font-mono text-[13.5px] font-extrabold tabular-nums text-slate-900">
            {fmt(fighterTotal)}
          </span>
          <button
            type="button"
            onClick={p.onClearFighter}
            className="btn btn-ghost btn-sm h-7 min-h-0 gap-1 px-2.5 text-[13px] font-bold"
          >
            <Icon8 name="clear" size={12} />
            <span>{t('board.cl')}</span>
          </button>

          <div className="mx-1 h-4 w-px bg-slate-200" />

          <button
            type="button"
            onClick={p.onRefr}
            className="btn btn-outline btn-sm h-7 min-h-0 gap-1 px-2.5 text-[13px] font-bold"
            title={t('board.refrTitle')}
          >
            <Icon8 name="refresh" size={13} />
            <span>{t('board.refr')}</span>
          </button>
          <span
            className="px-1.5 font-mono text-[13px] font-bold tabular-nums text-slate-600"
            title={t('board.savedRowsTitle')}
          >
            ({p.savedBetCount + p.savedCarryCount})
          </span>
          <button
            type="button"
            onClick={() => setSelectedOver(new Set(p.overLimit.map((r) => r.no)))}
            className="btn btn-outline btn-sm h-7 min-h-0 gap-1 px-2.5 text-[13px] font-bold"
          >
            <Icon8 name="checkmark" size={12} />
            <span>{t('board.all')}</span>
          </button>
          <button
            type="button"
            onClick={() => setOverAsc((v) => !v)}
            className="btn btn-outline btn-sm h-7 min-h-0 gap-1 px-2.5 text-[13px] font-bold"
            title={t('board.sortTitle')}
          >
            <Icon8 name="sort" size={12} />
            <span>{t('board.sort')}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => p.carryPersonRef.current?.focus()}
            className="btn btn-outline btn-sm h-7 min-h-0 gap-1.5 px-2.5 text-[13px] font-bold text-amber-900 hover:border-amber-300 hover:bg-amber-50/50"
          >
            <Icon8 name="users" size={13} />
            <span>{t('board.carryF6')}</span>
          </button>
          <span className="px-2 font-mono text-[13.5px] font-extrabold tabular-nums text-slate-900">
            {fmt(carryTotal)}
          </span>
          <button
            type="button"
            onClick={p.onClearCarry}
            className="btn btn-ghost btn-sm h-7 min-h-0 gap-1 px-2.5 text-[13px] font-bold"
          >
            <Icon8 name="clear" size={12} />
            <span>{t('board.cl')}</span>
          </button>
        </div>
      </div>

      {showSuggestSplits && (
        <SuggestSplitsModal
          savedBoard={baseSavedBoard}
          limit={p.limit}
          unsavedFighter={unsavedFighterFlat}
          unsavedCarry={unsavedCarryFlat}
          onApplySplits={(items) => p.onApplySuggestedSplits?.(items)}
          onClose={() => setShowSuggestSplits(false)}
        />
      )}
    </div>
  );
}
