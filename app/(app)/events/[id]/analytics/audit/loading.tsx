import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function AuditLoading() {
  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8">
        <Skel className="h-4 w-32 mb-4" />
        <Skel className="h-7 w-64 mb-2" />
        <Skel className="h-3 w-80 mb-6" />

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-[#E5E0D4] p-4 mb-4">
          <Skel className="h-4 w-20 mb-3" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => <Skel key={i} className="h-9 w-36" />)}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E5E0D4] overflow-hidden">
          <Skel className="h-10 w-full" style={{ borderRadius: 0 }} />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[#F0EEE7]">
              <Skel className="h-4 w-24" />
              <Skel className="h-4 w-32" />
              <Skel className="h-4 w-28" />
              <Skel className="h-5 w-16 rounded-full" />
              <Skel className="h-4 w-20" />
              <Skel className="h-5 w-16 rounded-full ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
