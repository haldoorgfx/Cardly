import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function PromoCodesLoading() {
  return (
    <div className="px-8 py-8 max-w-[1200px]">
      <Skel className="h-3 w-48 mb-6" />
      <div className="flex items-center justify-between mb-6">
        <Skel className="h-7 w-36" />
        <Skel className="h-9 w-28 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-[#E5E0D4] overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-[#E5E0D4]/40">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skel key={i} className="h-3 w-20" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, row) => (
          <div key={row} className="grid grid-cols-4 gap-4 items-center px-6 py-4 border-b border-[#E5E0D4]/40 last:border-b-0">
            <Skel className="h-5 w-24 rounded font-mono" />
            <Skel className="h-4 w-16" />
            <Skel className="h-4 w-20" />
            <Skel className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
