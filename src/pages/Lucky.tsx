import { useState } from 'react';
import { reverseNo } from '../shared-vendor/index.ts';
import type { Lucky } from '../lib/db';
import { useLang } from '../i18n';

interface Props {
  betDay: string;
  session: 'AM' | 'PM';
  current: Lucky | null;
  all: Lucky[];
  onSave: (no: string) => void;
  onOldNumbers: (amount: string) => void;
}

export default function LuckyPage(p: Props) {
  const { t } = useLang();
  const [no, setNo] = useState(p.current?.no ?? '');
  const [amt, setAmt] = useState('1000');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const rev = /^\d{2}$/.test(no) ? reverseNo(no) : '—';

  const save = () => {
    // FIX vs the original: the original had no numeric/length validation
    // and a 1-char entry would crash on Substring(1,1). Exactly 2 digits.
    if (!/^\d{2}$/.test(no)) {
      setError(t('lucky.error'));
      return;
    }
    setError('');
    p.onSave(no);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sorted = [...p.all].sort((a, b) => `${b.betDay}|${b.session}`.localeCompare(`${a.betDay}|${a.session}`));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
      {/* Left column: Current Draw Entry + Old Numbers Materializer */}
      <div className="flex flex-col gap-3">
        <section className="card overflow-hidden border-t-2 border-t-indigo-600 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">{t('lucky.title')}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{t('lucky.note', { day: p.betDay, session: p.session })}</p>
            </div>
            {p.current && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-right">
                <div className="text-[10px] font-bold uppercase text-indigo-600">{t('lucky.current')}</div>
                <div className="font-mono text-base font-extrabold text-indigo-950">
                  {p.current.no} <span className="text-xs font-semibold text-indigo-600">({p.current.noR})</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-stretch gap-2.5">
            <input
              className="input-yellow h-12 w-24 text-center font-mono text-2xl font-extrabold tracking-widest"
              value={no}
              maxLength={2}
              inputMode="numeric"
              placeholder="--"
              onChange={(e) => {
                setNo(e.target.value.replace(/\D/g, '').slice(0, 2));
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
              }}
            />
            <div className="flex flex-1 flex-col justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-500">{t('lucky.reverse')}</span>
                <span className="font-mono text-base font-extrabold text-slate-800">{rev}</span>
              </div>
              <div className="text-[11px] text-slate-400">{t('lucky.reverseNote')}</div>
            </div>
            <button type="button" onClick={save} className="btn btn-primary h-12 px-5 text-sm font-extrabold">
              {t('lucky.save')}
            </button>
          </div>
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
          {saved && (
            <p className="mt-2 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              {t('lucky.saved', { day: p.betDay, session: p.session })}
            </p>
          )}
        </section>

        <section className="card border-t-2 border-t-slate-700 p-4">
          <h3 className="text-sm font-extrabold text-slate-900">{t('lucky.oldTitle')}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{t('lucky.oldNote')}</p>
          <div className="mt-3 flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1 text-xs font-bold text-slate-700">
              <span>{t('lucky.oldAmountLabel')}</span>
              <input
                className="input h-9 w-full font-mono text-sm font-extrabold tabular-nums text-slate-900"
                value={amt}
                inputMode="numeric"
                onChange={(e) => setAmt(e.target.value)}
              />
            </label>
            <button type="button" onClick={() => p.onOldNumbers(amt)} className="btn btn-dark h-9 min-h-0 px-4 text-xs font-bold">
              {t('lucky.oldButton')}
            </button>
          </div>
        </section>
      </div>

      {/* Right column: Past Draws History Table */}
      <section className="card flex flex-col overflow-hidden border-t-2 border-t-amber-600">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-2">
          <h2 className="text-xs font-extrabold text-slate-800">{t('lucky.pastTitle')}</h2>
          <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-800">
            {sorted.length}
          </span>
        </div>
        <div className="max-h-80 flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-400">{t('lucky.pastEmpty')}</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-left font-bold text-slate-600">
                <tr>
                  <th className="px-3 py-2">{t('lucky.colDate')}</th>
                  <th className="px-3 py-2">{t('lucky.colSession')}</th>
                  <th className="px-3 py-2 text-center">{t('lucky.colLuckyNo')}</th>
                  <th className="px-3 py-2 text-center">{t('lucky.colReverse')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((l) => {
                  const isCurrent = l.betDay === p.betDay && l.session === p.session;
                  return (
                    <tr key={l.key} className={`hover:bg-slate-50 ${isCurrent ? 'bg-indigo-50/60' : ''}`}>
                      <td className="px-3 py-1.5 font-mono font-semibold text-slate-700">{l.betDay}</td>
                      <td className="px-3 py-1.5">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-extrabold ${
                            l.session === 'AM' ? 'bg-sky-100 text-sky-800' : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {l.session}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-center font-mono text-sm font-extrabold text-slate-900">{l.no}</td>
                      <td className="px-3 py-1.5 text-center font-mono font-semibold text-slate-500">{l.noR}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
