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
  const rows: { label: string; value: string; red?: boolean; highlight?: boolean; node?: React.ReactNode }[] = [
    {
      label: t('status.limit'),
      value: '',
      node: (
        <span className="flex items-center justify-end gap-1">
          <span className="text-base font-bold">{fmt(p.limit)}</span>
          <button
            type="button"
            onClick={p.onOpenCalc}
            className="btn btn-outline btn-sm whitespace-nowrap"
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

  // AUTO map: A=1 C=3 E=5 G=7 I=9 / B=2 D=4 F=6 H=8 J=0. The original
  // shows a checkerboard of cyan cells (A, E, I on top; D, H below);
  // the current session's letter is outlined in red.
  const top = ['A', 'C', 'E', 'G', 'I'];
  const topVal = ['1', '3', '5', '7', '9'];
  const bot = ['B', 'D', 'F', 'H', 'J'];
  const botVal = ['2', '4', '6', '8', '0'];
  const cyanTop = new Set(['A', 'E', 'I']);
  const cyanBot = new Set(['D', 'H']);

  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <section className="card flex flex-1 flex-col overflow-hidden border-t-2 border-t-slate-800">
        <table className="h-full w-full text-sm">
          <tbody>
            {rows.map((r) => {
              // Net P/L stands out: larger, bold, tinted — red when
              // negative, green when positive, neutral at zero.
              const tint = r.highlight
                ? p.dash.netPL < 0
                  ? 'bg-red-50 text-red-700 border-t border-red-200'
                  : p.dash.netPL > 0
                    ? 'bg-emerald-50 text-emerald-700 border-t border-emerald-200'
                    : 'bg-slate-100 text-slate-800 border-t border-slate-200'
                : '';
              return (
                <tr key={r.label} className="border-b border-slate-100 last:border-b-0">
                  <td
                    className={
                      r.highlight
                        ? `whitespace-nowrap px-3 py-2 text-sm font-extrabold ${tint}`
                        : 'whitespace-nowrap bg-slate-50/80 px-3 py-1 text-xs font-semibold text-slate-600'
                    }
                  >
                    {r.label}
                  </td>
                  <td
                    className={
                      r.highlight
                        ? `px-3 py-2 text-right font-mono text-base font-extrabold tabular-nums ${tint}`
                        : `px-3 py-1 text-right font-mono text-xs font-bold tabular-nums text-slate-900 ${r.red ? 'text-red-600' : ''}`
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

      <section className="card mt-auto p-1.5">
        <div className="flex justify-between px-1 font-mono text-[11px] font-bold text-slate-700">
          {top.map((l, i) => (
            <span key={l}>
              {l}={topVal[i]}
            </span>
          ))}
        </div>
        <div className="mt-0.5 grid grid-cols-5 gap-0.5">
          {top.map((l) => (
            <div
              key={l}
              className={`h-4 rounded-xs border ${cyanTop.has(l) ? 'border-cyan-500 bg-cyan-300' : 'border-slate-300 bg-white'} ${p.autoLetter === l ? 'ring-2 ring-red-500' : ''}`}
            />
          ))}
          {bot.map((l) => (
            <div
              key={l}
              className={`h-4 rounded-xs border ${cyanBot.has(l) ? 'border-cyan-500 bg-cyan-300' : 'border-slate-300 bg-white'} ${p.autoLetter === l ? 'ring-2 ring-red-500' : ''}`}
            />
          ))}
        </div>
        <div className="mt-0.5 flex justify-between px-1 font-mono text-[11px] font-bold text-slate-700">
          {bot.map((l, i) => (
            <span key={l}>
              {l}={botVal[i]}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
