import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function BillingLoading() {
  return (
    <div className="px-6 py-8 max-w-[900px] mx-auto">
      <Skel className="h-7 w-32 mb-2" />
      <Skel className="h-4 w-64 mb-8" />
      <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Skel className="h-4 w-24 mb-2" />
            <Skel className="h-8 w-20" />
          </div>
          <Skel className="h-9 w-32 rounded-xl" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skel key={i} className="h-3 w-48" />)}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6 mb-5">
        <Skel className="h-4 w-32 mb-3" />
        <Skel className="h-3 w-full rounded-full mb-2" />
        <Skel className="h-3 w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5">
            <Skel className="h-4 w-16 mb-2" />
            <Skel className="h-8 w-20 mb-4" />
            {Array.from({ length: 4 }).map((_, j) => <Skel key={j} className="h-3 w-full mb-2" />)}
            <Skel className="h-9 w-full rounded-xl mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
