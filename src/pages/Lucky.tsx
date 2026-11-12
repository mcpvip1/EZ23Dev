import { useEffect, useRef, useState } from 'react';
import { reverseNo } from '../shared-vendor/index.ts';
import type { Lucky, Session } from '../lib/db';
import { useLang } from '../i18n';
import { Icon8 } from '../components/Icons8';

interface Props {
  betDay: string;
  session: 'AM' | 'PM';
  current: Lucky | null;
  all: Lucky[];
  onSave: (no: string, targetDay?: string, targetSession?: Session, oldKey?: string) => void;
  onDelete?: (key: string) => void;
  onOldNumbers: (amount: string) => void;
}

export default function LuckyPage(p: Props) {
  const { t } = useLang();
  const [no, setNo] = useState(p.current?.no ?? '');
  const [amt, setAmt] = useState('1000');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const mainInputRef = useRef<HTMLInputElement>(null);

  // Inline row editing state for Past Draws table
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDay, setEditDay] = useState('');
  const [editSession, setEditSession] = useState<Session>('AM');
  const [editNo, setEditNo] = useState('');
  const [editError, setEditError] = useState('');
  const editNoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNo(p.current?.no ?? '');
  }, [p.current?.no, p.betDay, p.session]);

  const rev = /^\d{2}$/.test(no) ? reverseNo(no) : '—';
  const editRev = /^\d{2}$/.test(editNo) ? reverseNo(editNo) : '—';

  const save = () => {
    // FIX vs the original: the original had no numeric/length validation
    // and a 1-char entry would crash on Substring(1,1). Exactly 2 digits.
    if (!/^\d{2}$/.test(no)) {
      setError(t('lucky.error'));
      return;
    }
    setError('');
    p.onSave(no, p.betDay, p.session);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const startEditRow = (l: Lucky) => {
    setEditingKey(l.key);
    setEditDay(l.betDay);
    setEditSession(l.session);
    setEditNo(l.no);
    setEditError('');
    setTimeout(() => {
      editNoInputRef.current?.focus();
      editNoInputRef.current?.select();
    }, 0);
  };

  const cancelEditRow = () => {
    setEditingKey(null);
    setEditError('');
  };

  const commitEditRow = (oldKey: string) => {
    if (!/^\d{2}$/.test(editNo) || !editDay) {
      setEditError(t('lucky.error'));
      return;
    }
    setEditError('');
    p.onSave(editNo, editDay, editSession, oldKey);
    setEditingKey(null);
  };

  const sorted = [...p.all].sort((a, b) => `${b.betDay}|${b.session}`.localeCompare(`${a.betDay}|${a.session}`));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
      {/* Left column: Current Draw Entry + Old Numbers Materializer */}
      <div className="flex flex-col gap-3">
        <section className="card overflow-hidden border-t-2 border-t-indigo-600 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-extrabold text-slate-900">{t('lucky.title')}</h2>
              <p className="mt-0.5 text-[13.5px] font-medium text-slate-600">{t('lucky.note', { day: p.betDay, session: p.session })}</p>
            </div>
            {p.current && (
              <button
                type="button"
                onClick={() => {
                  setNo(p.current?.no ?? '');
                  mainInputRef.current?.focus();
                  mainInputRef.current?.select();
                }}
                title={t('lucky.edit')}
                className="group cursor-pointer rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-right transition-colors hover:border-indigo-400 hover:bg-indigo-100/80"
              >
                <div className="flex items-center justify-end gap-1.5 text-[12px] font-bold uppercase text-indigo-700">
                  <span>{t('lucky.current')}</span>
                  <span className="rounded bg-indigo-200/70 px-1.5 py-0.5 text-[11px] font-extrabold text-indigo-800 group-hover:bg-indigo-600 group-hover:text-white">
                    {t('lucky.edit')}
                  </span>
                </div>
                <div className="font-mono text-base font-extrabold text-indigo-950">
                  {p.current.no} <span className="text-[13px] font-semibold text-indigo-600">({p.current.noR})</span>
                </div>
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-stretch gap-2.5">
            <input
              ref={mainInputRef}
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
                <span className="text-[13.5px] font-bold text-slate-700">{t('lucky.reverse')}</span>
                <span className="font-mono text-base font-extrabold text-slate-900">{rev}</span>
              </div>
              <div className="text-[12.5px] font-medium text-slate-500">{t('lucky.reverseNote')}</div>
            </div>
            <button type="button" onClick={save} className="btn btn-primary h-12 gap-1.5 px-5 text-[14.5px] font-extrabold">
              <Icon8 name="save" size={16} />
              <span>{t('lucky.save')}</span>
            </button>
          </div>
          {error && <p className="mt-2 text-[13.5px] font-semibold text-red-600">{error}</p>}
          {saved && (
            <p className="mt-2 rounded-md bg-emerald-50 px-2.5 py-1 text-[13.5px] font-bold text-emerald-700">
              {t('lucky.saved', { day: p.betDay, session: p.session })}
            </p>
          )}
        </section>

        <section className="card border-t-2 border-t-slate-700 p-4">
          <h3 className="text-[15px] font-extrabold text-slate-900">{t('lucky.oldTitle')}</h3>
          <p className="mt-0.5 text-[13.5px] font-medium text-slate-600">{t('lucky.oldNote')}</p>
          <div className="mt-3 flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1 text-[13.5px] font-bold text-slate-800">
              <span>{t('lucky.oldAmountLabel')}</span>
              <input
                className="input h-9 w-full font-mono text-[14.5px] font-extrabold tabular-nums text-slate-900"
                value={amt}
                inputMode="numeric"
                onChange={(e) => setAmt(e.target.value)}
              />
            </label>
            <button type="button" onClick={() => p.onOldNumbers(amt)} className="btn btn-dark h-9 min-h-0 gap-1.5 px-4 text-[13.5px] font-bold">
              <Icon8 name="clock" size={14} />
              <span>{t('lucky.oldButton')}</span>
            </button>
          </div>
        </section>
      </div>

      {/* Right column: Past Draws History Table with Inline Edit & Delete */}
      <section className="card flex flex-col overflow-hidden border-t-2 border-t-amber-600">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3.5 py-2.5">
          <div>
            <h2 className="text-[14.5px] font-extrabold text-slate-900">{t('lucky.pastTitle')}</h2>
            <p className="text-[12.5px] font-medium text-slate-600">{t('lucky.clickToEditHint')}</p>
          </div>
          <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-[12.5px] font-bold text-amber-800">
            {sorted.length}
          </span>
        </div>
        {editError && (
          <div className="border-b border-rose-200 bg-rose-50 px-3.5 py-1.5 text-[13.5px] font-bold text-rose-700">
            {editError}
          </div>
        )}
        <div className="max-h-80 flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <p className="py-10 text-center text-[13.5px] text-slate-500">{t('lucky.pastEmpty')}</p>
          ) : (
            <table className="w-full text-[13.5px]">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-left font-bold text-slate-700">
                <tr>
                  <th className="px-3 py-2">{t('lucky.colDate')}</th>
                  <th className="px-3 py-2">{t('lucky.colSession')}</th>
                  <th className="px-3 py-2 text-center">{t('lucky.colLuckyNo')}</th>
                  <th className="px-3 py-2 text-center">{t('lucky.colReverse')}</th>
                  <th className="px-3 py-2 text-right">{t('lucky.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((l) => {
                  const isCurrent = l.betDay === p.betDay && l.session === p.session;
                  const isEditing = editingKey === l.key;

                  if (isEditing) {
                    return (
                      <tr key={l.key} className="bg-amber-50/90">
                        <td className="px-2 py-1.5">
                          <input
                            type="date"
                            value={editDay}
                            onChange={(e) => e.target.value && setEditDay(e.target.value)}
                            className="input h-7 w-[122px] px-1.5 font-mono text-xs font-bold text-slate-900"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={editSession}
                            onChange={(e) => setEditSession(e.target.value as Session)}
                            className="input h-7 w-16 px-1.5 font-mono text-xs font-extrabold text-slate-900"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <input
                            ref={editNoInputRef}
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={editNo}
                            placeholder="--"
                            onChange={(e) => {
                              setEditNo(e.target.value.replace(/\D/g, '').slice(0, 2));
                              setEditError('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                commitEditRow(l.key);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                e.stopPropagation();
                                cancelEditRow();
                              }
                            }}
                            className="input-yellow mx-auto h-7 w-14 text-center font-mono text-sm font-extrabold tracking-wider"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center font-mono font-bold text-slate-600">{editRev}</td>
                        <td className="px-2 py-1.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => commitEditRow(l.key)}
                              className="btn btn-primary btn-sm h-6 min-h-0 px-2 text-[11px] font-bold"
                            >
                              {t('lucky.save')}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditRow}
                              className="btn btn-outline btn-sm h-6 min-h-0 px-2 text-[11px] font-bold"
                            >
                              {t('lucky.cancel')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={l.key}
                      onDoubleClick={() => startEditRow(l)}
                      className={`transition-colors hover:bg-slate-50 ${isCurrent ? 'bg-indigo-50/60' : ''}`}
                    >
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
                      <td className="px-3 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => startEditRow(l)}
                          title={t('lucky.edit')}
                          className="inline-flex items-center justify-center rounded-md border border-transparent px-2 py-0.5 font-mono text-sm font-extrabold text-slate-900 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          {l.no}
                        </button>
                      </td>
                      <td className="px-3 py-1.5 text-center font-mono font-semibold text-slate-500">{l.noR}</td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditRow(l)}
                            className="btn btn-outline btn-sm h-6 min-h-0 gap-1 px-2 text-[11px] font-bold text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50"
                          >
                            <Icon8 name="edit" size={12} />
                            <span>{t('lucky.edit')}</span>
                          </button>
                          {p.onDelete && (
                            <button
                              type="button"
                              onClick={() => p.onDelete?.(l.key)}
                              className="btn btn-outline btn-sm h-6 min-h-0 gap-1 px-2 text-[11px] font-bold text-rose-600 hover:border-rose-400 hover:bg-rose-50"
                            >
                              <Icon8 name="trash" size={12} />
                              <span>{t('lucky.delete')}</span>
                            </button>
                          )}
                        </div>
                      </td>
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
