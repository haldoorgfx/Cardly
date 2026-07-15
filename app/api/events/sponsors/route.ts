import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';
import { getUserPlan } from '@/lib/billing/can';

// Optional sponsor contact email — trimmed; empty string coerces to undefined.
const contactEmailSchema = z
  .string()
  .trim()
  .email()
  .optional()
  .or(z.literal('').transform(() => undefined));

/**
 * Best-effort: if a sponsor's contact_email maps to an existing account, grant
 * that account the event-scoped 'sponsor' role so the unified "Sponsoring"
 * section lights up. Never throws — the primary sponsor write is authoritative.
 */
async function linkSponsorRoleByEmail(email: string | null | undefined, eventId: string): Promise<void> {
  if (!email || !eventId) return;
  const userId = await resolveAccountIdByEmail(email);
  if (userId) {
    await upsertEventRole({ userId, eventId, role: 'sponsor' });
  }
}

export async function PATCH(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { sponsor_id, company_name, tier, booth_location, website_url, logo_url, contact_email } = body;
  if (!sponsor_id) return NextResponse.json({ error: 'sponsor_id required' }, { status: 400 });

  // Validate the optional contact email (undefined = leave unchanged, '' = clear).
  let normalizedEmail: string | null | undefined;
  if (contact_email !== undefined) {
    const parsed = contactEmailSchema.safeParse(contact_email);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid contact email' }, { status: 400 });
    normalizedEmail = parsed.data ?? null; // '' → null clears it
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  // Verify ownership via event
  const { data: sponsor } = await admin.from('sponsors').select('id, event_id').eq('id', sponsor_id).single();
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data: event } = await admin.from('events').select('id').eq('id', sponsor.event_id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const patch: Record<string, unknown> = {};
  if (company_name !== undefined) patch.company_name = company_name;
  if (tier !== undefined) patch.tier = tier;
  if (booth_location !== undefined) patch.booth_location = booth_location || null;
  if (website_url !== undefined) patch.website_url = website_url || null;
  if (logo_url !== undefined) patch.logo_url = logo_url || null;
  if (normalizedEmail !== undefined) patch.contact_email = normalizedEmail;

  const { data, error } = await admin.from('sponsors').update(patch).eq('id', sponsor_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort: link the sponsor's account by email → 'sponsor' role (additive).
  if (normalizedEmail) {
    await linkSponsorRoleByEmail(normalizedEmail, sponsor.event_id as string);
  }

  return NextResponse.json({ sponsor: data });
}

export async function DELETE(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sponsorId = searchParams.get('id');
  if (!sponsorId) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: sponsor } = await admin.from('sponsors').select('id, event_id').eq('id', sponsorId).single();
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data: event } = await admin.from('events').select('id').eq('id', sponsor.event_id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await admin.from('sponsors').delete().eq('id', sponsorId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { event_id, company_name, tier, booth_location, website_url, contact_email } = body;
  if (!event_id || !company_name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Sponsors is a Studio-plan feature (see app/(app)/events/[id]/sponsors/page.tsx
  // and UpgradeSlideOver) — enforce server-side, not just the dashboard page gate.
  const plan = await getUserPlan(user.id);
  if (plan !== 'studio') {
    return NextResponse.json({ error: 'Sponsors requires the Studio plan.' }, { status: 402 });
  }

  // Validate the optional contact email.
  const parsedEmail = contactEmailSchema.safeParse(contact_email);
  if (!parsedEmail.success) return NextResponse.json({ error: 'Invalid contact email' }, { status: 400 });
  const contactEmail = parsedEmail.data ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  // Verify ownership
  const { data: event } = await admin.from('events').select('id').eq('id', event_id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const invite_token = randomUUID();

  const { data: sponsor, error } = await admin
    .from('sponsors')
    .insert({
      event_id,
      company_name,
      tier: tier || 'standard',
      booth_location: booth_location || null,
      website_url: website_url || null,
      contact_email: contactEmail,
      invite_token,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort: link the sponsor's account by email → 'sponsor' role (additive).
  if (contactEmail) {
    await linkSponsorRoleByEmail(contactEmail, event_id as string);
  }

  return NextResponse.json({ sponsor });
}
