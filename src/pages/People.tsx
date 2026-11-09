import { useRef, useState } from 'react';
import type { Person } from '../lib/db';
import { ConfirmDialog } from '../components/Dialogs';
import { useLang } from '../i18n';
import { Icon8 } from '../components/Icons8';

interface Props {
  people: Person[];
  /** When set (Setup → Fighter / Owner), show only that side — the original opens separate forms. */
  focus?: 'fighter' | 'owner';
  onSave: (p: Person) => void;
  onAdd: (side: 'fighter' | 'owner', no: string, commission: number, rate: number) => string | null;
  onDelete: (id: string) => void;
}

function List(p: { title: string; side: 'fighter' | 'owner'; people: Person[]; onSave: (x: Person) => void; onAdd: Props['onAdd']; onDelete: (id: string) => void }) {
  const { t } = useLang();
  const [no, setNo] = useState('');
  const [com, setCom] = useState(p.side === 'fighter' ? 15 : 14);
  const [rate, setRate] = useState(80);
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState<Person | null>(null);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<number | undefined>(undefined);
  const list = p.people.filter((x) => x.side === p.side);

  // Inline edits save on every keystroke; flash a brief "Saved" chip
  // near the title so the operator gets feedback (F10).
  const inlineSave = (x: Person) => {
    p.onSave(x);
    setFlash(true);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 1500);
  };

  const submitNew = () => {
    const e = p.onAdd(p.side, no.trim(), com, rate);
    if (e) setErr(e);
    else {
      setErr('');
      setNo('');
    }
  };

  const accentBorder = p.side === 'fighter' ? 'border-t-2 border-t-indigo-600' : 'border-t-2 border-t-amber-600';
  const badgeColor = p.side === 'fighter' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800';
  const btnColor = p.side === 'fighter' ? 'btn-primary' : 'btn-amber';

  return (
    <section className={`card flex flex-col overflow-hidden ${accentBorder}`}>
      {/* Header + Quick-Add bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold text-slate-900">{p.title}</h2>
          <span className={`rounded px-2 py-0.5 font-mono text-xs font-extrabold ${badgeColor}`}>
            {list.length}
          </span>
          {flash && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700" role="status">
              <Icon8 name="checkmark" size={12} />
              <span>{t('people.savedFlash')}</span>
            </span>
          )}
        </div>

        {/* Quick-Add Form */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input-yellow h-8 w-28 px-2.5 text-xs font-bold"
            placeholder={t('people.newNo')}
            value={no}
            onChange={(e) => {
              setNo(e.target.value);
              setErr('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitNew();
            }}
          />
          <label className="flex items-center gap-1 text-xs font-semibold text-slate-600">
            {t('people.comShort')}
            <input
              type="number"
              className="input h-8 w-16 px-2 text-center font-mono text-xs font-bold"
              value={com}
              onChange={(e) => setCom(Number(e.target.value) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNew();
              }}
            />
          </label>
          <label className="flex items-center gap-1 text-xs font-semibold text-slate-600">
            {t('people.rate')}
            <input
              type="number"
              className="input h-8 w-16 px-2 text-center font-mono text-xs font-bold"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNew();
              }}
            />
          </label>
          <button type="button" onClick={submitNew} className={`btn btn-sm h-8 min-h-0 px-3.5 text-xs font-bold ${btnColor}`}>
            + {t('people.add')}
          </button>
        </div>
      </div>

      {err && <div className="border-b border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-700">{err}</div>}

      {/* Scrollable People Table */}
      <div className="max-h-[58vh] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-left font-bold text-slate-600">
            <tr>
              <th className="w-20 px-4 py-2">{t('people.colNo')}</th>
              <th className="px-3 py-2">{t('people.colName')}</th>
              <th className="w-28 px-3 py-2">{t('people.colCom')}</th>
              <th className="w-28 px-3 py-2">{t('people.colRate')}</th>
              <th className="w-24 px-4 py-2 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((x) => (
              <tr key={x.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-1.5 font-mono text-sm font-extrabold text-slate-900">{x.no}</td>
                <td className="px-3 py-1.5">
                  <input
                    className="input h-7 w-full max-w-xs px-2 text-xs font-medium"
                    value={x.name}
                    placeholder={t('people.namePlaceholder')}
                    onChange={(e) => inlineSave({ ...x, name: e.target.value })}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    className="input h-7 w-20 px-2 text-center font-mono text-xs font-bold tabular-nums"
                    value={x.commission}
                    onChange={(e) => inlineSave({ ...x, commission: Number(e.target.value) || 0 })}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    className="input h-7 w-20 px-2 text-center font-mono text-xs font-bold tabular-nums"
                    value={x.rate}
                    onChange={(e) => inlineSave({ ...x, rate: Number(e.target.value) || 0 })}
                  />
                </td>
                <td className="px-4 py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => setConfirmDel(x)}
                    className="btn btn-danger btn-sm h-6 min-h-0 px-2.5 text-[11px]"
                  >
                    {t('people.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmDel && (
        <ConfirmDialog
          title={t('people.deleteTitle', { side: t(p.side === 'fighter' ? 'entry.fighter' : 'entry.owner'), no: confirmDel.no })}
          message={t('people.deleteMsg')}
          confirmLabel={t('people.yesDelete')}
          danger
          onConfirm={() => {
            p.onDelete(confirmDel.id);
            setConfirmDel(null);
          }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </section>
  );
}

export default function PeoplePage(p: Props) {
  const { t } = useLang();
  if (p.focus) {
    return (
      <div className="grid gap-3">
        <List
          title={p.focus === 'fighter' ? t('people.fighters') : t('people.owners')}
          side={p.focus}
          people={p.people}
          onSave={p.onSave}
          onAdd={p.onAdd}
          onDelete={p.onDelete}
        />
      </div>
    );
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <List title={t('people.fighters')} side="fighter" people={p.people} onSave={p.onSave} onAdd={p.onAdd} onDelete={p.onDelete} />
      <List title={t('people.owners')} side="owner" people={p.people} onSave={p.onSave} onAdd={p.onAdd} onDelete={p.onDelete} />
      <p className="text-xs text-slate-500 lg:col-span-2">{t('people.note')}</p>
    </div>
  );
}
