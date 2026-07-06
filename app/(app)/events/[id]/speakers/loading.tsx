import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function SpeakersLoading() {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1200px] mx-auto">
      <Skel className="h-3 w-48 mb-6" />
      <div className="flex items-center justify-between mb-6">
        <Skel className="h-7 w-32" />
        <Skel className="h-9 w-32 rounded-xl" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5">
            <div className="flex items-center gap-3 mb-4">
              <Skel className="w-12 h-12 rounded-full shrink-0" />
              <div>
                <Skel className="h-4 w-28 mb-2" />
                <Skel className="h-3 w-20" />
              </div>
            </div>
            <Skel className="h-3 w-full mb-1" />
            <Skel className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
