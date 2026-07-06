import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function TicketsLoading() {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1200px] mx-auto">
      <Skel className="h-3 w-48 mb-6" />
      <div className="flex items-center justify-between mb-6">
        <Skel className="h-7 w-36" />
        <Skel className="h-9 w-32 rounded-xl" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5 flex items-center justify-between">
            <div>
              <Skel className="h-5 w-40 mb-2" />
              <Skel className="h-3 w-24" />
            </div>
            <div className="flex gap-8">
              <div className="text-right">
                <Skel className="h-6 w-16 mb-1" />
                <Skel className="h-3 w-10" />
              </div>
              <div className="text-right">
                <Skel className="h-6 w-16 mb-1" />
                <Skel className="h-3 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
