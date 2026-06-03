export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import type { Metadata } from 'next';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await resolvePublicSlug(params.slug);
  return { title: `Sponsors — ${resolved?.eventPageTitle ?? 'Event'}` };
}

export default async function SponsorsPage({ params }: Props) {
  const admin = createAdminClient();
  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { eventPageTitle, event } = resolved;

  // Fetch event page for organizer contact link
  const { data: ep } = await admin
    .from('event_pages')
    .select('custom_slug, organizer_name')
    .eq('event_id', event.id)
    .eq('is_public', true)
    .single();

  const eventName = eventPageTitle ?? event.name;
  const contactLink = `/e/${params.slug}/register`;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />

      <div className="max-w-[880px] mx-auto px-5 pb-24">

        {/* Header */}
        <div className="py-14 text-center">
          <h1 className="font-display font-medium text-[28px]" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
            Partners &amp; Sponsors
          </h1>
          <p className="text-[16px] mt-2" style={{ color: '#6B7A72' }}>
            {eventName} is made possible by…
          </p>
        </div>

        {/* Placeholder — no sponsors configured */}
        <div
          className="rounded-2xl py-16 text-center mb-12"
          style={{ border: '1px solid #E5E0D4', background: 'white' }}
        >
          <div className="text-[15px] font-medium mb-2" style={{ color: '#1F4D3A' }}>
            Sponsors coming soon
          </div>
          <p className="text-[14px] max-w-[380px] mx-auto" style={{ color: '#6B7A72' }}>
            The organizer hasn&apos;t added sponsors yet. Check back closer to the event.
          </p>
        </div>

        {/* CTA */}
        <div
          className="rounded-2xl px-10 py-9 text-center"
          style={{ background: '#F5F2EB', border: '1px solid #E5E0D4' }}
        >
          <h3 className="font-display font-medium text-[20px]" style={{ color: '#1F4D3A' }}>
            Interested in sponsoring?
          </h3>
          <p className="text-[14px] mt-2 mb-5" style={{ color: '#6B7A72' }}>
            Reach attendees and showcase your brand at {eventName}.
          </p>
          <a
            href={contactLink}
            className="inline-flex items-center h-11 px-7 rounded-xl font-display font-semibold text-[14px] transition hover:opacity-90"
            style={{ background: '#E8C57E', color: '#163828' }}
          >
            Contact organizer
          </a>
        </div>

      </div>
    </div>
  );
}
