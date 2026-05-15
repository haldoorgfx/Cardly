function Skel({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} />;
}

export default function PublishLoading() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col">
      <div className="h-14 bg-white border-b border-[#E5E0D4] flex items-center px-6 gap-3">
        <Skel className="h-8 w-8 rounded-md" />
        <Skel className="h-4 w-32" />
      </div>

      <main className="flex-1 flex flex-col items-center px-4 py-10 max-w-2xl mx-auto w-full">
        <Skel className="h-7 w-48 mb-2" />
        <Skel className="h-4 w-72 mb-10" />

        <div className="w-full bg-white rounded-2xl border border-[#E5E0D4] p-6 mb-5">
          <Skel className="h-5 w-32 mb-3" />
          <Skel className="h-10 w-full rounded-xl mb-3" />
          <div className="flex gap-3">
            <Skel className="h-10 flex-1 rounded-xl" />
            <Skel className="h-10 flex-1 rounded-xl" />
          </div>
        </div>

        <div className="w-full bg-white rounded-2xl border border-[#E5E0D4] p-6">
          <Skel className="h-5 w-20 mb-4" />
          <div className="flex items-center gap-4">
            <Skel className="h-20 w-20 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skel className="h-4 w-3/4" />
              <Skel className="h-3 w-1/2" />
              <Skel className="h-3 w-24" />
            </div>
          </div>
        </div>

        <Skel className="mt-8 h-12 w-48 rounded-2xl" />
      </main>
    </div>
  );
}
