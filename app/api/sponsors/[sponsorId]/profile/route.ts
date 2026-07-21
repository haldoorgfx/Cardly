import { createAdminClient, createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ownedSponsor } from '@/lib/rbac/ownership';
import { zSafeUrl } from '@/lib/url/safeUrl';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

const Schema = z.object({
  /** Exhibitor-portal callers authenticate with the sponsor's invite token. */
  token: z.string().optional(),
  company_name: z.string().min(1).max(200).trim().optional(),
  tagline: z.string().max(300).trim().nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  // NOT z.string().url() — that accepts `javascript:alert(1)`, which is then
  // rendered as an href on the public booth page. See lib/url/safeUrl.ts.
  website_url: zSafeUrl,
  booth_location: z.string().max(100).trim().nullable().optional(),
  offerings: z.array(z.object({
    title: z.string().max(200),
    type: z.string().max(50).optional(),
    url: z.string().max(2000).optional(),
    opens: z.number().int().min(0).optional(),
  })).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { sponsorId: string } }
) {
  const raw = await req.json().catch(() => null);
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // AuthZ (this route was previously open): allow
  //  1. a valid invite token for THIS sponsor (token portal, account-less), or
  //  2. the logged-in owner of the sponsor record, or
  //  3. the event's organizer.
  const { token, ...updates } = parsed.data;
  let allowed = false;

  if (token) {
    const { data: byToken } = await adminAny
      .from('sponsors')
      .select('id')
      .eq('id', params.sponsorId)
      .eq('invite_token', token)
      .maybeSingle();
    allowed = Boolean(byToken);
  }

  if (!allowed) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      allowed = Boolean(await ownedSponsor(user.id, params.sponsorId));
      if (!allowed) {
        const { data: sponsorRow } = await adminAny
          .from('sponsors')
          .select('event_id')
          .eq('id', params.sponsorId)
          .maybeSingle();
        if (sponsorRow?.event_id) {
          const { data: event } = await adminAny
            .from('events')
            .select('id')
            .eq('id', sponsorRow.event_id)
            .in('user_id', await manageableOwnerIds(user.id))
            .maybeSingle();
          allowed = Boolean(event);
        }
      }
    }
  }

  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await adminAny
    .from('sponsors')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', params.sponsorId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
