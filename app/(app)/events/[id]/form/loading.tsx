import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function FormBuilderLoading() {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-[800px]">
      <Skel className="h-3 w-48 mb-6" />
      <div className="bg-white rounded-2xl border border-[#E5E0D4] overflow-hidden">
        <div className="p-5 border-b border-[#E5E0D4]">
          <Skel className="h-6 w-48" />
        </div>
        <div className="p-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E5E0D4]">
              <Skel className="w-4 h-4 rounded shrink-0" />
              <Skel className="h-4 flex-1 max-w-[200px]" />
              <Skel className="h-6 w-20 rounded-full ml-auto" />
              <Skel className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-[#E5E0D4]">
          <Skel className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
