import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { EVENT_EDIT_ALL } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';

const VALID_ACTIONS = ['approve', 'reject'] as const;
type Action = (typeof VALID_ACTIONS)[number];

// PATCH /api/admin/promoted/[id] — approve or reject a promoted-listing submission
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const result = await getAuthorizedUser(EVENT_EDIT_ALL);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: { action?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { action } = body;
  if (!action || !VALID_ACTIONS.includes(action as Action)) {
    return NextResponse.json(
      { error: `action must be one of: ${VALID_ACTIONS.join(', ')}` },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = adminClient as any;

  const { data: before } = await adminAny
    .from('promoted_listings')
    .select('id, status, event_id')
    .eq('id', params.id)
    .single();

  if (!before) return NextResponse.json({ error: 'Promoted listing not found' }, { status: 404 });

  // 'active' is the status the public-read RLS policy and marketplace feed key
  // off of — approving a submission makes it live, not merely "approved".
  const newStatus = action === 'approve' ? 'active' : 'rejected';

  const { data: after, error } = await adminAny
    .from('promoted_listings')
    .update({ status: newStatus })
    .eq('id', params.id)
    .select('id, status, event_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(
    user,
    action === 'approve' ? 'promoted_listing.approved' : 'promoted_listing.rejected',
    'promoted_listing',
    params.id,
    { before: { status: before.status }, after: { status: after.status } }
  );

  return NextResponse.json({ ok: true, promoted: after });
}
