// Shared dashboard UI primitives + lightweight SVG charts.
// All forest/cream/gold brand tokens. Used by every sub-page.

const CHART = {
  forest: "#1F4D3A",
  sage: "#2A6A50",
  leaf: "#3E7E5E",
  gold: "#E8C57E",
  goldDark: "#C9A45E",
  mist: "#A8C2B5",
  track: "#E8EFEB",
};

// ── Page scaffold ────────────────────────────────────────────────────
function PageShell({ title, subtitle, actions, children, max = "1100px" }) {
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" style={{ maxWidth: max }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h1 className="font-title text-[22px] sm:text-[24px] font-semibold text-primary tracking-[-0.025em]">{title}</h1>
          {subtitle && <p className="text-ink-soft text-[14px] mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ children, className = "" }) {
  return <div className={`font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3 ${className}`}>{children}</div>;
}

// ── Buttons ──────────────────────────────────────────────────────────
function Btn({ children, icon, variant = "ghost", onClick, className = "" }) {
  const IconC = icon ? Icon[icon] : null;
  const styles = {
    primary: "bg-primary text-cream hover:bg-primary-dark cardly-cta",
    ghost: "border border-border text-ink-soft hover:border-primary/40 hover:text-primary",
    accent: "bg-accent text-primary-dark hover:bg-accent-dark font-semibold",
    soft: "bg-primary-soft text-primary hover:bg-primary-soft/70",
    danger: "bg-red-600 text-white hover:bg-red-700",
    "danger-ghost": "border border-red-300 text-red-700 hover:bg-red-50",
  };
  return (
    <button onClick={onClick} className={`whitespace-nowrap inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${styles[variant]} ${className}`}>
      {IconC && <IconC w={15} />}{children}
    </button>
  );
}

// ── Stat cards ───────────────────────────────────────────────────────
function StatCard({ value, label, delta, deltaUp = true, icon, accent }) {
  const IconC = icon ? Icon[icon] : null;
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-accent/50" : "border-border bg-surface"}`} style={accent ? { background: "linear-gradient(135deg, rgba(232,197,126,0.14), rgba(31,77,58,0.05))" } : undefined}>
      <div className="flex items-center justify-between mb-3">
        <span className={`font-mono text-[9.5px] tracking-[0.14em] uppercase ${accent ? "text-accent-dark" : "text-muted"}`}>{label}</span>
        {IconC && <span className={accent ? "text-accent-dark" : "text-primary/50"}><IconC w={16} /></span>}
      </div>
      <div className="font-mono text-[26px] text-primary tracking-tight leading-none">{value}</div>
      {delta && (
        <div className={`mt-2 inline-flex items-center gap-1 font-mono text-[11px] ${deltaUp ? "text-success" : "text-danger"}`}>
          <Icon.Arrow w={11} style={{ transform: deltaUp ? "rotate(-45deg)" : "rotate(45deg)" }} /> {delta}
        </div>
      )}
    </div>
  );
}

function StatCards({ items, cols = 4 }) {
  const colCls = cols === 3 ? "grid-cols-2 lg:grid-cols-3" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-4";
  return (
    <div className={`grid gap-3 sm:gap-4 mb-7 ${colCls}`}>
      {items.map((s, i) => <StatCard key={i} {...s} />)}
    </div>
  );
}

function StatStrip({ items }) {
  return (
    <div className="bg-surface border border-border rounded-2xl px-6 py-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-2">
      {items.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-border hidden sm:inline">·</span>}
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[19px] text-primary tracking-tight">{s.value}</span>
            <span className="text-[13px] text-ink-soft">{s.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Pills / badges ───────────────────────────────────────────────────
function Pill({ children, tone = "neutral", dot, className = "" }) {
  const tones = {
    neutral: "bg-ink/5 text-ink-soft border-border",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    gold: "bg-accent/20 text-accent-dark border-accent/40",
    forest: "bg-primary-soft text-primary border-primary/20",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${tones[tone]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />}
      {children}
    </span>
  );
}

function Avatar({ initials, grad, size = 32 }) {
  return (
    <span className="rounded-full grid place-items-center text-cream font-display font-semibold shrink-0" style={{ width: size, height: size, fontSize: size * 0.34, background: grad || "linear-gradient(135deg,#2A6A50,#C9A45E)" }}>
      {initials}
    </span>
  );
}

// ── Toolbar (search + filters) ───────────────────────────────────────
function SearchBox({ placeholder = "Search…", w = "320px" }) {
  return (
    <div className="relative" style={{ maxWidth: w, width: "100%" }}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><Icon.Search w={15} /></span>
      <div className="h-9 pl-9 pr-3 rounded-lg bg-surface border border-border text-[13px] text-muted flex items-center">{placeholder}</div>
    </div>
  );
}

function FilterBtn({ children }) {
  return (
    <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-surface text-[12.5px] text-ink-soft hover:border-primary/40 transition-colors whitespace-nowrap">
      {children} <Icon.ChevDown w={13} />
    </button>
  );
}

function Toolbar({ children, search = "Search…" }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 flex-wrap">
      <div className="flex-1 min-w-[200px] max-w-[320px]"><SearchBox placeholder={search} /></div>
      {children}
    </div>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────
function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 mb-6 border-b border-border">
      {tabs.map((t) => {
        const id = typeof t === "string" ? t : t.id;
        const label = typeof t === "string" ? t : t.label;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`relative px-4 py-2.5 text-[13.5px] font-medium transition-colors ${active === id ? "text-primary" : "text-muted hover:text-ink-soft"}`}
          >
            {label}
            {active === id && <span className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}

function SegTabs({ tabs, active, onChange }) {
  return (
    <div className="inline-flex items-center gap-0.5 bg-cream border border-border rounded-lg p-0.5 mb-5">
      {tabs.map((t) => {
        const id = typeof t === "string" ? t : t.id;
        const label = typeof t === "string" ? t : t.label;
        return (
          <button key={id} onClick={() => onChange(id)} className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition-colors ${active === id ? "bg-primary text-cream" : "text-ink-soft hover:text-primary"}`}>{label}</button>
        );
      })}
    </div>
  );
}

// ── Table shell ──────────────────────────────────────────────────────
function Table({ head, children }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden overflow-x-auto">
      <table className="w-full text-left min-w-[640px]">
        <thead>
          <tr className="bg-cream/60 border-b border-border">
            {head.map((h, i) => (
              <th key={i} className="py-3 px-5 font-mono text-[9.5px] tracking-[0.16em] uppercase text-muted whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Row({ children }) {
  return <tr className="border-t border-border/60 hover:bg-cream/40 transition-colors">{children}</tr>;
}
function Cell({ children, className = "" }) {
  return <td className={`py-3 px-5 ${className}`}>{children}</td>;
}

// ── Card wrapper ─────────────────────────────────────────────────────
function Panel({ title, action, children, className = "", pad = "p-5" }) {
  return (
    <div className={`bg-surface border border-border rounded-2xl ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/70">
          <div className="font-display text-[14px] font-semibold text-ink tracking-tight">{title}</div>
          {action}
        </div>
      )}
      <div className={pad}>{children}</div>
    </div>
  );
}

// ── Toggle (visual) ──────────────────────────────────────────────────
function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${on ? "bg-primary" : "bg-ink/15"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

// ── Empty state ──────────────────────────────────────────────────────
function EmptyState({ icon, title, body, cta }) {
  const IconC = Icon[icon] || Icon.Grid;
  return (
    <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center">
      <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-primary-soft text-primary mb-5"><IconC w={26} /></div>
      <div className="font-display text-[18px] font-semibold text-primary tracking-tight">{title}</div>
      <p className="text-ink-soft text-[14px] mt-2 max-w-[400px] mx-auto leading-[1.6]">{body}</p>
      {cta && <div className="mt-6 inline-flex">{cta}</div>}
    </div>
  );
}

// ── Field (read-only display) ────────────────────────────────────────
function Field({ label, value, placeholder, mono, className = "" }) {
  return (
    <div className={className}>
      {label && <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-1.5">{label}</div>}
      <div className={`bg-surface border border-border rounded-lg px-3 py-2.5 text-[13.5px] ${value ? "text-ink" : "text-muted"} ${mono ? "font-mono text-[12.5px]" : ""}`}>
        {value || placeholder}
      </div>
    </div>
  );
}

// ── Interactive text input (controlled) ──────────────────────────────
function TextInput({ label, value, onChange, placeholder, mono, type = "text", error, hint, autoFocus }) {
  return (
    <label className="block">
      {label && <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-1.5">{label}</div>}
      <input
        type={type} value={value} placeholder={placeholder} autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-surface border rounded-lg px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-muted/70 ${mono ? "font-mono text-[12.5px]" : ""} ${error ? "border-red-400 focus:border-red-500" : "border-border focus:border-primary/50"}`}
      />
      {error ? <div className="text-[11px] text-red-600 mt-1">{error}</div> : hint ? <div className="text-[11px] text-muted mt-1">{hint}</div> : null}
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, error, rows = 3 }) {
  return (
    <label className="block">
      {label && <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-1.5">{label}</div>}
      <textarea
        value={value} placeholder={placeholder} rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-surface border rounded-lg px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors resize-none leading-[1.5] placeholder:text-muted/70 ${error ? "border-red-400" : "border-border focus:border-primary/50"}`}
      />
      {error && <div className="text-[11px] text-red-600 mt-1">{error}</div>}
    </label>
  );
}

// ── Loading-state hook (simulates async fetch for the prototype) ─────
function useLoaded(ms = 650) {
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setLoaded(true), ms); return () => clearTimeout(t); }, []);
  return loaded;
}

// ── Loading skeleton ─────────────────────────────────────────────────
function Skeleton({ className = "", rounded = "rounded-lg" }) {
  return <div className={`skeleton ${rounded} ${className}`} />;
}

function SkeletonPage({ rows = 3 }) {
  return (
    <div className="mx-auto px-8 py-8" style={{ maxWidth: "1100px" }}>
      <Skeleton className="h-7 w-52 mb-2" />
      <Skeleton className="h-4 w-72 mb-7" rounded="rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" rounded="rounded-2xl" />)}
      </div>
      <div className="grid gap-3">
        {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-16" rounded="rounded-2xl" />)}
      </div>
    </div>
  );
}

// ── Error state ──────────────────────────────────────────────────────
function ErrorState({ title = "Something went wrong", body = "We couldn't load this just now. Please try again.", onRetry }) {
  return (
    <div className="bg-surface border border-dashed border-red-200 rounded-2xl p-12 text-center">
      <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-red-50 text-red-600 mb-5"><Icon.Bell w={26} /></div>
      <div className="font-display text-[18px] font-semibold text-ink tracking-tight">{title}</div>
      <p className="text-ink-soft text-[14px] mt-2 max-w-[400px] mx-auto leading-[1.6]">{body}</p>
      {onRetry && <div className="mt-6 inline-flex"><Btn variant="primary" icon="Arrow" onClick={onRetry}>Try again</Btn></div>}
    </div>
  );
}

// ── Charts (SVG) ─────────────────────────────────────────────────────
function BarsChart({ data, height = 180, unit = "", color = CHART.forest }) {
  const max = Math.max(...data.map((d) => d.value)) || 1;
  return (
    <div>
      <div className="flex items-end gap-2.5" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(4, (d.value / max) * (height - 26));
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group">
              <span className="font-mono text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">{unit}{d.value.toLocaleString()}</span>
              <div className="w-full rounded-t-md transition-all" style={{ height: h, background: d.color || color, opacity: d.dim ? 0.45 : 1 }} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2.5 mt-2">
        {data.map((d, i) => <div key={i} className="flex-1 text-center font-mono text-[9.5px] text-muted truncate">{d.label}</div>)}
      </div>
    </div>
  );
}

function AreaChart({ points, height = 170, color = CHART.forest }) {
  const max = Math.max(...points.map((p) => p.v)) || 1;
  const W = 600, H = height;
  const step = W / (points.length - 1);
  const coords = points.map((p, i) => [i * step, H - 18 - (p.v / max) * (H - 36)]);
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${W} ${H - 18} L 0 ${H - 18} Z`;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g, i) => (
          <line key={i} x1="0" x2={W} y1={(H - 18) * g + 9} y2={(H - 18) * g + 9} stroke="#E5E0D4" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#areaFill)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((c, i) => <circle key={i} cx={c[0]} cy={c[1]} r="3" fill={color} />)}
      </svg>
      <div className="flex justify-between mt-1.5">
        {points.map((p, i) => <span key={i} className="font-mono text-[9.5px] text-muted">{p.label}</span>)}
      </div>
    </div>
  );
}

function Donut({ segments, size = 150, thickness = 22, centerLabel, centerSub }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((s, i) => {
            const len = (s.value / total) * C;
            const el = (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
                strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
            );
            offset += len;
            return el;
          })}
        </g>
        {centerLabel && (
          <text x="50%" y="47%" textAnchor="middle" className="font-mono" style={{ fontSize: 22, fill: "#1F4D3A", fontFamily: "JetBrains Mono" }}>{centerLabel}</text>
        )}
        {centerSub && (
          <text x="50%" y="62%" textAnchor="middle" style={{ fontSize: 9, fill: "#6B7A72", letterSpacing: 1, fontFamily: "JetBrains Mono" }}>{centerSub}</text>
        )}
      </svg>
      <div className="grid gap-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[12.5px]">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-ink-soft">{s.label}</span>
            <span className="font-mono text-muted">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Funnel({ steps }) {
  const top = steps[0].value || 1;
  return (
    <div className="grid gap-2.5">
      {steps.map((s, i) => {
        const pct = Math.round((s.value / top) * 100);
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] text-ink-soft flex items-center gap-2">
                {s.icon && <span className="text-primary/60">{React.createElement(Icon[s.icon], { w: 14 })}</span>}
                {s.label}
              </span>
              <span className="font-mono text-[12.5px] text-ink"><span className="text-primary">{s.value.toLocaleString()}</span> <span className="text-muted">· {pct}%</span></span>
            </div>
            <div className="h-7 rounded-lg bg-primary-soft/60 overflow-hidden">
              <div className="h-full rounded-lg flex items-center transition-all" style={{ width: `${pct}%`, background: s.color || CHART.forest }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ pct, color = CHART.forest, height = 8, track = "#E8EFEB" }) {
  return (
    <div className="rounded-full overflow-hidden" style={{ height, background: track }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

// Gated page banner (when a feature page is opened but plan too low — fallback)
function GateNotice({ feature, plan, onUpgrade }) {
  return (
    <div className="rounded-2xl border border-accent/50 p-6 flex items-center justify-between gap-4" style={{ background: "linear-gradient(135deg, rgba(232,197,126,0.14), rgba(31,77,58,0.05))" }}>
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-accent/25 text-accent-dark grid place-items-center"><Icon.Lock w={18} /></span>
        <div>
          <div className="font-display text-[15px] font-semibold text-accent-dark">This is a {PLAN_LABEL[feature.minPlan]} feature</div>
          <div className="text-[13px] text-ink-soft mt-0.5">Upgrade to unlock {feature.label}.</div>
        </div>
      </div>
      <Btn variant="accent" icon="Sparkle" onClick={() => onUpgrade(feature)}>Upgrade</Btn>
    </div>
  );
}

Object.assign(window, {
  CHART, PageShell, SectionLabel, Btn, StatCard, StatCards, StatStrip,
  Pill, Avatar, SearchBox, FilterBtn, Toolbar, Tabs, SegTabs,
  TextInput, TextArea, Skeleton, SkeletonPage, ErrorState, useLoaded,
  Table, Row, Cell, Panel, Toggle, EmptyState, Field,
  BarsChart, AreaChart, Donut, Funnel, ProgressBar, GateNotice, NotFound,
});

// ── 404 / not found ──────────────────────────────────────────────────
function NotFound({ item, onBack }) {
  return (
    <div className="mx-auto px-8 py-20 max-w-[560px] text-center">
      <div className="inline-grid place-items-center w-16 h-16 rounded-2xl bg-primary-soft text-primary mb-6 font-display text-[22px] font-bold">404</div>
      <h1 className="font-title text-[26px] font-semibold text-primary tracking-[-0.025em]">Page not found</h1>
      <p className="text-ink-soft text-[14.5px] mt-3 leading-[1.6]">
        {item ? `“${item.label}” doesn't exist yet, or you don't have access.` : "This page doesn't exist, or you don't have access to it."}
      </p>
      <div className="mt-7 inline-flex"><Btn variant="primary" icon="Home" onClick={onBack}>Back to dashboard</Btn></div>
    </div>
  );
}
