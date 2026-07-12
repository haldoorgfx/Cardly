import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { EVENT_EDIT_ALL } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';
import type { RegistrationStatus } from '@/types/database';

const VALID_STATUSES: RegistrationStatus[] = [
  'pending', 'confirmed', 'checked_in', 'cancelled', 'refunded', 'pending_approval',
];

// PATCH /api/admin/registrations/[id] — update a registration's status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const result = await getAuthorizedUser(EVENT_EDIT_ALL);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: { status?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { status } = body;
  if (!status || !VALID_STATUSES.includes(status as RegistrationStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminClient = createAdminClient() as any;

  const { data: before } = await adminClient
    .from('registrations')
    .select('id, event_id, attendee_email, status')
    .eq('id', params.id)
    .single();

  if (!before) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

  // Keep checked_in_at coherent when moving in/out of the checked_in state.
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'checked_in') patch.checked_in_at = new Date().toISOString();
  if (before.status === 'checked_in' && status !== 'checked_in') patch.checked_in_at = null;

  const { data: after, error } = await adminClient
    .from('registrations')
    .update(patch)
    .eq('id', params.id)
    .select('id, event_id, attendee_email, status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user, `registration.status.${status}`, 'registration', params.id, {
    before: { status: before.status, attendee_email: before.attendee_email },
    after:  { status: after.status },
  });

  return NextResponse.json({ ok: true, registration: after });
}

// DELETE /api/admin/registrations/[id] — permanently delete a registration
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const result = await getAuthorizedUser(EVENT_EDIT_ALL);
  if ('error' in result) return result.error;
  const { user } = result;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminClient = createAdminClient() as any;

  const { data: before } = await adminClient
    .from('registrations')
    .select('id, event_id, attendee_email, attendee_name, status')
    .eq('id', params.id)
    .single();

  if (!before) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

  const { error } = await adminClient
    .from('registrations')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user, 'registration.deleted', 'registration', params.id, {
    before: {
      event_id:       before.event_id,
      attendee_email: before.attendee_email,
      attendee_name:  before.attendee_name,
      status:         before.status,
    },
  });

  return NextResponse.json({ ok: true });
}
