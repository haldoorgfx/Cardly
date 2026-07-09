import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function RegistrationsLoading() {
  return (
    <div className="px-8 py-8 max-w-[1200px]">
      <Skel className="h-3 w-48 mb-6" />
      <div className="bg-white rounded-2xl border border-[#E5E0D4] overflow-hidden">
        <div className="p-6 border-b border-[#E5E0D4] flex items-center justify-between gap-4">
          <Skel className="h-7 w-40" />
          <div className="flex items-center gap-3 ml-auto">
            <Skel className="h-9 w-56 rounded-xl" />
            <Skel className="h-9 w-28 rounded-xl" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-[2rem_1fr_1.5fr_1fr_1fr_1fr] gap-4 mb-3 px-1">
            {['', 'Name', 'Email', 'Ticket', 'Status', 'Date'].map((_, i) => (
              <Skel key={i} className="h-3" style={{ width: i === 0 ? '1.25rem' : undefined }} />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, row) => (
            <div key={row} className="grid grid-cols-[2rem_1fr_1.5fr_1fr_1fr_1fr] gap-4 items-center py-3 border-t border-[#E5E0D4]/40">
              <Skel className="h-4 w-4 rounded" />
              <Skel className="h-4 w-full max-w-[120px]" />
              <Skel className="h-4 w-full max-w-[180px]" />
              <Skel className="h-5 w-20 rounded-full" />
              <Skel className="h-5 w-16 rounded-full" />
              <Skel className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
