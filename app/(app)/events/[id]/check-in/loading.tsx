export default function CheckInLoading() {
  return (
    <div className="animate-pulse" style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <div className="h-[72px]" style={{ background: 'white', borderBottom: '1px solid #E5E0D4' }} />
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="h-7 rounded w-40 mb-1" style={{ background: '#E5E0D4' }} />
        <div className="h-4 rounded w-64 mb-8" style={{ background: '#F0EBE3' }} />

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
              <div className="h-8 rounded w-16 mb-2" style={{ background: '#E5E0D4' }} />
              <div className="h-3.5 rounded w-24" style={{ background: '#F0EBE3' }} />
            </div>
          ))}
        </div>

        {/* Scanner area */}
        <div className="rounded-2xl p-8 flex flex-col items-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
          <div className="w-64 h-64 rounded-2xl mb-4" style={{ background: '#F5F2EC' }} />
          <div className="h-4 rounded w-48 mb-2" style={{ background: '#E5E0D4' }} />
          <div className="h-3.5 rounded w-36" style={{ background: '#F0EBE3' }} />
        </div>

        {/* Recent check-ins */}
        <div className="mt-8">
          <div className="h-4 rounded w-32 mb-4" style={{ background: '#E5E0D4' }} />
          <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < 3 ? '1px solid #F0EBE3' : 'none' }}>
                <div className="w-9 h-9 rounded-full" style={{ background: '#E5E0D4' }} />
                <div className="flex-1">
                  <div className="h-3.5 rounded w-32 mb-1.5" style={{ background: '#E5E0D4' }} />
                  <div className="h-3 rounded w-20" style={{ background: '#F0EBE3' }} />
                </div>
                <div className="h-3 rounded w-16" style={{ background: '#F5F2EC' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
