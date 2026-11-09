import { useMemo, useState } from 'react';
import { settlePerson } from '../shared-vendor/index.ts';
import type { DetailRow, Lucky, Person, SavedCode } from '../lib/db';
import { todayISO } from '../lib/db';
import { fmt } from '../lib/types';
import { useLang } from '../i18n';
import PrintPreviewModal from '../components/PrintPreviewModal';
import { Icon8 } from '../components/Icons8';

type Tab = 'current' | 'daily' | 'weekly' | 'range' | 'selected' | 'uptodate';

interface Props {
  betDay: string;
  session: 'AM' | 'PM';
  details: DetailRow[];
  lucky: Lucky[];
  people: Person[];
  codes?: SavedCode[];
  initialTab?: Tab;
  initialPerson?: { side: 'bet' | 'carry'; no: string };
  initialRange?: { from: string; to: string; fromSess: 'AM' | 'PM'; toSess: 'AM' | 'PM' };
  viewOnly?: boolean;
}

interface Row {
  personNo: string;
  betDay: string;
  session: 'AM' | 'PM';
  betDateTime: string;
  amount: number;
  winNo: string;
  winAmt: number;
  com: number;
  rate: number;
  netAmount: number;
}

function weekBounds(dateISO: string): { from: string; to: string } {
  const d = new Date(`${dateISO}T12:00:00`);
  const from = new Date(d);
  from.setDate(d.getDate() - d.getDay()); // Sunday
  const to = new Date(from);
  to.setDate(from.getDate() + 6); // Saturday
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

function mondayStart(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00`);
  const dow = d.getDay(); // 0 = Sunday
  const back = (dow + 6) % 7; // days since Monday
  d.setDate(d.getDate() - back);
  return d.toISOString().slice(0, 10);
}

function clockSession(): 'AM' | 'PM' {
  return new Date().getHours() <= 11 ? 'AM' : 'PM';
}

const sessRank = (s: 'AM' | 'PM') => (s === 'AM' ? 0 : 1);

export default function Reports(p: Props) {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>(p.initialTab ?? 'current');
  const [from, setFrom] = useState(p.initialRange?.from ?? mondayStart(todayISO()));
  const [to, setTo] = useState(p.initialRange?.to ?? todayISO());
  const [fromSess, setFromSess] = useState<'AM' | 'PM'>(p.initialRange?.fromSess ?? 'AM');
  const [toSess, setToSess] = useState<'AM' | 'PM'>(p.initialRange?.toSess ?? clockSession());
  const [selSide, setSelSide] = useState<'bet' | 'carry'>(p.initialPerson?.side ?? 'bet');
  const [selPerson, setSelPerson] = useState(p.initialPerson?.no ?? '');
  const [utdPerson, setUtdPerson] = useState('1');
  const [showPreview, setShowPreview] = useState(false);

  const luckyMap = useMemo(() => {
    const m = new Map<string, string>();
    p.lucky.forEach((l) => m.set(`${l.betDay}|${l.session}`, l.no));
    return m;
  }, [p.lucky]);

  const betDateTimeMap = useMemo(() => {
    const m = new Map<string, { sno: number; stamp: string }>();
    (p.codes ?? []).forEach((c) => {
      const key = `${c.side}|${c.personNo}|${c.betDay}|${c.session}`;
      const cur = m.get(key);
      if (!cur || c.sno < cur.sno) m.set(key, { sno: c.sno, stamp: c.betDateTime });
    });
    return m;
  }, [p.codes]);

  const selPeople = useMemo(
    () => p.people.filter((x) => (selSide === 'bet' ? x.side === 'fighter' : x.side === 'owner')),
    [p.people, selSide],
  );
  const fighters = useMemo(() => p.people.filter((x) => x.side === 'fighter'), [p.people]);

  const effectivePerson = selPerson || p.initialPerson?.no || (selPeople[0]?.no ?? '');

  const filtered = useMemo(() => {
    const inRange = (d: DetailRow): boolean => {
      if (tab === 'current') return d.betDay === p.betDay && d.session === p.session;
      if (tab === 'daily') return d.betDay === p.betDay;
      if (tab === 'weekly') {
        const w = weekBounds(p.betDay);
        return d.betDay >= w.from && d.betDay <= w.to;
      }
      if (tab === 'range' || tab === 'uptodate') {
        if (d.betDay < from || d.betDay > to) return false;
        if (d.betDay === from && sessRank(d.session) < sessRank(fromSess)) return false;
        if (d.betDay === to && sessRank(d.session) > sessRank(toSess)) return false;
        return true;
      }
      if (!effectivePerson) return false;
      return d.personNo === effectivePerson;
    };
    return p.details.filter(inRange);
  }, [p, tab, from, to, fromSess, toSess, effectivePerson]);

  const settle = (side: 'bet' | 'carry'): Row[] => {
    const byPerson = new Map<string, Map<string, DetailRow[]>>();
    filtered
      .filter((d) => d.side === side)
      .forEach((d) => {
        const key = `${d.betDay}|${d.session}`;
        if (!byPerson.has(d.personNo)) byPerson.set(d.personNo, new Map());
        const m = byPerson.get(d.personNo)!;
        if (!m.has(key)) m.set(key, []);
        m.get(key)!.push(d);
      });
    const out: Row[] = [];
    byPerson.forEach((sessions, personNo) => {
      sessions.forEach((rows, key) => {
        const [betDay, session] = key.split('|') as [string, 'AM' | 'PM'];
        const luckyNo = luckyMap.get(key) ?? null;
        const s = settlePerson(
          rows.map((r) => ({ no: r.no, amount: r.amount })),
          luckyNo,
          Math.max(...rows.map((r) => r.commission)),
          Math.max(...rows.map((r) => r.rate)),
        );
        out.push({
          personNo,
          betDay,
          session,
          betDateTime:
            betDateTimeMap.get(`${side}|${personNo}|${betDay}|${session}`)?.stamp ?? `${betDay} ${session}`,
          amount: s.amount,
          winNo: s.winAmt > 0 && luckyNo ? luckyNo : '—',
          winAmt: s.winAmt,
          com: Math.max(...rows.map((r) => r.commission)),
          rate: Math.max(...rows.map((r) => r.rate)),
          netAmount: s.netAmount,
        });
      });
    });
    return out.sort(
      (a, b) =>
        a.personNo.localeCompare(b.personNo) ||
        a.betDay.localeCompare(b.betDay) ||
        sessRank(a.session) - sessRank(b.session),
    );
  };

  const fighterRows = settle('bet');
  const ownerRows = settle('carry');
  const upToDateRows = fighterRows.filter((r) => r.personNo === utdPerson);


  // Aggregated KPIs across active view
  const activeReportRows = useMemo(() => {
    if (tab === 'uptodate') return upToDateRows;
    return [...fighterRows, ...ownerRows];
  }, [tab, upToDateRows, fighterRows, ownerRows]);

  const kpis = useMemo(() => {
    const totalAmount = activeReportRows.reduce((sum, r) => sum + r.amount, 0);
    const totalWin = activeReportRows.reduce((sum, r) => sum + r.winAmt, 0);
    const totalNet = activeReportRows.reduce((sum, r) => sum + r.netAmount, 0);
    const uniquePersons = new Set(activeReportRows.map((r) => r.personNo)).size;
    return { totalAmount, totalWin, totalNet, uniquePersons, totalRows: activeReportRows.length };
  }, [activeReportRows]);

  const tabs: { id: Tab; label: string; shortcut?: string }[] = [
    { id: 'current', label: t('reports.tab.current'), shortcut: 'F9' },
    { id: 'daily', label: t('reports.tab.daily'), shortcut: 'F10' },
    { id: 'weekly', label: t('reports.tab.weekly'), shortcut: 'F11' },
    { id: 'range', label: t('reports.tab.range'), shortcut: 'F12' },
    { id: 'uptodate', label: t('reports.tab.uptodate') },
    { id: 'selected', label: t('reports.tab.selected'), shortcut: 'F4' },
  ];

  const applyPreset = (preset: 'today' | 'week' | 'month') => {
    const today = todayISO();
    if (preset === 'today') {
      setFrom(today);
      setTo(today);
      setFromSess('AM');
      setToSess('PM');
    } else if (preset === 'week') {
      setFrom(mondayStart(today));
      setTo(today);
      setFromSess('AM');
      setToSess('PM');
    } else if (preset === 'month') {
      const firstDay = `${today.slice(0, 8)}01`;
      setFrom(firstDay);
      setTo(today);
      setFromSess('AM');
      setToSess('PM');
    }
  };

  const renderTable = (title: string, rows: Row[], theme: 'indigo' | 'amber') => {
    const tot = rows.reduce(
      (a, r) => ({ amount: a.amount + r.amount, winAmt: a.winAmt + r.winAmt, net: a.net + r.netAmount }),
      { amount: 0, winAmt: 0, net: 0 },
    );

    const isIndigo = theme === 'indigo';

    return (
      <section
        className={`flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xs print:border-none print:shadow-none ${
          isIndigo ? 'border-t-4 border-t-indigo-600' : 'border-t-4 border-t-amber-600'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${isIndigo ? 'bg-indigo-600' : 'bg-amber-600'}`}
            />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-extrabold text-slate-700">
              {rows.length} rows
            </span>
            <span className="font-mono text-xs font-black text-slate-900">
              {fmt(tot.amount)} Ks
            </span>
          </div>
        </div>

        {/* Table Body */}
        {rows.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center p-6 text-center text-xs text-slate-400">
            <span className="text-2xl">📊</span>
            <p className="mt-1.5">{t('reports.table.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 font-semibold text-slate-600">
                  <th className="px-2 py-2 text-left">{t('reports.col.person')}</th>
                  <th className="px-2 py-2 text-left">{t('reports.col.betDateTime')}</th>
                  <th className="px-2 py-2 text-right">{t('reports.col.amount')}</th>
                  <th className="px-1 py-2 text-center">{t('reports.col.winNo')}</th>
                  <th className="px-2 py-2 text-right">{t('reports.col.winAmt')}</th>
                  <th className="px-1 py-2 text-right">{t('reports.col.com')}</th>
                  <th className="px-1 py-2 text-right">{t('reports.col.rate')}</th>
                  <th className="px-2 py-2 text-right">{t('reports.col.netAmount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const hasWon = r.winAmt > 0;
                  return (
                    <tr
                      key={`${r.personNo}|${r.betDay}|${r.session}`}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        hasWon ? 'bg-emerald-50/50' : ''
                      }`}
                    >
                      <td className="px-2 py-1.5">
                        <span className="font-mono font-black text-slate-900">{r.personNo}</span>
                      </td>
                      <td className="px-2 py-1.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                        {r.betDateTime}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-bold text-slate-900">
                        {fmt(r.amount)}
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        {r.winNo !== '—' ? (
                          <span className="rounded bg-emerald-100 px-1 py-0.5 font-mono text-[11px] font-black text-emerald-800">
                            {r.winNo}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right font-mono font-bold ${
                          hasWon ? 'text-emerald-700' : 'text-slate-600'
                        }`}
                      >
                        {fmt(r.winAmt)}
                      </td>
                      <td className="px-1 py-1.5 text-right font-mono text-slate-600">{r.com}%</td>
                      <td className="px-1 py-1.5 text-right font-mono text-slate-600">{r.rate}</td>
                      <td
                        className={`px-2 py-1.5 text-right font-mono text-xs font-black ${
                          r.netAmount < 0 ? 'text-red-600' : 'text-emerald-700'
                        }`}
                      >
                        {fmt(r.netAmount)}
                      </td>
                    </tr>
                  );
                })}

                {/* Grand Total Footer */}
                <tr className="border-t-2 border-slate-300 bg-slate-100/90 font-bold text-slate-900">
                  <td className="px-2 py-2 font-black uppercase tracking-wider">
                    {t('reports.col.total')}
                  </td>
                  <td className="px-2 py-2 text-[10px] text-slate-500 font-normal">
                    {rows.length} sessions
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-xs font-black text-slate-900">
                    {fmt(tot.amount)}
                  </td>
                  <td />
                  <td className="px-2 py-2 text-right font-mono text-xs font-black text-emerald-700">
                    {fmt(tot.winAmt)}
                  </td>
                  <td />
                  <td />
                  <td
                    className={`px-2 py-2 text-right font-mono text-xs font-black ${
                      tot.net < 0 ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {fmt(tot.net)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-4">
      {/* View-Only Announcement Banner */}
      {p.viewOnly && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 shadow-xs">
          <span className="text-base">🔒</span>
          <span>{t('reports.viewOnly')}</span>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-slate-50/80 p-2">
        <div className="flex flex-wrap items-center gap-1">
          {tabs.map((tb) => {
            const isActive = tab === tb.id;
            return (
              <button
                key={tb.id}
                type="button"
                onClick={() => setTab(tb.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <span>{tb.label}</span>
                {tb.shortcut && (
                  <span
                    className={`rounded px-1 py-0.2 text-[9px] font-mono font-extrabold ${
                      isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tb.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-xs hover:border-indigo-300 hover:bg-indigo-100 active:bg-indigo-200"
            title={t('reports.printPreview')}
          >
            <Icon8 name="document" size={15} />
            <span>{t('reports.printPreview')}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100"
          >
            <Icon8 name="print" size={15} />
            <span>{t('reports.print')}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Filter Controls Toolbar */}
      {(tab === 'range' || tab === 'uptodate') && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            {tab === 'uptodate' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">{t('reports.fighterLabel')}:</span>
                <select
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  value={utdPerson}
                  onChange={(e) => setUtdPerson(e.target.value)}
                >
                  {fighters.map((x) => (
                    <option key={x.id} value={x.no}>
                      #{x.no} {x.name ? `— ${x.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* From Date & Session */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">{t('reports.from')}</span>
              <input
                type="date"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <div className="flex rounded-md border border-slate-300 bg-slate-50 p-0.5">
                {(['AM', 'PM'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFromSess(s)}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      fromSess === s ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-slate-400">→</span>

            {/* To Date & Session */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">{t('reports.to')}</span>
              <input
                type="date"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
              <div className="flex rounded-md border border-slate-300 bg-slate-50 p-0.5">
                {(['AM', 'PM'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setToSess(s)}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      toSess === s ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] text-slate-400">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('today')}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
            >
              ယနေ့
            </button>
            <button
              type="button"
              onClick={() => applyPreset('week')}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
            >
              ဤအပတ်
            </button>
            <button
              type="button"
              onClick={() => applyPreset('month')}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
            >
              ဤလ
            </button>
          </div>
        </div>
      )}

      {tab === 'selected' && (
        <div className="no-print flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          {/* Side Toggle */}
          <div className="flex rounded-lg border border-slate-300 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => {
                setSelSide('bet');
                setSelPerson('');
              }}
              className={`rounded-md px-3 py-1 text-xs font-bold ${
                selSide === 'bet' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('reports.selFighter')}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelSide('carry');
                setSelPerson('');
              }}
              className={`rounded-md px-3 py-1 text-xs font-bold ${
                selSide === 'carry' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('reports.selOwner')}
            </button>
          </div>

          {/* Person Selector */}
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
            value={effectivePerson}
            onChange={(e) => setSelPerson(e.target.value)}
          >
            {selPeople.map((x) => (
              <option key={x.id} value={x.no}>
                #{x.no} {x.name ? `— ${x.name}` : ''}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-500">
            {selPerson ? `ရက်စွဲအားလုံး စုစည်းချက်` : t('reports.allDates')}
          </span>
        </div>
      )}

      {/* Scope Description Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span className="font-medium">
            {tab === 'current' && t('reports.desc.current', { day: p.betDay, session: p.session })}
            {tab === 'daily' && t('reports.desc.daily', { day: p.betDay })}
            {tab === 'weekly' &&
              t('reports.desc.weekly', {
                day: p.betDay,
                from: weekBounds(p.betDay).from,
                to: weekBounds(p.betDay).to,
              })}
            {tab === 'range' && t('reports.desc.range', { from, fromSess, to, toSess })}
            {tab === 'uptodate' &&
              t('reports.desc.uptodate', { no: utdPerson, from, fromSess, to, toSess })}
            {tab === 'selected' &&
              t('reports.desc.selected', {
                side: selSide === 'bet' ? t('reports.selFighter') : t('reports.selOwner'),
                no: effectivePerson,
              })}
          </span>
        </div>
      </div>

      {/* KPI Overview Ribbon */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Total Bets */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {t('reports.col.amount')} စုစုပေါင်း
          </div>
          <div className="mt-1 font-mono text-lg font-black text-slate-900">
            {fmt(kpis.totalAmount)}{' '}
            <span className="text-xs font-normal text-slate-500">Ks</span>
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">{kpis.totalRows} sessions total</div>
        </div>

        {/* Total Win Payout */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {t('reports.col.winAmt')} စုစုပေါင်း
          </div>
          <div className="mt-1 font-mono text-lg font-black text-emerald-700">
            {fmt(kpis.totalWin)}{' '}
            <span className="text-xs font-normal text-slate-500">Ks</span>
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">Winning payouts</div>
        </div>

        {/* Net Balance */}
        <div
          className={`rounded-xl border p-3 shadow-xs ${
            kpis.totalNet >= 0
              ? 'border-emerald-200 bg-emerald-50/50'
              : 'border-red-200 bg-red-50/50'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            {t('reports.col.netAmount')}
          </div>
          <div
            className={`mt-1 font-mono text-lg font-black ${
              kpis.totalNet >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {fmt(kpis.totalNet)}{' '}
            <span className="text-xs font-normal text-slate-500">Ks</span>
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">
            {kpis.totalNet >= 0 ? 'အမြတ် (Profitable)' : 'အရှုံး (Deficit)'}
          </div>
        </div>

        {/* Active People Count */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            ပါဝင်သူ ဦးရေ
          </div>
          <div className="mt-1 font-mono text-lg font-black text-slate-800">
            {kpis.uniquePersons}{' '}
            <span className="text-xs font-normal text-slate-500">ဦး</span>
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">Active participants</div>
        </div>
      </div>

      {/* Tables Display */}
      {tab === 'uptodate' ? (
        <div className="grid gap-4">
          {renderTable(t('reports.table.uptodate', { no: utdPerson }), upToDateRows, 'indigo')}
        </div>
      ) : tab === 'selected' ? (
        <div className="grid gap-4">
          {selSide === 'bet'
            ? renderTable(t('reports.table.fighterBet'), fighterRows, 'indigo')
            : renderTable(t('reports.table.ownerCarry'), ownerRows, 'amber')}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {renderTable(t('reports.table.fighterBet'), fighterRows, 'indigo')}
          {renderTable(t('reports.table.ownerCarry'), ownerRows, 'amber')}
        </div>
      )}

      {/* Print Preview Document Modal */}
      {showPreview && (
        <PrintPreviewModal
          reportTitle="EASY 2D Pro"
          reportSubtitle={
            tab === 'current'
              ? t('reports.desc.current', { day: p.betDay, session: p.session })
              : tab === 'daily'
                ? t('reports.desc.daily', { day: p.betDay })
                : tab === 'weekly'
                  ? t('reports.desc.weekly', {
                      day: p.betDay,
                      from: weekBounds(p.betDay).from,
                      to: weekBounds(p.betDay).to,
                    })
                  : tab === 'range'
                    ? t('reports.desc.range', { from, fromSess, to, toSess })
                    : tab === 'uptodate'
                      ? t('reports.desc.uptodate', { no: utdPerson, from, fromSess, to, toSess })
                      : t('reports.desc.selected', {
                          side: selSide === 'bet' ? t('reports.selFighter') : t('reports.selOwner'),
                          no: effectivePerson,
                        })
          }
          betDay={p.betDay}
          session={p.session}
          luckyNo={luckyMap.get(`${p.betDay}|${p.session}`) ?? null}
          kpis={kpis}
          fighterRows={tab === 'uptodate' ? upToDateRows : fighterRows}
          ownerRows={tab === 'uptodate' || (tab === 'selected' && selSide === 'bet') ? [] : ownerRows}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
