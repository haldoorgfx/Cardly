export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
  searchParams: { ticket?: string; step?: string };
}

// Phase 1.5 / 1.6 — registration + payment + card built here
export default function RegisterPage({ params, searchParams }: Props) {
  return (
    <div className="max-w-[960px] mx-auto px-5 py-12">
      <div
        className="rounded-2xl flex items-center justify-center py-24 text-center"
        style={{ background: 'white', border: '1px solid #E5E0D4' }}
      >
        <div>
          <div className="font-mono text-[11px] tracking-widest uppercase mb-2" style={{ color: '#6B7A72' }}>
            Phase 1.5 · /e/{params.slug}/register
          </div>
          <div className="text-[15px]" style={{ color: '#3A4A42' }}>
            4-step registration: ticket → details → payment → Karta Card
          </div>
        </div>
      </div>
    </div>
  );
}
