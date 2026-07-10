export default function CateringLoading() {
  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 pb-24">
        <div className="h-4 w-28 rounded mb-4 animate-pulse" style={{ background: '#E5E0D4' }} />
        <div className="h-7 w-40 rounded mb-2 animate-pulse" style={{ background: '#E5E0D4' }} />
        <div className="h-4 w-72 max-w-full rounded mb-8 animate-pulse" style={{ background: '#EFEAE0' }} />
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E0D4' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl animate-pulse" style={{ background: '#E8EFEB' }} />
                <div className="flex-1">
                  <div className="h-4 w-40 rounded mb-2 animate-pulse" style={{ background: '#E5E0D4' }} />
                  <div className="h-3 w-24 rounded animate-pulse" style={{ background: '#EFEAE0' }} />
                </div>
              </div>
              <div className="space-y-1.5">
                {[0, 1].map((j) => (
                  <div key={j} className="h-10 rounded-xl animate-pulse" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
