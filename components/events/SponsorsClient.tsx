'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';

interface Sponsor {
  id: string;
  company_name: string;
  tier: string | null;
  booth_location: string | null;
  website_url: string | null;
  invite_token: string;
  lead_count: number;
}

interface Props {
  eventId: string;
  eventName: string;
  sponsors: Sponsor[];
}

const TIERS = [
  { value: 'platinum', label: 'Platinum' },
  { value: 'gold',     label: 'Gold' },
  { value: 'silver',   label: 'Silver' },
  { value: 'standard', label: 'Standard' },
];

const TIER_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  platinum: { bg: 'rgba(232,197,126,0.15)', color: '#C9A45E',  border: 'rgba(201,164,94,0.4)' },
  gold:     { bg: 'rgba(201,122,45,0.10)',  color: '#C97A2D',  border: 'rgba(201,122,45,0.3)' },
  silver:   { bg: 'rgba(107,122,114,0.10)', color: '#6B7A72',  border: 'rgba(107,122,114,0.3)' },
  standard: { bg: '#E8EFEB',                color: '#1F4D3A',  border: 'rgba(31,77,58,0.2)' },
};

function tierStyle(tier: string | null) {
  return TIER_STYLE[tier ?? ''] ?? TIER_STYLE['standard'];
}

function tierLabel(tier: string | null) {
  return TIERS.find(t => t.value === tier)?.label ?? tier ?? 'Standard';
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className="w-10 h-10 rounded-xl grid place-items-center text-cream font-display font-semibold text-[13px] shrink-0"
      style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)' }}>
      {initials}
    </span>
  );
}

/* ── Edit modal ─────────────────────────────────────────────────────────── */
function EditSponsorModal({
  sponsor,
  onClose,
  onSaved,
}: {
  sponsor: Sponsor;
  onClose: () => void;
  onSaved: (s: Sponsor) => void;
}) {
  const [form, setForm] = useState({
    company_name:  sponsor.company_name,
    tier:          sponsor.tier ?? 'standard',
    booth_location: sponsor.booth_location ?? '',
    website_url:   sponsor.website_url ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function handleSave() {
    if (!form.company_name.trim()) { setError('Company name is required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/events/sponsors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsor_id: sponsor.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return; }
      onSaved({ ...sponsor, ...data.sponsor });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl overflow-hidden w-full max-w-[460px]" style={{ border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>Edit sponsor</div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg grid place-items-center hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
            <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 sm:px-6 py-5 grid sm:grid-cols-2 gap-4">
          {error && <p className="sm:col-span-2 text-[13px] px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B8423C' }}>{error}</p>}
          <div className="sm:col-span-2">
            <label className="block  text-[10px] tracking-[0.12em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Company name *</label>
            <input type="text" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none" style={{ borderColor: '#E5E0D4', color: '#0F1F18' }} />
          </div>
          <div>
            <label className="block  text-[10px] tracking-[0.12em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Tier</label>
            <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none bg-white" style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}>
              {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block  text-[10px] tracking-[0.12em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Booth location</label>
            <input type="text" value={form.booth_location} onChange={e => setForm(f => ({ ...f, booth_location: e.target.value }))}
              placeholder="Hall B · Booth 14"
              className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none" style={{ borderColor: '#E5E0D4', color: '#0F1F18' }} />
          </div>
          <div className="sm:col-span-2">
            <label className="block  text-[10px] tracking-[0.12em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Website</label>
            <input type="url" value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
              placeholder="https://company.com"
              className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none" style={{ borderColor: '#E5E0D4', color: '#0F1F18' }} />
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] border" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-60"
            style={{ background: '#1F4D3A' }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete confirm modal ───────────────────────────────────────────────── */
function DeleteSponsorModal({
  sponsor,
  onClose,
  onDeleted,
}: {
  sponsor: Sponsor;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');

  async function handleDelete() {
    setDeleting(true); setError('');
    try {
      const res = await fetch(`/api/events/sponsors?id=${sponsor.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to delete'); return; }
      onDeleted(sponsor.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl overflow-hidden w-full max-w-[400px] p-6" style={{ border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)' }}>
        <div className="w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: 'rgba(184,66,60,0.08)' }}>
          <svg width={22} height={22} fill="none" stroke="#B8423C" strokeWidth={1.6} viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </div>
        <h3 className="font-display text-[17px] font-semibold text-center mb-1" style={{ color: '#0F1F18' }}>Remove {sponsor.company_name}?</h3>
        <p className="text-[13.5px] text-center mb-5" style={{ color: '#6B7A72' }}>
          This will also delete all their leads, resources, and team members. This cannot be undone.
        </p>
        {error && <p className="text-[13px] mb-3 text-center" style={{ color: '#B8423C' }}>{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] border" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-60"
            style={{ background: '#B8423C' }}>
            {deleting ? 'Deleting…' : 'Delete sponsor'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export function SponsorsClient({ eventId, eventName, sponsors: initial }: Props) {
  const router = useRouter();
  const [sponsors, setSponsors] = useState(initial);
  const [showAdd, setShowAdd]   = useState(false);
  const [copied, setCopied]     = useState<string | null>(null);
  const [form, setForm]         = useState({ company_name: '', tier: 'gold', booth_location: '', website_url: '' });
  const [isPending, startTransition] = useTransition();
  const [editingSponsor, setEditingSponsor]   = useState<Sponsor | null>(null);
  const [deletingSponsor, setDeletingSponsor] = useState<Sponsor | null>(null);

  const totalLeads = sponsors.reduce((s, sp) => s + sp.lead_count, 0);
  const booths     = sponsors.filter(s => s.booth_location).length;

  function copyPortalLink(token: string) {
    const url = `${window.location.origin}/exhibitor/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleAdd() {
    if (!form.company_name) return;
    startTransition(async () => {
      const res = await fetch('/api/events/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, ...form }),
      });
      const data = await res.json();
      if (data.sponsor) {
        setSponsors(prev => [{ ...data.sponsor, lead_count: 0 }, ...prev]);
        setForm({ company_name: '', tier: 'gold', booth_location: '', website_url: '' });
        setShowAdd(false);
        router.refresh();
      } else {
        alert(data.error || 'Failed to add sponsor');
      }
    });
  }

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      {editingSponsor && (
        <EditSponsorModal
          sponsor={editingSponsor}
          onClose={() => setEditingSponsor(null)}
          onSaved={updated => setSponsors(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))}
        />
      )}
      {deletingSponsor && (
        <DeleteSponsorModal
          sponsor={deletingSponsor}
          onClose={() => setDeletingSponsor(null)}
          onDeleted={id => setSponsors(prev => prev.filter(s => s.id !== id))}
        />
      )}

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 text-[12px] mb-1" style={{ color: '#6B7A72' }}>
              <Link href="/dashboard" className="hover:text-[#1F4D3A] transition-colors">Events</Link>
              <span>/</span>
              <Link href={`/events/${eventId}`} className="hover:text-[#1F4D3A] transition-colors truncate max-w-[200px]">{eventName}</Link>
              <span>/</span>
              <span>Sponsors</span>
            </div>
            <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>Sponsors</h1>
            <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>Manage packages, booths, and lead capture.</p>
          </div>
          <button onClick={() => setShowAdd(v => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13.5px] font-medium text-cream transition-colors"
            style={{ background: '#1F4D3A' }}>
            <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add sponsor
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Sponsors',         value: sponsors.length, accent: false },
            { label: 'Total leads',      value: totalLeads || '—', accent: false },
            { label: 'Booths assigned',  value: booths, accent: false },
            { label: 'Portal links sent', value: sponsors.length, accent: true },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
              <div className=" text-[10px] tracking-[0.12em] uppercase mb-2" style={{ color: '#6B7A72' }}>{s.label}</div>
              <div className=" text-[26px] leading-none tracking-tight" style={{ color: s.accent ? '#C9A45E' : '#1F4D3A' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Add form */}
        <Modal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          title="New sponsor"
          footer={
            <>
              <button onClick={() => setShowAdd(false)} className="h-10 px-4 rounded-xl text-[13.5px] font-medium border" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>Cancel</button>
              <button onClick={handleAdd} disabled={isPending || !form.company_name}
                className="h-10 px-5 rounded-xl text-[13.5px] font-semibold text-cream disabled:opacity-60"
                style={{ background: '#1F4D3A' }}>
                {isPending ? 'Adding…' : 'Add sponsor'}
              </button>
            </>
          }
        >
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Company name *</div>
                <input type="text" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  placeholder="Paystack"
                  className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }} />
              </div>
              <div>
                <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Tier</div>
                <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none bg-white"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}>
                  {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Booth location</div>
                <input type="text" value={form.booth_location} onChange={e => setForm(f => ({ ...f, booth_location: e.target.value }))}
                  placeholder="Hall B · Booth 14"
                  className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }} />
              </div>
              <div>
                <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Website</div>
                <input type="url" value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
                  placeholder="https://paystack.com"
                  className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }} />
              </div>
            </div>
        </Modal>

        {/* Sponsors list */}
        {sponsors.length === 0 ? (
          <div className="bg-white rounded-2xl py-20 text-center" style={{ border: '1px solid #E5E0D4' }}>
            <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: '#E8EFEB' }}>
              <svg width={22} height={22} fill="none" stroke="#1F4D3A" strokeWidth={1.6} viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h3 className="font-display text-[16px] font-semibold mb-2" style={{ color: '#0F1F18' }}>No sponsors yet</h3>
            <p className="text-[13px] max-w-[380px] mx-auto" style={{ color: '#6B7A72' }}>
              Add a sponsor to generate their exhibitor portal link.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
            <div className="flex items-center gap-2 px-5 py-3.5 flex-wrap" style={{ borderBottom: '1px solid #E5E0D4' }}>
              {TIERS.map(t => {
                const ts = tierStyle(t.value);
                const count = sponsors.filter(s => s.tier === t.value).length;
                if (count === 0) return null;
                return (
                  <span key={t.value} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>
                    {t.label} · {count}
                  </span>
                );
              })}
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(229,224,212,0.6)' }}>
              {sponsors.map(sponsor => {
                const ts = tierStyle(sponsor.tier);
                return (
                  <div key={sponsor.id} className="group flex items-center gap-4 px-5 py-4">
                    <Avatar name={sponsor.company_name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-[14.5px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>
                          {sponsor.company_name}
                        </span>
                        {sponsor.tier && (
                          <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full border"
                            style={{ background: ts.bg, color: ts.color, borderColor: ts.border }}>
                            {tierLabel(sponsor.tier)}
                          </span>
                        )}
                      </div>
                      <div className=" text-[11px] mt-0.5 flex items-center gap-3 flex-wrap" style={{ color: '#6B7A72' }}>
                        {sponsor.booth_location && <span>{sponsor.booth_location}</span>}
                        {sponsor.website_url && <span>{sponsor.website_url}</span>}
                      </div>
                    </div>
                    <div className="text-center shrink-0 hidden sm:block">
                      <div className=" text-[15px]" style={{ color: '#1F4D3A' }}>{sponsor.lead_count}</div>
                      <div className=" text-[9.5px] tracking-[0.1em] uppercase" style={{ color: '#6B7A72' }}>leads</div>
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => setEditingSponsor(sponsor)}
                      className="w-8 h-8 grid place-items-center rounded-lg transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                      style={{ color: '#6B7A72' }}
                      title="Edit sponsor"
                    >
                      <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L18 5.625" />
                      </svg>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => setDeletingSponsor(sponsor)}
                      className="w-8 h-8 grid place-items-center rounded-lg transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                      style={{ color: '#B8423C' }}
                      title="Delete sponsor"
                    >
                      <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>

                    <button onClick={() => copyPortalLink(sponsor.invite_token)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-colors border shrink-0"
                      style={{
                        borderColor: copied === sponsor.invite_token ? 'rgba(45,122,79,0.4)' : '#E5E0D4',
                        color: copied === sponsor.invite_token ? '#2D7A4F' : '#3A4A42',
                        background: copied === sponsor.invite_token ? 'rgba(45,122,79,0.06)' : 'white',
                      }}>
                      {copied === sponsor.invite_token ? 'Copied!' : 'Copy portal link'}
                    </button>
                    <a href={`/exhibitor/${sponsor.invite_token}`} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 grid place-items-center rounded-lg shrink-0" style={{ color: '#6B7A72' }}>
                      <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
