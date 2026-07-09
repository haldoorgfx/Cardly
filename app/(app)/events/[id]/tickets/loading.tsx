import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function TicketsLoading() {
  return (
    <div className="px-8 py-8 max-w-[1200px]">
      <Skel className="h-3 w-48 mb-6" />
      <div className="flex items-center justify-between mb-6">
        <Skel className="h-7 w-32" />
        <Skel className="h-9 w-32 rounded-xl" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5">
            <div className="flex items-start justify-between mb-4">
              <Skel className="h-6 w-40" />
              <Skel className="h-7 w-24 rounded-xl" />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <Skel className="h-3 w-16 mb-2" />
                <Skel className="h-5 w-20" />
              </div>
              <div>
                <Skel className="h-3 w-16 mb-2" />
                <Skel className="h-5 w-20" />
              </div>
              <div>
                <Skel className="h-3 w-16 mb-2" />
                <Skel className="h-5 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
