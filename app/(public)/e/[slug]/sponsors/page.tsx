export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import Link from 'next/link';

interface Props { params: { slug: string } }

interface Sponsor {
  id: string;
  company_name: string;
  tagline: string | null;
  logo_url: string | null;
  website_url: string | null;
  tier: string;
  position: number;
}

const TIER_ORDER = ['platinum', 'gold', 'silver', 'standard'];
const TIER_LABELS: Record<string, string> = {
  platinum: 'Title Sponsors',
  gold: 'Gold Sponsors',
  silver: 'Silver Sponsors',
  standard: 'Community Partners',
};

export default async function SponsorsPage({ params }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sponsors } = await (admin as any)
    .from('sponsors')
    .select('id, company_name, tagline, logo_url, website_url, tier, position')
    .eq('event_id', event.id)
    .eq('is_visible', true)
    .order('position', { ascending: true });

  const allSponsors: Sponsor[] = sponsors ?? [];

  const byTier = TIER_ORDER.reduce<Record<string, Sponsor[]>>((acc, t) => {
    acc[t] = allSponsors.filter(s => s.tier === t);
    return acc;
  }, {});

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />

      <div className="max-w-[800px] mx-auto px-5 pb-24">
        {/* Header */}
        <div className="py-14 text-center">
          <h1
            className="font-display font-normal text-[28px]"
            style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}
          >
            Partners &amp; Sponsors
          </h1>
          <p className="text-[16px] mt-1.5" style={{ color: '#6B7A72' }}>
            {event.name} is made possible by…
          </p>
        </div>

        {allSponsors.length === 0 ? (
          /* No sponsors yet — show organizer CTA */
          <div className="text-center py-8" />
        ) : (
          TIER_ORDER.filter(t => byTier[t].length > 0).map(tier => (
            <div key={tier}>
              {/* Tier label */}
              <div
                className="text-center text-[11px] font-medium tracking-[0.08em] uppercase mb-5"
                style={{ color: '#6B7A72', marginTop: 56 }}
              >
                {TIER_LABELS[tier]}
              </div>

              {/* Title / Platinum — 2-col */}
              {tier === 'platinum' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {byTier[tier].map(s => (
                    <SponsorCard key={s.id} sponsor={s} slug={params.slug} gold />
                  ))}
                </div>
              )}

              {/* Gold — 3-col */}
              {tier === 'gold' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {byTier[tier].map(s => (
                    <SponsorCard key={s.id} sponsor={s} slug={params.slug} />
                  ))}
                </div>
              )}

              {/* Silver — 3-col, smaller */}
              {tier === 'silver' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {byTier[tier].map(s => (
                    <SponsorCard key={s.id} sponsor={s} slug={params.slug} small />
                  ))}
                </div>
              )}

              {/* Community / standard — flex row greyscale */}
              {tier === 'standard' && (
                <div className="flex flex-wrap gap-10 justify-center items-center py-2">
                  {byTier[tier].map(s => (
                    <Link
                      key={s.id}
                      href={`/e/${params.slug}/sponsors/${s.id}`}
                      className="font-display font-medium text-[18px] transition-all"
                      style={{ color: '#6B7A72', opacity: 0.55, filter: 'grayscale(1)' }}
                    >
                      {s.company_name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {/* Organizer CTA */}
        <div
          className="mt-20 rounded-2xl px-10 py-9 text-center"
          style={{ background: 'white', border: '1px solid #E5E0D4' }}
        >
          <h3
            className="font-display font-normal text-[20px] mb-2"
            style={{ color: '#1F4D3A' }}
          >
            Interested in sponsoring?
          </h3>
          <p className="text-[14px] mb-5" style={{ color: '#6B7A72' }}>
            Reach thousands of founders, engineers, and investors at {event.name}.
          </p>
          <a
            href={`mailto:?subject=Sponsorship inquiry — ${event.name}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-display font-medium text-[15px] transition-opacity hover:opacity-90"
            style={{ background: '#E8C57E', color: '#0F1F18' }}
          >
            Contact organizer
          </a>
        </div>
      </div>
    </div>
  );
}

function SponsorCard({
  sponsor, slug, gold = false, small = false,
}: {
  sponsor: Sponsor;
  slug: string;
  gold?: boolean;
  small?: boolean;
}) {
  const logoH = small ? 56 : gold ? 80 : 64;
  return (
    <div
      className="rounded-2xl flex flex-col items-center text-center p-7"
      style={{
        border: `1px solid ${gold ? '#E8C57E' : '#E5E0D4'}`,
        background: 'white',
      }}
    >
      {/* Logo / wordmark */}
      <div
        className="flex items-center justify-center font-display font-medium w-full"
        style={{ height: logoH, fontSize: small ? 22 : gold ? 30 : 24, color: '#1F4D3A' }}
      >
        {sponsor.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sponsor.logo_url}
            alt={sponsor.company_name}
            className="max-h-full object-contain"
            style={{ maxWidth: '80%' }}
          />
        ) : (
          sponsor.company_name
        )}
      </div>

      {!small && (
        <>
          <div
            className="font-display font-medium mt-4"
            style={{ fontSize: gold ? 20 : 16, color: '#1F4D3A' }}
          >
            {sponsor.company_name}
          </div>
          {sponsor.tagline && (
            <div className="text-[14px] mt-1.5" style={{ color: '#6B7A72' }}>
              {sponsor.tagline}
            </div>
          )}
        </>
      )}

      <Link
        href={`/e/${slug}/sponsors/${sponsor.id}`}
        className="font-medium mt-4 text-[14px] transition-colors hover:opacity-70"
        style={{ color: '#1F4D3A' }}
      >
        {gold ? 'View booth →' : 'Visit booth →'}
      </Link>
    </div>
  );
}
