import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { EVENT_EDIT_ALL } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';
import type { ModerationStatus } from '@/types/database';

const VALID_STATUSES: ModerationStatus[] = ['ok', 'flagged', 'removed'];

// PATCH /api/admin/events/[id] — update moderation_status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const result = await getAuthorizedUser(EVENT_EDIT_ALL);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: { moderation_status?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { moderation_status } = body;
  if (!moderation_status || !VALID_STATUSES.includes(moderation_status as ModerationStatus)) {
    return NextResponse.json(
      { error: `moderation_status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();
  const { data: before } = await adminClient
    .from('events')
    .select('id, name, slug, moderation_status')
    .eq('id', params.id)
    .single();

  if (!before) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // Removing an event: also archive it so /c/[slug] returns 404 (that page filters by status='published').
  // Restoring (ok/flagged): re-publish it so the attendee page works again.
  const statusUpdate = moderation_status === 'removed' ? 'archived' : 'published';

  const { data: after, error } = await adminClient
    .from('events')
    .update({
      moderation_status: moderation_status as ModerationStatus,
      status: statusUpdate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select('id, name, slug, moderation_status, status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user, `event.moderation.${moderation_status}`, 'event', params.id, {
    before: { moderation_status: before.moderation_status, name: before.name },
    after:  { moderation_status: after.moderation_status,  name: after.name, status: after.status },
  });

  return NextResponse.json({ ok: true, event: after });
}
