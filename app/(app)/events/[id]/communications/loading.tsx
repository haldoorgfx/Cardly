function Skel({ w, h, className }: { w?: string; h?: string; className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#E5E0D4]/60 ${className ?? ''}`} style={{ width: w, height: h }} />;
}

export default function CommunicationsLoading() {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div><Skel w="180px" h="28px" className="mb-2" /><Skel w="260px" h="16px" /></div>
        <Skel w="120px" h="36px" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => <Skel key={i} h="88px" />)}
      </div>
      <Skel h="320px" />
    </div>
  );
}
