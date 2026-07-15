export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Attendee Roster — Print' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { AgendaPrintTrigger } from '@/components/events/AgendaPrintTrigger';

interface Props { params: Promise<{ id: string }> }

const STATUS_LABELS: Record<string, string> = {
  confirmed:  'Confirmed',
  checked_in: 'Checked In',
  pending:    'Pending',
  cancelled:  'Cancelled',
  waitlisted: 'Waitlisted',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default async function RosterPrintPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: regs }, { data: ticketTypes }] = await Promise.all([
    admin.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single(),
    admin.from('registrations').select('id, attendee_name, status, amount_paid, currency, created_at, ticket_type_id').eq('event_id', id).order('created_at', { ascending: true }),
    admin.from('ticket_types').select('id, name, price, currency').eq('event_id', id),
  ]);

  if (!event) redirect('/dashboard');

  const ttMap = new Map((ticketTypes ?? []).map(t => [t.id, t.name]));
  const rows = regs ?? [];
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  // Summary counts
  const confirmed  = rows.filter(r => ['confirmed', 'checked_in'].includes(r.status)).length;
  const checkedIn  = rows.filter(r => r.status === 'checked_in').length;
  const total      = rows.length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: white; color: #0F1F18; font-size: 13px; line-height: 1.5; }
        @media print {
          @page { margin: 1.2cm; }
          .no-print { display: none !important; }
          body { font-size: 11px; }
          tr { page-break-inside: avoid; }
        }
      ` }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 48px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, borderBottom: '3px solid #0F1F18', paddingBottom: 16 }}>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: '#0F1F18' }}>
            {event.name}
          </h1>
          <p style={{ marginTop: 4, color: '#6B7A72', fontSize: 13 }}>Attendee Roster</p>
        </div>

        {/* Summary row */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          {[
            { label: 'Total Registrations', value: total },
            { label: 'Confirmed',           value: confirmed },
            { label: 'Checked In',          value: checkedIn },
          ].map(s => (
            <div key={s.label} style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', borderRadius: 12, padding: '12px 20px', minWidth: 130 }}>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 26, fontWeight: 700, color: '#0F1F18', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6B7A72', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        {rows.length === 0 ? (
          <p style={{ color: '#9BA8A1', padding: '32px 0', textAlign: 'center' }}>No registrations yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #0F1F18' }}>
                {['#', 'Name', 'Ticket', 'Amount', 'Status', 'Registered'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7A72', fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isCheckedIn = r.status === 'checked_in';
                const isCancelled = r.status === 'cancelled';
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(229,224,212,0.6)', background: i % 2 === 0 ? 'transparent' : 'rgba(250,246,238,0.4)' }}>
                    <td style={{ padding: '8px 12px', color: '#9BA8A1', fontSize: 11, width: 36 }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0F1F18' }}>
                      {r.attendee_name || <span style={{ color: '#9BA8A1', fontWeight: 400 }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#3A4A42' }}>
                      {r.ticket_type_id ? (ttMap.get(r.ticket_type_id) ?? '—') : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#3A4A42' }}>
                      {r.amount_paid != null && r.amount_paid > 0
                        ? `${r.currency ?? ''} ${r.amount_paid}`
                        : 'Free'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                        color: isCheckedIn ? '#2D7A4F' : isCancelled ? '#B8423C' : '#C97A2D',
                        border: `1px solid ${isCheckedIn ? '#2D7A4F' : isCancelled ? '#B8423C' : '#C97A2D'}`,
                      }}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#6B7A72', fontSize: 11 }}>
                      {fmtDate(r.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #E5E0D4', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9BA8A1' }}>
          <span>Generated with Eventera · {(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/^https?:\/\//, '')}</span>
          <span>{today}</span>
        </div>
      </div>

      <AgendaPrintTrigger backHref={`/events/${_ev.slug}/downloads`} />
    </>
  );
}
