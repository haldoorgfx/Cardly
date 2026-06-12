import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function AnalyticsLoading() {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1200px]">
      <Skel className="h-3 w-48 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5">
            <Skel className="h-3 w-24 mb-3" />
            <Skel className="h-10 w-20" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6 mb-6">
        <Skel className="h-5 w-32 mb-4" />
        <Skel className="w-full rounded-xl" style={{ height: 180 }} />
      </div>
      <div className="bg-white rounded-2xl border border-[#E5E0D4] overflow-hidden">
        <div className="p-5 border-b border-[#E5E0D4]"><Skel className="h-5 w-36" /></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-3.5 border-b border-[#E5E0D4]/60">
            <Skel className="h-4 w-40" />
            <Skel className="h-4 w-24" />
            <Skel className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
