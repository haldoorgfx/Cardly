'use client';

import { useRef, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Bell, Calendar, BarChart3, Ticket, List, Users, Download,
  Check, ArrowUp, Lock, ChevronRight, ArrowRight, MessageSquare,
} from 'lucide-react';
import s from './home-visuals.module.css';

export { s as hv };

/* ── Icons (Lucide, 1.7 stroke) ─────────────────────────────────────── */
const ICONS = {
  bell: Bell, cal: Calendar, chart: BarChart3, ticket: Ticket, list: List,
  users: Users, dl: Download, check: Check, up: ArrowUp, lock: Lock,
  chev: ChevronRight, arr: ArrowRight, msg: MessageSquare,
} as const;
export type IcName = keyof typeof ICONS;
const IC_COLOR: Record<string, string> = {
  '': 'var(--forest)', mut: 'var(--muted)', crm: 'var(--cream)', gold: 'var(--gold-deep)',
};
export function Ic({ n, c = '', size = 19 }: { n: IcName; c?: 'mut' | 'crm' | 'gold' | ''; size?: number }) {
  const Comp = ICONS[n];
  return <Comp size={size} strokeWidth={1.7} style={{ color: IC_COLOR[c], flexShrink: 0 }} />;
}

/* ── Skeleton helpers ───────────────────────────────────────────────── */
export function Bar({ w, sm, lg, style }: { w?: string | number; sm?: boolean; lg?: boolean; style?: CSSProperties }) {
  return <div className={`${s.bar} ${sm ? s.barSm : ''} ${lg ? s.barLg : ''}`} style={{ width: w, ...style }} />;
}
export function DotSq({ style }: { style?: CSSProperties }) {
  return <div className={s.dotSq} style={style} />;
}

/* ── Browser chrome ─────────────────────────────────────────────────── */
export function Chrome({ url, skel }: { url?: string; skel?: boolean }) {
  return (
    <div className={s.chrome}>
      <div className={s.lights}>
        <i style={{ background: '#EC6A5E' }} />
        <i style={{ background: '#F4BF4F' }} />
        <i style={{ background: '#61C554' }} />
      </div>
      <div className={s.url}>
        {skel ? (
          <Bar sm w="60%" />
        ) : (
          <>
            <Ic n="lock" c="mut" size={13} />
            <span>eventera.so/{url}</span>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sidebar building blocks ────────────────────────────────────────── */
export function Brand({ icon, word = 'Eventera' }: { icon?: ReactNode; word?: ReactNode }) {
  return (
    <div className={s.brand}>
      {icon !== undefined ? <div className={s.brandMark}>{icon}</div> : null}
      <span className={s.wordmark}>{word}</span>
    </div>
  );
}
export function NavItem({ active, icon, label, muted }: { active?: boolean; icon?: ReactNode; label: ReactNode; muted?: boolean }) {
  return (
    <div className={`${s.nav} ${active ? s.navActive : ''}`}>
      {icon ?? <DotSq />}
      <span className={`${s.navtxt} ${muted ? s.navtxtMut : ''}`}>{label}</span>
    </div>
  );
}
const SKEL_NAV_W = [76, 58, 70, 52, 64, 48];
export function SkelNav({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={s.nav}>
          <DotSq />
          <Bar sm w={SKEL_NAV_W[i % 6]} />
        </div>
      ))}
    </>
  );
}
export function Plan({ children = 'Pro plan' }: { children?: ReactNode }) {
  return <span className={s.plan}>{children}</span>;
}

/* ── Stat card ──────────────────────────────────────────────────────── */
export function Stat({ label, num, kind, delta }: {
  label: string; num: string; kind: 'gold' | 'forest' | 'ink'; delta?: string;
}) {
  const kindCls = kind === 'gold' ? s.statGold : kind === 'forest' ? s.statForest : s.statInk;
  return (
    <div className={`${s.card} ${kindCls}`}>
      <div className={s.label}>{label}</div>
      <div className={s.statN}>{num}</div>
      {delta ? (
        <div className={s.delta}><Ic n="up" size={13} /><span>{delta}</span></div>
      ) : (
        <Bar sm w={52} />
      )}
    </div>
  );
}

/* ── Chart column ───────────────────────────────────────────────────── */
export function Col({ h, tone, day, goldDay }: {
  h: number; tone?: 'gold' | 'forest' | 'tint'; day?: string; goldDay?: boolean;
}) {
  const toneCls = tone === 'gold' ? s.colGold : tone === 'forest' ? s.colForest : tone === 'tint' ? s.colTint : '';
  return (
    <div className={s.colwrap}>
      <div className={`${s.col} ${toneCls}`} style={{ height: `${h}%` }} />
      {day ? <span className={s.colday} style={goldDay ? { color: 'var(--gold-deep)', fontWeight: 600 } : undefined}>{day}</span> : null}
    </div>
  );
}

/* ── Eventera Card ──────────────────────────────────────────────────── */
export function Ecard({ name, role, initials, withBtn, faded }: {
  name?: string | null; role?: string | null; initials: string; withBtn?: boolean; faded?: boolean;
}) {
  return (
    <div className={s.ecard} style={{ opacity: faded ? 0.88 : 1, width: '100%', height: '100%' }}>
      <span className={s.ecWm}>EVENTERA</span>
      <div className={s.ecIn}>
        <div className={s.ecAva}><div className={s.ecAvaIn}>{initials}</div></div>
        {name ? <div className={s.ecName}>{name}</div> : <div className={s.barW} style={{ width: 130, height: 13, marginTop: 6 }} />}
        {role ? <div className={s.ecRole}>{role}</div> : <div className={s.barW} style={{ width: 90, height: 9, marginTop: 4 }} />}
        <div className={s.ecPills}>
          <span className={s.ecPill}>IG</span>
          <span className={s.ecPill}>WA</span>
          <span className={s.ecPill}>X</span>
        </div>
        {withBtn ? (
          <div className={s.ecDl}><Ic n="dl" c="" size={19} /><span className="dm">Download card</span></div>
        ) : null}
      </div>
    </div>
  );
}

/* ── Responsive "shot" — scales an intrinsic-size composition to fit ── */
export function Shot({ width, height, className, float, pad = 48, children }: {
  width: number; height: number; className?: string; float?: boolean; pad?: number; children: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  // Full art box includes uniform padding on every side so drop-shadows and any
  // intentional bleed (a phone floating off-edge) have room and never get sliced.
  const boxW = width + pad * 2;
  const boxH = height + pad * 2;
  useEffect(() => {
    function fit() {
      if (!wrapRef.current) return;
      setScale(Math.min(1, wrapRef.current.offsetWidth / boxW));
    }
    fit();
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [boxW]);
  return (
    <div ref={wrapRef} aria-hidden="true" className={`${s.hv} ${className ?? ''}`} style={{ width: '100%', height: boxH * scale }}>
      {/* Purely decorative product mockup — hidden from assistive tech so screen
          readers don't read through fake dashboard/card copy (names, stats, etc.)
          that duplicates the real heading/paragraph text next to it. */}
      {/* Sized to the SCALED dimensions with overflow:hidden so the inner div's
          unscaled layout footprint (transform:scale doesn't shrink the box) can't
          push the document into horizontal scroll. The float animation lives here,
          not on the scaled div, so it never clobbers the scale transform. */}
      <div
        className={float ? s.float : undefined}
        style={{ width: boxW * scale, height: boxH * scale, overflow: 'hidden' }}
      >
        <div style={{ position: 'relative', width: boxW, height: boxH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <div style={{ position: 'absolute', left: pad, top: pad, width, height }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
