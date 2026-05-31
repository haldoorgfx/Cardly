export default function Loading() {
  return (
    <div className="flex-1 p-8 space-y-6 animate-pulse">
      <div className="h-8 w-36 bg-[#E5E0D4] rounded-lg" />
      <div className="grid grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-[#E5E0D4] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
