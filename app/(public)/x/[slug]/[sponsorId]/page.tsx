export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Store, Globe, ArrowLeft, ExternalLink } from 'lucide-react';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { ownedSponsor } from '@/lib/rbac/ownership';
import { PublicNav } from '@/components/events/PublicNav';

interface Props { params: { slug: string; sponsorId: string } }

export async function generateMetadata() {
  return { title: 'Sponsor' };
}

// PUBLIC read-only sponsor showcase — what a stranger sees.
// The sponsor's own MANAGEMENT workspace (booth editing, leads, resources,
// team) lives in the dashboard at /sponsoring/[sponsorId] (or the token-gated
// /exhibitor/[token] portal); a logged-in owner landing here is redirected.
// The old open portal on this route exposed every sponsor's leads publicly and
// allowed anyone to edit any booth — it is retired.
export default async function PublicSponsorPage({ params }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sponsor } = await (admin as any)
    .from('sponsors')
    .select('id, company_name, tagline, description, website_url, logo_url, tier, booth_location, offerings, event_id')
    .eq('id', params.sponsorId)
    .eq('event_id', event.id)
    .single();

  if (!sponsor) notFound();

  // Owner? → their workspace lives inside the dashboard.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const owned = await ownedSponsor(user.id, params.sponsorId);
    if (owned) redirect(`/sponsoring/${params.sponsorId}`);
  }

  const offerings = Array.isArray(sponsor.offerings) ? sponsor.offerings : [];

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <div className="max-w-[680px] mx-auto px-5 py-10">
        <Link href={`/e/${params.slug}?tab=sponsors`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-6"
          style={{ color: '#6B7A72' }}>
          <ArrowLeft size={14} strokeWidth={2} /> {event.name}
        </Link>

        <div className="bg-white rounded-2xl border p-6 sm:p-8" style={{ borderColor: '#E5E0D4' }}>
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 grid place-items-center"
              style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
              {sponsor.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sponsor.logo_url} alt={sponsor.company_name} className="w-full h-full object-contain p-2" />
              ) : (
                <Store size={26} strokeWidth={1.6} style={{ color: '#1F4D3A' }} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                  {sponsor.company_name}
                </h1>
                {sponsor.tier && (
                  <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium"
                    style={{ background: 'rgba(232,197,126,0.18)', color: '#C9A45E', border: '1px solid rgba(232,197,126,0.4)' }}>
                    {sponsor.tier} sponsor
                  </span>
                )}
              </div>
              {sponsor.tagline && (
                <p className="text-[14px] mt-1" style={{ color: '#3A4A42' }}>{sponsor.tagline}</p>
              )}
              {sponsor.booth_location && (
                <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>Booth {sponsor.booth_location}</p>
              )}
              {sponsor.website_url && (
                <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-[13px] font-medium"
                  style={{ color: '#1F4D3A' }}>
                  <Globe size={14} strokeWidth={1.8} /> Website
                </a>
              )}
            </div>
          </div>

          {sponsor.description && (
            <p className="text-[14px] leading-[1.7] mt-6 whitespace-pre-line" style={{ color: '#3A4A42' }}>
              {sponsor.description}
            </p>
          )}
        </div>

        {offerings.length > 0 && (
          <div className="bg-white rounded-2xl border mt-4 overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
            <div className="px-6 py-4 font-display font-semibold text-[15px]" style={{ color: '#0F1F18', borderBottom: '1px solid #E5E0D4' }}>
              Offerings
            </div>
            <ul>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {offerings.map((o: any, i: number) => (
                <li key={i} className="px-6 py-4 flex items-center gap-3"
                  style={{ borderTop: i > 0 ? '1px solid #F0EDE6' : 'none' }}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>{o.title}</div>
                    {o.type && <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{o.type}</div>}
                  </div>
                  {o.url && (
                    <a href={o.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium shrink-0"
                      style={{ color: '#1F4D3A' }}>
                      Open <ExternalLink size={13} strokeWidth={2} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
