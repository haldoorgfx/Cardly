import { requirePermission, getSessionUser } from '@/lib/auth/guards';
import { EVENT_VIEW_ALL } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { PageShell, PageHeader } from '@/components/dash';
import { RegistrationsAdminClient } from './RegistrationsAdminClient';

export const metadata = { title: 'Registrations — Eventera Admin' };
export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  status?: string;
  payment_status?: string;
  event_id?: string;
  page?: string;
}

const PAGE_SIZE = 50;

export default async function RegistrationsAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission(EVENT_VIEW_ALL);
  const currentUser = await getSessionUser();
  // Destructive per-row / bulk actions (PATCH status, DELETE) are gated on
  // EVENT_EDIT_ALL — mirror that here so the UI only shows actions the actor
  // can actually perform (the API re-checks regardless).
  const canManage = currentUser?.role === 'super_admin';

  const page   = Math.max(1, parseInt(searchParams.page ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  // Registrations carry columns (dietary, accessibility) not present in the
  // generated types, and we join across events + ticket_types — cast to any,
  // the established pattern for admin oversight queries.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminClient = createAdminClient() as any;

  let query = adminClient
    .from('registrations')
    .select(
      'id, event_id, ticket_type_id, attendee_name, attendee_email, attendee_phone, status, payment_status, amount_paid, currency, created_at, events(name, slug), ticket_types(name)',
      { count: 'exact' },
    );

  const q = searchParams.q?.trim().replace(/[(),*:%]/g, '');
  if (q) {
    query = query.or(`attendee_name.ilike.%${q}%,attendee_email.ilike.%${q}%`);
  }
  if (searchParams.status) {
    query = query.eq('status', searchParams.status);
  }
  if (searchParams.payment_status) {
    query = query.eq('payment_status', searchParams.payment_status);
  }
  if (searchParams.event_id) {
    query = query.eq('event_id', searchParams.event_id);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const { data, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Flatten the joined shape (Supabase returns nested objects for the joins).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: RegistrationRow[] = ((data ?? []) as any[]).map((r) => ({
    id:             r.id,
    event_id:       r.event_id,
    attendee_name:  r.attendee_name,
    attendee_email: r.attendee_email,
    attendee_phone: r.attendee_phone ?? null,
    status:         r.status,
    payment_status: r.payment_status,
    amount_paid:    r.amount_paid ?? 0,
    currency:       r.currency ?? '',
    created_at:     r.created_at,
    event_name:     r.events?.name ?? null,
    event_slug:     r.events?.slug ?? null,
    ticket_name:    r.ticket_types?.name ?? null,
  }));

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Admin · Registrations"
        title="Registrations"
        subtitle="Every registration across all events. Search, change status, delete, and export."
      />

      <RegistrationsAdminClient
        key={`${searchParams.q ?? ''}|${searchParams.status ?? ''}|${searchParams.payment_status ?? ''}|${searchParams.event_id ?? ''}|${page}`}
        rows={rows}
        total={total}
        page={page}
        totalPages={totalPages}
        canManage={canManage}
        defaultFilters={{
          q:              searchParams.q              ?? '',
          status:         searchParams.status         ?? '',
          payment_status: searchParams.payment_status ?? '',
          event_id:       searchParams.event_id       ?? '',
        }}
      />
    </PageShell>
  );
}

export interface RegistrationRow {
  id: string;
  event_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  status: string;
  payment_status: string;
  amount_paid: number;
  currency: string;
  created_at: string;
  event_name: string | null;
  event_slug: string | null;
  ticket_name: string | null;
}
