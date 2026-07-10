import type { CSSProperties } from 'react';

function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}

export default function AttendanceLoading() {
  const cols = 4;
  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Skel className="h-8 w-64 mb-2" />
        <Skel className="h-3 w-96 mb-6" />

        <div className="flex gap-5 mb-4">
          {Array.from({ length: 3 }).map((_, i) => <Skel key={i} className="h-3 w-24" />)}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
          {/* Header */}
          <div className="grid" style={{ gridTemplateColumns: `200px repeat(${cols}, 132px)`, borderBottom: '1px solid #E5E0D4' }}>
            <div className="px-4 py-3"><Skel className="h-3 w-16" /></div>
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="px-3 py-3 flex flex-col items-center gap-1.5" style={{ borderLeft: '1px solid #F0EDE6' }}>
                <Skel className="h-3 w-10" /><Skel className="h-2.5 w-12" />
              </div>
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: 6 }).map((_, r) => (
            <div key={r} className="grid items-center" style={{ gridTemplateColumns: `200px repeat(${cols}, 132px)`, borderTop: r === 0 ? 'none' : '1px solid #F0EDE6' }}>
              <div className="px-4 py-2.5"><Skel className="h-3.5 w-32" /></div>
              {Array.from({ length: cols }).map((_, c) => (
                <div key={c} className="px-2 py-1.5" style={{ borderLeft: '1px solid #F5F3EC' }}>
                  <Skel className="h-9 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
