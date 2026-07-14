import React from 'react';

function Skel({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-xl bg-[#E5E0D4]/50 ${className ?? ''}`} style={style} />;
}

export default function EventsDiscoveryLoading() {
  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      {/* Nav skeleton */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b"
        style={{ background: 'white', borderColor: '#E5E0D4' }}
      >
        <Skel className="h-5 w-28" />
        <div className="flex gap-2">
          <Skel className="h-7 w-16 rounded-full" />
          <Skel className="h-7 w-16 rounded-full" />
        </div>
      </div>

      {/* Featured / hero skeleton */}
      <div className="max-w-[1120px] mx-auto px-5 pt-8">
        <Skel className="w-full rounded-2xl" style={{ height: 260 }} />

        {/* Section heading */}
        <Skel className="h-6 w-48 mt-10 mb-5" />

        {/* Event card grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
              <Skel className="w-full rounded-none" style={{ height: 150 }} />
              <div className="p-4 space-y-2">
                <Skel className="h-3 w-24" />
                <Skel className="h-4 w-3/4" />
                <Skel className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
