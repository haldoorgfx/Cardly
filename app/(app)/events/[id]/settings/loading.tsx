function Skel({ w, h, className }: { w?: string; h?: string; className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#E5E0D4]/60 ${className ?? ''}`} style={{ width: w, height: h }} />;
}

export default function EventSettingsLoading() {
  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div><Skel w="140px" h="28px" className="mb-2" /><Skel w="200px" h="16px" /></div>
        <Skel w="120px" h="36px" />
      </div>
      <Skel w="320px" h="40px" className="mb-7 rounded-xl" />
      <Skel h="260px" className="mb-4" />
      <Skel h="180px" />
    </div>
  );
}
