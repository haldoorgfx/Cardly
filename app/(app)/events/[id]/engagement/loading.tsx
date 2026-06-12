export default function EngagementLoading() {
  return (
    <div className="animate-pulse" style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <div className="h-[72px]" style={{ background: 'white', borderBottom: '1px solid #E5E0D4' }} />
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="h-7 rounded w-36 mb-1" style={{ background: '#E5E0D4' }} />
        <div className="h-4 rounded w-72 mb-8" style={{ background: '#F0EBE3' }} />

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
              <div className="w-10 h-10 rounded-xl mb-4" style={{ background: '#E8EFEB' }} />
              <div className="h-5 rounded w-32 mb-2" style={{ background: '#E5E0D4' }} />
              <div className="h-3.5 rounded w-full mb-1.5" style={{ background: '#F0EBE3' }} />
              <div className="h-3.5 rounded w-3/4 mb-4" style={{ background: '#F0EBE3' }} />
              <div className="flex items-center justify-between">
                <div className="h-3.5 rounded w-20" style={{ background: '#F5F2EC' }} />
                <div className="h-8 rounded-lg w-24" style={{ background: '#E8EFEB' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
