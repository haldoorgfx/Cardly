'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Loader2, Gift, FileText, RotateCcw, X, AlertTriangle, ChevronDown } from 'lucide-react';
import type { BillingUserRow } from './page';

const PLAN_STYLES: Record<string, { bg: string; color: string }> = {
  free:   { bg: '#F5F5F4',               color: '#6B7A72' },
  pro:    { bg: 'rgba(232,197,126,0.15)', color: '#C9A45E' },
  studio: { bg: 'rgba(31,77,58,0.12)',   color: '#1F4D3A' },
};

const SUB_STYLES: Record<string, { bg: string; color: string }> = {
  active:     { bg: 'rgba(45,122,79,0.10)',  color: '#2D7A4F' },
  trialing:   { bg: 'rgba(58,107,140,0.10)', color: '#3A6B8C' },
  past_due:   { bg: 'rgba(201,122,45,0.12)', color: '#C97A2D' },
  canceled:   { bg: 'rgba(107,122,114,0.10)', color: '#6B7A72' },
  incomplete: { bg: 'rgba(184,66,60,0.10)', color: '#B8423C' },
  none:       { bg: '#F5F5F4',              color: '#6B7A72' },
};

interface Invoice {
  id: string;
  number: string | null;
  amount: number;
  currency: string;
  status: string | null;
  created: number;
  pdf: string | null;
  hosted: string | null;
}

interface Filters { q: string; plan: string }
interface Props {
  users: BillingUserRow[];
  total: number;
  page: number;
  totalPages: number;
  defaultFilters: Filters;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() })
    .format(cents / 100);
}

// ── Comp modal ────────────────────────────────────────────────────────────────

function CompModal({
  user,
  onDone,
  onClose,
}: {
  user: BillingUserRow;
  onDone: (plan: string) => void;
  onClose: () => void;
}) {
  const [plan, setPlan] = useState<string>('pro');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/billing/comp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      onDone(plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-[#E5E0D4] p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[15px] text-[#0F1F18]">Comp plan</h3>
          <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded-lg hover:bg-[#F5F5F4] transition-colors">
            <X size={13} strokeWidth={2} className="text-[#6B7A72]" />
          </button>
        </div>
        <p className="text-[13px] text-[#6B7A72] mb-4">
          Grant a plan to <strong className="text-[#0F1F18]">{user.email}</strong> without Stripe.
          This overrides their current plan ({user.plan}) and is logged in the audit trail.
        </p>
        <div className="mb-3">
          <label className="text-[12px] text-[#6B7A72] mb-1.5 block">New plan</label>
          <select
            value={plan}
            onChange={e => setPlan(e.target.value)}
            className="w-full border border-[#E5E0D4] rounded-lg px-3 py-2 text-[13px] bg-white outline-none focus:ring-2 focus:ring-[#1F4D3A]/20"
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="studio">Studio</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="text-[12px] text-[#6B7A72] mb-1.5 block">Reason (optional)</label>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="E.g. speaker comp, refund make-good"
            className="w-full border border-[#E5E0D4] rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20"
          />
        </div>
        {error && <p className="text-[12px] text-[#B8423C] mb-3">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] text-[#6B7A72] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors">Cancel</button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            style={{ background: '#1F4D3A' }}
          >
            {saving && <Loader2 size={12} strokeWidth={2} className="animate-spin" />}
            Grant plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invoices panel ────────────────────────────────────────────────────────────

function InvoicesPanel({ user, onClose }: { user: BillingUserRow; onClose: () => void }) {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState('');

  useState(() => {
    if (!user.stripe_customer_id) { setLoading(false); return; }
    fetch(`/api/admin/billing/invoices?customerId=${user.stripe_customer_id}`)
      .then(r => r.json())
      .then(d => { setInvoices(d.invoices ?? []); setLoading(false); })
      .catch(() => { setInvoices([]); setLoading(false); });
  });

  const issueRefund = async (paymentIntentId: string, maxAmount: number) => {
    const amountCents = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined;
    if (amountCents && (amountCents <= 0 || amountCents > maxAmount)) {
      alert(`Amount must be between $0.01 and ${formatAmount(maxAmount, 'usd')}`);
      return;
    }

    setRefunding(paymentIntentId);
    try {
      const res = await fetch('/api/admin/billing/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId, amount: amountCents, userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? 'Refund failed'); return; }
      alert(`Refund of ${formatAmount(data.refund.amount, data.refund.currency)} issued.`);
      setRefundAmount('');
    } finally {
      setRefunding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-[#E5E0D4] w-full max-w-[640px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D4]">
          <div>
            <h3 className="font-semibold text-[15px] text-[#0F1F18]">Invoices</h3>
            <p className="text-[12px] text-[#6B7A72] mt-0.5">{user.email}</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded-lg hover:bg-[#F5F5F4] transition-colors">
            <X size={13} strokeWidth={2} className="text-[#6B7A72]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="py-10 flex justify-center"><Loader2 size={20} strokeWidth={1.8} className="animate-spin text-[#6B7A72]" /></div>
          )}
          {!loading && !user.stripe_customer_id && (
            <p className="text-[13px] text-[#6B7A72] text-center py-8">No Stripe customer ID — this user has never paid.</p>
          )}
          {!loading && invoices?.length === 0 && user.stripe_customer_id && (
            <p className="text-[13px] text-[#6B7A72] text-center py-8">No invoices found.</p>
          )}
          {invoices && invoices.length > 0 && (
            <div className="space-y-3">
              {invoices.map(inv => (
                <div key={inv.id} className="border border-[#E5E0D4] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-mono text-[12px] text-[#0F1F18]">{inv.number ?? inv.id}</div>
                      <div className="text-[11px] text-[#6B7A72] mt-0.5">
                        {new Date(inv.created * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[14px] text-[#0F1F18]">{formatAmount(inv.amount, inv.currency)}</div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#E5E0D4]">
                    {inv.pdf && (
                      <a href={inv.pdf} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-[#1F4D3A] hover:underline font-mono">PDF ↗</a>
                    )}
                    {inv.hosted && (
                      <a href={inv.hosted} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-[#1F4D3A] hover:underline font-mono">View ↗</a>
                    )}
                    {inv.status === 'paid' && (
                      <div className="ml-auto flex items-center gap-2">
                        <input
                          value={refundAmount}
                          onChange={e => setRefundAmount(e.target.value)}
                          placeholder="Partial $ (blank=full)"
                          className="h-7 w-32 border border-[#E5E0D4] rounded-lg px-2 text-[11px] outline-none font-mono"
                        />
                        <button
                          onClick={() => issueRefund(inv.id, inv.amount)}
                          disabled={refunding === inv.id}
                          className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-[#E5E0D4] text-[11px] text-[#B8423C] hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {refunding === inv.id ? <Loader2 size={10} strokeWidth={2} className="animate-spin" /> : <RotateCcw size={10} strokeWidth={2} />}
                          Refund
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BillingAdminClient({ users: initialUsers, total, page, totalPages, defaultFilters }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  const [users, setUsers] = useState<BillingUserRow[]>(initialUsers);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [compUser, setCompUser]     = useState<BillingUserRow | null>(null);
  const [invoiceUser, setInvoiceUser] = useState<BillingUserRow | null>(null);

  const hasActiveFilters = Object.values(defaultFilters).some(v => v !== '');

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.q.trim())    params.set('q',    filters.q.trim());
    if (filters.plan.trim()) params.set('plan', filters.plan.trim());
    router.push(`${pathname}?${params.toString()}`);
  }, [filters, pathname, router]);

  const clearFilters = () => { setFilters({ q: '', plan: '' }); router.push(pathname); };

  const handleComp = (newPlan: string) => {
    if (compUser) {
      setUsers(prev => prev.map(u => u.id === compUser.id ? { ...u, plan: newPlan } : u));
    }
    setCompUser(null);
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-2 items-end">
        <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E5E0D4] bg-white min-w-[200px] flex-1 max-w-[280px]">
          <Search size={13} strokeWidth={2} className="text-[#6B7A72] shrink-0" />
          <input
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Email or name…"
            className="outline-none bg-transparent flex-1 text-[13px] placeholder-[#6B7A72]/60 text-[#0F1F18]"
          />
        </div>

        <select
          value={filters.plan}
          onChange={e => setFilters(f => ({ ...f, plan: e.target.value }))}
          className="h-9 px-3 rounded-lg border border-[#E5E0D4] bg-white text-[13px] text-[#0F1F18] outline-none"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="studio">Studio</option>
        </select>

        <button onClick={applyFilters} className="h-9 px-4 rounded-lg text-[13px] font-medium text-white hover:opacity-90 transition" style={{ background: '#1F4D3A' }}>Apply</button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="h-9 px-4 rounded-lg text-[13px] text-[#6B7A72] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors">Clear</button>
        )}
      </div>

      <div className="mb-4 text-[12px] font-mono text-[#6B7A72]">
        {total} {total === 1 ? 'user' : 'users'}{page > 1 && ` — page ${page} of ${totalPages}`}
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="py-16 text-center text-[14px] text-[#6B7A72]">No users match these filters.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E5E0D4]">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: '#FAF6EE', borderBottom: '1px solid #E5E0D4' }}>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">User</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Plan</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Subscription</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Period ends</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Cards / mo</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E0D4]">
              {users.map(u => {
                const planStyle = PLAN_STYLES[u.plan] ?? PLAN_STYLES.free;
                const subStyle  = SUB_STYLES[u.subscription_status] ?? SUB_STYLES.none;

                return (
                  <tr key={u.id} className="hover:bg-[#FAF6EE]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#0F1F18]">{u.full_name ?? '—'}</div>
                      <div className="text-[11px] font-mono text-[#6B7A72]">{u.email}</div>
                      {u.stripe_customer_id && (
                        <div className="text-[10px] font-mono text-[#6B7A72]/50 mt-0.5">{u.stripe_customer_id}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] tracking-[0.1em] uppercase" style={planStyle}>
                        {u.plan}
                      </span>
                      {u.billing_cycle && u.billing_cycle !== 'none' && (
                        <div className="text-[10px] font-mono text-[#6B7A72] mt-0.5">{u.billing_cycle}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px]" style={{ background: subStyle.bg, color: subStyle.color }}>
                        {u.subscription_status}
                      </span>
                      {u.cancel_at_period_end && (
                        <div className="text-[10px] text-[#C97A2D] mt-0.5">cancels at period end</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#6B7A72]">
                      {formatDate(u.current_period_end)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#6B7A72]">
                      {u.cards_this_month}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCompUser(u)}
                          title="Comp plan"
                          className="h-7 w-7 rounded-lg border border-[#E5E0D4] grid place-items-center text-[#1F4D3A] hover:bg-[#E8EFEB] transition-colors"
                        >
                          <Gift size={12} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => setInvoiceUser(u)}
                          title="View invoices"
                          className="h-7 w-7 rounded-lg border border-[#E5E0D4] grid place-items-center text-[#6B7A72] hover:bg-[#FAF6EE] transition-colors"
                        >
                          <FileText size={12} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <PagLink page={page - 1} disabled={page <= 1} label="← Previous" filters={defaultFilters} pathname={pathname} />
          <span className="text-[13px] text-[#6B7A72] font-mono">{page} / {totalPages}</span>
          <PagLink page={page + 1} disabled={page >= totalPages} label="Next →" filters={defaultFilters} pathname={pathname} />
        </div>
      )}

      {compUser && <CompModal user={compUser} onDone={handleComp} onClose={() => setCompUser(null)} />}
      {invoiceUser && <InvoicesPanel user={invoiceUser} onClose={() => setInvoiceUser(null)} />}
    </div>
  );
}

function PagLink({ page, disabled, label, filters, pathname }: {
  page: number; disabled: boolean; label: string; filters: Filters; pathname: string;
}) {
  const params = new URLSearchParams();
  if (filters.q)    params.set('q',    filters.q);
  if (filters.plan) params.set('plan', filters.plan);
  params.set('page', String(page));
  if (disabled) return <span className="text-[13px] text-[#6B7A72]/40 font-mono px-3 py-1.5">{label}</span>;
  return (
    <a href={`${pathname}?${params.toString()}`} className="text-[13px] font-mono text-[#1F4D3A] hover:underline px-3 py-1.5 rounded-lg hover:bg-[#E8EFEB] transition-colors">{label}</a>
  );
}
