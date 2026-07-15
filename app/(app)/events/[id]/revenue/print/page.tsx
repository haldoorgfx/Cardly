export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Revenue Report — Print' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AgendaPrintTrigger } from '@/components/events/AgendaPrintTrigger';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

interface Props { params: Promise<{ id: string }> }

function fmtCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export default async function RevenuePrintPage({ params }: Props) {
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
    admin.from('registrations').select('id, status, amount_paid, currency, ticket_type_id').eq('event_id', id),
    admin.from('ticket_types').select('id, name, price, currency').eq('event_id', id),
  ]);

  if (!event) redirect('/dashboard');

  const allRegs     = regs ?? [];
  const confirmed   = allRegs.filter(r => ['confirmed', 'checked_in'].includes(r.status));
  const totalRev    = confirmed.reduce((s, r) => s + (r.amount_paid ?? 0), 0);
  const currency    = confirmed.find(r => r.currency)?.currency ?? 'USD';
  const today       = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  // Per-ticket breakdown
  const breakdown = (ticketTypes ?? []).map(tt => {
    const ttRegs = confirmed.filter(r => r.ticket_type_id === tt.id);
    const sold   = ttRegs.length;
    const rev    = ttRegs.reduce((s, r) => s + (r.amount_paid ?? 0), 0);
    return { name: tt.name, price: tt.price, sold, rev };
  }).filter(b => b.sold > 0 || (ticketTypes ?? []).length <= 4); // show all if few ticket types

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
        }
      ` }} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28, borderBottom: '3px solid #0F1F18', paddingBottom: 16 }}>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: '#0F1F18' }}>
            {event.name}
          </h1>
          <p style={{ marginTop: 4, color: '#6B7A72', fontSize: 13 }}>Revenue Report</p>
        </div>

        {/* Hero total */}
        <div style={{ background: '#1F4D3A', borderRadius: 16, padding: '28px 32px', marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'rgba(250,246,238,0.65)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
              Total Revenue
            </div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 42, fontWeight: 700, color: '#FAF6EE', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmtCurrency(totalRev, currency)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(250,246,238,0.65)', fontSize: 11, marginBottom: 4 }}>Confirmed Registrations</div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 28, fontWeight: 700, color: '#E8C57E' }}>{confirmed.length}</div>
          </div>
        </div>

        {/* Ticket type breakdown */}
        <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: '#0F1F18', fontSize: 15, marginBottom: 12, letterSpacing: '-0.01em' }}>
          Breakdown by Ticket Type
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #0F1F18' }}>
              {['Ticket Type', 'Unit Price', 'Sold', 'Revenue'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7A72', fontWeight: 600 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {breakdown.map((b, i) => (
              <tr key={b.name} style={{ borderBottom: '1px solid rgba(229,224,212,0.6)', background: i % 2 === 0 ? 'transparent' : 'rgba(250,246,238,0.4)' }}>
                <td style={{ padding: '10px 10px', fontWeight: 600, color: '#0F1F18' }}>{b.name}</td>
                <td style={{ padding: '10px 10px', color: '#3A4A42' }}>
                  {b.price != null && b.price > 0 ? fmtCurrency(b.price, currency) : 'Free'}
                </td>
                <td style={{ padding: '10px 10px', color: '#3A4A42', fontWeight: 600 }}>{b.sold}</td>
                <td style={{ padding: '10px 10px', color: b.rev > 0 ? '#0F1F18' : '#9BA8A1', fontWeight: 700 }}>
                  {b.rev > 0 ? fmtCurrency(b.rev, currency) : '—'}
                </td>
              </tr>
            ))}
            {/* Total row */}
            <tr style={{ borderTop: '2px solid #0F1F18', background: 'rgba(31,77,58,0.04)' }}>
              <td colSpan={2} style={{ padding: '10px 10px', fontWeight: 700, color: '#0F1F18', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>TOTAL</td>
              <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0F1F18' }}>{confirmed.length}</td>
              <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0F1F18', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 15 }}>
                {fmtCurrency(totalRev, currency)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Registration status summary */}
        <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: '#0F1F18', fontSize: 15, marginBottom: 12, letterSpacing: '-0.01em' }}>
          Registration Summary
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',       value: allRegs.length,                                                     color: '#0F1F18' },
            { label: 'Confirmed',   value: allRegs.filter(r => r.status === 'confirmed').length,               color: '#C97A2D' },
            { label: 'Checked In',  value: allRegs.filter(r => r.status === 'checked_in').length,              color: '#2D7A4F' },
            { label: 'Pending',     value: allRegs.filter(r => r.status === 'pending').length,                 color: '#6B7A72' },
            { label: 'Cancelled',   value: allRegs.filter(r => r.status === 'cancelled').length,               color: '#B8423C' },
          ].filter(s => s.value > 0).map(s => (
            <div key={s.label} style={{ border: '1px solid #E5E0D4', borderRadius: 12, padding: '10px 16px', minWidth: 100 }}>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6B7A72', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 14, borderTop: '1px solid #E5E0D4', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9BA8A1' }}>
          <span>Generated with Eventera · {(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/^https?:\/\//, '')}</span>
          <span>{today}</span>
        </div>
      </div>

      <AgendaPrintTrigger backHref={`/events/${_ev.slug}/downloads`} />
    </>
  );
}
