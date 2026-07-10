import type { CSSProperties } from 'react';

/**
 * Shared skeleton primitives — the ONE loading language for the dashboard.
 * Same pulse, same tone (#E5E0D4/60) as the original dashboard/loading.tsx,
 * now importable so every route's loading.tsx stays identical.
 */

export function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

/** Standard page header skeleton: eyebrow, title, subtitle. */
export function PageHeaderSkel() {
  return (
    <div className="mb-8">
      <Skel className="h-8 w-48 mb-3" />
      <Skel className="h-4 w-72" />
    </div>
  );
}

/** A white card shell with pulsing rows — the standard list placeholder. */
export function CardListSkel({ cards = 3, rows = 2 }: { cards?: number; rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-[#E5E0D4] p-5">
          <Skel className="h-4 w-40 mb-4" />
          {Array.from({ length: rows }).map((_, j) => (
            <Skel key={j} className="h-3 w-full max-w-[420px] mb-2.5" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Grid of card tiles (saved events, my cards). */
export function CardGridSkel({ tiles = 4 }: { tiles?: number }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {Array.from({ length: tiles }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-[#E5E0D4] overflow-hidden">
          <Skel className="h-32 w-full rounded-none" />
          <div className="p-4">
            <Skel className="h-4 w-32 mb-2" />
            <Skel className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full standard page skeleton: header + card list, in the standard container. */
export function PageSkel({ maxWidth = 900 }: { maxWidth?: number }) {
  return (
    <div className="mx-auto px-5 py-10" style={{ maxWidth }}>
      <PageHeaderSkel />
      <CardListSkel />
    </div>
  );
}
