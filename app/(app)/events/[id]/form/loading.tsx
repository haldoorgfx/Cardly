import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function FormLoading() {
  return (
    <div className="px-8 py-8 max-w-[1200px]">
      <Skel className="h-3 w-48 mb-6" />
      <div className="bg-white rounded-2xl border border-[#E5E0D4] overflow-hidden">
        <div className="p-6 border-b border-[#E5E0D4]">
          <Skel className="h-6 w-52" />
        </div>
        <div className="p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-[#E5E0D4]/60">
              <Skel className="h-5 w-5 rounded shrink-0" />
              <Skel className="h-4 w-36" />
              <Skel className="h-5 w-20 rounded-full ml-2" />
              <div className="ml-auto flex items-center gap-3">
                <Skel className="h-5 w-10 rounded-full" />
                <Skel className="h-4 w-4 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6">
          <Skel className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
