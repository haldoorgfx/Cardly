import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function PromoCodesLoading() {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1200px] mx-auto">
      <Skel className="h-3 w-48 mb-6" />
      <div className="flex items-center justify-between mb-6">
        <Skel className="h-7 w-36" />
        <Skel className="h-9 w-28 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-[#E5E0D4] overflow-hidden overflow-x-auto">
        <div className="min-w-[480px]">
          <div className="grid grid-cols-4 gap-4 px-5 py-3.5 bg-[#FAF6EE] border-b border-[#E5E0D4]">
            {[60, 50, 40, 60].map((w, i) => <Skel key={i} className="h-3" style={{ width: w }} />)}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 px-5 py-4 border-b border-[#E5E0D4]/60">
              <Skel className="h-4 w-24" />
              <Skel className="h-4 w-16" />
              <Skel className="h-4 w-12" />
              <Skel className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
