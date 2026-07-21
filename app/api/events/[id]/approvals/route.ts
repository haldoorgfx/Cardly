import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

// GET — list pending applications
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Verify ownership
  const { data: event } = await admin.from('events').select('id').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Registrations with status = 'pending_approval'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('registrations')
    .select('id, attendee_name, attendee_email, attendee_data, created_at, status, ticket_type_id, ticket_types(name)')
    .eq('event_id', id)
    .in('status', ['pending_approval', 'approved', 'rejected'])
    .order('created_at', { ascending: false });

  return NextResponse.json(data ?? []);
}

// PATCH — approve or reject a registration
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { registrationId, action } = await req.json() as { registrationId: string; action: 'approve' | 'reject' };
  if (!registrationId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify ownership of event
  const { data: event } = await admin.from('events').select('id').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'approve') {
    const { data: ep } = await admin.from('event_pages').select('max_capacity').eq('event_id', id).maybeSingle();
    if (ep?.max_capacity) {
      const { count } = await admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).in('status', ['confirmed', 'checked_in']);
      if ((count ?? 0) >= ep.max_capacity) {
        return NextResponse.json({ error: 'Cannot approve — the event is at full capacity' }, { status: 409 });
      }
    }

    // A paid registration created under approval-gating carries NO payment
    // intent (the register route deliberately defers payment), so flipping it
    // to `confirmed` here would hand out a free valid ticket AND book the
    // uncollected amount as revenue (every revenue query sums amount_paid over
    // confirmed+checked_in). Refuse until payment is actually collected.
    const { data: target } = await admin
      .from('registrations')
      .select('amount_paid, payment_status')
      .eq('id', registrationId)
      .eq('event_id', id)
      .maybeSingle();
    const owesPayment =
      (target?.amount_paid ?? 0) > 0 &&
      (target?.payment_status === 'pending' || target?.payment_status === 'failed');
    if (owesPayment) {
      return NextResponse.json({
        error:
          'This application is for a paid ticket that has not been paid for yet. ' +
          'Approving it would confirm the ticket for free — collect payment first, then approve.',
      }, { status: 409 });
    }
  }

  const newStatus = action === 'approve' ? 'confirmed' : 'rejected';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('registrations')
    .update({ status: newStatus })
    .eq('id', registrationId)
    .eq('event_id', id)
    .select('id, status, user_id, attendee_email')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Roles write-path: an approved application is now a confirmed attendee.
  // Best-effort; uses the registrant's account id when present, else email match.
  if (action === 'approve' && data) {
    const attendeeAccountId = data.user_id
      ?? (await resolveAccountIdByEmail(data.attendee_email));
    if (attendeeAccountId) {
      await upsertEventRole({ userId: attendeeAccountId, eventId: id, role: 'attendee' });
    }
  }

  return NextResponse.json({ id: data.id, status: data.status });
}
