import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function SessionsLoading() {
  return (
    <div className="px-8 py-8 max-w-[1200px]">
      <Skel className="h-3 w-48 mb-6" />
      <div className="flex items-center justify-between mb-6">
        <Skel className="h-7 w-36" />
        <Skel className="h-9 w-32 rounded-xl" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5 flex items-start gap-4">
            <Skel className="h-10 w-20 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skel className="h-5 w-56" />
              <div className="flex items-center gap-3">
                <Skel className="h-4 w-32" />
                <Skel className="h-3 w-3 rounded-full" />
                <Skel className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
