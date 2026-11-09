import { useEffect, useMemo, useState } from 'react';
import { expandCode, settlePersonClipboard } from '../shared-vendor/index.ts';
import type { AllData, DetailRow, SavedCode, Session } from '../lib/db';
import { deleteSavedCode, nowStamp, uid, updateSavedCode } from '../lib/db';
import { ConfirmDialog, PopupDialog } from '../components/Dialogs';
import { fmt } from '../lib/types';
import { useLang } from '../i18n';
import { Icon8 } from '../components/Icons8';

export interface BrowseProps {
  data: AllData;
  betDay: string;
  session: Session;
  onChanged: () => void;
  onClose: () => void;
}

/**
 * Browse / edit / delete of saved bets — the web equivalent of the
 * original Bet.cs / Carry.cs forms.
 */
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
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export default function Browse(p: BrowseProps) {
  const { t } = useLang();
  const [side, setSide] = useState<'bet' | 'carry'>('bet');
  const [personNo, setPersonNo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCodeId, setSelectedCodeId] = useState('');
  const [editing, setEditing] = useState<SavedCode | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editAmt, setEditAmt] = useState('');
  const [editError, setEditError] = useState('');
  const [repriceGroup, setRepriceGroup] = useState<number | null>(null);
  const [repriceAmt, setRepriceAmt] = useState('');
  const [copied, setCopied] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Esc closes popup when no sub-dialog is active
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editing && repriceGroup === null && !confirm) p.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, repriceGroup, confirm, p]);

  const sideLabel = side === 'bet' ? t('reports.fighterLabel') : t('reports.selOwner');

  // People with saved rows this day/session
  const persons = useMemo(() => {
    const nos = new Set<string>();
    p.data.codes.forEach((c) => {
      if (c.side === side && c.betDay === p.betDay && c.session === p.session) nos.add(c.personNo);
    });
    p.data.details.forEach((d) => {
      if (d.side === side && d.betDay === p.betDay && d.session === p.session) nos.add(d.personNo);
    });
    const order = new Map(
      p.data.people
        .filter((x) => (side === 'bet' ? x.side === 'fighter' : x.side === 'owner'))
        .map((x, i) => [x.no, i]),
    );
    return [...nos].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999) || a.localeCompare(b));
  }, [p.data, p.betDay, p.session, side]);

  const fighterCount = useMemo(() => {
    const s = new Set<string>();
    p.data.codes.forEach((c) => {
      if (c.side === 'bet' && c.betDay === p.betDay && c.session === p.session) s.add(c.personNo);
    });
    return s.size;
  }, [p.data, p.betDay, p.session]);

  const ownerCount = useMemo(() => {
    const s = new Set<string>();
    p.data.codes.forEach((c) => {
      if (c.side === 'carry' && c.betDay === p.betDay && c.session === p.session) s.add(c.personNo);
    });
    return s.size;
  }, [p.data, p.betDay, p.session]);

  const person = personNo && persons.includes(personNo) ? personNo : persons[0] ?? '';
  const personObj = p.data.people.find(
    (x) => x.no === person && (side === 'bet' ? x.side === 'fighter' : x.side === 'owner'),
  );
  const personName = personObj?.name;

  const personDetails = useMemo(
    () =>
      p.data.details.filter(
        (d) => d.side === side && d.betDay === p.betDay && d.session === p.session && d.personNo === person,
      ),
    [p.data, p.betDay, p.session, side, person],
  );

  const personCodes = useMemo(
    () =>
      p.data.codes
        .filter(
          (c) => c.side === side && c.betDay === p.betDay && c.session === p.session && c.personNo === person,
        )
        .sort((a, b) => a.groupId - b.groupId || a.sno - b.sno),
    [p.data, p.betDay, p.session, side, person],
  );

  // Groups in save order
  const groups = useMemo(() => {
    const out: { groupId: number; seq: number; codes: SavedCode[]; subtotal: number }[] = [];
    const byId = new Map<number, SavedCode[]>();
    personCodes.forEach((c) => {
      if (!byId.has(c.groupId)) byId.set(c.groupId, []);
      byId.get(c.groupId)!.push(c);
    });
    [...byId.keys()]
      .sort((a, b) => a - b)
      .forEach((gid, i) => {
        const codes = byId.get(gid)!;
        out.push({ groupId: gid, seq: i + 1, codes, subtotal: codes.reduce((s, c) => s + c.rowTotal, 0) });
      });
    return out;
  }, [personCodes]);

  const personTotal = personDetails.reduce((s, d) => s + d.amount, 0);
  const lucky = p.data.lucky.find((l) => l.betDay === p.betDay && l.session === p.session) ?? null;
  const winAmt = lucky ? personDetails.filter((d) => d.no === lucky.no).reduce((s, d) => s + d.amount, 0) : 0;
  const com = personDetails.reduce((m, d) => Math.max(m, d.commission), 0);
  const rate = personDetails.reduce((m, d) => Math.max(m, d.rate), 0);
  const youText =
    personDetails.length > 0
      ? settlePersonClipboard(
          personDetails.map((d) => ({ no: d.no, amount: d.amount })),
          lucky?.no ?? null,
          com,
          rate,
          side,
        )
      : '';

  const flash = (msg: string) => {
    setCopied(msg);
    setTimeout(() => setCopied(''), 2500);
  };

  const todayStamp = () => {
    const now = new Date();
    return `${now.getDate()}.${now.getMonth() + 1}`;
  };

  const copyGroup = async (seq: number, codes: SavedCode[], subtotal: number) => {
    const lines = codes.map((c) => `${c.displayCode}=${c.amountText}`).join('\r\n');
    let text = `\`No.(${seq})-${todayStamp()} ${p.session}\r\n${lines}\r\nT=${subtotal}`;
    if (seq > 1) text += `\r\n\r\nAll T=${personTotal}`;
    flash((await copyText(text)) ? t('browse.groupCopied', { seq }) : t('browse.copyFailed'));
  };

  const copySettlement = async () => {
    if (!person) return;
    const winPart = lucky ? `(${lucky.no}) P=${winAmt}` : `P=${winAmt}`;
    const text = `(${person})\r\n\r\nT=${personTotal}\r\n${winPart}\r\n${youText}`;
    flash((await copyText(text)) ? t('browse.settlementCopied') : t('browse.copyFailed'));
  };

  const openEdit = (code: SavedCode) => {
    setEditing(code);
    setEditCode(code.codeNo);
    setEditAmt(code.amountText);
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (editCode.trim() === '' || editAmt.trim() === '') {
      setEditError(t('browse.errEnterCodeAmt'));
      return;
    }
    const expanded = expandCode(editCode, editAmt);
    if (!expanded) {
      setEditError(t('browse.errCantSave'));
      return;
    }
    setBusy(true);
    try {
      const now = Date.now();
      const updated: SavedCode = {
        ...editing,
        displayCode: expanded.displayCode,
        codeNo: expanded.codeNo,
        amountText: editAmt.trim(),
        rowTotal: expanded.rowTotal,
        betDateTime: nowStamp(),
        edited: true,
      };
      const newDetails: DetailRow[] = expanded.numbers.map((n) => ({
        id: uid(),
        side: editing.side,
        betDay: editing.betDay,
        session: editing.session,
        personNo: editing.personNo,
        no: n.no,
        amount: n.amount,
        commission: editing.commission,
        rate: editing.rate,
        sno: editing.sno,
        groupId: editing.groupId,
        updatedAt: now,
      }));
      await updateSavedCode(updated, newDetails);
      setEditing(null);
      p.onChanged();
    } finally {
      setBusy(false);
    }
  };

  const saveReprice = async () => {
    if (repriceGroup === null) return;
    const group = groups.find((g) => g.groupId === repriceGroup);
    if (!group) return;
    if (repriceAmt.trim() === '' || Number(repriceAmt) === 0) {
      setEditError(t('browse.errEnterRepriceAmt'));
      return;
    }
    const expanded = group.codes.map((c) => ({ code: c, r: expandCode(c.codeNo, repriceAmt) }));
    const bad = expanded.find((e) => !e.r);
    if (bad) {
      setEditError(t('browse.errCantSaveCode', { code: bad.code.displayCode }));
      return;
    }
    setBusy(true);
    try {
      const now = Date.now();
      for (const { code, r } of expanded) {
        const updated: SavedCode = {
          ...code,
          displayCode: r!.displayCode,
          codeNo: r!.codeNo,
          amountText: repriceAmt.trim(),
          rowTotal: r!.rowTotal,
          betDateTime: nowStamp(),
          edited: true,
        };
        const newDetails: DetailRow[] = r!.numbers.map((n) => ({
          id: uid(),
          side: code.side,
          betDay: code.betDay,
          session: code.session,
          personNo: code.personNo,
          no: n.no,
          amount: n.amount,
          commission: code.commission,
          rate: code.rate,
          sno: code.sno,
          groupId: code.groupId,
          updatedAt: now,
        }));
        await updateSavedCode(updated, newDetails);
      }
      setRepriceGroup(null);
      p.onChanged();
    } finally {
      setBusy(false);
    }
  };

  const deleteCode = async (code: SavedCode) => {
    setConfirm({
      title: t('browse.delRowTitle', { sno: code.sno }),
      message: t('browse.delRowMsg', { code: code.displayCode }),
      onConfirm: () => {
        void (async () => {
          await deleteSavedCode(code);
          setSelectedCodeId('');
          p.onChanged();
        })();
      },
    });
  };

  const deletePersonAll = async (no: string) => {
    setConfirm({
      title: t('browse.delAllConfirmTitle'),
      message: t('browse.delAllMsg', { side: sideLabel, no, day: p.betDay, session: p.session }),
      onConfirm: () => {
        void (async () => {
          const codes = p.data.codes.filter(
            (c) => c.side === side && c.betDay === p.betDay && c.session === p.session && c.personNo === no,
          );
          for (const c of codes) await deleteSavedCode(c);
          p.onChanged();
        })();
      },
    });
  };

  // Del key on a selected code row
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
      if (e.key === 'Delete' && selectedCodeId) {
        const code = personCodes.find((c) => c.id === selectedCodeId);
        if (code) void deleteCode(code);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCodeId, personCodes]);

  const personTotals = useMemo(() => {
    const m = new Map<string, number>();
    p.data.details.forEach((d) => {
      if (d.side === side && d.betDay === p.betDay && d.session === p.session) {
        m.set(d.personNo, (m.get(d.personNo) ?? 0) + d.amount);
      }
    });
    return m;
  }, [p.data, p.betDay, p.session, side]);

  const filteredPersons = useMemo(() => {
    if (!searchQuery.trim()) return persons;
    const q = searchQuery.toLowerCase().trim();
    return persons.filter((no) => {
      if (no.toLowerCase().includes(q)) return true;
      const nm = p.data.people.find(
        (x) => x.no === no && (side === 'bet' ? x.side === 'fighter' : x.side === 'owner'),
      )?.name;
      return nm ? nm.toLowerCase().includes(q) : false;
    });
  }, [persons, searchQuery, p.data.people, side]);

  return (
    <div className="space-y-4">
      {/* Top executive toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-slate-50/80 p-2.5">
        <div className="flex items-center gap-2">
          {/* Segmented side toggle */}
          <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setSide('bet');
                setPersonNo('');
                setSelectedCodeId('');
              }}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
                side === 'bet'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{t('browse.betTab')}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  side === 'bet' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {fighterCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSide('carry');
                setPersonNo('');
                setSelectedCodeId('');
              }}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
                side === 'carry'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{t('browse.carryTab')}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  side === 'carry' ? 'bg-amber-700 text-amber-100' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {ownerCount}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs">
            <Icon8 name="calendar" size={14} />
            <span>{p.betDay}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                p.session === 'AM' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {p.session}
            </span>
          </div>
        </div>

        {copied && (
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 shadow-xs animate-in fade-in duration-200">
            <Icon8 name="checkmark" size={14} />
            <span>{copied}</span>
          </div>
        )}
      </div>

      {/* Main split workspace */}
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Left Sidebar: Persons Directory */}
        <section className="flex flex-col rounded-xl border border-slate-300 bg-white shadow-xs">
          <div className="border-b border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                {side === 'bet' ? t('browse.totalsFighter') : t('browse.totalsOwner')}
              </h3>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-700">
                {persons.length}
              </span>
            </div>
            {/* Quick search */}
            <div className="relative mt-2">
              <input
                type="text"
                placeholder="Search # or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-7 pr-7 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="pointer-events-none absolute left-2 top-1.5 text-xs text-slate-400">
                <Icon8 name="search" size={14} />
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-700"
                >
                  <Icon8 name="close" size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[62vh] flex-1 overflow-y-auto p-2">
            {filteredPersons.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {persons.length === 0
                  ? side === 'bet'
                    ? t('browse.noSavedBet', { day: p.betDay, session: p.session })
                    : t('browse.noSavedCarry', { day: p.betDay, session: p.session })
                  : 'No matches found.'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredPersons.map((no) => {
                  const nm = p.data.people.find(
                    (x) => x.no === no && (side === 'bet' ? x.side === 'fighter' : x.side === 'owner'),
                  )?.name;
                  const isSelected = no === person;
                  const amt = personTotals.get(no) ?? 0;
                  return (
                    <div
                      key={no}
                      onClick={() => {
                        setPersonNo(no);
                        setSelectedCodeId('');
                      }}
                      className={`group flex cursor-pointer items-center justify-between rounded-lg border px-2.5 py-2 transition-all ${
                        isSelected
                          ? side === 'bet'
                            ? 'border-indigo-500 bg-indigo-50/80 text-indigo-950 shadow-xs ring-1 ring-indigo-400'
                            : 'border-amber-500 bg-amber-50/80 text-amber-950 shadow-xs ring-1 ring-amber-400'
                          : 'border-transparent bg-slate-50/60 text-slate-800 hover:border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black">{no}</span>
                          {nm && <span className="truncate text-[11px] font-medium text-slate-500">— {nm}</span>}
                        </div>
                        <div className="mt-0.5 font-mono text-xs font-bold text-slate-900">
                          {fmt(amt)} <span className="text-[10px] font-normal text-slate-500">Ks</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        title={t('browse.delAllTitle', { no })}
                        onClick={(e) => {
                          e.stopPropagation();
                          void deletePersonAll(no);
                        }}
                        className="rounded p-1 text-slate-300 opacity-60 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      >
                        <Icon8 name="trash" size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Detail Workspace: Groups & Codes */}
        <section className="flex flex-col rounded-xl border border-slate-300 bg-white p-4 shadow-xs">
          {person ? (
            <>
              {/* Executive Settlement Ribbon */}
              <div
                className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 ${
                  side === 'bet'
                    ? 'border-indigo-200 bg-indigo-50/40'
                    : 'border-amber-200 bg-amber-50/40'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide ${
                        side === 'bet' ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white'
                      }`}
                    >
                      {sideLabel} #{person}
                    </span>
                    {personName && <span className="text-sm font-bold text-slate-800">{personName}</span>}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-500">ထိုးငွေ စုစုပေါင်း:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">{fmt(personTotal)} Ks</span>
                    </div>
                    {lucky && (
                      <div className="border-l border-slate-300 pl-3">
                        <span className="text-slate-500">ထွက်ဂဏန်း ({lucky.no}):</span>{' '}
                        <span
                          className={`font-mono font-bold ${
                            winAmt > 0 ? 'text-emerald-700 underline' : 'text-slate-700'
                          }`}
                        >
                          {fmt(winAmt)} Ks
                        </span>
                      </div>
                    )}
                    {youText && (
                      <div className="border-l border-slate-300 pl-3">
                        <span className="text-slate-500">အခြေချ:</span>{' '}
                        <span className="font-mono font-black text-slate-900">{youText}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void copySettlement()}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100"
                  title={t('browse.copySettlementTitle')}
                >
                  <Icon8 name="clipboard" size={14} />
                  <span>{t('browse.copySettlement')}</span>
                </button>
              </div>

              {/* Interaction guidance hint */}
              <div className="mb-3 flex items-center justify-between text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Icon8 name="idea" size={14} />
                  <span>{t('browse.help')}</span>
                </span>
                <span className="font-semibold text-slate-700">{groups.length} Groups</span>
              </div>

              {/* Group cards feed */}
              <div className="max-h-[54vh] space-y-4 overflow-y-auto pr-1">
                {groups.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
                    {t('browse.noRows')}
                  </div>
                ) : (
                  groups.map((g) => (
                    <div
                      key={g.groupId}
                      className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xs"
                    >
                      {/* Group Header */}
                      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/80 px-3.5 py-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-extrabold text-white">
                            {t('browse.group', { seq: g.seq })}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            ({g.codes.length} codes · {g.codes[0]?.betDateTime ?? ''})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="mr-2 font-mono text-xs font-black text-slate-900">
                            Total: {fmt(g.subtotal)} Ks
                          </div>
                          <button
                            type="button"
                            onClick={() => void copyGroup(g.seq, g.codes, g.subtotal)}
                            className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            title={t('browse.copyGroup')}
                          >
                            <Icon8 name="clipboard" size={13} />
                            <span>{t('browse.copyGroup')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRepriceGroup(g.groupId);
                              setRepriceAmt('');
                              setEditError('');
                            }}
                            className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <Icon8 name="edit" size={13} />
                            <span>{t('browse.repriceGroup')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Group Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[580px] text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-100/60 font-semibold text-slate-600">
                              <th className="px-3 py-2 text-left">{t('browse.colNum')}</th>
                              <th className="px-3 py-2 text-left">{t('browse.colCode')}</th>
                              <th className="px-3 py-2 text-right">{t('browse.colAmount')}</th>
                              <th className="px-3 py-2 text-left">{t('browse.colCodeNo')}</th>
                              <th className="px-3 py-2 text-left">{t('browse.colBetDateTime')}</th>
                              <th className="px-3 py-2 text-right">{t('browse.colRowTotal')}</th>
                              <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {g.codes.map((c) => {
                              const isRowSelected = selectedCodeId === c.id;
                              return (
                                <tr
                                  key={c.id}
                                  onClick={() => {
                                    setSelectedCodeId(c.id);
                                    void copyGroup(g.seq, g.codes, g.subtotal);
                                  }}
                                  onDoubleClick={() => openEdit(c)}
                                  className={`cursor-pointer transition-colors ${
                                    isRowSelected
                                      ? 'bg-indigo-100/70 font-semibold text-indigo-950'
                                      : 'hover:bg-slate-50'
                                  }`}
                                  title={t('browse.rowTitle')}
                                >
                                  <td className="px-3 py-2 font-mono font-bold text-slate-700">{c.sno}</td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-sm font-black text-slate-900">
                                        {c.displayCode}
                                      </span>
                                      {Boolean(c.edited) && (
                                        <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[9px] font-extrabold text-rose-800">
                                          ပြင်ပြီး
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">
                                    {Number(c.amountText) ? fmt(Number(c.amountText)) : c.amountText}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-slate-600 truncate max-w-[150px]">
                                    {c.codeNo}
                                  </td>
                                  <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">
                                    {c.betDateTime}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                                    {fmt(c.rowTotal)}
                                  </td>
                                  <td className="px-3 py-2 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEdit(c);
                                      }}
                                      className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 mr-1"
                                    >
                                      {t('browse.editRow')}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void deleteCode(c);
                                      }}
                                      className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                                    >
                                      {t('browse.delRow')}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Group Subtotal Row - styled with refined legacy pink tint */}
                            <tr className="border-t-2 border-rose-300 bg-rose-50/70 font-bold text-rose-950">
                              <td colSpan={2} className="px-3 py-2 text-left">
                                {t('browse.groupSubtotal', { seq: g.seq })}
                              </td>
                              <td colSpan={3} className="px-3 py-2 text-right text-xs text-rose-800/80 font-normal">
                                {g.codes.length} codes in group
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-sm font-black text-rose-950">
                                {fmt(g.subtotal)}
                              </td>
                              <td />
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              <Icon8 name="users" size={36} />
              <p className="mt-2 text-sm font-medium">{t('browse.pickPerson')}</p>
            </div>
          )}
        </section>
      </div>

      {/* Edit Code Popup (Bet.cs GroupBox1) */}
      {editing && (
        <PopupDialog
          title={t('browse.editTitle', { side: sideLabel, person: editing.personNo })}
          onClose={() => setEditing(null)}
          wide={false}
        >
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
              {t('browse.editSub', { code: editing.displayCode, sno: editing.sno, gid: editing.groupId })}
            </div>

            <label className="block text-xs font-bold text-slate-700">
              {t('browse.editCode')}
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (document.getElementById('browse-edit-amt') as HTMLInputElement | null)?.focus();
                  if (e.key === 'Escape') setEditing(null);
                }}
                autoFocus
              />
            </label>

            <label className="block text-xs font-bold text-slate-700">
              {t('browse.editAmount')}
              <input
                id="browse-edit-amt"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={editAmt}
                inputMode="decimal"
                onChange={(e) => setEditAmt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveEdit();
                  if (e.key === 'Escape') setEditing(null);
                }}
              />
            </label>

            {editError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-700">
                {editError}
              </div>
            )}

            <p className="text-[11px] text-slate-500 leading-normal">{t('browse.editNote')}</p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                {t('browse.editCancel')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveEdit()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {t('browse.editSave')}
              </button>
            </div>
          </div>
        </PopupDialog>
      )}

      {/* Re-price group popup (Bet.cs GroupBox2) */}
      {repriceGroup !== null && (
        <PopupDialog
          title={t('browse.repriceTitle', {
            seq: groups.find((g) => g.groupId === repriceGroup)?.seq ?? '',
            side: sideLabel,
            person,
          })}
          onClose={() => setRepriceGroup(null)}
          wide={false}
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600">{t('browse.repriceNote')}</p>

            <label className="block text-xs font-bold text-slate-700">
              {t('browse.repriceAmount')}
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={repriceAmt}
                inputMode="decimal"
                onChange={(e) => setRepriceAmt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveReprice();
                  if (e.key === 'Escape') setRepriceGroup(null);
                }}
                autoFocus
              />
            </label>

            {editError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-700">
                {editError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRepriceGroup(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                {t('browse.repriceCancel')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveReprice()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {t('browse.repriceApply')}
              </button>
            </div>
          </div>
        </PopupDialog>
      )}

      {/* Destructive Confirm Dialog */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={t('browse.yesDelete')}
          danger
          onConfirm={() => {
            const f = confirm.onConfirm;
            setConfirm(null);
            f();
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
