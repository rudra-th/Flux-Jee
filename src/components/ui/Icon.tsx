import type { SVGProps } from 'react'

export type IconName =
  | 'home'
  | 'test'
  | 'custom'
  | 'chapter'
  | 'subject'
  | 'topic'
  | 'mixed'
  | 'daily'
  | 'marathon'
  | 'speed'
  | 'revision'
  | 'pyq'
  | 'adaptive'
  | 'weak'
  | 'wrong'
  | 'bookmark'
  | 'full'
  | 'analytics'
  | 'mistake'
  | 'flashcard'
  | 'formula'
  | 'search'
  | 'leaderboard'
  | 'book'
  | 'settings'
  | 'admin'
  | 'logout'
  | 'menu'
  | 'close'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-up'
  | 'check'
  | 'x'
  | 'clock'
  | 'timer'
  | 'flag'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'play'
  | 'pause'
  | 'refresh'
  | 'edit'
  | 'trash'
  | 'plus'
  | 'minus'
  | 'filter'
  | 'eye'
  | 'eye-off'
  | 'trophy'
  | 'flame'
  | 'target'
  | 'lightning'
  | 'shield'
  | 'info'
  | 'warning'
  | 'alert'
  | 'check-circle'
  | 'x-circle'
  | 'question'
  | 'dumbbell'
  | 'calendar'
  | 'grid'
  | 'list'
  | 'bookmark-off'
  | 'save'
  | 'keyboard'
  | 'external'
  | 'download'
  | 'upload'
  | 'copy'
  | 'sparkles'
  | 'brain'
  | 'rocket'
  | 'award'
  | 'star'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'contrast'
  | 'wifi'
  | 'wifi-off'
  | 'battery'
  | 'users'
  | 'user'
  | 'more-horizontal'
  | 'file'
  | 'folder'
  | 'tag'
  | 'percent'
  | 'trending-up'
  | 'trending-down'
  | 'circle'
  | 'square'
  | 'lock'
  | 'link'
  | 'printer'
  | 'share'
  | 'help'
  | 'command'
  | 'layers'
  | 'pie'
  | 'bar'
  | 'line-chart'
  | 'heatmap'
  | 'calculator'

const paths: Record<IconName, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9.5 21v-6h5v6" />,
  test: (
    <>
      <path d="M9 3h6v3H9zM9 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  custom: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  chapter: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  subject: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  topic: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2a10 10 0 0 0 0 20 10 10 0 0 0 0-20z" />
      <path d="M12 2a10 10 0 0 1 0 20" />
    </>
  ),
  mixed: (
    <>
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
    </>
  ),
  daily: <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />,
  marathon: (
    <>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </>
  ),
  speed: (
    <>
      <path d="M12 14 16 10" />
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v3M2 12h3M22 12h-3" />
    </>
  ),
  revision: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  pyq: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </>
  ),
  adaptive: (
    <>
      <path d="M12 2a3 3 0 0 1 3 3v1h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4V5a3 3 0 0 1 3-3z" />
      <circle cx="12" cy="14" r="2.5" />
      <path d="M12 11.5V9M12 16.5V19" />
    </>
  ),
  weak: (
    <>
      <path d="M12 21s-7-4.6-9.3-9.2C1 8 3 5 6 5c2 0 3.2 1.2 4 2.3C10.8 6.2 12 5 14 5c3 0 5 3 3.3 6.8C15 16.4 12 21 12 21z" />
    </>
  ),
  wrong: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </>
  ),
  bookmark: <path d="M6 2h12v20l-6-4-6 4z" />,
  full: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </>
  ),
  analytics: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15v2M11 10v7M15 6v11M19 12v5" />
    </>
  ),
  mistake: (
    <>
      <path d="M9 11 3 5M11.5 13.5 5 20M14.8 14.8 20 20" />
      <path d="m3 13 2 2 3-3" />
      <circle cx="18" cy="6" r="3" />
    </>
  ),
  flashcard: (
    <>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M2 20h20M6 8h8M6 11h12" />
    </>
  ),
  formula: (
    <>
      <path d="M7 21c-2 0-2-2 0-2 2 0 2-2 0-2H5l2-10h4" />
      <path d="m14 7 2 2 3-3M14 13l2 2 3-3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  leaderboard: (
    <>
      <path d="M6 9H3v11h3zM13 4h-2v16h2zM21 7h-3v13h3z" />
      <path d="M3 20h18" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  admin: (
    <>
      <path d="M12 3 4 7v6c0 5 3.4 8 8 8s8-3 8-8V7l-8-4z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-up': <path d="m18 15-6-6-6 6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  timer: (
    <>
      <path d="M12 2v3M10 2h4" />
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13l3-3M9 20l-2 2M15 20l2 2" />
    </>
  ),
  flag: <path d="M4 21V4c0-.6.4-1 1-1h11c.7 0 1.1.7.8 1.3L14.7 9l2.1 4.7c.3.6-.1 1.3-.8 1.3H6" />,
  'arrow-left': <path d="M19 12H5M12 19l-7-7 7-7" />,
  'arrow-right': <path d="M5 12h14M12 5l7 7-7 7" />,
  'arrow-up-right': <path d="M7 17 17 7M8 7h9v9" />,
  play: <path d="M5 3l14 9-14 9z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  refresh: (
    <>
      <path d="M3 12a9 9 0 0 1 15.4-6.4L21 8" />
      <path d="M21 3v5h-5M21 12a9 9 0 0 1-15.4 6.4L3 16" />
      <path d="M3 21v-5h5" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  filter: <path d="M4 4h16l-6 8v6l-4 2v-8L4 4z" />,
  eye: (
    <>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M17.94 17.94A10.1 10.1 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88M1 1l22 22" />
    </>
  ),
  trophy: (
    <>
      <path d="M6 2h12v4a6 6 0 0 1-12 0V2z" />
      <path d="M6 4H3v2a4 4 0 0 0 4 4M18 4h3v2a4 4 0 0 1-4 4" />
      <path d="M12 14v4M8 22h8M9 18h6" />
    </>
  ),
  flame: <path d="M12 2c1 4-4 6-4 10a4 4 0 0 0 8 0c0-1-.4-2-1-3-.5 1-1 1.5-1 1.5S15 8 12 2z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  lightning: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />,
  shield: <path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.2 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5M12 16h.01" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m8.5 12.5 2.5 2.5 5-5" />
    </>
  ),
  'x-circle': (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M6.5 6.5 17.5 17.5M3 8l2-2M21 16l-2 2M21 8l-2 2M3 16l2-2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  'bookmark-off': (
    <>
      <path d="M6 2h12a2 2 0 0 1 2 2v15l-1-1-4-3-5 3-6 4V4a2 2 0 0 1 2-2z" />
    </>
  ),
  save: <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />,
  keyboard: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" />
    </>
  ),
  external: <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />,
  download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  upload: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  sparkles: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />,
  brain: (
    <>
      <path d="M9.5 2a2.5 2.5 0 0 0-2.5 2.5v.5A2.5 2.5 0 0 0 4.5 7v.5A2.5 2.5 0 0 0 2.5 10v4a2.5 2.5 0 0 0 2.5 2.5" />
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5V7a2.5 2.5 0 0 1 2.5 2.5v2" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v2.5A2.5 2.5 0 0 1 14.5 9.5a2.5 2.5 0 0 1 2.5 2.5v.5A2.5 2.5 0 0 1 19.5 15v.5a2.5 2.5 0 0 0 2.5 2.5" />
      <path d="M12 22v-7M12 15H4.5a2.5 2.5 0 0 1-2-4M12 15h7.5a2.5 2.5 0 0 0 2-4M12 15v-3a2.5 2.5 0 0 0-2.5-2.5" />
    </>
  ),
  rocket: (
    <>
      <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.8-.8-.7-2-.7-3 0z" />
      <path d="M12 15 9 12c1.5-3 4-6.5 8-7 3-.5 3.5 2 3 5-.5 4-4 6.5-7 8l-1-3z" />
      <path d="M8.5 11.5 5 12l-2-2 2-2 2 1.5M9 15l.5 3.5L11 21l2-2-1.5-2" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="m9 14-1.5 8L12 19l4.5 3L15 14" />
    </>
  ),
  star: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.2-6.2 3.2L7 14.2l-5-4.9 6.9-1L12 2z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  monitor: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  contrast: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20M12 2a10 10 0 0 0 0 20" />
    </>
  ),
  wifi: (
    <>
      <path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 8.5a15 15 0 0 1 20 0" />
      <path d="M12 20h.01" />
    </>
  ),
  'wifi-off': (
    <>
      <path d="M2 2l20 20M8.5 16a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 6-2.8M2 8.5a15 15 0 0 1 4.3-2.6M22 8.5a15 15 0 0 0-8-5M12 20h.01M16.9 15.4a10 10 0 0 0-1.3-1.2" />
    </>
  ),
  battery: (
    <>
      <rect x="2" y="7" width="17" height="10" rx="2" />
      <path d="M22 11v2" />
      <path d="M6 10v4M10 10v4" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  'more-horizontal': <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8" />
    </>
  ),
  folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
  tag: (
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
      <path d="M7 7h.01" />
    </>
  ),
  percent: (
    <>
      <path d="M19 5 5 19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </>
  ),
  'trending-up': <path d="M23 6 13.5 15.5 8.5 10.5 1 18M17 6h6v6" />,
  'trending-down': <path d="M23 18 13.5 8.5 8.5 13.5 1 6M17 18h6v-6" />,
  circle: <circle cx="12" cy="12" r="9" />,
  square: <rect x="3" y="3" width="18" height="18" rx="2" />,
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7-7l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7 7l1.1-1.1" />
    </>
  ),
  printer: (
    <>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
    </>
  ),
  command: <path d="M9 6h6v12H9zM9 6a2 2 0 1 0-2-2M9 6a2 2 0 1 1-2 2M15 6a2 2 0 1 1 2-2M15 6a2 2 0 1 0 2 2M9 18a2 2 0 1 1-2 2M9 18a2 2 0 1 0-2-2M15 18a2 2 0 1 0 2 2M15 18a2 2 0 1 1 2-2" />,
  layers: (
    <>
      <path d="m12 2 10 5-10 5L2 7l10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </>
  ),
  pie: (
    <>
      <path d="M21.2 15.9A10 10 0 1 1 8 2.8" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </>
  ),
  bar: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15v3M11 10v8M15 6v12M19 12v6" />
    </>
  ),
  'line-chart': (
    <>
      <path d="M3 3v18h18" />
      <path d="m3 17 5-5 4 4 7-8" />
      <path d="M15 8h4v4" />
    </>
  ),
  heatmap: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="8.5" y="8.5" width="7" height="7" rx="1" />
    </>
  ),
  calculator: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
    </>
  ),
}

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
  strokeWidth?: number
}

export function Icon({ name, size = 20, strokeWidth = 1.8, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}
