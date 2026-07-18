import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { upsertEventRole } from '@/lib/rbac/assign';
import { slugifyBase } from '@/lib/slug';
import { getMyTeam, createTeam, getTeamMembers, getTeamInvites, createInvite } from '@/lib/teams/queries';
import { sendTeamInviteEmail } from '@/lib/email';
import { PLANS } from '@/lib/billing/plans';

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

    // Persist the currency the organizer chose during onboarding as this
    // event's default (best-effort — a separate update so a missing column
    // can never fail the event insert itself).
    if (newEvent?.id && body.currency?.trim()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('events').update({ currency: body.currency.trim() }).eq('id', newEvent.id);
    }

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

  // Invite team members — best-effort. The old code POSTed to /api/team/invite,
  // a route that does not exist, so every invite was silently dropped. Wire it
  // through the real team helpers instead: ensure a team exists, respect the
  // plan's seat limit, create each invite, and email the accept link.
  if (body.inviteEmails?.length) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (admin as any)
        .from('profiles').select('plan, full_name, email').eq('id', user.id).single();
      const plan = (profile?.plan ?? 'free') as 'free' | 'pro' | 'studio';
      const seatLimit = PLANS[plan].teamSeats;

      // Only provision a team + invites for plans that actually allow teammates.
      if (seatLimit > 1) {
        const team = (await getMyTeam(user.id))
          ?? (await createTeam(user.id, `${body.orgName?.trim() || 'My'} Team`));
        const members = await getTeamMembers(team.id);
        const pending = (await getTeamInvites(team.id)).filter(i => !i.accepted_at).length;
        let used = members.length + pending;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

        for (const raw of body.inviteEmails) {
          const email = raw.trim().toLowerCase();
          if (!email || used >= seatLimit) break;
          try {
            const invite = await createInvite(team.id, email, 'member', user.id);
            used++;
            sendTeamInviteEmail({
              to: email,
              teamName: team.name,
              inviterName: profile?.full_name ?? profile?.email ?? 'Someone',
              acceptUrl: `${appUrl}/team/invite/${invite.token}`,
              role: 'member',
            }).catch(() => {});
          } catch { /* skip a duplicate/invalid email, keep going */ }
        }
      }
    } catch { /* team invites are best-effort during onboarding */ }
  }

  return NextResponse.json({ ok: true });
}
