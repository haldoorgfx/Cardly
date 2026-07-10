import React from 'react';

function Skel({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-xl bg-[#E5E0D4]/50 ${className ?? ''}`} style={style} />;
}

export default function PublicEventLoading() {
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

      {/* Hero / cover skeleton */}
      <Skel className="w-full rounded-none" style={{ height: 220 }} />

      {/* Content area */}
      <div className="max-w-[480px] mx-auto px-4 py-6 space-y-4">
        <Skel className="h-7 w-3/4" />
        <Skel className="h-4 w-1/2" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skel className="h-14 rounded-2xl" />
          <Skel className="h-14 rounded-2xl" />
          <Skel className="h-14 rounded-2xl" />
          <Skel className="h-14 rounded-2xl" />
        </div>
        <Skel className="h-12 w-full rounded-2xl mt-4" />
      </div>
    </div>
  );
}
