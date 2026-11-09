import React from 'react';

export type Icon8Name =
  | 'inbox'
  | 'lightning'
  | 'idea'
  | 'close'
  | 'checkmark'
  | 'chevron-down'
  | 'clipboard'
  | 'print'
  | 'document'
  | 'share'
  | 'whatsapp'
  | 'telegram'
  | 'search'
  | 'trash'
  | 'edit'
  | 'users'
  | 'warning'
  | 'help'
  | 'forward'
  | 'forward-all'
  | 'forward-tens'
  | 'back'
  | 'back-all'
  | 'sort'
  | 'browse'
  | 'save'
  | 'clear'
  | 'clock'
  | 'refresh'
  | 'device'
  | 'plus'
  | 'settings'
  | 'report'
  | 'trophy'
  | 'calendar'
  | 'palette'
  | 'database'
  | 'globe'
  | 'mobile';

export interface Icon8Props {
  name: Icon8Name;
  size?: number;
  className?: string;
}

/**
 * Icons8 Flat Color Vector Icon System (Standalone / Zero Attribution).
 * Renders multi-tone layered flat vector icons matching the Icons8 Flat / Fluency aesthetic.
 */
export function Icon8({ name, size = 16, className = '' }: Icon8Props): React.ReactElement {
  const s = size;
  const baseClass = `inline-block shrink-0 select-none align-middle ${className}`;

  switch (name) {
    case 'inbox':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M9 10C7.343 10 6 11.343 6 13V37C6 39.761 8.239 42 11 42H37C39.761 42 42 39.761 42 37V13C42 11.343 40.657 10 39 10H9Z" fill="#5C6BC0" />
          <path d="M6 28H16L19 33H29L32 28H42V37C42 39.761 39.761 42 37 42H11C8.239 42 6 39.761 6 37V28Z" fill="#3949AB" />
          <path d="M24 6V24M24 24L17 17M24 24L31 17" stroke="#FFCA28" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'lightning':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M27 4L10 26H23L19 44L38 20H25L27 4Z" fill="#FFC107" />
          <path d="M27 4L19 26H25L19 44L38 20H25L27 4Z" fill="#FFA000" fillOpacity="0.45" />
        </svg>
      );

    case 'idea':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="24" cy="20" r="14" fill="#FFD54F" />
          <path d="M18 31H30L28 38H20L18 31Z" fill="#FFF176" />
          <rect x="19" y="37" width="10" height="5" rx="2" fill="#78909C" />
          <path d="M22 42H26C26 43.657 25.105 45 24 45C22.895 45 22 43.657 22 42Z" fill="#455A64" />
          <path d="M24 11C19.582 11 16 14.582 16 19" stroke="#FFF9C4" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'close':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill="#EF5350" fillOpacity="0.16" />
          <path d="M16 16L32 32M32 16L16 32" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );

    case 'checkmark':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill="#4CAF50" />
          <path d="M14 24.5L21 31.5L35 17.5" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'chevron-down':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M12 18L24 30L36 18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'clipboard':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="9" y="8" width="30" height="36" rx="4" fill="#90CAF9" />
          <rect x="13" y="12" width="22" height="28" rx="2" fill="#FFFFFF" />
          <path d="M18 6H30C31.657 6 33 7.343 33 9V12H15V9C15 7.343 16.343 6 18 6Z" fill="#546E7A" />
          <rect x="17" y="19" width="14" height="3" rx="1.5" fill="#42A5F5" />
          <rect x="17" y="25" width="14" height="3" rx="1.5" fill="#42A5F5" />
          <rect x="17" y="31" width="9" height="3" rx="1.5" fill="#42A5F5" />
        </svg>
      );

    case 'print':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="12" y="6" width="24" height="12" rx="2" fill="#90CAF9" />
          <rect x="6" y="16" width="36" height="18" rx="4" fill="#546E7A" />
          <rect x="12" y="28" width="24" height="14" rx="2" fill="#E3F2FD" />
          <circle cx="35" cy="22" r="2.5" fill="#4CAF50" />
          <rect x="16" y="33" width="16" height="2.5" rx="1.25" fill="#1E88E5" />
          <rect x="16" y="37" width="11" height="2.5" rx="1.25" fill="#1E88E5" />
        </svg>
      );

    case 'document':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M10 8C10 5.791 11.791 4 14 4H29L38 13V40C38 42.209 36.209 44 34 44H14C11.791 44 10 42.209 10 40V8Z" fill="#42A5F5" />
          <path d="M29 4L38 13H31C29.895 13 29 12.105 29 11V4Z" fill="#BBDEFB" />
          <rect x="16" y="20" width="16" height="3" rx="1.5" fill="#FFFFFF" />
          <rect x="16" y="26" width="16" height="3" rx="1.5" fill="#FFFFFF" />
          <rect x="16" y="32" width="10" height="3" rx="1.5" fill="#FFFFFF" />
        </svg>
      );

    case 'share':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M14 24L34 12M14 24L34 36" stroke="#26A69A" strokeWidth="4" strokeLinecap="round" />
          <circle cx="12" cy="24" r="7" fill="#00897B" />
          <circle cx="35" cy="12" r="7" fill="#26A69A" />
          <circle cx="35" cy="36" r="7" fill="#4DB6AC" />
        </svg>
      );

    case 'whatsapp':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M24 4C12.954 4 4 12.732 4 23.5C4 27.39 5.17 31.015 7.185 34.065L4.5 43.5L14.33 40.92C17.22 42.56 20.51 43.5 24 43.5C35.046 43.5 44 34.768 44 24C44 13.232 35.046 4 24 4Z" fill="#25D366" />
          <path d="M17.5 14.5C16.8 14.5 15.5 15.2 15.5 17.5C15.5 21.2 18.8 25.9 22.2 28.6C25.6 31.3 30 32.5 32 32C34 31.5 34.5 29.5 34.5 28.8C34.5 28.1 34.1 27.8 33.4 27.4L29.5 25.6C28.9 25.3 28.4 25.5 28 26.1L26.8 27.6C26.4 28 25.9 28.1 25.3 27.8C23.5 26.9 21.1 24.9 19.9 22.8C19.6 22.3 19.8 21.8 20.2 21.4L21.3 20.1C21.7 19.6 21.8 19.1 21.5 18.5L19.8 14.9C19.4 14.5 18.2 14.5 17.5 14.5Z" fill="#FFFFFF" />
        </svg>
      );

    case 'telegram':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill="#29B6F6" />
          <path d="M35.5 14.5L11.5 23.8C10.5 24.2 10.5 25.1 11.4 25.4L17.5 27.3L31.8 18.3C32.5 17.9 33.1 18.1 32.6 18.6L21 29.1L20.6 35.2C21.2 35.2 21.5 34.9 21.9 34.5L25 31.5L31.3 36.1C32.4 36.7 33.2 36.4 33.5 35.1L37.2 16.2C37.5 14.8 36.6 14 35.5 14.5Z" fill="#FFFFFF" />
        </svg>
      );

    case 'search':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M31 31L42 42" stroke="#546E7A" strokeWidth="5" strokeLinecap="round" />
          <circle cx="21" cy="21" r="14" fill="#81D4FA" stroke="#1E88E5" strokeWidth="3.5" />
          <path d="M15 16C16.5 14 18.6 13 21 13" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'trash':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M12 14H36L34 40C33.9 41.7 32.5 43 30.8 43H17.2C15.5 43 14.1 41.7 14 40L12 14Z" fill="#EF5350" />
          <path d="M19 7H29C30.1 7 31 7.9 31 9V11H17V9C17 7.9 17.9 7 19 7Z" fill="#B71C1C" />
          <rect x="8" y="10" width="32" height="4" rx="2" fill="#E53935" />
          <path d="M20 20V36M28 20V36" stroke="#FFCDD2" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'edit':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M33.5 7.5L40.5 14.5L16 39L8 40L9 32L33.5 7.5Z" fill="#FFB74D" />
          <path d="M33.5 7.5L40.5 14.5L36.5 18.5L29.5 11.5L33.5 7.5Z" fill="#EF5350" />
          <path d="M9 32L16 39L8 40L9 32Z" fill="#37474F" />
        </svg>
      );

    case 'users':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="31" cy="16" r="6" fill="#90CAF9" />
          <path d="M22 36C22 30.5 26 27 31 27C36 27 40 30.5 40 36V38H22V36Z" fill="#64B5F6" />
          <circle cx="19" cy="17" r="7" fill="#5C6BC0" />
          <path d="M8 38C8 31.9 12.9 28 19 28C25.1 28 30 31.9 30 38V40H8V38Z" fill="#3F51B5" />
        </svg>
      );

    case 'warning':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M24 6L44 41H4L24 6Z" fill="#FFB300" />
          <rect x="22" y="18" width="4" height="12" rx="2" fill="#263238" />
          <circle cx="24" cy="35" r="2.5" fill="#263238" />
        </svg>
      );

    case 'help':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill="#5C6BC0" />
          <path d="M18.5 18.5C18.5 15.5 21 13.5 24.2 13.5C27.4 13.5 29.8 15.5 29.8 18.4C29.8 20.6 28.4 22 26.5 23.1C24.9 24 24 25 24 26.8V28" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          <circle cx="24" cy="34.5" r="2.5" fill="#FFFFFF" />
        </svg>
      );

    case 'forward':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M18 11L31 24L18 37" stroke="#4F46E5" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'forward-all':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M11 11L24 24L11 37" stroke="#6366F1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 11L37 24L24 37" stroke="#4338CA" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'forward-tens':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M7 12L18 24L7 36" stroke="#818CF8" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 12L30 24L19 36" stroke="#6366F1" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M31 12L42 24L31 36" stroke="#4338CA" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'back':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M30 11L17 24L30 37" stroke="#D97706" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'back-all':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M37 11L24 24L37 37" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 11L11 24L24 37" stroke="#B45309" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'sort':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M16 10V38M16 10L9 17M16 10L23 17" stroke="#5C6BC0" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M32 38V10M32 38L25 31M32 38L39 31" stroke="#26A69A" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'browse':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="6" y="8" width="36" height="32" rx="4" fill="#E8EAF6" />
          <rect x="6" y="8" width="36" height="9" rx="4" fill="#5C6BC0" />
          <rect x="12" y="22" width="24" height="3" rx="1.5" fill="#7986CB" />
          <rect x="12" y="29" width="18" height="3" rx="1.5" fill="#7986CB" />
        </svg>
      );

    case 'save':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M9 9C9 7.343 10.343 6 12 6H32L42 16V39C42 40.657 40.657 42 39 42H12C10.343 42 9 40.657 9 39V9Z" fill="#FFFFFF" fillOpacity="0.22" />
          <circle cx="24" cy="26" r="10" fill="#FFFFFF" />
          <path d="M19.5 26L22.8 29.3L29.5 22.5" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'clear':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M14 14L34 34M34 14L14 34" stroke="#64748B" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );

    case 'clock':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="24" cy="24" r="19" fill="#FFCA28" />
          <circle cx="24" cy="24" r="15" fill="#1E293B" />
          <path d="M24 14V24L31 28" stroke="#FFCA28" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'refresh':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M38 18C35.5 11.6 29.3 7 22 7C12.6 7 5 14.6 5 24C5 33.4 12.6 41 22 41C29.9 41 36.5 35.6 38.4 28.3" stroke="#5C6BC0" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M40 8V19H29" stroke="#26A69A" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'device':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="6" y="9" width="36" height="25" rx="3" fill="#42A5F5" />
          <rect x="9" y="12" width="30" height="19" rx="1.5" fill="#E3F2FD" />
          <path d="M2 36H46L42 40H6L2 36Z" fill="#546E7A" />
          <circle cx="24" cy="21.5" r="5.5" fill="#26A69A" />
          <path d="M21.5 21.5L23.3 23.3L27 19.6" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'plus':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M24 10V38M10 24H38" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
        </svg>
      );

    case 'settings':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="24" cy="24" r="16" fill="#78909C" />
          <circle cx="24" cy="24" r="7" fill="#ECEFF1" />
        </svg>
      );

    case 'report':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="8" y="24" width="8" height="18" rx="2" fill="#42A5F5" />
          <rect x="20" y="14" width="8" height="28" rx="2" fill="#5C6BC0" />
          <rect x="32" y="6" width="8" height="36" rx="2" fill="#26A69A" />
        </svg>
      );

    case 'trophy':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M14 8H34V21C34 26.5 29.5 31 24 31C18.5 31 14 26.5 14 21V8Z" fill="#FFCA28" />
          <rect x="21" y="30" width="6" height="8" fill="#FFA000" />
          <rect x="15" y="37" width="18" height="5" rx="2" fill="#546E7A" />
        </svg>
      );

    case 'calendar':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="6" y="10" width="36" height="32" rx="4" fill="#ECEFF1" />
          <path d="M6 14C6 11.8 7.8 10 10 10H38C40.2 10 42 11.8 42 14V19H6V14Z" fill="#EF5350" />
          <circle cx="16" cy="27" r="2.5" fill="#5C6BC0" />
          <circle cx="24" cy="27" r="2.5" fill="#5C6BC0" />
          <circle cx="32" cy="27" r="2.5" fill="#5C6BC0" />
        </svg>
      );

    case 'palette':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M24 6C13.5 6 5 14 5 24C5 34 13.5 42 23 42C26.3 42 28 39.8 28 37.3C28 36 27.3 35 26.6 34C26 33.1 25.5 32.1 25.5 31C25.5 28.8 27.3 27 29.8 27H34C39.5 27 43 23.2 43 18C43 11.2 34.5 6 24 6Z" fill="#FFCA28" />
          <circle cx="15" cy="20" r="3" fill="#EF5350" />
          <circle cx="22" cy="14" r="3" fill="#42A5F5" />
          <circle cx="31" cy="15" r="3" fill="#66BB6A" />
        </svg>
      );

    case 'database':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <ellipse cx="24" cy="12" rx="16" ry="6" fill="#42A5F5" />
          <path d="M8 12V24C8 27.3 15.2 30 24 30C32.8 30 40 27.3 40 24V12" fill="#1E88E5" />
          <path d="M8 24V36C8 39.3 15.2 42 24 42C32.8 42 40 39.3 40 36V24" fill="#1565C0" />
          <ellipse cx="24" cy="12" rx="16" ry="6" fill="#64B5F6" />
        </svg>
      );

    case 'globe':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="24" cy="24" r="18" fill="#29B6F6" />
          <ellipse cx="24" cy="24" rx="9" ry="18" stroke="#E1F5FE" strokeWidth="2.5" />
          <path d="M6 24H42" stroke="#E1F5FE" strokeWidth="2.5" />
        </svg>
      );

    case 'mobile':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="12" y="4" width="24" height="40" rx="4" fill="#546E7A" />
          <rect x="15" y="8" width="18" height="29" rx="1.5" fill="#81D4FA" />
          <circle cx="24" cy="40.5" r="2" fill="#ECEFF1" />
        </svg>
      );
  }
}
