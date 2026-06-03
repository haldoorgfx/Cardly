export default function AgendaLoading() {
  return (
    <div className="animate-pulse" style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <div className="h-[72px]" style={{ background: 'white', borderBottom: '1px solid #E5E0D4' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: 'calc(100vh - 72px)' }}>
        {/* Left sidebar skeleton */}
        <div style={{ borderRight: '1px solid #E5E0D4', background: 'white', padding: '20px 16px' }} className="space-y-3">
          <div className="h-4 rounded w-3/4" style={{ background: '#E5E0D4' }} />
          <div className="h-px w-full my-3" style={{ background: '#F0EBE3' }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl" style={{ background: '#F5F2EC' }} />
          ))}
          <div className="h-px w-full my-3" style={{ background: '#F0EBE3' }} />
          <div className="h-8 w-full rounded-xl" style={{ background: '#E8EFEB' }} />
        </div>
        {/* Time grid skeleton */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex gap-3 mb-6">
            {[70, 80, 65].map((w, i) => (
              <div key={i} className="h-8 rounded-full" style={{ width: w, background: '#E5E0D4' }} />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-14 h-4 rounded shrink-0 mt-3" style={{ background: '#E5E0D4' }} />
              <div className="flex-1 rounded-xl p-4" style={{ background: 'white', border: '1px solid #E5E0D4', height: 80 + i * 20 }}>
                <div className="h-4 rounded w-2/3 mb-2" style={{ background: '#F0EBE3' }} />
                <div className="h-3 rounded w-1/3" style={{ background: '#F5F2EC' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
