export default function Loading() {
  return (
    <div className="flex-1 p-8 space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-[#E5E0D4] rounded-lg" />
      <div className="grid grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-56 bg-[#E5E0D4] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
