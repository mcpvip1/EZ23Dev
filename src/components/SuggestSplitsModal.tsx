import { useMemo, useState } from 'react';
import { Modal } from './Dialogs';
import { analyzeBoardSplits } from '../lib/suggestSplits';
import type { SuggestedSplitItem, SuggestSplitsAnalysis } from '../lib/suggestSplits';
import { fmt } from '../lib/types';
import { Icon8 } from './Icons8';

export interface SuggestSplitsButtonProps {
  analysis: SuggestSplitsAnalysis;
  onOpenModal: () => void;
  onQuickApply: (items: SuggestedSplitItem[]) => void;
}

/**
 * Center Control Tower button for "ကာငွေအကြံပြုချက်" (Suggest Splits).
 * On hover: displays "ကာငွေဖယ်ထုတ်ရန်အခက်အခဲဖြစ်ပါက နှိပ်ကြည့်ပါ" along with
 * a live preview of the recommended Fighter / Owner splits.
 * On click: opens the full interactive SuggestSplitsModal (or allows one-click apply).
 */
export function SuggestSplitsButton(p: SuggestSplitsButtonProps) {
  const [hovered, setHovered] = useState(false);
  const count = p.analysis.items.length;
  const urgentCount = p.analysis.overLimitCount + p.analysis.nearLimitCount;

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={p.onOpenModal}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        title="ကာငွေဖယ်ထုတ်ရန်အခက်အခဲဖြစ်ပါက နှိပ်ကြည့်ပါ"
        className={`btn h-8 min-h-0 w-full justify-between px-2.5 text-xs font-extrabold whitespace-nowrap transition-all ${
          urgentCount > 0
            ? 'border border-teal-500/40 bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-xs hover:from-teal-500 hover:to-indigo-500'
            : 'border border-teal-300 bg-teal-50/80 text-teal-900 hover:border-teal-400 hover:bg-teal-100/80'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Icon8 name="lightning" size={15} />
          <span>ကာငွေအကြံပြုချက်</span>
        </span>
        <span
          className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-extrabold tabular-nums ${
            urgentCount > 0
              ? 'bg-white/20 text-white'
              : 'bg-teal-200/70 text-teal-900'
          }`}
        >
          {count}
        </span>
      </button>

      {/* Rich Hover Popover: Shows exact hover prompt + recommended split preview */}
      {hovered && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-80 -translate-x-1/2 rounded-2xl border border-slate-700 bg-slate-900/98 p-3 text-left text-slate-100 shadow-2xl ring-1 ring-white/10 backdrop-blur-xs"
        >
          <div className="flex items-start gap-2 border-b border-slate-700/80 pb-2">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-500/20">
              <Icon8 name="idea" size={16} />
            </span>
            <div>
              <p className="text-xs font-extrabold leading-snug text-amber-300">
                ကာငွေဖယ်ထုတ်ရန်အခက်အခဲဖြစ်ပါက နှိပ်ကြည့်ပါ
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                ကန့်သတ်ချက် {fmt(p.analysis.limit)} · ချန်ငွေ {p.analysis.safeTargetPct}% စံနှုန်း
              </p>
            </div>
          </div>

          {count > 0 ? (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>ဂဏန်း (လက်ရှိ)</span>
                <span>ဖိုက်တာချန် / ဒိုင်ကာငွေ</span>
              </div>
              <div className="max-h-36 space-y-1 overflow-y-auto pr-0.5">
                {p.analysis.items.slice(0, 5).map((item) => (
                  <div
                    key={item.no}
                    className="flex items-center justify-between rounded-lg bg-slate-800/90 px-2 py-1 font-mono text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-extrabold ${
                          item.urgency === 'OVER_LIMIT'
                            ? 'text-rose-400'
                            : item.urgency === 'NEAR_LIMIT'
                              ? 'text-amber-300'
                              : 'text-indigo-300'
                        }`}
                      >
                        {item.no}
                      </span>
                      <span className="text-[10px] text-slate-400">({fmt(item.currentExposure)})</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold tabular-nums">
                      <span className="text-indigo-300">{fmt(item.fighterSplit)}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-amber-300">{fmt(item.ownerSplit)}</span>
                    </div>
                  </div>
                ))}
                {count > 5 && (
                  <div className="text-center font-mono text-[10px] text-slate-400">
                    + နောက်ထပ် {count - 5} လုံး ကြည့်ရန် နှိပ်ပါ…
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-700/80 pt-1.5 font-mono text-[11px] font-extrabold">
                <span className="text-slate-300">စုစုပေါင်း အကြံပြုချက်:</span>
                <span>
                  <span className="text-indigo-300">{fmt(p.analysis.totalFighterSplit)}</span>
                  <span className="mx-1 text-slate-500">/</span>
                  <span className="text-amber-300">{fmt(p.analysis.totalOwnerSplit)}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  p.onQuickApply(p.analysis.items);
                  setHovered(false);
                }}
                className="mt-1 flex h-7 w-full items-center justify-center gap-1.5 rounded-lg bg-teal-500 px-2.5 text-[11px] font-extrabold text-slate-950 transition-colors hover:bg-teal-400"
              >
                <Icon8 name="lightning" size={14} />
                <span>တစ်ချက်နှိပ်၍ အချိုးညီ ခွဲထုတ်ရန် ({count})</span>
              </button>
            </div>
          ) : (
            <div className="mt-2 rounded-lg bg-slate-800/80 p-2 text-[11px] leading-relaxed text-slate-300">
              <div className="font-semibold text-slate-200">
                လက်ရှိ ဇယားတွင် ကန့်သတ်ချက်နီးကပ်သော ဂဏန်း မရှိသေးပါ။
              </div>
              <div className="mt-1 font-mono text-[10px] text-slate-400">
                အကြံပြုချက် နမူနာ (ကန့်သတ်ချက် {fmt(p.analysis.limit)}):
                <br />• ဖိုက်တာ ချန်ငွေ: <span className="text-indigo-300">{fmt(Math.round(p.analysis.limit * 0.75))}</span> (75%)
                <br />• ဒိုင် ကာငွေ (ပို့ငွေ): <span className="text-amber-300">ကျော်/ပိုငွေ အလိုအလျောက်</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface SuggestSplitsModalProps {
  savedBoard: number[];
  limit: number;
  unsavedFighter: Array<{ no: string; amount: number }>;
  unsavedCarry: Array<{ no: string; amount: number }>;
  onApplySplits: (items: SuggestedSplitItem[]) => void;
  onClose: () => void;
}

export function SuggestSplitsModal(p: SuggestSplitsModalProps) {
  const [nearRatio, setNearRatio] = useState(0.7);
  const [safeRatio, setSafeRatio] = useState(0.75);
  const [excludedNos, setExcludedNos] = useState<Set<string>>(new Set());

  const analysis = useMemo(
    () =>
      analyzeBoardSplits(p.savedBoard, p.limit, {
        nearThresholdRatio: nearRatio,
        safeTargetRatio: safeRatio,
        unsavedFighter: p.unsavedFighter,
        unsavedCarry: p.unsavedCarry,
      }),
    [p.savedBoard, p.limit, p.unsavedFighter, p.unsavedCarry, nearRatio, safeRatio],
  );

  const selectedItems = useMemo(
    () => analysis.items.filter((it) => !excludedNos.has(it.no)),
    [analysis.items, excludedNos],
  );

  const toggleNo = (no: string) => {
    setExcludedNos((prev) => {
      const next = new Set(prev);
      if (next.has(no)) next.delete(no);
      else next.add(no);
      return next;
    });
  };

  const selectedTotalExposure = selectedItems.reduce((s, x) => s + x.currentExposure, 0);
  const selectedFighterTotal = selectedItems.reduce((s, x) => s + x.fighterSplit, 0);
  const selectedOwnerTotal = selectedItems.reduce((s, x) => s + x.ownerSplit, 0);

  return (
    <Modal title="ကာငွေအကြံပြုချက် — ဖိုက်တာ / ဒိုင် အချိုးညီ ခွဲထုတ်မှု" onClose={p.onClose} wide>
      {/* Top Guidance Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200/80 bg-gradient-to-r from-teal-50/90 via-indigo-50/50 to-white px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-600/15">
              <Icon8 name="lightning" size={16} />
            </span>
            <span>ကာငွေဖယ်ထုတ်ရန်အခက်အခဲဖြစ်ပါက နှိပ်ကြည့်ပါ</span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            ကန့်သတ်ချက် ({fmt(analysis.limit)}) သို့ နီးကပ်နေသော သို့မဟုတ် ကျော်လွန်နေသော ဂဏန်းများကို စစ်ဆေးပြီး ဖိုက်တာ (ချန်ငွေ) နှင့် ဒိုင် (ကာငွေ/ပို့ငွေ) အချိုးညီ တစ်ချက်တည်း ခွဲထုတ်ပေးပါသည်။
          </p>
        </div>

        {/* Threshold & Safe Target Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs">
            <span>သတိပေးနှုန်း:</span>
            <select
              value={nearRatio}
              onChange={(e) => setNearRatio(Number(e.target.value))}
              className="bg-transparent font-mono font-extrabold text-indigo-700 focus:outline-none"
            >
              <option value={0.5}>50% ({fmt(Math.round(analysis.limit * 0.5))}+)</option>
              <option value={0.6}>60% ({fmt(Math.round(analysis.limit * 0.6))}+)</option>
              <option value={0.7}>70% ({fmt(Math.round(analysis.limit * 0.7))}+)</option>
              <option value={0.8}>80% ({fmt(Math.round(analysis.limit * 0.8))}+)</option>
              <option value={0.9}>90% ({fmt(Math.round(analysis.limit * 0.9))}+)</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs">
            <span>ဖိုက်တာ ချန်ငွေ စံနှုန်း:</span>
            <select
              value={safeRatio}
              onChange={(e) => setSafeRatio(Number(e.target.value))}
              className="bg-transparent font-mono font-extrabold text-teal-700 focus:outline-none"
            >
              <option value={0.6}>60% ({fmt(Math.round(analysis.limit * 0.6))})</option>
              <option value={0.7}>70% ({fmt(Math.round(analysis.limit * 0.7))})</option>
              <option value={0.75}>75% ({fmt(Math.round(analysis.limit * 0.75))})</option>
              <option value={0.8}>80% ({fmt(Math.round(analysis.limit * 0.8))})</option>
              <option value={0.9}>90% ({fmt(Math.round(analysis.limit * 0.9))})</option>
              <option value={1.0}>100% ({fmt(analysis.limit)})</option>
            </select>
          </label>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
          <div className="text-[11px] font-semibold text-slate-500">ရွေးချယ်ထားသော ဂဏန်း</div>
          <div className="mt-0.5 font-mono text-base font-extrabold text-slate-900 tabular-nums">
            {selectedItems.length} လုံး
            <span className="ml-1.5 text-xs font-semibold text-slate-500">
              (ကျော် {analysis.overLimitCount} · နီးကပ် {analysis.nearLimitCount})
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
          <div className="text-[11px] font-semibold text-slate-500">စုစုပေါင်း လက်ရှိထိုးငွေ</div>
          <div className="mt-0.5 font-mono text-base font-extrabold text-slate-900 tabular-nums">
            {fmt(selectedTotalExposure)}
          </div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-3.5 py-2.5">
          <div className="text-[11px] font-semibold text-indigo-700">ဖိုက်တာ ချန်ငွေ (Fighter Hold)</div>
          <div className="mt-0.5 font-mono text-base font-extrabold text-indigo-900 tabular-nums">
            {fmt(selectedFighterTotal)}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-2.5">
          <div className="text-[11px] font-semibold text-amber-800">ဒိုင် ကာငွေ / ပို့ငွေ (Owner Split)</div>
          <div className="mt-0.5 font-mono text-base font-extrabold text-amber-900 tabular-nums">
            {fmt(selectedOwnerTotal)}
          </div>
        </div>
      </div>

      {/* Recommended Split Table */}
      <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100/95 text-[11px] font-bold text-slate-600">
            <tr>
              <th className="w-10 px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={analysis.items.length > 0 && selectedItems.length === analysis.items.length}
                  onChange={() => {
                    if (selectedItems.length === analysis.items.length) {
                      setExcludedNos(new Set(analysis.items.map((x) => x.no)));
                    } else {
                      setExcludedNos(new Set());
                    }
                  }}
                  aria-label="အားလုံး ရွေးရန်"
                />
              </th>
              <th className="px-3 py-2 text-left">ဂဏန်း</th>
              <th className="px-3 py-2 text-left">အခြေအနေ</th>
              <th className="px-3 py-2 text-right">လက်ရှိ ပမာဏ</th>
              <th className="px-3 py-2 text-right text-indigo-700">ဖိုက်တာ ချန်ငွေ (Fighter)</th>
              <th className="px-3 py-2 text-right text-amber-700">ဒိုင် ကာငွေ (Owner)</th>
              <th className="px-3 py-2 text-right">အချိုး (Hold / Hedge)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {analysis.items.map((item) => {
              const checked = !excludedNos.has(item.no);
              const holdPct =
                item.currentExposure > 0
                  ? Math.round((item.fighterSplit / item.currentExposure) * 100)
                  : 0;
              const hedgePct = 100 - holdPct;
              return (
                <tr
                  key={item.no}
                  onClick={() => toggleNo(item.no)}
                  className={`cursor-pointer transition-colors ${
                    checked ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 opacity-55'
                  }`}
                >
                  <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleNo(item.no)}
                      aria-label={`ဂဏန်း ${item.no}`}
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-sm font-extrabold text-slate-900">
                    {item.no}
                    {item.reverseNo !== item.no && (
                      <span className="ml-1.5 text-[11px] font-medium text-slate-400">
                        (R: {item.reverseNo} = {fmt(item.reverseExposure)})
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-bold ${
                        item.urgency === 'OVER_LIMIT'
                          ? 'text-rose-600'
                          : item.urgency === 'NEAR_LIMIT'
                            ? 'text-amber-600'
                            : 'text-indigo-600'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          item.urgency === 'OVER_LIMIT'
                            ? 'bg-rose-500'
                            : item.urgency === 'NEAR_LIMIT'
                              ? 'bg-amber-500'
                              : 'bg-indigo-500'
                        }`}
                      />
                      <span>
                        {item.urgency === 'OVER_LIMIT'
                          ? `ကန့်သတ်ချက်ကျော် (${item.limitPct}%)`
                          : item.urgency === 'NEAR_LIMIT'
                            ? `ကန့်သတ်ချက်နီးကပ် (${item.limitPct}%)`
                            : `အများဆုံးထိုးငွေ (${item.limitPct}%)`}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {fmt(item.currentExposure)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-extrabold text-indigo-700 tabular-nums">
                    {fmt(item.fighterSplit)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-extrabold text-amber-700 tabular-nums">
                    {fmt(item.ownerSplit)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] font-semibold text-slate-600 tabular-nums">
                    {holdPct}% / {hedgePct}%
                  </td>
                </tr>
              );
            })}
            {analysis.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-xs text-slate-400">
                  လက်ရှိ ဇယားတွင် ခွဲထုတ်ရန် ဂဏန်း မရှိသေးပါ။ ဖိုက်တာ ထိုးငွေ ထည့်သွင်းပြီးနောက် ကာငွေအကြံပြုချက်ကို အသုံးပြုနိုင်ပါသည်။
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Footer Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-500">
          ခွဲထုတ်ပြီးနောက် ဖိုက်တာ (F3) သို့မဟုတ် ပို့ငွေ (F6) သိမ်းရန် ခလုတ်နှိပ်၍ အတည်ပြုသိမ်းဆည်းနိုင်ပါသည်။
        </span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={p.onClose} className="btn btn-ghost h-9 min-h-0 px-3.5 text-xs">
            ပိတ်ရန်
          </button>
          <button
            type="button"
            disabled={selectedItems.length === 0}
            onClick={() => {
              p.onApplySplits(selectedItems);
              p.onClose();
            }}
            className="btn btn-primary h-9 min-h-0 px-4 text-xs font-extrabold"
          >
            <Icon8 name="lightning" size={15} />
            <span>အကြံပြုချက်အတိုင်း တစ်ချက်တည်း ခွဲထုတ်ရန် ({selectedItems.length})</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
