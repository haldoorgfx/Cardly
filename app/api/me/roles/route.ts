import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVisibleSections } from '@/lib/rbac/sections';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me/roles — the adaptive-shell data source.
 *
 * Authenticates the request with the server (anon) client, then returns the
 * account's visible nav sections. The client shell (AppShell) fetches this and
 * renders role-gated nav from the flags. Never leaks other users' data — it
 * only ever resolves sections for the authenticated user.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'unauthenticated' },
      { status: 401 },
    );
  }

  const sections = await getVisibleSections(user.id);
  return NextResponse.json(sections);
}
