import { useEffect, useRef, useState } from 'react';
import type { DeleteScope } from '../lib/db';
import { deleteScope } from '../lib/db';
import { useLang } from '../i18n';
import { Icon8 } from './Icons8';
import {
  clampFontScale,
  DEFAULT_FONT_SCALE,
  FONT_SCALE_PRESETS,
  FONT_SCALE_STEP,
  MAX_FONT_SCALE,
  MIN_FONT_SCALE,
} from '../lib/fontScale';

/**
 * Topmost-Esc stack: every modal/popup registers its onClose here, and a
 * single document listener (capture phase) closes only the topmost one.
 * That makes Esc close a nested confirm without also closing the dialog
 * underneath it, and close a popup before anything behind it.
 */
const escStack: Array<() => void> = [];
let escListenerAttached = false;

function useTopmostEsc(onClose: () => void) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    const fn = () => ref.current();
    escStack.push(fn);
    if (!escListenerAttached) {
      escListenerAttached = true;
      document.addEventListener(
        'keydown',
        (e) => {
          if (e.key === 'Escape') {
            const top = escStack[escStack.length - 1];
            if (top) {
              e.preventDefault();
              e.stopImmediatePropagation();
              top();
            }
          }
        },
        true,
      );
    }
    return () => {
      const i = escStack.indexOf(fn);
      if (i !== -1) escStack.splice(i, 1);
    };
  }, []);
}

export function Modal(p: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  const { t } = useLang();
  useTopmostEsc(p.onClose);
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/55 p-3 pt-10 backdrop-blur-xs"
      onClick={p.onClose}
    >
      <div
        className={`flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl ${
          p.wide ? 'max-w-6xl' : 'max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
            <h2 className="text-[15.5px] font-extrabold tracking-tight text-slate-900">{p.title}</h2>
          </div>
          <button
            type="button"
            onClick={p.onClose}
            className="btn btn-ghost btn-sm h-7.5 w-7.5 min-h-0 rounded-lg p-0 text-xs text-slate-500 hover:bg-slate-200/70 hover:text-slate-900"
            aria-label={t('dialog.close')}
          >
            <Icon8 name="close" size={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{p.children}</div>
      </div>
    </div>
  );
}

/** Generic popup shell: content opens OVER the main screen (board stays mounted behind). */
export function PopupDialog(p: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <Modal title={p.title} onClose={p.onClose} wide={p.wide ?? true}>
      {p.children}
    </Modal>
  );
}

/**
 * Reusable global UI & Myanmar Font Size Adjustment Slider section
 * shown inside Settings (CalcDialog) and About (AboutDialog).
 */
export function FontScaleControl(p: {
  fontScale: number;
  onChange: (pct: number) => void;
}) {
  const { t } = useLang();
  const current = clampFontScale(p.fontScale);

  return (
    <div className="rounded-xl border border-indigo-200/90 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white p-3.5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600/15">
            <Icon8 name="settings" size={14} />
          </span>
          <span className="text-xs font-extrabold text-slate-900">
            {t('dialog.fontScale.title')}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            data-testid="font-scale-badge"
            className="rounded-md bg-indigo-600 px-2 py-0.5 font-mono text-xs font-extrabold text-white tabular-nums"
          >
            {current}%
          </span>
          {current !== DEFAULT_FONT_SCALE && (
            <button
              type="button"
              onClick={() => p.onChange(DEFAULT_FONT_SCALE)}
              className="btn btn-outline btn-sm h-6 min-h-0 px-2 text-[11px] font-bold"
            >
              {t('dialog.fontScale.reset')}
            </button>
          )}
        </div>
      </div>

      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        {t('dialog.fontScale.note')}
      </p>

      {/* Slider + Step Controls */}
      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => p.onChange(clampFontScale(current - FONT_SCALE_STEP))}
          disabled={current <= MIN_FONT_SCALE}
          aria-label={t('dialog.fontScale.decrease')}
          className="btn btn-outline btn-sm h-8 w-8 min-h-0 shrink-0 p-0 font-mono text-sm font-black"
        >
          −
        </button>

        <input
          type="range"
          min={MIN_FONT_SCALE}
          max={MAX_FONT_SCALE}
          step={FONT_SCALE_STEP}
          value={current}
          onChange={(e) => p.onChange(clampFontScale(Number(e.target.value)))}
          aria-label={t('dialog.fontScale.sliderLabel')}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
        />

        <button
          type="button"
          onClick={() => p.onChange(clampFontScale(current + FONT_SCALE_STEP))}
          disabled={current >= MAX_FONT_SCALE}
          aria-label={t('dialog.fontScale.increase')}
          className="btn btn-outline btn-sm h-8 w-8 min-h-0 shrink-0 p-0 font-mono text-sm font-black"
        >
          +
        </button>
      </div>

      {/* Quick Presets */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1">
          {FONT_SCALE_PRESETS.map((preset) => {
            const active = current === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => p.onChange(preset)}
                className={`btn btn-sm h-6 min-h-0 px-2.5 font-mono text-[11px] font-extrabold ${
                  active ? 'btn-primary' : 'btn-outline'
                }`}
              >
                {preset}%
              </button>
            );
          })}
        </div>
        <span className="font-mono text-[11px] font-semibold text-slate-500">
          {MIN_FONT_SCALE}% – {MAX_FONT_SCALE}%
        </span>
      </div>

      {/* Live Myanmar & Numeric Legibility Preview */}
      <div className="mt-2.5 rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-xs shadow-2xs">
        <span className="mr-1.5 font-bold text-indigo-700">
          {t('dialog.fontScale.previewLabel')}
        </span>
        <span className="font-mono font-bold text-slate-900">
          {t('dialog.fontScale.previewText')}
        </span>
      </div>
    </div>
  );
}

/**
 * In-app confirm dialog (replaces window.confirm, which the Space frame
 * suppresses). One click opens it, OK confirms, Esc / backdrop / Cancel
 * dismisses without doing anything.
 */
export function ConfirmDialog(p: {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useLang();
  const okRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    okRef.current?.focus();
  }, []);
  return (
    <Modal title={p.title ?? t('dialog.confirmDefaultTitle')} onClose={p.onCancel}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${
            p.danger ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
          }`}
        >
          <Icon8 name={p.danger ? 'warning' : 'help'} size={22} />
        </div>
        <p className="pt-1 text-sm leading-relaxed font-medium text-slate-700">{p.message}</p>
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={p.onCancel} className="btn btn-ghost h-8 min-h-0 px-3 text-xs">
          {p.cancelLabel ?? t('dialog.confirmCancel')}
        </button>
        <button
          ref={okRef}
          type="button"
          onClick={p.onConfirm}
          className={`btn h-8 min-h-0 px-4 text-xs ${p.danger ? 'btn-danger' : 'btn-primary'}`}
        >
          {p.confirmLabel ?? t('dialog.confirmOk')}
        </button>
      </div>
    </Modal>
  );
}

export function ChangeDateDialog(p: {
  betDay: string;
  session: 'AM' | 'PM';
  onApply: (betDay: string, session: 'AM' | 'PM') => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [day, setDay] = useState(p.betDay);
  const [sess, setSess] = useState<'AM' | 'PM'>(p.session);
  return (
    <Modal title={t('dialog.changeDate')} onClose={p.onClose}>
      <p className="text-xs font-medium text-slate-500">{t('dialog.changeDate.note')}</p>
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
            <span>{t('dialog.changeDate.date')}</span>
            <input
              type="date"
              className="input h-9 w-full font-mono text-sm font-bold text-slate-900"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </label>
          <div className="flex flex-col gap-1 text-xs font-bold text-slate-700">
            <span>Session</span>
            <div className="flex h-9 overflow-hidden rounded-md border border-slate-300 bg-white p-0.5">
              {(['AM', 'PM'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSess(s)}
                  className={`px-4 text-xs font-extrabold transition-colors rounded-xs ${
                    sess === s ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={p.onClose} className="btn btn-ghost h-8 min-h-0 px-3 text-xs">
          {t('dialog.close')}
        </button>
        <button
          type="button"
          onClick={() => {
            if (day) p.onApply(day, sess);
          }}
          className="btn btn-primary h-8 min-h-0 px-4 text-xs"
        >
          {t('dialog.changeDate.apply')}
        </button>
      </div>
    </Modal>
  );
}

const DELETE_SCOPES: { id: DeleteScope; key: string }[] = [
  { id: 'sales', key: 'dialog.delete.scope.sales' },
  { id: 'carry', key: 'dialog.delete.scope.carry' },
  { id: 'salesCarryLucky', key: 'dialog.delete.scope.salesCarryLucky' },
  { id: 'lucky', key: 'dialog.delete.scope.lucky' },
  { id: 'fighter', key: 'dialog.delete.scope.fighter' },
  { id: 'owner', key: 'dialog.delete.scope.owner' },
  { id: 'all', key: 'dialog.delete.scope.all' },
];

export function DeleteDialog(p: { betDay: string; onDone: (msg: string) => void; onClose: () => void }) {
  const { t } = useLang();
  const [day, setDay] = useState(p.betDay);
  const [mode, setMode] = useState<'upto' | 'from'>('upto');
  const [scope, setScope] = useState<DeleteScope>('sales');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  return (
    <Modal title={t('dialog.delete')} onClose={p.onClose}>
      <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/80 p-3 text-xs font-semibold text-red-800">
        <Icon8 name="warning" size={18} className="mt-0.5 shrink-0" />
        <span className="leading-relaxed">{t('dialog.delete.warn')}</span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-[1fr_auto]">
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
          <span>{t('dialog.delete.date')}</span>
          <input
            type="date"
            className="input h-9 w-full font-mono text-sm font-bold text-slate-900"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </label>
        <div className="flex flex-col gap-1 text-xs font-bold text-slate-700">
          <span>Direction</span>
          <div className="flex h-9 overflow-hidden rounded-md border border-slate-300 bg-white p-0.5">
            {(['upto', 'from'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 text-xs font-extrabold transition-colors rounded-xs ${
                  mode === m ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t(m === 'upto' ? 'dialog.delete.upTo' : 'dialog.delete.from')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {DELETE_SCOPES.map((s) => {
          const active = scope === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setScope(s.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-bold transition-all ${
                active
                  ? 'border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500/30'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              } ${s.id === 'all' ? 'sm:col-span-2' : ''}`}
            >
              <span
                className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  active ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span className="leading-snug">{t(s.key)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={p.onClose} className="btn btn-ghost h-8 min-h-0 px-3 text-xs">
          {t('dialog.delete.closeBtn')}
        </button>
        <button type="button" disabled={busy} onClick={() => setConfirming(true)} className="btn btn-danger h-8 min-h-0 px-4 text-xs">
          {t('dialog.delete.deleteBtn')}
        </button>
      </div>
      {confirming && (
        <ConfirmDialog
          title={t('dialog.delete.confirmTitle')}
          message={t('dialog.delete.confirmMsg')}
          confirmLabel={t('dialog.delete.yesDelete')}
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={async () => {
            setConfirming(false);
            setBusy(true);
            const n = await deleteScope(day, mode, scope);
            setBusy(false);
            p.onDone(t('dialog.delete.done', { n }));
            p.onClose();
          }}
        />
      )}
    </Modal>
  );
}

/**
 * Limit / Calc / Display Settings popup (D12 + D13).
 */
export function CalcDialog(p: {
  limit: number;
  commission: number;
  rate: number;
  fontScale?: number;
  onFontScaleChange?: (pct: number) => void;
  onApply: (limit: number, commission: number, rate: number) => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [limit, setLimit] = useState(String(p.limit));
  const [commission, setCommission] = useState(String(p.commission));
  const [rate, setRate] = useState(String(p.rate));
  const [confirming, setConfirming] = useState(false);
  const valid = limit.trim() !== '' && commission.trim() !== '' && rate.trim() !== '';
  return (
    <Modal title={t('dialog.calc')} onClose={p.onClose}>
      <p className="text-xs font-medium text-slate-500">{t('dialog.calc.note')}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs font-bold text-slate-700">
          <span>{t('dialog.calc.limit')}</span>
          <input
            type="number"
            className="input-yellow h-9 w-full font-mono text-base font-extrabold tabular-nums"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            aria-label={t('dialog.calc.limit')}
          />
        </label>
        <label className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-700">
          <span>{t('dialog.calc.commission')}</span>
          <input
            type="number"
            className="input h-9 w-full font-mono text-base font-extrabold tabular-nums text-slate-900"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            aria-label={t('dialog.calc.commission')}
          />
        </label>
        <label className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-700">
          <span>{t('dialog.calc.rate')}</span>
          <input
            type="number"
            className="input h-9 w-full font-mono text-base font-extrabold tabular-nums text-slate-900"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            aria-label={t('dialog.calc.rate')}
          />
        </label>
      </div>

      {p.onFontScaleChange && (
        <div className="mt-3">
          <FontScaleControl
            fontScale={p.fontScale ?? DEFAULT_FONT_SCALE}
            onChange={p.onFontScaleChange}
          />
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={p.onClose} className="btn btn-ghost h-8 min-h-0 px-3 text-xs">
          {t('dialog.calc.cancel')}
        </button>
        <button type="button" disabled={!valid} onClick={() => setConfirming(true)} className="btn btn-primary h-8 min-h-0 px-4 text-xs">
          {t('dialog.calc.save')}
        </button>
      </div>
      {confirming && (
        <ConfirmDialog
          title={t('dialog.calc.confirmTitle')}
          message={t('dialog.calc.confirmMsg')}
          confirmLabel={t('dialog.calc.yesSave')}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            p.onApply(Number(limit) || 0, Number(commission) || 0, Number(rate) || 0);
            p.onClose();
          }}
        />
      )}
    </Modal>
  );
}

const CLOSED_KEY = 'easy2d-closedays';

export function CloseDaysDialog(p: { onClose: () => void }) {
  const { t } = useLang();
  const [days, setDays] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CLOSED_KEY) ?? '[]') as string[];
    } catch {
      return [];
    }
  });
  const [day, setDay] = useState('');
  const save = (next: string[]) => {
    setDays(next);
    localStorage.setItem(CLOSED_KEY, JSON.stringify(next));
  };
  return (
    <Modal title={t('dialog.closeDays')} onClose={p.onClose}>
      <p className="text-xs font-medium text-slate-500">{t('dialog.closeDays.note')}</p>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
        <input
          type="date"
          className="input h-8 flex-1 font-mono text-xs font-bold text-slate-900"
          value={day}
          onChange={(e) => setDay(e.target.value)}
        />
        <button
          type="button"
          onClick={() => {
            if (day && !days.includes(day)) {
              save([...days, day].sort());
              setDay('');
            }
          }}
          className="btn btn-primary btn-sm h-8 min-h-0 px-3 text-xs"
        >
          {t('dialog.closeDays.save')}
        </button>
      </div>
      <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-slate-200">
        {days.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">{t('dialog.closeDays.empty')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {days.map((d) => (
              <li key={d} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50">
                <span className="font-mono font-bold text-slate-800">{d}</span>
                <button
                  type="button"
                  onClick={() => save(days.filter((x) => x !== d))}
                  className="btn btn-danger btn-sm h-6 min-h-0 px-2 text-[11px]"
                >
                  {t('dialog.closeDays.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

export function AboutDialog(p: {
  fontScale: number;
  onFontScaleChange: (pct: number) => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  return (
    <Modal title={t('dialog.about')} onClose={p.onClose}>
      <div className="space-y-3.5">
        <FontScaleControl
          fontScale={p.fontScale}
          onChange={p.onFontScaleChange}
        />
        <div>
          <pre className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
            {t('dialog.about.cheat')}
          </pre>
          <p className="mt-2 text-xs text-slate-500">{t('dialog.about.note')}</p>
        </div>
      </div>
    </Modal>
  );
}

export function HighlightDialog(p: { color: string; onApply: (c: string) => void; onClose: () => void }) {
  const { t } = useLang();
  const [c, setC] = useState(p.color);
  return (
    <Modal title={t('dialog.highlight')} onClose={p.onClose}>
      <p className="text-xs text-slate-500">{t('dialog.highlight.note')}</p>
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <input
          type="color"
          value={c}
          onChange={(e) => setC(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
          aria-label={t('dialog.highlight.colorLabel')}
        />
        <span className="rounded border border-slate-300 px-3 py-1.5 font-mono text-xs font-bold shadow-2xs" style={{ backgroundColor: c }}>
          {c}
        </span>
        <button
          type="button"
          onClick={() => {
            p.onApply(c);
            p.onClose();
          }}
          className="btn btn-primary ml-auto h-8 min-h-0 px-4 text-xs"
        >
          {t('dialog.highlight.apply')}
        </button>
      </div>
    </Modal>
  );
}

export function DeviceStatusDialog(p: {
  profile: {
    deviceId: string;
    fingerprintHash: string;
    platformSummary: string;
    isStandalone: boolean;
    firstSeenAt: number;
    lastSeenAt: number;
    bootCount: number;
    lastBootMode: 'FRESH_START' | 'RETURNING_USER';
    bootReason: string;
  } | null;
  counts: { codes: number; details: number; lucky: number; people: number };
  onCopyDeviceId: (id: string) => void;
  onResetFreshStart: () => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [confirmReset, setConfirmReset] = useState(false);
  const isFresh = p.profile?.lastBootMode === 'FRESH_START';
  const fmtTime = (ms?: number) => (ms ? new Date(ms).toLocaleString() : '—');

  return (
    <Modal title={t('device.title')} onClose={p.onClose}>
      <p className="text-xs leading-relaxed text-slate-600">{t('device.subtitle')}</p>

      {/* Auto-Detect Banner */}
      <div
        className={`mt-3 flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${
          isFresh
            ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
            : 'border-indigo-200 bg-indigo-50/80 text-indigo-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isFresh ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-indigo-600 ring-4 ring-indigo-600/20'
            }`}
          />
          <div>
            <div className="text-xs font-extrabold">
              {isFresh ? t('device.badgeFresh') : t('device.badgeReturning')}
            </div>
            <div className="font-mono text-[11px] opacity-80">
              {p.profile?.platformSummary ?? 'Browser'} · {t('device.bootCount')}: {p.profile?.bootCount ?? 1}
            </div>
          </div>
        </div>
      </div>

      {/* Device Identity & Auth Binding Details */}
      <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">{t('device.deviceId')}</div>
            <div className="mt-0.5 font-mono text-sm font-extrabold tracking-tight text-slate-900">
              {p.profile?.deviceId ?? '—'}
            </div>
          </div>
          {p.profile?.deviceId && (
            <button
              type="button"
              onClick={() => p.onCopyDeviceId(p.profile!.deviceId)}
              className="btn btn-outline btn-sm h-7 min-h-0 gap-1.5 px-2.5 text-xs font-bold"
            >
              <Icon8 name="clipboard" size={14} />
              <span>{t('device.copyId')}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">{t('device.fingerprint')}</div>
            <div className="font-mono text-xs font-bold text-slate-800">{p.profile?.fingerprintHash ?? '—'}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">{t('device.platform')}</div>
            <div className="font-semibold text-slate-800">{p.profile?.platformSummary ?? '—'}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">{t('device.firstSeen')}</div>
            <div className="font-mono text-[11px] font-semibold text-slate-700">{fmtTime(p.profile?.firstSeenAt)}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">{t('device.lastSeen')}</div>
            <div className="font-mono text-[11px] font-semibold text-slate-700">{fmtTime(p.profile?.lastSeenAt)}</div>
          </div>
        </div>

        <div className="border-t border-slate-200/80 pt-2">
          <div className="text-[11px] font-semibold text-slate-500">{t('device.recordsSummary')}</div>
          <div className="mt-0.5 font-mono text-xs font-bold text-slate-800">
            {t('backup.currentData', {
              details: p.counts.details,
              codes: p.counts.codes,
              lucky: p.counts.lucky,
              people: p.counts.people,
            })}
          </div>
        </div>

        <div className="border-t border-slate-200/80 pt-2">
          <div className="text-[11px] font-semibold text-slate-500">{t('device.licenseStatus')}</div>
          <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            <span>{t('device.licenseReady')}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="btn btn-danger h-8 min-h-0 px-3 text-xs"
        >
          {t('device.freshResetBtn')}
        </button>
        <button type="button" onClick={p.onClose} className="btn btn-ghost h-8 min-h-0 px-3 text-xs">
          {t('dialog.close')}
        </button>
      </div>

      {confirmReset && (
        <ConfirmDialog
          title={t('device.freshResetConfirmTitle')}
          message={t('device.freshResetConfirmMsg')}
          confirmLabel={t('device.freshResetYes')}
          danger
          onCancel={() => setConfirmReset(false)}
          onConfirm={async () => {
            setConfirmReset(false);
            await p.onResetFreshStart();
            p.onClose();
          }}
        />
      )}
    </Modal>
  );
}

