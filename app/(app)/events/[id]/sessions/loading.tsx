import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function SessionsLoading() {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1200px] mx-auto">
      <Skel className="h-3 w-48 mb-6" />
      <div className="flex items-center justify-between mb-6">
        <Skel className="h-7 w-32" />
        <Skel className="h-9 w-32 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5 flex items-center gap-4">
            <Skel className="h-10 w-16 rounded-lg shrink-0" />
            <div className="flex-1">
              <Skel className="h-5 w-56 mb-2" />
              <Skel className="h-3 w-32" />
            </div>
            <Skel className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
