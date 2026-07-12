export default function AccessibilityLoading() {
  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 pb-24">
        <div className="h-4 w-28 rounded mb-4 animate-pulse" style={{ background: '#E5E0D4' }} />
        <div className="h-7 w-44 rounded mb-2 animate-pulse" style={{ background: '#E5E0D4' }} />
        <div className="h-4 w-80 max-w-full rounded mb-6 animate-pulse" style={{ background: '#EFEAE0' }} />
        <div className="h-14 rounded-xl mb-6 animate-pulse" style={{ background: '#E8EFEB' }} />
        <div className="bg-white rounded-2xl border p-5 mb-4" style={{ borderColor: '#E5E0D4' }}>
          <div className="h-8 w-24 rounded mb-4 animate-pulse" style={{ background: '#E5E0D4' }} />
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full animate-pulse" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }} />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E0D4' }}>
              <div className="h-4 w-36 rounded mb-3 animate-pulse" style={{ background: '#E5E0D4' }} />
              <div className="flex gap-2">
                {[0, 1].map((j) => (
                  <div key={j} className="h-7 w-28 rounded-full animate-pulse" style={{ background: '#E8EFEB' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
