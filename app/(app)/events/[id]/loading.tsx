function Skel({ w, h, className }: { w?: string; h?: string; className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#E5E0D4]/60 ${className ?? ''}`} style={{ width: w, height: h }} />;
}

export default function EventDetailLoading() {
  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      {/* Hero skeleton */}
      <div className="animate-pulse" style={{ height: 190, background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)', opacity: 0.6 }} />

      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-6 space-y-6">
        {/* Stats bar */}
        <div className="bg-white rounded-2xl border px-6 py-4 flex gap-8" style={{ borderColor: '#E5E0D4' }}>
          {[140, 80, 200, 120].map((w, i) => <Skel key={i} w={`${w}px`} h="24px" />)}
        </div>

        {/* Section label */}
        <Skel w="160px" h="12px" />

        {/* Action cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <Skel key={i} h="110px" />)}
        </div>
      </div>
    </div>
  );
}
