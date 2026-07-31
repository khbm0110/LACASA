// Petit jeu d icones "outline" (trait fin, coins arrondis) pour l espace
// admin - dans le meme esprit visuel que les icones Feather/Lucide, mais
// dessinees a la main en SVG pour ne pas ajouter de dependance npm
// (l environnement ne peut pas telecharger de nouveaux paquets).
function Svg({ children, size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  )
}

export const IconGrid = (p) => (
  <Svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Svg>
)
export const IconBag = (p) => (
  <Svg {...p}><path d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></Svg>
)
export const IconMonitor = (p) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></Svg>
)
export const IconUtensils = (p) => (
  <Svg {...p}><path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11M18 3c-1.5 0-3 1.5-3 4v3a2 2 0 0 0 2 2h1M18 3v18" /></Svg>
)
export const IconCalendar = (p) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></Svg>
)
export const IconBox = (p) => (
  <Svg {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="M3 8l9 5 9-5M12 13v8" /></Svg>
)
export const IconQr = (p) => (
  <Svg {...p}><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="3" width="6" height="6" rx="1" /><rect x="3" y="15" width="6" height="6" rx="1" /><path d="M15 15h2.5M15 19h2.5M19 15v2.5M19 19.5v1.5" /></Svg>
)
export const IconUser = (p) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" /></Svg>
)
export const IconUsers = (p) => (
  <Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3 3-5.2 6.5-5.2s6.5 2.2 6.5 5.2" /><path d="M16 4.6c1.5.3 2.6 1.6 2.6 3.2 0 1.6-1.1 2.9-2.6 3.2M18.5 14.3c2 .5 3.5 2.3 3.5 4.6" /></Svg>
)
export const IconChart = (p) => (
  <Svg {...p}><path d="M4 20V10M11 20V4M18 20v-7" /><path d="M2 20h20" /></Svg>
)
export const IconMessage = (p) => (
  <Svg {...p}><path d="M4 5h16v11H8l-4 4V5Z" /></Svg>
)
export const IconReceipt = (p) => (
  <Svg {...p}><path d="M6 3h12v18l-2.5-1.5L13 21l-1-1.5L11 21l-2.5-1.5L6 21V3Z" /><path d="M9 8h6M9 12h6" /></Svg>
)
export const IconTag = (p) => (
  <Svg {...p}><path d="M12 3h6a2 2 0 0 1 2 2v6l-9.5 9.5a2 2 0 0 1-2.8 0L4 17.3a2 2 0 0 1 0-2.8L12 3Z" /><circle cx="16.2" cy="7.8" r="1.4" /></Svg>
)
export const IconImage = (p) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="m21 16-5.5-5.5L6 19" /></Svg>
)
export const IconMegaphone = (p) => (
  <Svg {...p}><path d="M3 10v4a1 1 0 0 0 1 1h2l7 4V5L6 9H4a1 1 0 0 0-1 1Z" /><path d="M17 8.5a4 4 0 0 1 0 7" /></Svg>
)
export const IconNews = (p) => (
  <Svg {...p}><rect x="3" y="4" width="14" height="16" rx="1.5" /><path d="M17 8h3.5a.5.5 0 0 1 .5.5V18a2 2 0 0 1-2 2H8" /><path d="M6.5 8h7M6.5 11.5h7M6.5 15h4" /></Svg>
)
export const IconLayout = (p) => (
  <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></Svg>
)
export const IconGlobe = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 4 6 4 9s-1.5 6.5-4 9c-2.5-2.5-4-6-4-9s1.5-6.5 4-9Z" /></Svg>
)
export const IconPower = (p) => (
  <Svg {...p}><path d="M12 3v9" /><path d="M6.5 6.5a8 8 0 1 0 11 0" /></Svg>
)
export const IconBell = (p) => (
  <Svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></Svg>
)
export const IconMenuLines = (p) => (
  <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>
)
export const IconChevronDown = (p) => (
  <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
)
export const IconArrowRight = (p) => (
  <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
)
export const IconPlusCircle = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></Svg>
)
export const IconSend = (p) => (
  <Svg {...p}><path d="m3 11 18-8-8 18-2.5-7.5L3 11Z" /></Svg>
)
export const IconStar = (p) => (
  <Svg {...p}><path d="m12 3 2.6 5.6 6 .6-4.5 4 1.3 6-5.4-3.1L6.6 19l1.3-6L3.4 9.2l6-.6L12 3Z" /></Svg>
)
export const IconClipboard = (p) => (
  <Svg {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><rect x="8.5" y="2.5" width="7" height="3.5" rx="1" /><path d="M8.5 11h7M8.5 15h4.5" /></Svg>
)
