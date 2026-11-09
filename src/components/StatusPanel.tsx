import { useLang } from '../i18n';
import type { DashboardResult } from '../shared-vendor/index.ts';
import { fmt } from '../lib/types';

/**
 * Right-hand status panel from the original main screen (§7.4):
 * Limit / Times / Sales / Carry / Net Sales / % / Gross Profit /
 * Rate / Net P/L, plus the AUTO letter map at the bottom-right.
 * Values are identical to the dashboard the tab layout showed.
 * The limit is NOT an always-visible editable input (D12): the original
 * kept it in a hidden box and confirmed a new value into Calc. It is
 * shown here as a value with a "Limit" button that opens the Limit /
 * Calc popup, where limit, commission % and rate are all editable (D13).
 */
export default function StatusPanel(p: {
  dash: DashboardResult;
  limit: number;
  onOpenCalc: () => void;
  commissionPct: number;
  rate: number;
  /** Auto letter for the current session, e.g. "C" — highlighted cyan. */
  autoLetter: string | null;
}) {
  const { t } = useLang();
  const rows: { label: string; value: string; red?: boolean; highlight?: boolean; isLimit?: boolean; node?: React.ReactNode }[] = [
    {
      label: t('status.limit'),
      value: '',
      isLimit: true,
      node: (
        <span className="inline-flex items-center justify-end gap-1">
          <span className="font-mono text-xs font-extrabold text-slate-900 tabular-nums">{fmt(p.limit)}</span>
          <button
            type="button"
            onClick={p.onOpenCalc}
            className="btn btn-outline h-5 min-h-0 rounded px-1.5 text-[10px] font-bold whitespace-nowrap text-indigo-700 border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100"
            title={t('status.limitTitle')}
          >
            {t('status.limitEdit')}
          </button>
        </span>
      ),
    },
    { label: t('status.times'), value: fmt(p.dash.times) },
    { label: t('status.sales'), value: fmt(p.dash.sales) },
    { label: t('status.carry'), value: fmt(p.dash.carry) },
    { label: t('status.netSales'), value: fmt(p.dash.netSales) },
    { label: `${p.commissionPct.toFixed(2)} %`, value: fmt(p.dash.commissionAmt) },
    { label: t('status.grossProfit'), value: fmt(p.dash.grossProfit) },
    { label: `${p.rate} ${t('entry.rate')}`, value: fmt(p.dash.payout) },
    { label: t('status.netPL'), value: fmt(p.dash.netPL), red: p.dash.netPLRed, highlight: true },
  ];

  // AUTO map: A=1 C=3 E=5 G=7 I=9 / B=2 D=4 F=6 H=8 J=0.
  const top = ['A', 'C', 'E', 'G', 'I'];
  const topVal = ['1', '3', '5', '7', '9'];
  const bot = ['B', 'D', 'F', 'H', 'J'];
  const botVal = ['2', '4', '6', '8', '0'];
  const cyanTop = new Set(['A', 'E', 'I']);
  const cyanBot = new Set(['D', 'H']);

  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <section className="card flex flex-1 flex-col overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-slate-800 via-indigo-600 to-teal-500" />
        <table className="h-full w-full table-fixed text-xs">
          <colgroup>
            <col className="w-[52%]" />
            <col className="w-[48%]" />
          </colgroup>
          <tbody>
            {rows.map((r) => {
              const tint = r.highlight
                ? p.dash.netPL < 0
                  ? 'bg-rose-50/90 text-rose-700 border-t border-rose-200/80'
                  : p.dash.netPL > 0
                    ? 'bg-emerald-50/90 text-emerald-700 border-t border-emerald-200/80'
                    : 'bg-emerald-50/60 text-emerald-800 border-t border-emerald-200/60'
                : r.isLimit
                  ? 'bg-slate-50/70'
                  : '';
              return (
                <tr key={r.label} className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/50">
                  <td
                    className={
                      r.highlight
                        ? `px-2.5 py-2 text-xs font-extrabold leading-snug ${tint}`
                        : `px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-slate-600 ${r.isLimit ? 'bg-slate-50/70 font-bold text-slate-700' : 'bg-slate-50/40'}`
                    }
                  >
                    {r.label}
                  </td>
                  <td
                    className={
                      r.highlight
                        ? `px-2.5 py-2 text-right font-mono text-sm font-extrabold tabular-nums ${tint}`
                        : `px-2.5 py-1.5 text-right font-mono text-xs font-bold tabular-nums text-slate-900 ${r.isLimit ? 'bg-slate-50/70' : ''} ${r.red ? 'text-rose-600' : ''}`
                    }
                  >
                    {r.node ?? r.value}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card mt-auto p-2 bg-gradient-to-b from-white to-slate-50/60">
        <div className="flex justify-between px-1 font-mono text-[10px] font-bold text-slate-600">
          {top.map((l, i) => (
            <span key={l} className={p.autoLetter === l ? 'text-rose-600 font-extrabold' : ''}>
              {l}={topVal[i]}
            </span>
          ))}
        </div>
        <div className="my-1 grid grid-cols-5 gap-1">
          {top.map((l) => (
            <div
              key={l}
              className={`h-3.5 rounded-sm border transition-all ${
                cyanTop.has(l)
                  ? 'border-teal-300 bg-teal-100/90'
                  : 'border-slate-200 bg-white'
              } ${p.autoLetter === l ? 'ring-2 ring-rose-500 ring-offset-1' : ''}`}
            />
          ))}
          {bot.map((l) => (
            <div
              key={l}
              className={`h-3.5 rounded-sm border transition-all ${
                cyanBot.has(l)
                  ? 'border-teal-300 bg-teal-100/90'
                  : 'border-slate-200 bg-white'
              } ${p.autoLetter === l ? 'ring-2 ring-rose-500 ring-offset-1' : ''}`}
            />
          ))}
        </div>
        <div className="flex justify-between px-1 font-mono text-[10px] font-bold text-slate-600">
          {bot.map((l, i) => (
            <span key={l} className={p.autoLetter === l ? 'text-rose-600 font-extrabold' : ''}>
              {l}={botVal[i]}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
