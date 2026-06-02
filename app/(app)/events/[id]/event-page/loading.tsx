import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function EventPageEditorLoading() {
  return (
    <div className="px-6 py-8 max-w-[1200px]">
      <Skel className="h-3 w-48 mb-6" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skel className="h-3 w-24 mb-2" />
              <Skel className="h-10 w-full rounded-xl" />
            </div>
          ))}
          <Skel className="h-10 w-32 rounded-xl mt-2" />
        </div>
        <div>
          <Skel className="h-3 w-20 mb-2" />
          <Skel className="w-full rounded-2xl" style={{ aspectRatio: '16/9' }} />
        </div>
      </div>
    </div>
  );
}
