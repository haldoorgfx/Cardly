export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { RoleBand } from '@/components/workspace/RoleBand';
import { resolveEventRoles, roleLinks } from '@/lib/workspace/eventRoles';

/**
 * Adds the cross-role band above every sponsor workspace tab.
 *
 * A layout rather than a prop threaded through all eight pages (overview,
 * leads, meetings, booth, products, preview, resources, team) — one place to
 * change, and no page can forget it.
 *
 * Auth and sponsor ownership stay where they were, on the pages themselves via
 * requireSponsorWorkspace. This only decides whether to draw a switcher, and
 * RoleBand renders nothing unless the account genuinely holds a second role at
 * the same event, so a failed lookup here degrades to exactly today's UI.
 */
export default async function SponsorWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sponsorId: string }>;
}) {
  const { sponsorId } = await params;

  let band: React.ReactNode = null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const admin = createAdminClient() as any;
      const { data: sponsor } = await admin
        .from('sponsors')
        .select('event_id, events(slug)')
        .eq('id', sponsorId)
        .maybeSingle();

      const eventId = sponsor?.event_id as string | undefined;
      const slug = sponsor?.events?.slug as string | undefined;
      if (eventId && slug) {
        const roles = await resolveEventRoles(user.id, eventId);
        band = (
          <RoleBand
            roles={roleLinks(roles, slug, eventId)}
            activeRole="sponsoring"
            className="mb-5"
          />
        );
      }
    }
  } catch {
    // Decorative navigation — never let it take the workspace down.
  }

  return (
    <>
      {band}
      {children}
    </>
  );
}
