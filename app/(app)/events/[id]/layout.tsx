import type { Metadata } from 'next';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { createClient } from '@/lib/supabase/server';
import { RoleBand } from '@/components/workspace/RoleBand';
import { resolveEventRoles, roleLinks } from '@/lib/workspace/eventRoles';

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const _ev = await resolveEventRef(id);
  return {
    title: _ev?.name ?? 'Event',
  };
}

/**
 * Organizers speak at their own events more often than not, and some also hold
 * a ticket. Before the band, getting from "managing this event" to "my session
 * as a speaker at this event" meant leaving through the sidebar and finding
 * the other entry by name.
 *
 * RoleBand renders nothing unless a second role genuinely exists, so an
 * organizer who only organizes sees exactly what they see today. Wrapped in
 * try/catch — this is decorative navigation and must never take the workspace
 * down.
 */
export default async function EventLayout({ children, params }: Props) {
  const { id } = await params;

  let band: React.ReactNode = null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ev = await resolveEventRef(id);
    if (user && ev) {
      const roles = await resolveEventRoles(user.id, ev.id);
      const links = roleLinks(roles, ev.slug ?? '', ev.id);
      if (links.length > 1) {
        band = (
          <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6" style={{ maxWidth: 1240 }}>
            <RoleBand roles={links} activeRole="organizing" />
          </div>
        );
      }
    }
  } catch {
    /* decorative only */
  }

  return (
    <>
      {band}
      {children}
    </>
  );
}
