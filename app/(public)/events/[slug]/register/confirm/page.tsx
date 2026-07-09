export default async function RegisterConfirmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="container mx-auto px-4 py-16">
      <p className="text-sm font-mono text-[#6B7A72]">Phase 1.5 — Registration confirmation: {slug}</p>
    </div>
  );
}
