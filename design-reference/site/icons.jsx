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

  // ── Platform feature icons ──────────────────────────────────────
  Ticket: (p) => (
    <I {...p}>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
      <path d="M13 6v2M13 12v2M13 18v-2" />
    </I>
  ),
  Layout: (p) => (
    <I {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 9v11" />
    </I>
  ),
  Scan: (p) => (
    <I {...p}>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M8.5 12.5l2.5 2.5 4.5-4.5" />
    </I>
  ),
  Grid: (p) => (
    <I {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 9v11M15 4v16" />
    </I>
  ),
  User: (p) => (
    <I {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </I>
  ),
  Network: (p) => (
    <I {...p}>
      <circle cx="6" cy="6.5" r="2.4" />
      <circle cx="18" cy="7.5" r="2.4" />
      <circle cx="12" cy="18" r="2.4" />
      <path d="M7.8 8.2l2.8 7.6M16.4 9.3l-3 6.2M8.2 6.8h7.4" />
    </I>
  ),
  Chat: (p) => (
    <I {...p}>
      <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4V6a1 1 0 0 1 1-1z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </I>
  ),
  Briefcase: (p) => (
    <I {...p}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5.5A2 2 0 0 1 10 4h4a2 2 0 0 1 2 1.5V7M3 13h18" />
    </I>
  ),
  Chart: (p) => (
    <I {...p}>
      <path d="M3 21h18" />
      <path d="M6 21V11M12 21V5M18 21v-6" />
    </I>
  ),
  Trophy: (p) => (
    <I {...p}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5.5H4.5v1.5a3 3 0 0 0 3 3M17 5.5h2.5V7a3 3 0 0 1-3 3" />
      <path d="M9.5 15h5M10 19.5h4M12 14.5v5" />
    </I>
  ),
  Sparkle: (p) => (
    <I {...p} fill="currentColor" sw={0}>
      <path d="M12 2.5l1.7 5.3 5.3 1.7-5.3 1.7L12 16.5l-1.7-5.3L5 9.5l5.3-1.7L12 2.5z" />
    </I>
  ),
  IdCard: (p) => (
    <I {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8" cy="11" r="2" />
      <path d="M13 9.5h5M13 13h5M5 15.5h6" />
    </I>
  ),
  Pin: (p) => (
    <I {...p}>
      <path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </I>
  ),
  Calendar: (p) => (
    <I {...p}>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </I>
  ),
  Users: (p) => (
    <I {...p}>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3.4 3.4 0 0 1 0 6.4M17.5 20a5.5 5.5 0 0 0-3-4.9" />
    </I>
  ),
  Bolt: (p) => (
    <I {...p} d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  ),
};

window.Icon = Icon;
