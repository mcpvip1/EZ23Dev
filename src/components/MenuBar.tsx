import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n';

/**
 * Classic menu bar from the original EASY main screen:
 * Setup | Report | System | AUTO | OK Thanks | Close | Template | T =
 * Dropdowns open on click; clicking an item runs it and closes the menu.
 * Labels come from the locale files (Myanmar default); the language
 * itself is switched from the System menu (မြန်မာ / English).
 */

export interface MenuAction {
  kind:
    | 'lucky'
    | 'fighter'
    | 'owner'
    | 'delete'
    | 'changeDate'
    | 'unitSales'
    | 'closeDays'
    | 'about'
    | 'highlight'
    | 'backup'
    | 'browseBets'
    | 'reportCurrent'
    | 'reportDaily'
    | 'reportWeekly'
    | 'reportRange'
    | 'reportRangeAMPM'
    | 'reportSelected'
    | 'reportSelectedViewOnly'
    | 'reportUpToDate'
    | 'auto'
    | 'okThanks'
    | 'close'
    | 'template'
    | 'tEquals'
    | 'langMy'
    | 'langEn'
    | 'chatIngest';
}

interface Item {
  key: string;
  shortcut?: string;
  action: MenuAction['kind'];
  checked?: boolean;
}

export default function MenuBar(p: {
  onAction: (a: MenuAction['kind']) => void;
  dateLabel: string;
  right?: React.ReactNode;
}) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const SETUP: Item[] = [
    { key: 'menu.setup.lucky', shortcut: 'Ctrl+L', action: 'lucky' },
    { key: 'menu.setup.fighter', shortcut: 'Ctrl+F', action: 'fighter' },
    { key: 'menu.setup.owner', shortcut: 'Ctrl+O', action: 'owner' },
    { key: 'menu.setup.delete', shortcut: 'Ctrl+D', action: 'delete' },
    { key: 'menu.setup.changeDate', shortcut: 'Ctrl+T', action: 'changeDate' },
    { key: 'menu.setup.unitSales', action: 'unitSales' },
    { key: 'menu.setup.closeDays', action: 'closeDays' },
  ];

  const REPORT: Item[] = [
    { key: 'menu.report.current', shortcut: 'F9', action: 'reportCurrent' },
    { key: 'menu.report.daily', shortcut: 'F10', action: 'reportDaily' },
    { key: 'menu.report.weekly', shortcut: 'F11', action: 'reportWeekly' },
    { key: 'menu.report.range', shortcut: 'F12', action: 'reportRange' },
    { key: 'menu.report.rangeAMPM', action: 'reportRangeAMPM' },
    { key: 'menu.report.selected', shortcut: 'F4', action: 'reportSelected' },
    { key: 'menu.report.selectedViewOnly', shortcut: 'Ctrl+F4', action: 'reportSelectedViewOnly' },
    { key: 'menu.report.upToDate', action: 'reportUpToDate' },
    { key: 'menu.report.browseBets', action: 'browseBets' },
  ];

  const SYSTEM: Item[] = [
    { key: 'menu.system.about', action: 'about' },
    { key: 'menu.system.highlight', action: 'highlight' },
    { key: 'menu.system.backup', action: 'backup' },
    { key: 'menu.lang.my', action: 'langMy', checked: lang === 'my' },
    { key: 'menu.lang.en', action: 'langEn', checked: lang === 'en' },
    { key: 'menu.system.exit', action: 'close' },
  ];

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const run = (action: MenuAction['kind']) => {
    setOpen(null);
    p.onAction(action);
  };

  const menu = (id: string, labelKey: string, items: Item[], bold?: boolean) => (
    <div className="relative" key={id}>
      <button
        type="button"
        onClick={() => setOpen(open === id ? null : id)}
        className={`btn btn-sm h-8 min-h-0 rounded-md px-2.5 text-xs ${bold ? 'font-extrabold' : 'font-semibold'} ${
          open === id
            ? 'bg-slate-800 text-white'
            : 'text-slate-700 hover:bg-slate-200/80'
        }`}
      >
        <span>{t(labelKey)}</span>
        <span className="ml-0.5 text-[10px] opacity-60">▾</span>
      </button>
      {open === id && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-60 rounded-lg border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={() => run(it.action)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-3 text-indigo-600 font-bold">{it.checked ? '✓' : ''}</span>
                <span>{t(it.key)}</span>
              </span>
              {it.shortcut && (
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                  {it.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const single = (labelKey: string, action: MenuAction['kind'], bold?: boolean) => (
    <button
      key={labelKey}
      type="button"
      onClick={() => run(action)}
      className={`btn btn-sm h-8 min-h-0 rounded-md px-2.5 text-xs ${
        bold ? 'font-extrabold text-indigo-700 hover:bg-indigo-50' : 'font-semibold text-slate-700 hover:bg-slate-200/80'
      }`}
    >
      {t(labelKey)}
    </button>
  );

  return (
    <div ref={ref} className="no-print border-b border-slate-300 bg-white/95 shadow-2xs backdrop-blur-xs">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-1 px-3 py-1">
        {menu('setup', 'menu.setup', SETUP)}
        {menu('report', 'menu.report', REPORT)}
        {menu('system', 'menu.system', SYSTEM)}
        <div className="mx-1 h-4 w-px bg-slate-200" />
        <button
          type="button"
          onClick={() => run('chatIngest')}
          className="btn btn-sm h-8 min-h-0 rounded-md bg-indigo-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
          title="Smart Chat Message Ingestion (Viber / Telegram / SMS) — Ctrl+I"
        >
          <span>📥</span> Chat Ingest
        </button>
        {single('menu.auto', 'auto', true)}
        {single('menu.okThanks', 'okThanks')}
        {single('menu.close', 'close')}
        {single('menu.template', 'template')}
        {single('menu.tEquals', 'tEquals')}
        <span className="ml-auto flex items-center gap-2 text-xs text-slate-600">
          <span className="hidden rounded bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-800 sm:inline-block">
            {p.dateLabel}
          </span>
          {p.right}
        </span>
      </div>
    </div>
  );
}
