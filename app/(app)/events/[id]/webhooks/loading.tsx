function Skel({ w, h, className }: { w?: string; h?: string; className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#E5E0D4]/60 ${className ?? ''}`} style={{ width: w, height: h }} />;
}

export default function WebhooksLoading() {
  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div><Skel w="160px" h="28px" className="mb-2" /><Skel w="260px" h="16px" /></div>
        <Skel w="140px" h="36px" />
      </div>
      <Skel h="52px" className="mb-7" />
      <Skel w="120px" h="14px" className="mb-3" />
      <div className="space-y-2.5 mb-7">{[...Array(3)].map((_, i) => <Skel key={i} h="68px" />)}</div>
      <Skel h="220px" />
    </div>
  );
}
