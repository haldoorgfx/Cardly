export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  return {
    title: `Event — Karta`,
    description: `Register and get your personalized Karta Card.`,
  };
}

// Phase 1.2 — full public event page built here
export default function PublicEventPage({ params }: Props) {
  return (
    <div className="max-w-[1000px] mx-auto px-5 py-12">
      <div
        className="rounded-2xl flex items-center justify-center py-24 text-center"
        style={{ background: 'white', border: '1px solid #E5E0D4' }}
      >
        <div>
          <div className="font-mono text-[11px] tracking-widest uppercase mb-2" style={{ color: '#6B7A72' }}>
            Phase 1.2 · /e/{params.slug}
          </div>
          <div className="text-[15px]" style={{ color: '#3A4A42' }}>
            Full-bleed hero event page with ticket cards and registration CTA
          </div>
        </div>
      </div>
    </div>
  );
}
