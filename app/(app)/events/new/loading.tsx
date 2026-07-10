function Skel({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} />;
}

export default function NewEventLoading() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col">
      {/* Header */}
      <div className="h-14 bg-white border-b border-[#E5E0D4] flex items-center px-6 gap-3">
        <Skel className="h-8 w-8 rounded-md" />
        <Skel className="h-4 w-36" />
        <div className="flex-1" />
        <div className="hidden md:flex items-center gap-3">
          <Skel className="h-6 w-20" />
          <Skel className="h-px w-8" />
          <Skel className="h-6 w-24" />
          <Skel className="h-px w-8" />
          <Skel className="h-6 w-16" />
        </div>
        <div className="w-[88px]" />
      </div>

      <main className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-[680px]">
          <Skel className="h-7 w-48 mb-2" />
          <Skel className="h-4 w-80 mb-6" />
          {/* Upload zone */}
          <div className="rounded-lg border-2 border-dashed border-[#E5E0D4] bg-white px-5 py-20 flex flex-col items-center gap-4">
            <Skel className="h-12 w-12 rounded-lg" />
            <Skel className="h-5 w-40" />
            <Skel className="h-4 w-56" />
            <div className="flex gap-2 mt-2">
              <Skel className="h-7 w-20 rounded-md" />
              <Skel className="h-7 w-20 rounded-md" />
              <Skel className="h-7 w-20 rounded-md" />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <Skel className="h-4 w-16" />
            <Skel className="h-9 w-36 rounded-md" />
          </div>
        </div>
      </main>
    </div>
  );
}
