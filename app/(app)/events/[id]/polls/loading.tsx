import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function PollsLoading() {
  return (
    <div className="px-8 py-8 max-w-[1200px]">
      <Skel className="h-3 w-48 mb-6" />
      <div className="flex items-center justify-between mb-6">
        <Skel className="h-7 w-24" />
        <Skel className="h-9 w-32 rounded-xl" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5">
            <Skel className="h-5 w-3/4 mb-4" />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skel className="h-4 w-full max-w-[70%]" />
                <Skel className="h-3 w-10" />
              </div>
              <div className="flex items-center gap-3">
                <Skel className="h-4 w-full max-w-[45%]" />
                <Skel className="h-3 w-10" />
              </div>
              <div className="flex items-center gap-3">
                <Skel className="h-4 w-full max-w-[30%]" />
                <Skel className="h-3 w-10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
