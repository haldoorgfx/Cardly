import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function QAndALoading() {
  return (
    <div className="px-8 py-8 max-w-[1200px]">
      <Skel className="h-3 w-48 mb-6" />
      <div className="flex items-center gap-3 mb-6">
        <Skel className="h-9 w-24 rounded-xl" />
        <Skel className="h-9 w-24 rounded-xl" />
        <Skel className="h-9 w-28 rounded-xl" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5 flex gap-4">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <Skel className="h-6 w-6 rounded" />
              <Skel className="h-4 w-6" />
            </div>
            <div className="flex-1 space-y-2">
              <Skel className="h-5 w-full max-w-[80%]" />
              <Skel className="h-5 w-3/5" />
              <Skel className="h-3 w-28 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
