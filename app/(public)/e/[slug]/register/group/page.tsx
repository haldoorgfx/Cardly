export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { GroupRegistrationClient } from '@/components/registration/GroupRegistrationClient';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  return { title: `Group Registration — ${params.slug}` };
}

export default async function GroupRegistrationPage({ params }: Props) {
  const admin = createAdminClient();
  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // /api/events/[id]/group-register is organizer-only (401 for everyone else),
  // but this page sat on a public URL with no gate — an attendee could pick
  // tickets, type in a dozen colleagues' names and emails, hit Register and only
  // then be told to "sign in with the organizer account". Say so up front and
  // send them to the flow that actually works for them.
  let canManage = false;
  try {
    const { data: { user } } = await createClient().auth.getUser();
    if (user) {
      const ownerIds = await manageableOwnerIds(user.id);
      const { data: managed } = await admin
        .from('events')
        .select('id')
        .eq('id', event.id)
        .in('user_id', ownerIds)
        .maybeSingle();
      canManage = !!managed;
    }
  } catch { /* treated as "not the organizer" */ }

  if (!canManage) {
    return (
      <div className="min-h-screen flex items-start sm:items-center justify-center px-5 py-12" style={{ background: '#FAF6EE' }}>
        <div className="w-full max-w-[440px] rounded-2xl p-6 sm:p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
          <h1 className="font-display font-semibold text-[22px] mb-2.5" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
            Group registration is for organizers
          </h1>
          <p className="text-[14px] mb-6" style={{ color: '#3A4A42', lineHeight: 1.6 }}>
            Only {event.name}&rsquo;s organizing team can register a group of people at once. To get your own ticket, use the normal registration form — you can register each colleague from there with their own email.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href={`/e/${params.slug}/register`}
              className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-[14px] font-semibold text-white"
              style={{ background: '#1F4D3A' }}
            >
              Register for this event
            </Link>
            <Link
              href={`/e/${params.slug}`}
              className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-[14px] font-semibold"
              style={{ border: '1px solid #E5E0D4', color: '#3A4A42' }}
            >
              Back to event
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const [{ data: tickets }, { data: ep }, { count: confirmedCount }] = await Promise.all([
    adminAny
      .from('ticket_types')
      .select('id, name, description, price, currency, quantity, quantity_sold, is_visible')
      .eq('event_id', event.id)
      .eq('is_visible', true)
      .order('price', { ascending: true }),
    adminAny.from('event_pages').select('max_capacity').eq('event_id', event.id).maybeSingle(),
    adminAny.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', event.id).in('status', ['confirmed', 'checked_in']),
  ]);

  const available = (tickets ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any) => t.quantity === null || t.quantity_sold < t.quantity
  );

  return (
    <GroupRegistrationClient
      eventId={event.id}
      eventName={event.name}
      eventSlug={params.slug}
      tickets={available}
      maxCapacity={ep?.max_capacity ?? null}
      confirmedCount={confirmedCount ?? 0}
    />
  );
}
