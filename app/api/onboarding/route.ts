import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { upsertEventRole } from '@/lib/rbac/assign';
import { slugifyBase } from '@/lib/slug';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    evType: string;
    orgName: string;
    region: string;
    currency: string;
    accent: string;
    brandColor?: string;
    evName: string;
    evStart: string;
    evEnd: string;
    venue: string;
    inviteEmails: string[];
  };

  const admin = createAdminClient();

  // Ensure profile row exists before updating it — guards against signup trigger failures.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('profiles').upsert(
    { id: user.id, email: user.email ?? '' },
    { onConflict: 'id', ignoreDuplicates: true },
  );

  // Save org name + mark onboarding as completed.
  // full_name is used as a completion signal on DBs that don't yet have
  // the onboarding_completed column — always set it to something.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('profiles')
    .update({
      full_name: body.orgName?.trim() || 'My Organization',
      onboarding_completed: true,
    })
    .eq('id', user.id);

  // Persist the brand colour chosen during onboarding. white_label_settings is
  // the brand-settings store (brand_name / primary_color / logo_url); upsert so
  // the choice survives (and is ready if the user later enables white-label)
  // instead of being silently discarded.
  if (body.brandColor && /^#[0-9a-fA-F]{6}$/.test(body.brandColor)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('white_label_settings').upsert(
      { user_id: user.id, primary_color: body.brandColor },
      { onConflict: 'user_id' },
    );
  }

  // Create first event if name provided
  if (body.evName.trim()) {
    const slug = slugifyBase(body.evName, 40) + '-' + Math.random().toString(36).slice(2, 6);

    const { data: newEvent } = await admin.from('events').insert({
      user_id: user.id,
      name: body.evName.trim(),
      slug,
      status: 'draft',
    }).select('id').single();

    // Create companion event_pages row so the event editor works immediately
    if (newEvent?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('event_pages').insert({
        event_id: newEvent.id,
        title:     body.evName.trim(),
        is_public: false,
        is_online: false,
        ...(body.venue ? { venue_name: body.venue } : {}),
        ...(body.evStart ? { starts_at: body.evStart } : {}),
        ...(body.evEnd   ? { ends_at:   body.evEnd   } : {}),
      });
    }

    // Roles write-path: the creator is the organizer of this first event.
    if (newEvent?.id) {
      await upsertEventRole({ userId: user.id, eventId: newEvent.id, role: 'organizer' });
    }
  }

  // Invite team members
  if (body.inviteEmails?.length) {
    // Queue invites — best-effort, don't block on errors
    await Promise.allSettled(
      body.inviteEmails.map(email =>
        fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/team/invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-internal': 'onboarding' },
          body: JSON.stringify({ email, inviter_id: user.id }),
        }).catch(() => null)
      )
    );
  }

  return NextResponse.json({ ok: true });
}
