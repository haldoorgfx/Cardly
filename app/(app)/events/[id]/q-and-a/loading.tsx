import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function QAndALoading() {
  return (
    <div className="px-6 py-8 max-w-[1200px]">
      <Skel className="h-3 w-48 mb-6" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => <Skel key={i} className="h-9 w-24 rounded-full" />)}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E0D4] p-5 flex gap-4">
            <div className="shrink-0 flex flex-col items-center gap-1">
              <Skel className="h-8 w-8 rounded-lg" />
              <Skel className="h-3 w-6" />
            </div>
            <div className="flex-1">
              <Skel className="h-5 w-3/4 mb-2" />
              <Skel className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
