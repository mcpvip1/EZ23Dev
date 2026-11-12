import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n';
import type { DeviceProfile } from '../lib/deviceDetect';
import { Icon8 } from './Icons8';
import type { Icon8Name } from './Icons8';

/**
 * Modern Institutional Top Navigation Bar for EASY 2D Pro:
 * Brand Lockup | Setup / Report / System Dropdowns | Quick Actions | Device Status & Session Controls
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
    | 'deviceStatus'
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
  icon?: Icon8Name;
  checked?: boolean;
  danger?: boolean;
}

export default function MenuBar(p: {
  onAction: (a: MenuAction['kind']) => void;
  dateLabel: string;
  deviceProfile?: DeviceProfile | null;
  right?: React.ReactNode;
}) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const SETUP: Item[] = [
    { key: 'menu.setup.lucky', shortcut: 'Ctrl+L', action: 'lucky', icon: 'trophy' },
    { key: 'menu.setup.fighter', shortcut: 'Ctrl+F', action: 'fighter', icon: 'users' },
    { key: 'menu.setup.owner', shortcut: 'Ctrl+O', action: 'owner', icon: 'users' },
    { key: 'menu.setup.unitSales', action: 'unitSales', icon: 'report' },
    { key: 'menu.setup.changeDate', shortcut: 'Ctrl+T', action: 'changeDate', icon: 'calendar' },
    { key: 'menu.setup.closeDays', action: 'closeDays', icon: 'calendar' },
    { key: 'menu.setup.delete', shortcut: 'Ctrl+D', action: 'delete', icon: 'trash', danger: true },
  ];

  const REPORT: Item[] = [
    { key: 'menu.report.current', shortcut: 'F9', action: 'reportCurrent', icon: 'report' },
    { key: 'menu.report.daily', shortcut: 'F10', action: 'reportDaily', icon: 'report' },
    { key: 'menu.report.weekly', shortcut: 'F11', action: 'reportWeekly', icon: 'report' },
    { key: 'menu.report.range', shortcut: 'F12', action: 'reportRange', icon: 'calendar' },
    { key: 'menu.report.rangeAMPM', action: 'reportRangeAMPM', icon: 'calendar' },
    { key: 'menu.report.selected', shortcut: 'F4', action: 'reportSelected', icon: 'users' },
    { key: 'menu.report.selectedViewOnly', shortcut: 'Ctrl+F4', action: 'reportSelectedViewOnly', icon: 'document' },
    { key: 'menu.report.upToDate', action: 'reportUpToDate', icon: 'report' },
    { key: 'menu.report.browseBets', action: 'browseBets', icon: 'browse' },
  ];

  const SYSTEM: Item[] = [
    { key: 'menu.auto', action: 'auto', icon: 'lightning' },
    { key: 'menu.template', action: 'template', icon: 'clipboard' },
    { key: 'menu.system.device', action: 'deviceStatus', icon: 'device' },
    { key: 'menu.system.backup', action: 'backup', icon: 'database' },
    { key: 'menu.system.highlight', action: 'highlight', icon: 'palette' },
    { key: 'menu.system.about', action: 'about', icon: 'help' },
    { key: 'menu.system.exit', action: 'close', icon: 'close' },
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

  const menu = (id: string, labelKey: string, items: Item[], menuIcon: Icon8Name) => {
    const isOpen = open === id;
    return (
      <div className="relative" key={id}>
        <button
          type="button"
          onClick={() => setOpen(isOpen ? null : id)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13.5px] font-bold whitespace-nowrap transition-colors ${
            isOpen
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-100 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Icon8 name={menuIcon} size={15} />
          <span>{t(labelKey)}</span>
          <Icon8
            name="chevron-down"
            size={11}
            className={`transition-transform ${isOpen ? 'rotate-180 opacity-100' : 'opacity-65'}`}
          />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-full z-40 mt-1.5 min-w-68 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-2xl ring-1 ring-slate-900/5">
            {items.map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => run(it.action)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] font-bold transition-colors ${
                  it.danger
                    ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                    : 'text-slate-800 hover:bg-indigo-50/80 hover:text-indigo-700'
                }`}
              >
                <span className="flex items-center gap-2.5 whitespace-nowrap">
                  <span className="flex w-4 items-center justify-center">
                    {it.checked ? (
                      <Icon8 name="checkmark" size={15} />
                    ) : it.icon ? (
                      <Icon8 name={it.icon} size={15} />
                    ) : null}
                  </span>
                  <span>{t(it.key)}</span>
                </span>
                {it.shortcut && (
                  <kbd className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                    {it.shortcut}
                  </kbd>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const isFresh = p.deviceProfile?.lastBootMode === 'FRESH_START';

  return (
    <header ref={ref} className="no-print sticky top-0 z-30 shrink-0 border-b border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
      <div className="flex w-full max-w-7xl mx-auto flex-wrap items-center gap-1.5 px-2.5 py-1">
        {/* Brand Identity */}
        <div className="mr-1.5 flex items-center gap-2 select-none">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 font-mono text-xs font-black text-white shadow-xs">
            2D
          </div>
          <span className="font-mono text-sm font-extrabold tracking-tight text-white whitespace-nowrap">
            EASY 2D
          </span>
        </div>

        <div className="mx-1 h-4 w-px bg-slate-700/80" />

        {/* Left Zone: Active Date, Session Switcher & Device Status */}
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-bold text-slate-200 whitespace-nowrap">
            {lang === 'my' ? 'လက်ရှိရက်စွဲ:' : 'Current Date:'}
          </span>
          {p.right}
          {p.deviceProfile && (
            <button
              type="button"
              onClick={() => run('deviceStatus')}
              title={`${t('device.title')} — ${p.deviceProfile.deviceId}`}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-[12px] font-bold transition-colors whitespace-nowrap ${
                isFresh
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                  : 'border-slate-700 bg-slate-800/90 text-slate-300 hover:border-slate-600 hover:text-white'
              }`}
            >
              <Icon8 name="device" size={14} />
              <span>{isFresh ? 'Fresh Start' : p.deviceProfile.deviceId.slice(0, 8)}</span>
            </button>
          )}
        </div>

        {/* Primary Dropdown Menus & Language Selector (Right-Aligned) */}
        <nav className="ml-auto flex items-center gap-1.5" aria-label="Main Menu">
          {menu('setup', 'menu.setup', SETUP, 'settings')}
          {menu('report', 'menu.report', REPORT, 'report')}
          {menu('system', 'menu.system', SYSTEM, 'device')}

          <div className="mx-0.5 h-4 w-px bg-slate-700/80" />

          {/* Combined English & Myanmar Language Selector */}
          <div
            className="inline-flex h-8 items-center gap-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-800/90 p-0.5"
            role="group"
            aria-label={t('menu.system.language')}
          >
            <span className="pl-1.5 pr-0.5 flex items-center">
              <Icon8 name="globe" size={14} />
            </span>
            <button
              type="button"
              onClick={() => run('langMy')}
              className={`inline-flex h-full items-center justify-center rounded-md px-2.5 text-[13px] font-bold transition-colors whitespace-nowrap ${
                lang === 'my'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {t('menu.lang.my')}
            </button>
            <button
              type="button"
              onClick={() => run('langEn')}
              className={`inline-flex h-full items-center justify-center rounded-md px-2.5 text-[13px] font-bold transition-colors whitespace-nowrap ${
                lang === 'en'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {t('menu.lang.en')}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
