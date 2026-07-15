import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function PromoCodesLoading() {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1200px] mx-auto">
      <Skel className="h-3 w-48 mb-6" />
      <div className="flex items-center gap-2 mb-6">
        <Skel className="h-9 w-40 rounded-xl" />
        <Skel className="h-9 w-24 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] px-5 py-4">
            <div className="flex items-center gap-3 mb-3">
              <Skel className="h-6 w-24 rounded-lg" />
              <Skel className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-4">
              <Skel className="h-3 w-20" />
              <Skel className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
