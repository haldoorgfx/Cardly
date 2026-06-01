export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Discover Events — Karta',
  description: 'Find and register for events near you.',
};

// Phase 1.2 — full discovery grid built here
export default function EventDiscoveryPage() {
  return (
    <div className="max-w-[1120px] mx-auto px-5 py-12">
      <div className="mb-10">
        <h1
          className="font-display font-semibold text-[40px] tracking-tight leading-tight"
          style={{ color: '#0F1F18', letterSpacing: '-0.025em' }}
        >
          Find your next event
        </h1>
        <p className="mt-3 text-[16px]" style={{ color: '#6B7A72' }}>
          Events from organizers around the world — with personalized Karta Cards.
        </p>
      </div>

      {/* Placeholder grid — replaced in Phase 1.2 */}
      <div
        className="rounded-2xl flex items-center justify-center py-24 text-center"
        style={{ background: 'white', border: '1px solid #E5E0D4' }}
      >
        <div>
          <div className="font-mono text-[11px] tracking-widest uppercase mb-2" style={{ color: '#6B7A72' }}>
            Coming in Phase 1.2
          </div>
          <div className="text-[15px]" style={{ color: '#3A4A42' }}>
            Photography-first event discovery grid
          </div>
        </div>
      </div>
    </div>
  );
}
