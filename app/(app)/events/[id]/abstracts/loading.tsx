export default function AbstractsLoading() {
  return (
    <div className="animate-pulse" style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <div className="h-[72px]" style={{ background: 'white', borderBottom: '1px solid #E5E0D4' }} />
      <div className="px-10 pt-7">
        <div className="flex gap-8 mb-4">
          {[80, 60, 55, 70].map((w, i) => (
            <div key={i} className="h-4 rounded" style={{ width: w, background: '#E5E0D4' }} />
          ))}
        </div>
        <div className="h-px w-full mb-0" style={{ background: '#E5E0D4' }} />
      </div>
      <div className="flex flex-col lg:grid" style={{ gridTemplateColumns: '400px 1fr', height: 'calc(100vh - 160px)' }}>
        <div style={{ borderRight: '1px solid #E5E0D4', padding: '16px 24px' }} className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4" style={{ border: '1px solid #E5E0D4', background: 'white' }}>
              <div className="h-4 rounded mb-2" style={{ width: '80%', background: '#E5E0D4' }} />
              <div className="h-3 rounded mb-3" style={{ width: '50%', background: '#F0EBE3' }} />
              <div className="flex gap-2">
                <div className="h-5 w-20 rounded-full" style={{ background: '#F0EBE3' }} />
                <div className="h-5 w-16 rounded-full" style={{ background: '#F0EBE3' }} />
              </div>
            </div>
          ))}
        </div>
        <div className="p-8 space-y-4">
          <div className="h-7 rounded w-2/3" style={{ background: '#E5E0D4' }} />
          <div className="h-4 rounded w-1/3" style={{ background: '#F0EBE3' }} />
          <div className="flex gap-2 mt-2">
            {[60, 70, 55].map((w, i) => <div key={i} className="h-5 rounded-full" style={{ width: w, background: '#E8EFEB' }} />)}
          </div>
          <div className="space-y-2 mt-4">
            {[100, 95, 90, 85, 80].map((w, i) => (
              <div key={i} className="h-3.5 rounded" style={{ width: `${w}%`, background: '#F0EBE3' }} />
            ))}
          </div>
          <div className="rounded-2xl p-5 mt-6" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <div className="h-5 rounded w-32 mb-4" style={{ background: '#E5E0D4' }} />
            <div className="flex gap-2 flex-wrap">
              {[80, 70, 100, 90, 75].map((w, i) => (
                <div key={i} className="h-9 rounded-full" style={{ width: w, background: '#F0EBE3' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
