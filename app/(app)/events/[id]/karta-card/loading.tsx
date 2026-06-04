function Skel({ w, h, className }: { w?: string; h?: string; className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#E5E0D4]/60 ${className ?? ''}`} style={{ width: w, height: h }} />;
}

export default function KartaCardLoading() {
  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div><Skel w="160px" h="28px" className="mb-2" /><Skel w="240px" h="16px" /></div>
        <div className="flex gap-2"><Skel w="160px" h="36px" /><Skel w="120px" h="36px" /></div>
      </div>
      <Skel h="44px" className="mb-7" />
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <Skel h="300px" />
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <Skel key={i} h="100px" />)}</div>
          <Skel h="160px" />
          <Skel h="200px" />
        </div>
      </div>
    </div>
  );
}
