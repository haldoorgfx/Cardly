export default function Loading() {
  return (
    <div className="flex-1 p-8 space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-[#E5E0D4] rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-[#E5E0D4] rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-[#E5E0D4] rounded-2xl" />
    </div>
  );
}
