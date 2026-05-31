export default function Loading() {
  return (
    <div className="flex-1 p-8 space-y-6 animate-pulse">
      <div className="h-8 w-28 bg-[#E5E0D4] rounded-lg" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 bg-[#E5E0D4] rounded-xl" />
      ))}
    </div>
  );
}
