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
  | 'mobile'
  | 'crop';

export interface Icon8Props {
  name: Icon8Name;
  size?: number;
  className?: string;
}

/**
 * Icons8 "Pulsar" (`pulsar-color`) Vector Icon System.
 * Features the signature Icons8 Pulsar aesthetic:
 *  1. Offset pastel/vibrant color fill layer shifted down-right (+3px, +3px)
 *  2. Crisp #18193F dark-navy rounded line-art strokes (strokeWidth=3) with Pulsar gap details
 */
export function Icon8({ name, size = 16, className = '' }: Icon8Props): React.ReactElement {
  const s = size;
  const baseClass = `inline-block shrink-0 select-none align-middle ${className}`;
  const INK = '#18193F';

  switch (name) {
    case 'inbox':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          {/* Pulsar offset fill */}
          <rect x="11" y="13" width="32" height="30" rx="5" fill="#8CE7F2" />
          <path d="M9 29H17L20 34H28L31 29H39V37C39 39.2 37.2 41 35 41H13C10.8 41 9 39.2 9 37V29Z" fill="#5C9CE6" />
          {/* Pulsar line art */}
          <path d="M15 9H35C37.2 9 39 10.8 39 13V36C39 38.8 36.8 41 34 41H14C11.2 41 9 38.8 9 36V15" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 28H16.5L19.5 33H28.5L31.5 28H39" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 6V23M24 23L18 17M24 23L30 17" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'lightning':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          {/* Pulsar offset fill */}
          <path d="M29 8L14 28H26L22 44L39 22H27L29 8Z" fill="#FFE082" />
          <path d="M29 8L21 28H27L22 44L39 22H27L29 8Z" fill="#FFB74D" />
          {/* Pulsar line art */}
          <path d="M26 5L11 25H23L19 43L36 19H24L26 5Z" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'idea':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          {/* Pulsar offset fill */}
          <circle cx="27" cy="22" r="13" fill="#FFE082" />
          <rect x="20" y="36" width="11" height="6" rx="2" fill="#90CAF9" />
          {/* Pulsar line art */}
          <path d="M18 31C14.4 28.6 12 24.6 12 20C12 12.8 17.4 7 24 7C30.6 7 36 12.8 36 20C36 24.6 33.6 28.6 30 31L28.5 36H19.5L18 31Z" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 36H29V40C29 41.7 27.7 43 26 43H22C20.3 43 19 41.7 19 40V36Z" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 13C20.7 13 18 15.7 18 19" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      );

    case 'close':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          {/* Pulsar offset fill */}
          <circle cx="26" cy="26" r="17" fill="#FFAB91" />
          {/* Pulsar line art */}
          <circle cx="23" cy="23" r="17" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeDasharray="88 14" />
          <path d="M16.5 16.5L29.5 29.5M29.5 16.5L16.5 29.5" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 'checkmark':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          {/* Pulsar offset fill */}
          <circle cx="26" cy="26" r="17" fill="#A5D6A7" />
          {/* Pulsar line art */}
          <circle cx="23" cy="23" r="17" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeDasharray="88 14" />
          <path d="M15.5 23.5L21 29L31.5 17.5" stroke={INK} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'chevron-down':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M14 21L26 33L38 21" stroke="#8CE7F2" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 18L23 30L35 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'clipboard':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          {/* Pulsar offset fill */}
          <rect x="13" y="12" width="27" height="32" rx="4" fill="#8CE7F2" />
          <rect x="19" y="7" width="14" height="7" rx="2.5" fill="#FFE082" />
          {/* Pulsar line art */}
          <path d="M17 10H13C10.8 10 9 11.8 9 14V39C9 41.2 10.8 43 13 43H33C35.2 43 37 41.2 37 39V14C37 11.8 35.2 10 33 10H29" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="17" y="6" width="12" height="7" rx="2.5" stroke={INK} strokeWidth="3.2" />
          <path d="M16 21H30M16 28H30M16 35H24" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'print':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          {/* Pulsar offset fill */}
          <rect x="10" y="18" width="32" height="17" rx="4" fill="#90CAF9" />
          <rect x="15" y="30" width="22" height="13" rx="2" fill="#8CE7F2" />
          {/* Pulsar line art */}
          <path d="M13 16V8C13 6.9 13.9 6 15 6H31C32.1 6 33 6.9 33 8V16" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M13 33H9C7.3 33 6 31.7 6 30V20C6 17.8 7.8 16 10 16H36C38.2 16 40 17.8 40 20V30C40 31.7 38.7 33 37 33H33" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="13" y="27" width="20" height="15" rx="2" fill="#FFFFFF" stroke={INK} strokeWidth="3.2" />
          <path d="M17 33H29M17 37H25" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
          <circle cx="34" cy="21" r="2" fill={INK} />
        </svg>
      );

    case 'document':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          {/* Pulsar offset fill */}
          <path d="M14 9H31L40 18V41C40 43.2 38.2 45 36 45H14C11.8 45 10 43.2 10 41V13C10 10.8 11.8 9 14 9Z" fill="#8CE7F2" />
          {/* Pulsar line art */}
          <path d="M11 6H28L37 15V39C37 41.2 35.2 43 33 43H11C8.8 43 7 41.2 7 39V10C7 7.8 8.8 6 11 6Z" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M27 6V14C27 15.1 27.9 16 29 16H37" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 23H29M14 30H29M14 37H22" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'share':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="15" cy="26" r="6.5" fill="#8CE7F2" />
          <circle cx="37" cy="14" r="6.5" fill="#A5D6A7" />
          <circle cx="37" cy="38" r="6.5" fill="#FFE082" />
          <path d="M18 21L30 14M18 27L30 34" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="13" cy="24" r="6" stroke={INK} strokeWidth="3.2" />
          <circle cx="35" cy="12" r="6" stroke={INK} strokeWidth="3.2" />
          <circle cx="35" cy="36" r="6" stroke={INK} strokeWidth="3.2" />
        </svg>
      );

    case 'whatsapp':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="26" cy="26" r="18" fill="#A5D6A7" />
          <path d="M23 6C13.1 6 5 13.9 5 23.6C5 27.2 6.1 30.5 8 33.3L5.5 42L14.5 39.6C17.1 41.1 20 42 23 42C32.9 42 41 34.1 41 24.4C41 14.7 32.9 6 23 6Z" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17.5 16.5C16.8 16.5 15.8 17.2 15.8 19C15.8 22.3 18.7 26.5 21.8 28.9C24.9 31.3 28.8 32.3 30.5 31.8C32.2 31.3 32.8 29.6 32.8 29L29.2 27.2L27.2 29C25.2 28.1 22.2 25.6 21 23.3L22.5 21.5L20.8 17.5C20.4 16.8 18.2 16.5 17.5 16.5Z" fill="#25D366" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        </svg>
      );

    case 'telegram':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="26" cy="26" r="18" fill="#8CE7F2" />
          <path d="M39 11L7 23.5L18.5 28L34 16L22.5 30.5L22 40L27.5 34L35 39.5L39 11Z" fill="#8CE7F2" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'search':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="24" cy="24" r="13" fill="#8CE7F2" />
          <circle cx="21" cy="21" r="13" stroke={INK} strokeWidth="3.2" />
          <path d="M16 16C17.4 14.5 19.2 13.7 21 13.7" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
          <path d="M30.5 30.5L41 41" stroke={INK} strokeWidth="3.8" strokeLinecap="round" />
        </svg>
      );

    case 'trash':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          {/* Pulsar offset fill */}
          <path d="M15 16H37L35 41C34.9 42.7 33.5 44 31.8 44H20.2C18.5 44 17.1 42.7 17 41L15 16Z" fill="#FFAB91" />
          {/* Pulsar line art */}
          <path d="M9 12H39" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M18 12V8.5C18 7.1 19.1 6 20.5 6H27.5C28.9 6 30 7.1 30 8.5V12" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M12 12L14 39.5C14.1 41.5 15.8 43 17.8 43H30.2C32.2 43 33.9 41.5 34 39.5L36 12" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 20V35M28 20V35" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'edit':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          {/* Pulsar offset fill */}
          <path d="M34 10L41 17L18 40L9 42L11 33L34 10Z" fill="#FFE082" />
          <path d="M31 11L38 18L34 22L27 15L31 11Z" fill="#FFAB91" />
          {/* Pulsar line art */}
          <path d="M32.5 7.5L40.5 15.5L16 40L7 42L9 33L32.5 7.5Z" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M28 12L36 20" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'users':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          {/* Pulsar offset fill */}
          <circle cx="21" cy="18" r="7" fill="#8CE7F2" />
          <path d="M9 40C9 33.5 14.5 29 21 29C27.5 29 33 33.5 33 40H9Z" fill="#90CAF9" />
          <circle cx="33" cy="17" r="5.5" fill="#FFE082" />
          {/* Pulsar line art */}
          <circle cx="19" cy="16" r="6.5" stroke={INK} strokeWidth="3.2" />
          <path d="M7 39C7 32.9 12.4 28.5 19 28.5C25.6 28.5 31 32.9 31 39" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M30 11.5C32.8 11.5 35 13.7 35 16.5C35 19.3 32.8 21.5 30 21.5" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M33 29C37.5 29.8 41 33.2 41 38" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'warning':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M26 9L45 42H7L26 9Z" fill="#FFE082" />
          <path d="M24 6L43 40H5L24 6Z" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 18V28" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="24" cy="34" r="2.2" fill={INK} />
        </svg>
      );

    case 'help':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="26" cy="26" r="17" fill="#B39DDB" />
          <circle cx="23" cy="23" r="17" stroke={INK} strokeWidth="3.2" strokeDasharray="88 14" strokeLinecap="round" />
          <path d="M18.5 18.5C18.5 15.8 20.6 14 23.3 14C26 14 28 15.8 28 18.2C28 20.2 26.7 21.4 25 22.4C23.7 23.2 23 24.2 23 25.8V26.8" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="23" cy="32.5" r="2.2" fill={INK} />
        </svg>
      );

    case 'forward':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="26" cy="26" r="16" fill="#8CE7F2" />
          <path d="M19 12L31 24L19 36" stroke={INK} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'forward-all':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="26" cy="26" r="16" fill="#90CAF9" />
          <path d="M12 12L24 24L12 36" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 12L36 24L24 36" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'forward-tens':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="8" y="10" width="34" height="30" rx="8" fill="#B39DDB" />
          <path d="M8 13L18 24L8 35" stroke={INK} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 13L29 24L19 35" stroke={INK} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 13L40 24L30 35" stroke={INK} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'back':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="26" cy="26" r="16" fill="#FFE082" />
          <path d="M29 12L17 24L29 36" stroke={INK} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'back-all':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="26" cy="26" r="16" fill="#FFAB91" />
          <path d="M36 12L24 24L36 36" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 12L12 24L24 36" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'sort':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="25" cy="25" r="16" fill="#8CE7F2" />
          <path d="M16 10V38M16 10L10 16M16 10L22 16" stroke={INK} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M32 38V10M32 38L26 32M32 38L38 32" stroke={INK} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'browse':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="9" y="11" width="34" height="30" rx="4" fill="#8CE7F2" />
          <rect x="6" y="8" width="34" height="30" rx="4" stroke={INK} strokeWidth="3.2" />
          <path d="M6 16H40" stroke={INK} strokeWidth="3.2" />
          <path d="M13 23H33M13 30H25" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'save':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="11" y="10" width="30" height="31" rx="4" fill="#8CE7F2" />
          <path d="M9 11C9 8.8 10.8 7 13 7H31L39 15V37C39 39.2 37.2 41 35 41H13C10.8 41 9 39.2 9 37V11Z" fill="#FFFFFF" fillOpacity="0.88" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
          <circle cx="24" cy="26" r="8" fill="#A5D6A7" stroke={INK} strokeWidth="2.8" />
          <path d="M20.5 26L23 28.5L28 23.5" stroke={INK} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'clear':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="26" cy="26" r="15" fill="#FFAB91" />
          <path d="M15 15L33 33M33 15L15 33" stroke={INK} strokeWidth="3.8" strokeLinecap="round" />
        </svg>
      );

    case 'clock':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="26" cy="26" r="17" fill="#FFE082" />
          <circle cx="23" cy="23" r="17" fill="#FFF8E1" stroke={INK} strokeWidth="3.2" />
          <path d="M23 13V23L30 27" stroke={INK} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'refresh':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="26" cy="26" r="15" fill="#8CE7F2" />
          <path d="M37 18C34.5 12 28.7 8 22 8C13.2 8 6 15.2 6 24C6 32.8 13.2 40 22 40C29.4 40 35.6 35 37.4 28.2" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
          <path d="M39 8V19H28" stroke={INK} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'device':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="9" y="11" width="33" height="23" rx="3" fill="#8CE7F2" />
          <rect x="6" y="8" width="33" height="23" rx="3" stroke={INK} strokeWidth="3.2" />
          <path d="M3 35H42L38.5 39.5H6.5L3 35Z" fill="#FFE082" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M19 19.5L22 22.5L27.5 17" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'plus':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="26" cy="26" r="16" fill="#A5D6A7" />
          <circle cx="23" cy="23" r="16" fill="#FFFFFF" fillOpacity="0.9" stroke={INK} strokeWidth="3.2" />
          <path d="M23 14V32M14 23H32" stroke={INK} strokeWidth="3.8" strokeLinecap="round" />
        </svg>
      );

    case 'settings':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="26" cy="26" r="14" fill="#8CE7F2" />
          <circle cx="23" cy="23" r="12" fill="#E0F7FA" stroke={INK} strokeWidth="3.2" />
          <circle cx="23" cy="23" r="5" fill="#FFE082" stroke={INK} strokeWidth="3" />
          <path d="M23 7V11M23 35V39M7 23H11M35 23H39M11.7 11.7L14.5 14.5M31.5 31.5L34.3 34.3M34.3 11.7L31.5 14.5M14.5 31.5L11.7 34.3" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      );

    case 'report':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="10" y="25" width="8" height="17" rx="2" fill="#8CE7F2" />
          <rect x="22" y="16" width="8" height="26" rx="2" fill="#FFE082" />
          <rect x="34" y="9" width="8" height="33" rx="2" fill="#A5D6A7" />
          <rect x="8" y="23" width="8" height="17" rx="2" stroke={INK} strokeWidth="3" />
          <rect x="20" y="14" width="8" height="26" rx="2" stroke={INK} strokeWidth="3" />
          <rect x="32" y="7" width="8" height="33" rx="2" stroke={INK} strokeWidth="3" />
        </svg>
      );

    case 'trophy':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M16 10H36V21C36 26.5 31.5 31 26 31C20.5 31 16 26.5 16 21V10Z" fill="#FFE082" />
          <path d="M14 8H34V19C34 24.5 29.5 29 24 29C18.5 29 14 24.5 14 19V8Z" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
          <path d="M14 12H8V17C8 20.3 10.7 23 14 23M34 12H40V17C40 20.3 37.3 23 34 23" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 29V37M16 38H32" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      );

    case 'calendar':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="10" y="13" width="32" height="29" rx="4" fill="#8CE7F2" />
          <rect x="7" y="10" width="32" height="29" rx="4" fill="#FFFFFF" stroke={INK} strokeWidth="3.2" />
          <path d="M7 18H39" stroke={INK} strokeWidth="3.2" />
          <path d="M15 6V12M31 6V12" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="16" cy="26" r="2.2" fill="#FFAB91" stroke={INK} strokeWidth="1.5" />
          <circle cx="23" cy="26" r="2.2" fill="#FFE082" stroke={INK} strokeWidth="1.5" />
          <circle cx="30" cy="26" r="2.2" fill="#A5D6A7" stroke={INK} strokeWidth="1.5" />
        </svg>
      );

    case 'palette':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M26 9C15.5 9 7 16.8 7 26.5C7 36.2 15.5 43 24.5 43C27.8 43 29.5 40.8 29.5 38.5C29.5 36.2 27.5 35 27.5 32.8C27.5 30.6 29.3 28.8 31.8 28.8H35.5C40.5 28.8 44 25 44 20C44 13.5 36 9 26 9Z" fill="#FFE082" />
          <path d="M23 6C13 6 5 13.8 5 23.5C5 33.2 13 40 22 40C25.3 40 27 37.8 27 35.5C27 33.2 25 32 25 29.8C25 27.6 26.8 25.8 29.3 25.8H33C38 25.8 41.5 22 41.5 17C41.5 10.5 33.5 6 23 6Z" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
          <circle cx="14" cy="19" r="2.6" fill="#FFAB91" stroke={INK} strokeWidth="2" />
          <circle cx="21" cy="13" r="2.6" fill="#8CE7F2" stroke={INK} strokeWidth="2" />
          <circle cx="30" cy="14" r="2.6" fill="#A5D6A7" stroke={INK} strokeWidth="2" />
        </svg>
      );

    case 'database':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <path d="M11 15V37C11 40.3 17.7 43 26 43C34.3 43 41 40.3 41 37V15" fill="#8CE7F2" />
          <ellipse cx="23" cy="12" rx="15" ry="5.5" fill="#FFE082" stroke={INK} strokeWidth="3.2" />
          <path d="M8 12V24C8 27 14.7 29.5 23 29.5C31.3 29.5 38 27 38 24V12" stroke={INK} strokeWidth="3.2" />
          <path d="M8 24V36C8 39 14.7 41.5 23 41.5C31.3 41.5 38 39 38 36V24" stroke={INK} strokeWidth="3.2" />
        </svg>
      );

    case 'globe':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <circle cx="26" cy="26" r="16" fill="#8CE7F2" />
          <circle cx="23" cy="23" r="16" fill="#E0F7FA" stroke={INK} strokeWidth="3.2" />
          <ellipse cx="23" cy="23" rx="8" ry="16" stroke={INK} strokeWidth="2.8" />
          <path d="M7 23H39" stroke={INK} strokeWidth="2.8" />
        </svg>
      );

    case 'mobile':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="15" y="7" width="22" height="37" rx="4" fill="#8CE7F2" />
          <rect x="12" y="5" width="22" height="37" rx="4" stroke={INK} strokeWidth="3.2" />
          <path d="M19 10H27" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
          <circle cx="23" cy="36.5" r="2" fill={INK} />
        </svg>
      );

    case 'crop':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" className={baseClass} aria-hidden="true">
          <rect x="15" y="15" width="21" height="21" rx="2" fill="#FFAB91" />
          <path d="M13 6V33C13 34.7 14.3 36 16 36H42" stroke={INK} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 13H32C33.7 13 35 14.3 35 16V42" stroke={INK} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
