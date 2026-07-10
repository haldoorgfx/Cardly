import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function ConflictsLoading() {
  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8">
        <Skel className="h-3.5 w-32 mb-4" />
        <Skel className="h-7 w-52 mb-2" />
        <Skel className="h-3 w-80 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5">
              <div className="flex items-center gap-3 mb-4">
                <Skel className="h-10 w-10 rounded-xl" />
                <div className="flex-1">
                  <Skel className="h-4 w-40 mb-2" />
                  <Skel className="h-3 w-28" />
                </div>
                <Skel className="h-6 w-16 rounded-full" />
              </div>
              <div className="space-y-2 mb-4">
                <Skel className="h-14 w-full rounded-xl" />
                <Skel className="h-14 w-full rounded-xl" />
              </div>
              <div className="flex gap-2">
                <Skel className="h-9 w-24 rounded-lg" />
                <Skel className="h-9 w-24 rounded-lg" />
                <Skel className="h-9 w-32 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
