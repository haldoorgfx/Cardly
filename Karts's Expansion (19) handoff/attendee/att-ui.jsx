// Attendee app — shared UI kit. KartaCard is the centerpiece (reused everywhere).

// ── The Karta Card ───────────────────────────────────────────────────
function KartaCard({ w = 300, name = "Amina Osman", role = "Founder, Sahel Pay",
  event = "AfriTech Summit", year = "2026", tier = "VIP", no = "198", date = "12 Mar",
  accent = CARD_ACCENTS[0], initials = "AO", photo, glow = false }) {
  const h = w * 1.4;
  return (
    <div className="relative rounded-[14px] overflow-hidden" style={{
      width: w, height: h, background: accent.grad,
      boxShadow: glow
        ? "0 0 40px rgba(232,197,126,0.32), 0 0 90px rgba(232,197,126,0.12), 0 18px 50px rgba(13,31,23,0.4)"
        : "0 18px 44px -18px rgba(13,31,23,0.55)",
    }}>
      {/* guilloché texture */}
      <div aria-hidden className="absolute inset-0" style={{ opacity: 0.5, backgroundImage: "repeating-linear-gradient(115deg, rgba(232,197,126,0.06) 0 2px, transparent 2px 9px)" }} />
      <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 45% at 50% 40%, rgba(232,197,126,0.18), transparent 65%)" }} />
      <div className="relative h-full flex flex-col" style={{ padding: w * 0.085 }}>
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold" style={{ color: accent.ring, fontSize: w * 0.044, letterSpacing: "0.04em" }}>{event}</span>
          <span className="font-mono" style={{ color: "rgba(255,255,255,0.6)", fontSize: w * 0.037 }}>{year}</span>
        </div>
        <div className="rounded-full grid place-items-center mx-auto mt-auto" style={{
          width: w * 0.39, height: w * 0.39, border: `2px solid ${accent.ring}`,
          background: photo || "linear-gradient(135deg,#C9A45E,#1F4D3A)",
          boxShadow: "0 0 24px rgba(232,197,126,0.22)", color: "#fff",
          fontSize: w * 0.12, fontFamily: '"DM Sans"', fontWeight: 600,
        }}>{!photo && initials}</div>
        <div className="text-center text-white font-display font-medium mt-4" style={{ fontSize: w * 0.09, letterSpacing: "-0.01em" }}>{name}</div>
        <div className="text-center" style={{ color: "rgba(255,255,255,0.75)", fontSize: w * 0.044, marginTop: 3 }}>{role}</div>
        <div className="flex items-center justify-between mt-auto" style={{ paddingTop: w * 0.05, borderTop: `1px solid ${accent.ring}40` }}>
          <span className="font-mono" style={{ color: accent.ring, fontSize: w * 0.04 }}>{tier}</span>
          <span className="font-mono" style={{ color: "rgba(255,255,255,0.6)", fontSize: w * 0.04 }}>#{no} · {date}</span>
        </div>
      </div>
    </div>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────
function Btn({ children, icon, iconRight, variant = "ghost", size = "md", onClick, className = "", full }) {
  const L = icon ? Icon[icon] : null;
  const R = iconRight ? Icon[iconRight] : null;
  const styles = {
    primary: "bg-primary text-cream hover:bg-primary-dark cardly-cta",
    accent: "bg-accent text-primary-dark hover:bg-accent-dark font-semibold cardly-cta",
    ghost: "border border-border text-ink-soft hover:border-primary/40 hover:text-primary",
    soft: "bg-primary-soft text-primary hover:bg-primary-soft/70",
    dark: "bg-cream/10 text-cream border border-cream/20 hover:bg-cream/15",
  };
  const sizes = { sm: "px-3 py-1.5 text-[12.5px]", md: "px-4 py-2.5 text-[13.5px]", lg: "px-6 py-3.5 text-[15px]" };
  return (
    <button onClick={onClick} className={`whitespace-nowrap inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors ${styles[variant]} ${sizes[size]} ${full ? "w-full" : ""} ${className}`}>
      {L && <L w={size === "lg" ? 17 : 15} />}{children}{R && <R w={size === "lg" ? 17 : 15} />}
    </button>
  );
}

// ── Pills / chips ────────────────────────────────────────────────────
function Pill({ children, tone = "neutral", dot, className = "" }) {
  const tones = {
    neutral: "bg-ink/5 text-ink-soft border-border",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    gold: "bg-accent/20 text-accent-dark border-accent/40",
    forest: "bg-primary-soft text-primary border-primary/20",
    dark: "bg-cream/10 text-cream/90 border-cream/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${tones[tone]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />}{children}
    </span>
  );
}

function Avatar({ initials, grad, size = 40, ring }) {
  return (
    <span className="rounded-full grid place-items-center text-cream font-display font-semibold shrink-0" style={{
      width: size, height: size, fontSize: size * 0.36,
      background: grad || "linear-gradient(135deg,#2A6A50,#C9A45E)",
      boxShadow: ring ? "0 0 0 2px #FAF6EE, 0 0 0 3.5px " + ring : "none",
    }}>{initials}</span>
  );
}

// ── QR code (decorative SVG) ─────────────────────────────────────────
function QR({ size = 160 }) {
  const cells = 21;
  const c = size / cells;
  // deterministic pseudo-random pattern
  const seed = (x, y) => ((x * 13 + y * 7 + x * y * 3) % 5) > 1;
  const finder = (gx, gy) => (
    <g key={`${gx}-${gy}`}>
      <rect x={gx * c} y={gy * c} width={c * 7} height={c * 7} fill="#0F1F18" />
      <rect x={(gx + 1) * c} y={(gy + 1) * c} width={c * 5} height={c * 5} fill="#fff" />
      <rect x={(gx + 2) * c} y={(gy + 2) * c} width={c * 3} height={c * 3} fill="#0F1F18" />
    </g>
  );
  const dots = [];
  for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
    const inFinder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    if (!inFinder && seed(x, y)) dots.push(<rect key={`${x}-${y}`} x={x * c} y={y * c} width={c} height={c} fill="#0F1F18" />);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
      <rect width={size} height={size} fill="#fff" />
      {dots}{finder(0, 0)}{finder(14, 0)}{finder(0, 14)}
    </svg>
  );
}

// ── Section label / card / list row ──────────────────────────────────
function SectionLabel({ children, action, className = "" }) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted">{children}</span>
      {action}
    </div>
  );
}

function Card({ children, className = "", onClick, pad = "p-4" }) {
  return (
    <div onClick={onClick} className={`bg-surface border border-border rounded-2xl ${pad} ${onClick ? "cursor-pointer hover:border-primary/40 transition-colors" : ""} ${className}`}>{children}</div>
  );
}

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${on ? "bg-primary" : "bg-ink/15"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

// ── Cover (event hero/thumb art) ─────────────────────────────────────
function Cover({ grad, h = 160, rounded = "", children, glowCorner = true }) {
  return (
    <div className={`relative overflow-hidden ${rounded}`} style={{ height: h, background: grad }}>
      {glowCorner && <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(70% 90% at 90% 8%, rgba(232,197,126,0.28), transparent 60%)" }} />}
      <svg aria-hidden viewBox="0 0 400 160" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <path key={i} d={`M -40 ${34 + i * 30} Q 110 ${-4 + i * 30} 220 ${58 + i * 30} T 460 ${38 + i * 30}`} fill="none" stroke="#E8C57E" strokeWidth="1.2" />
        ))}
      </svg>
      {children}
    </div>
  );
}

// ── App shell: top bar + content + bottom tab bar ────────────────────
const TABS = [
  { id: "discover", label: "Discover", icon: "Search" },
  { id: "schedule", label: "Schedule", icon: "Calendar" },
  { id: "wallet", label: "Tickets", icon: "Ticket" },
  { id: "network", label: "Network", icon: "Network" },
  { id: "me", label: "Me", icon: "User" },
];

function TopBar({ title, onBack, right, transparent }) {
  return (
    <header className={`sticky top-0 z-30 h-14 flex items-center gap-3 px-4 ${transparent ? "" : "bg-cream/90 backdrop-blur border-b border-border"}`}>
      {onBack ? (
        <button onClick={onBack} className="w-9 h-9 grid place-items-center rounded-full bg-surface/80 border border-border text-ink hover:text-primary transition-colors shrink-0"><Icon.ChevLeft w={18} /></button>
      ) : (
        <div className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block w-6 h-6 rounded-md" style={{ background: "linear-gradient(135deg,#1F4D3A,#2A6A50 60%,#E8C57E)" }} />
          <span className="font-display text-[18px] font-bold tracking-tight text-primary">Karta</span>
        </div>
      )}
      {title && <div className="font-display text-[16px] font-semibold text-ink tracking-tight truncate flex-1">{title}</div>}
      {!title && <div className="flex-1" />}
      {right}
    </header>
  );
}

function BottomTabs({ active, onTab }) {
  return (
    <nav className="sticky bottom-0 z-30 bg-cream/95 backdrop-blur border-t border-border">
      <div className="flex items-stretch">
        {TABS.map((t) => {
          const IconC = Icon[t.icon];
          const on = active === t.id;
          return (
            <button key={t.id} onClick={() => onTab(t.id)} className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${on ? "text-primary" : "text-muted hover:text-ink-soft"}`}>
              <span className={`grid place-items-center w-9 h-7 rounded-full transition-colors ${on ? "bg-primary-soft" : ""}`}><IconC w={19} /></span>
              <span className="text-[10px] font-medium tracking-tight">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Responsive WEB-APP shell (no native mobile app). Full-bleed on phones;
// a centered app panel on larger screens. No device bezel.
function Phone({ children }) {
  return (
    <div className="min-h-screen w-full flex justify-center bg-cream sm:py-6 sm:px-4" style={{
      backgroundImage: "radial-gradient(70% 45% at 50% 0%, rgba(31,77,58,0.07), transparent 60%)",
    }}>
      <div className="w-full sm:max-w-[480px] bg-cream flex flex-col sm:rounded-2xl sm:border sm:border-border sm:shadow-xl overflow-hidden" style={{ minHeight: "100vh", height: "auto" }} data-app-shell>
        {children}
      </div>
    </div>
  );
}

// Scroll region between top bar and tab bar
function Screen({ children, className = "" }) {
  return <div className={`flex-1 overflow-y-auto att-scroll ${className}`}>{children}</div>;
}

Object.assign(window, {
  KartaCard, Btn, Pill, Avatar, QR, SectionLabel, Card, Toggle, Cover,
  TopBar, BottomTabs, Phone, Screen, TABS,
});
