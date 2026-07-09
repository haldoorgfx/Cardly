import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function SpeakersLoading() {
  return (
    <div className="px-8 py-8 max-w-[1200px]">
      <Skel className="h-3 w-48 mb-6" />
      <div className="flex items-center justify-between mb-6">
        <Skel className="h-7 w-32" />
        <Skel className="h-9 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5 flex gap-4">
            <Skel className="h-14 w-14 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skel className="h-5 w-36" />
              <Skel className="h-3 w-24" />
              <Skel className="h-3 w-full" />
              <Skel className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
