import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function BillingLoading() {
  return (
    <div className="px-8 py-8 max-w-[900px]">
      <Skel className="h-8 w-32 mb-1" />
      <Skel className="h-4 w-56 mb-8" />
      <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Skel className="h-6 w-28 mb-2" />
            <Skel className="h-8 w-20" />
          </div>
          <Skel className="h-9 w-32 rounded-xl" />
        </div>
        <div className="space-y-2 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skel className="h-4 w-4 rounded-full shrink-0" />
              <Skel className="h-4 w-48" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6 mb-6">
        <Skel className="h-4 w-24 mb-3" />
        <Skel className="h-3 w-full rounded-full mb-1" />
        <Skel className="h-3 w-32 mt-1" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5 space-y-3">
            <Skel className="h-5 w-20" />
            <Skel className="h-8 w-28" />
            <div className="space-y-1">
              {Array.from({ length: 3 }).map((_, j) => <Skel key={j} className="h-3 w-full" />)}
            </div>
            <Skel className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
