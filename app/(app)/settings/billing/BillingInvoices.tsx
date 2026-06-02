'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import type { Plan } from '@/lib/billing/plans';

interface Invoice {
  id:          string;
  date:        string;
  description: string;
  amount:      number;
  currency:    string;
  status:      'paid' | 'open' | 'void' | 'draft';
  pdf_url:     string | null;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  paid:  { bg: '#F0FAF4', color: '#2D7A4F' },
  open:  { bg: '#FFF7ED', color: '#C97A2D' },
  void:  { bg: '#F5F5F4', color: '#6B7A72' },
  draft: { bg: '#F5F5F4', color: '#6B7A72' },
};

function fmtMoney(n: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n / 100);
  } catch {
    return `$${(n / 100).toFixed(2)}`;
  }
}

export default function BillingInvoices({ hasPortal, plan }: { hasPortal: boolean; plan: Plan }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  useEffect(() => {
    if (!hasPortal) { setLoading(false); return; }
    fetch('/api/billing/invoices')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setInvoices(d.invoices ?? []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [hasPortal]);

  if (!hasPortal) {
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E0D4', background: 'white' }}>
        <div className="px-5 py-10 text-center">
          <p className="text-[13px]" style={{ color: '#6B7A72' }}>
            No invoices yet.{' '}
            {plan === 'free' && (
              <a href="/pricing" className="text-[#1F4D3A] hover:underline">Upgrade to a paid plan →</a>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E0D4', background: 'white' }}>
        <div className="px-5 py-8 text-center text-[13px]" style={{ color: '#6B7A72' }}>
          Loading invoices…
        </div>
      </div>
    );
  }

  if (error || invoices.length === 0) {
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E0D4', background: 'white' }}>
        <div className="px-5 py-8 text-center text-[13px]" style={{ color: '#6B7A72' }}>
          {error ? 'Could not load invoices. Visit the billing portal to download them.' : 'No invoices yet.'}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
      {/* Table header */}
      <div className="grid gap-4 px-5 py-3 border-b" style={{
        gridTemplateColumns: '1fr 2fr 1fr 80px 36px',
        borderColor: '#E5E0D4', background: 'rgba(250,246,238,0.5)',
      }}>
        {['DATE', 'DESCRIPTION', 'AMOUNT', 'STATUS', ''].map(h => (
          <div key={h} className="font-mono uppercase" style={{ fontSize: 9.5, letterSpacing: '0.16em', color: '#6B7A72' }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {invoices.map((inv, i) => {
        const st = STATUS_STYLE[inv.status] ?? STATUS_STYLE.void;
        return (
          <div key={inv.id}
            className="grid gap-4 px-5 py-3.5 items-center hover:bg-[#FAF6EE]/40 transition-colors"
            style={{ gridTemplateColumns: '1fr 2fr 1fr 80px 36px', borderTop: i > 0 ? '1px solid rgba(229,224,212,0.6)' : undefined }}>
            <div className="font-mono text-[12.5px]" style={{ color: '#6B7A72' }}>{inv.date}</div>
            <div className="text-[13px]" style={{ color: '#3A4A42' }}>{inv.description}</div>
            <div className="font-mono font-medium text-[13px]" style={{ color: '#0F1F18' }}>
              {fmtMoney(inv.amount, inv.currency)}
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium capitalize"
                style={{ background: st.bg, color: st.color }}>
                {inv.status}
              </span>
            </div>
            <div>
              {inv.pdf_url && (
                <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer"
                  className="h-8 w-8 rounded-lg grid place-items-center transition hover:bg-[#E8EFEB]"
                  style={{ color: '#1F4D3A' }}>
                  <Download size={14} strokeWidth={2} />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
