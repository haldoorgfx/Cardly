import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getVisibleSections } from '@/lib/rbac/sections';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { resolveEffectiveUserId } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me/shell — the adaptive-shell's client-side refresh data source.
 *
 * Mirrors exactly what app/(app)/layout.tsx computes server-side (nav
 * sections, profile/plan, event count, logo) so the two can never drift.
 * This replaced two separate client fetches — a raw Supabase profile/event
 * query and a call to the now-removed /api/me/roles — neither of which
 * were impersonation-aware or team-aware: they read `user.id` straight off
 * the browser session, so within moments of page load they silently
 * overwrote the server-rendered, impersonation/team-correct shell with the
 * real caller's own (possibly empty, possibly wrong) data.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'unauthenticated' }, { status: 401 });
  }

  const effective = await resolveEffectiveUserId(user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const [sections, profileRes, countRes, settingsRes] = await Promise.all([
    getVisibleSections(effective.id),
    admin.from('profiles').select('full_name, email, plan, role').eq('id', effective.id).single(),
    admin.from('events').select('id', { count: 'exact', head: true }).in('user_id', await manageableOwnerIds(effective.id)).neq('status', 'archived'),
    admin.from('site_settings').select('logo_light_url').eq('id', 1).maybeSingle(),
  ]);

  return NextResponse.json({
    sections,
    profile: profileRes?.data ?? null,
    eventCount: countRes?.count ?? 0,
    logoUrl: settingsRes?.data?.logo_light_url ?? null,
    // The real caller's id, for PostHog identify() — never the impersonation
    // target, so events stay attributed to the actual admin doing the viewing.
    realUserId: effective.realUserId,
  });
}
