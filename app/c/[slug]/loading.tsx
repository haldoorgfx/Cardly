export default function AttendeeLoading() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col items-center px-4 py-6">
      {/* Header */}
      <div className="w-full max-w-[420px] flex items-center justify-between mb-6">
        <div className="h-5 w-20 rounded bg-[#E5E0D4]/70 animate-pulse" />
        <div className="h-5 w-16 rounded bg-[#E5E0D4]/70 animate-pulse" />
      </div>

      {/* Card preview skeleton */}
      <div
        className="w-full max-w-[420px] rounded-2xl bg-[#E5E0D4]/50 animate-pulse mb-6"
        style={{ aspectRatio: '4/5' }}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 mb-6">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1.5 rounded-full animate-pulse ${i === 0 ? 'w-6 bg-[#1F4D3A]/40' : 'w-3 bg-[#E5E0D4]/70'}`}
          />
        ))}
      </div>

      {/* Form field skeleton */}
      <div className="w-full max-w-[420px] space-y-3">
        <div className="h-3 w-20 rounded bg-[#E5E0D4]/70 animate-pulse" />
        <div className="h-12 w-full rounded-xl bg-[#E5E0D4]/50 animate-pulse" />
        <div className="h-12 w-full rounded-xl bg-[#1F4D3A]/20 animate-pulse mt-4" />
      </div>
    </div>
  );
}
