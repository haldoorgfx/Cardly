// Minimal lucide-style icons drawn inline. Stroke 1.6, currentColor.
const I = ({ d, w = 20, vb = "0 0 24 24", sw = 1.6, fill = "none", children, style }) => (
  <svg
    width={w}
    height={w}
    viewBox={vb}
    fill={fill}
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const Icon = {
  Arrow: (p) => <I {...p} d="M5 12h14M13 6l6 6-6 6" />,
  Check: (p) => <I {...p} d="M5 12.5l4.5 4.5L19 7" />,
  ChevDown: (p) => <I {...p} d="M6 9l6 6 6-6" />,
  ChevRight: (p) => <I {...p} d="M9 6l6 6-6 6" />,
  Menu: (p) => <I {...p} d="M4 7h16M4 12h16M4 17h16" />,
  X: (p) => <I {...p} d="M6 6l12 12M18 6L6 18" />,
  Pencil: (p) => (
    <I {...p}>
      <path d="M14.5 4.5l5 5L8 21H3v-5L14.5 4.5z" />
      <path d="M13 6l5 5" />
    </I>
  ),
  Send: (p) => <I {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  Share: (p) => (
    <I {...p}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </I>
  ),
  Mic: (p) => (
    <I {...p}>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </I>
  ),
  Heart: (p) => (
    <I {...p} d="M20.8 6.6a5 5 0 0 0-8.8-2.7A5 5 0 0 0 3.2 6.6c0 5.4 8.8 11.4 8.8 11.4s8.8-6 8.8-11.4z" />
  ),
  Flag: (p) => (
    <I {...p}>
      <path d="M4 21V4c5-3 9 3 14 0v11c-5 3-9-3-14 0z" />
      <line x1="4" y1="21" x2="4" y2="13" />
    </I>
  ),
  Sun: (p) => (
    <I {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </I>
  ),
  Shop: (p) => (
    <I {...p}>
      <path d="M3 9h18l-2 11H5L3 9z" />
      <path d="M8 9V6a4 4 0 0 1 8 0v3" />
    </I>
  ),
  Cap: (p) => (
    <I {...p}>
      <path d="M2 9l10-5 10 5-10 5L2 9z" />
      <path d="M6 11v5c0 2 3 3 6 3s6-1 6-3v-5" />
    </I>
  ),
  Layers: (p) => (
    <I {...p}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </I>
  ),
  Crop: (p) => (
    <I {...p}>
      <path d="M6 2v16h16M2 6h16v16" />
    </I>
  ),
  Eye: (p) => (
    <I {...p}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </I>
  ),
  Globe: (p) => (
    <I {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </I>
  ),
  UserOff: (p) => (
    <I {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M17 8l5 5M22 8l-5 5" />
    </I>
  ),
  Plus: (p) => <I {...p} d="M5 12h14M12 5v14" />,
  Star: (p) => (
    <I {...p} fill="currentColor" sw={0} d="M12 2l3 7 7 .6-5.4 4.7L18 22l-6-3.6L6 22l1.4-7.7L2 9.6 9 9z" />
  ),
  Quote: (p) => (
    <I {...p} fill="currentColor" sw={0}>
      <path d="M7 7c-3 0-5 2-5 5 0 3 2 5 5 5 0-2-1-3-3-3 0-2 1-4 3-4V7zm10 0c-3 0-5 2-5 5 0 3 2 5 5 5 0-2-1-3-3-3 0-2 1-4 3-4V7z" />
    </I>
  ),
  Linkedin: (p) => (
    <I {...p}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10v8M8 7v.01M12 18v-5a2 2 0 0 1 4 0v5M12 12v6" />
    </I>
  ),
  Twitter: (p) => (
    <I {...p} d="M4 4l7 9-7 7h3l5.5-5.5L17 20h4l-7.5-9.5L20 4h-3l-5 5L8 4H4z" fill="currentColor" sw={0} />
  ),
  Instagram: (p) => (
    <I {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </I>
  ),
};

window.Icon = Icon;
