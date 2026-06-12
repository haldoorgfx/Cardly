function Skel({ w, h, className }: { w?: string; h?: string; className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#E5E0D4]/60 ${className ?? ''}`} style={{ width: w, height: h }} />;
}

export default function IntegrationsLoading() {
  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div><Skel w="180px" h="28px" className="mb-2" /><Skel w="280px" h="16px" /></div>
        <Skel w="120px" h="36px" />
      </div>
      <Skel h="72px" className="mb-8" />
      {[...Array(3)].map((_, s) => (
        <div key={s} className="mb-8">
          <Skel w="100px" h="12px" className="mb-4" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skel key={i} h="148px" />)}
          </div>
        </div>
      ))}
    </div>
  );
}
