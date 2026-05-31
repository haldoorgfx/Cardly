export default function Loading() {
  return (
    <div className="flex-1 p-8 space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-[#E5E0D4] rounded-lg" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-[#E5E0D4] rounded-2xl" />
      ))}
    </div>
  );
}
