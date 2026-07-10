import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function RedemptionLoading() {
  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8">
        <Skel className="h-7 w-56 mb-2" />
        <Skel className="h-3 w-72 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5">
              <div className="flex items-center gap-3 mb-4">
                <Skel className="h-10 w-10 rounded-xl" />
                <div className="flex-1">
                  <Skel className="h-4 w-40 mb-2" />
                  <Skel className="h-3 w-24" />
                </div>
                <Skel className="h-6 w-16" />
              </div>
              <Skel className="h-2.5 w-full rounded-full mb-3" />
              <Skel className="h-3 w-48" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
