export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AttendeeFlow from './AttendeeFlow';
import VariantPickerClient from './VariantPickerClient';
import { ViewTracker } from './components/ViewTracker';
import { AttendeeBrandProvider } from '@/components/white-label/attendee-brand';
import { getWhiteLabelByEvent } from '@/lib/white-label/server';
import type { Zone, Variant } from '@/types/database';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('name')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!event) return {};

  const title = `${event.name} — Get your personalized card`;
  const description = `You're invited to ${event.name}. Add your name and photo, then download your personalized card in seconds.`;

  return {
    title: event.name,
    description,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/c/${slug}`,
      type: 'website',
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: event.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function AttendeePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const admin = createAdminClient();
  const isPreview = Boolean(preview);

  // In preview mode (from Test button in editor), allow draft events.
  // The preview token must match the event's own ID — obscurity-sufficient for a designer preview.
  let baseQuery = admin
    .from('events')
    .select('id, name, slug, status, view_count')
    .eq('slug', slug);

  if (!isPreview) {
    baseQuery = baseQuery.eq('status', 'published');
  }

  const { data: event } = await baseQuery.single();

  if (!event) notFound();

  // Verify preview token matches event ID to prevent enumeration of draft events
  if (isPreview && preview !== event.id) notFound();

  const { data: variantsData } = await admin
    .from('event_variants')
    .select('id, variant_name, variant_slug, background_url, background_width, background_height, zones, position')
    .eq('event_id', event.id)
    .order('position', { ascending: true });

  const variants = (variantsData ?? []) as unknown as Variant[];

  // No variants yet — show a friendly empty state instead of a hard 404
  if (variants.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 grid place-items-center mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-primary">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M8 12h8M12 8v8" />
          </svg>
        </div>
        <h1 className="font-display font-bold text-2xl text-ink mb-2">No card design yet</h1>
        <p className="text-muted text-[15px] max-w-xs leading-relaxed">
          {isPreview
            ? 'This is a preview. Go back to the canvas editor and add a variant with a background image and zones.'
            : 'The organizer hasn\'t finished setting up the card design yet. Check back soon.'}
        </p>
      </div>
    );
  }

  // Attendee-facing white-label branding (Studio plan), applied to every screen.
  const wl = await getWhiteLabelByEvent(event.id);
  const brand = {
    brandName: wl?.brandName ?? null,
    primaryColor: wl?.primaryColor ?? '#1F4D3A',
    hidePoweredBy: wl?.hidePoweredBy ?? false,
  };

  // Single variant — skip the picker and go straight to the form
  if (variants.length === 1) {
    const v = variants[0];
    return (
      <AttendeeBrandProvider value={brand}>
        {/* Don't count views in preview mode */}
        {!isPreview && <ViewTracker eventId={event.id} />}
        {isPreview && (
          <div className="fixed top-0 left-0 right-0 z-50 text-white text-center text-[12px] py-1.5 px-4" style={{ background: '#C97A2D' }}>
            🔍 Preview mode — this is how attendees will see your card. Not publicly visible until published.
          </div>
        )}
        <AttendeeFlow
          variantId={v.id}
          eventId={event.id}
          eventName={event.name}
          backgroundUrl={v.background_url ?? ''}
          backgroundWidth={v.background_width ?? 1080}
          backgroundHeight={v.background_height ?? 1350}
          zones={(v.zones as unknown as Zone[]) ?? []}
        />
      </AttendeeBrandProvider>
    );
  }

  // Multiple variants — show the picker
  return (
    <AttendeeBrandProvider value={brand}>
      {!isPreview && <ViewTracker eventId={event.id} />}
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-50 text-white text-center text-[12px] py-1.5 px-4" style={{ background: '#C97A2D' }}>
          🔍 Preview mode — this is how attendees will see your card. Not publicly visible until published.
        </div>
      )}
      <VariantPickerClient
        eventName={event.name}
        eventSlug={event.slug}
        variants={variants}
      />
    </AttendeeBrandProvider>
  );
}
