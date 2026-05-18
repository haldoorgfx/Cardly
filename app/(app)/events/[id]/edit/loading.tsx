export default function EditorLoading() {
  return (
    <div className="h-screen bg-[#FAF6EE] flex flex-col overflow-hidden">
      {/* Toolbar skeleton */}
      <div className="h-12 bg-white border-b border-[#E5E0D4] flex items-center px-4 gap-3 shrink-0">
        <div className="h-6 w-6 rounded-md bg-[#E5E0D4]/70 animate-pulse" />
        <div className="h-4 w-32 rounded bg-[#E5E0D4]/70 animate-pulse" />
        <div className="flex-1" />
        <div className="h-7 w-20 rounded-lg bg-[#E5E0D4]/70 animate-pulse" />
        <div className="h-7 w-24 rounded-lg bg-[#E5E0D4]/70 animate-pulse" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left rail skeleton */}
        <div className="w-[52px] bg-white border-r border-[#E5E0D4] flex flex-col items-center py-3 gap-3 shrink-0">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 w-8 rounded-lg bg-[#E5E0D4]/70 animate-pulse" />
          ))}
        </div>

        {/* Canvas area skeleton */}
        <div className="flex-1 bg-[#FAF6EE] grid place-items-center">
          <div className="rounded-lg bg-[#E5E0D4]/50 animate-pulse" style={{ width: 300, height: 375 }} />
        </div>

        {/* Right rail skeleton */}
        <div className="w-[220px] bg-white border-l border-[#E5E0D4] p-4 space-y-4 shrink-0">
          <div className="h-3 w-24 rounded bg-[#E5E0D4]/70 animate-pulse" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-8 rounded-lg bg-[#E5E0D4]/70 animate-pulse" />
            ))}
          </div>
          <div className="h-px bg-[#E5E0D4]" />
          <div className="h-3 w-16 rounded bg-[#E5E0D4]/70 animate-pulse" />
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-7 rounded-md bg-[#E5E0D4]/70 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
