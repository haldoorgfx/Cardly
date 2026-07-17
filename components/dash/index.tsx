/**
 * Dash UI — the ONE shared visual language for every dashboard page.
 *
 * Every page in app/(app) composes these instead of hand-rolling headers,
 * containers, stats, tabs and empty states. Do NOT re-implement these
 * patterns inline in pages — extend them here.
 *
 * All primitives are pure JSX (no hooks) so they work in server AND client
 * components alike.
 */

import Link from 'next/link';
import type { ReactNode, CSSProperties } from 'react';

/* ── Tokens (single source for the dash layer) ────────────────────────── */

export const dash = {
  ink: '#0F1F18',
  inkSoft: '#3A4A42',
  muted: '#65736B',
  forest: '#1F4D3A',
  forestDark: '#163828',
  soft: '#E8EFEB',
  gold: '#E8C57E',
  cream: '#FAF6EE',
  border: '#E5E0D4',
  hairline: '#F0EDE6',
} as const;

/* ── PageShell — the standard content container ───────────────────────── */

// `screen` is for dense data tables (admin lists) that should use the available
// width instead of sitting in a narrow centred column with big empty margins on
// large monitors. It still caps + centres on ultra-wide displays.
const WIDTHS = { narrow: 760, default: 900, wide: 1200, full: 1400, screen: 1720 } as const;
export type ShellWidth = keyof typeof WIDTHS;

/** Standard page container: consistent max-width, gutters and vertical rhythm. */
export function PageShell({
  width = 'default',
  children,
}: {
  width?: ShellWidth;
  children: ReactNode;
}) {
  return (
    <div
      className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
      style={{ maxWidth: WIDTHS[width] }}
    >
      {children}
    </div>
  );
}

/* ── PageHeader — the standard page header ─────────────────────────────── */

/**
 * ONE header pattern for every dashboard page:
 * optional eyebrow (small caps, muted) → title (display, ink) → subtitle
 * (muted) with an optional actions slot on the right.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <div
            className="text-[11px] font-medium uppercase tracking-[0.14em] mb-2"
            style={{ color: dash.muted }}
          >
            {eyebrow}
          </div>
        )}
        <h1
          className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight"
          style={{ color: dash.ink, letterSpacing: '-0.02em' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] sm:text-[14.5px] mt-1.5" style={{ color: dash.muted }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}

/* ── Card — the standard white surface ─────────────────────────────────── */

export function Card({
  children,
  className = '',
  padded = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden ${padded ? 'p-5 sm:p-6' : ''} ${className}`}
      style={{ borderColor: dash.border, boxShadow: '0 1px 2px rgba(15,31,24,0.04)', ...style }}
    >
      {children}
    </div>
  );
}

/* ── Stats — the standard metric display ───────────────────────────────── */

export interface StatItem {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
}

/** Row of stat cards — same tile everywhere (dashboard, analytics, admin). */
export function StatRow({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {stats.map((s, i) => (
        <div
          key={i}
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            background: s.accent ? 'rgba(232,197,126,0.12)' : '#FFFFFF',
            borderColor: s.accent ? 'rgba(232,197,126,0.5)' : dash.border,
          }}
        >
          <div
            className="text-[11px] font-medium uppercase tracking-[0.08em] mb-2"
            style={{ color: dash.muted }}
          >
            {s.label}
          </div>
          <div
            className="font-display font-semibold text-[26px] sm:text-[30px] leading-none"
            style={{ color: s.accent ? '#C9A45E' : dash.ink }}
          >
            {s.value}
          </div>
          {s.hint && (
            <div className="text-[12px] mt-1.5" style={{ color: dash.muted }}>
              {s.hint}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── SegmentedTabs — the standard in-page filter tabs (pill group) ─────── */

export interface SegmentedTab {
  key: string;
  label: ReactNode;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

/**
 * Pill-group tabs for switching views WITHIN a page (Saved/Following,
 * attending tools, list filters). For page-level SECTIONS use the underline
 * tabs (SettingsTabs pattern).
 */
export function SegmentedTabs({ tabs }: { tabs: SegmentedTab[] }) {
  return (
    <div
      className="inline-flex gap-1 p-1 rounded-xl mb-6 max-w-full overflow-x-auto"
      style={{ background: '#EDE9E0' }}
    >
      {tabs.map((t) => {
        const cls =
          'px-4 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition';
        const style: CSSProperties = {
          background: t.active ? '#FFFFFF' : 'transparent',
          color: t.active ? dash.ink : dash.muted,
          boxShadow: t.active ? '0 1px 3px rgba(15,31,24,0.08)' : 'none',
        };
        return t.href ? (
          <Link key={t.key} href={t.href} className={cls} style={style}>
            {t.label}
          </Link>
        ) : (
          <button key={t.key} type="button" onClick={t.onClick} className={cls} style={style}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── EmptyState — the standard "nothing here yet" ──────────────────────── */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-2xl border py-14 px-6 text-center"
      style={{ borderColor: dash.border, boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
    >
      {icon && (
        <span
          className="inline-grid place-items-center w-12 h-12 rounded-2xl mb-4"
          style={{ background: dash.soft, color: dash.forest }}
        >
          {icon}
        </span>
      )}
      <h2 className="font-display text-[17px] font-semibold" style={{ color: dash.ink }}>
        {title}
      </h2>
      {body && (
        <p
          className="text-[13.5px] mt-1.5 max-w-[420px] mx-auto leading-[1.6]"
          style={{ color: dash.muted }}
        >
          {body}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Buttons — the standard actions ────────────────────────────────────── */

export function PrimaryButton({
  href,
  onClick,
  children,
  disabled,
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  const cls =
    'inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-[13.5px] font-medium text-white transition hover:opacity-90 disabled:opacity-50';
  const style: CSSProperties = { background: dash.forest };
  return href ? (
    <Link href={href} className={cls} style={style}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls} style={style}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  href,
  onClick,
  children,
  disabled,
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  const cls =
    'inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-[13.5px] font-medium border bg-white transition hover:bg-[#F5F3EE] disabled:opacity-50';
  const style: CSSProperties = { color: dash.forest, borderColor: dash.border };
  return href ? (
    <Link href={href} className={cls} style={style}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls} style={style}>
      {children}
    </button>
  );
}
