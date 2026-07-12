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

  let body: { moderation_status?: string; name?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { moderation_status, name } = body;
  const hasModeration = moderation_status !== undefined;
  const hasName = name !== undefined;

  if (!hasModeration && !hasName) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }
  if (hasModeration && !VALID_STATUSES.includes(moderation_status as ModerationStatus)) {
    return NextResponse.json(
      { error: `moderation_status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }
  const trimmedName = hasName ? String(name).trim() : undefined;
  if (hasName && (!trimmedName || trimmedName.length > 200)) {
    return NextResponse.json({ error: 'Name must be 1–200 characters' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: before } = await adminClient
    .from('events')
    .select('id, name, slug, moderation_status')
    .eq('id', params.id)
    .single();

  if (!before) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  if (hasModeration) {
    // Removing an event: also archive it so /c/[slug] returns 404 (that page filters by status='published').
    // Restoring (ok/flagged): re-publish it so the attendee page works again.
    update.moderation_status = moderation_status as ModerationStatus;
    update.status = moderation_status === 'removed' ? 'archived' : 'published';
  }
  if (hasName) update.name = trimmedName;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: after, error } = await (adminClient as any)
    .from('events')
    .update(update)
    .eq('id', params.id)
    .select('id, name, slug, moderation_status, status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const action = hasModeration ? `event.moderation.${moderation_status}` : 'event.renamed';
  await logAudit(user, action, 'event', params.id, {
    before: { moderation_status: before.moderation_status, name: before.name },
    after:  { moderation_status: after.moderation_status,  name: after.name, status: after.status },
  });

  return NextResponse.json({ ok: true, event: after });
}
