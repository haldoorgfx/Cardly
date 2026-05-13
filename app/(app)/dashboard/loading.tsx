import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function DashboardLoading() {
  return (
    <div className="px-8 py-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <Skel className="h-3 w-40 mb-3" />
          <Skel className="h-9 w-32" />
          <Skel className="h-4 w-64 mt-2" />
        </div>
        <Skel className="h-10 w-32 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-2xl bg-white border border-[#E5E0D4] p-5">
            <Skel className="h-3 w-28 mb-4" />
            <Skel className="h-9 w-20" />
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-2xl bg-white border border-[#E5E0D4] overflow-hidden">
            <Skel className="w-full rounded-none" style={{ aspectRatio: '5/3' } as React.CSSProperties} />
            <div className="p-5 space-y-3">
              <Skel className="h-5 w-40" />
              <Skel className="h-3 w-32" />
              <div className="flex justify-between">
                <Skel className="h-3 w-24" />
                <Skel className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
