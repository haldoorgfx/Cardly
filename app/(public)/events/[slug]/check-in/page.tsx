export default async function CheckInPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="container mx-auto px-4 py-16">
      <p className="text-sm font-mono text-[#6B7A72]">Phase 1.8 — QR check-in scanner: {slug}</p>
    </div>
  );
}
