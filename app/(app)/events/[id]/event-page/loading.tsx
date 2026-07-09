import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function EventPageLoading() {
  return (
    <div className="px-8 py-8 max-w-[1200px]">
      <Skel className="h-3 w-48 mb-6" />
      <Skel className="h-7 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6 space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skel className="h-3 w-24 mb-2" />
              <Skel className="h-10 w-full rounded-xl" />
            </div>
          ))}
          <Skel className="h-10 w-full rounded-xl mt-2" />
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6">
          <Skel className="h-3 w-20 mb-4" />
          <Skel className="h-48 w-full rounded-2xl mb-4" />
          <Skel className="h-5 w-40 mb-2" />
          <Skel className="h-4 w-full" />
          <Skel className="h-4 w-3/4 mt-1" />
        </div>
      </div>
    </div>
  );
}
