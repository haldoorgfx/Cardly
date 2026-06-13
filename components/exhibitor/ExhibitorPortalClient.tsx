'use client';

import { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Sponsor {
  id: string;
  company_name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  meeting_url: string | null;
  booth_location: string | null;
  booth_hours: string | null;
  offerings: unknown;
  team_members: unknown;
  tier: string;
  is_visible: boolean;
}

interface Lead {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  note: string | null;
  rating: string | null;
  created_at: string;
}

interface Session {
  id: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  room: string | null;
  session_type: string | null;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  starts_at: string | null;
  ends_at: string | null;
}

interface Props {
  sponsor: Sponsor;
  event: Event;
  leads: Lead[];
  sessions: Session[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function tierColor(tier: string) {
  const t = tier.toLowerCase();
  if (t === 'platinum') return { pill: 'bg-accent/20 text-accent-dark border-accent/40', label: 'Platinum sponsor' };
  if (t === 'gold') return { pill: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Gold sponsor' };
  if (t === 'silver') return { pill: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Silver sponsor' };
  return { pill: 'bg-primary-soft/60 text-primary border-primary/20', label: `${tier} sponsor` };
}

function ratingStyle(rating: string | null) {
  if (rating === 'hot') return { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Hot' };
  if (rating === 'warm') return { pill: 'bg-accent/20 text-accent-dark border-accent/40', label: 'Warm' };
  return { pill: 'bg-ink/5 text-ink-soft border-border', label: 'Cold' };
}

function formatSessionTime(session: Session) {
  if (!session.starts_at) return session.room ?? '';
  const d = new Date(session.starts_at);
  return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${session.room ? ` · ${session.room}` : ''}`;
}

// ── Icon ──────────────────────────────────────────────────────────────────────

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    scan: <><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M8.5 12.5l2.5 2.5 4.5-4.5" /></>,
    plus: <path d="M5 12h14M12 5v14" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    check: <path d="M5 12.5l4.5 4.5L19 7" />,
    external: <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
    calendar: <><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {paths[name]}
    </svg>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Panel({ title, action, children, noPad }: { title?: string; action?: React.ReactNode; children: React.ReactNode; noPad?: boolean }) {
  return (
    <div className="bg-white border border-[#E5E0D4] rounded-2xl overflow-hidden">
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#E5E0D4]/70">
          <span className="font-display text-[14px] font-semibold text-[#0F1F18] tracking-tight">{title}</span>
          {action}
        </div>
      )}
      <div className={noPad ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${accent ? 'border-[#E8C57E]/50' : 'border-[#E5E0D4] bg-white'}`}
      style={accent ? { background: 'linear-gradient(135deg, rgba(232,197,126,0.14), rgba(31,77,58,0.05))' } : undefined}
    >
      <div className=" text-[9.5px] tracking-[0.14em] uppercase text-[#6B7A72] mb-2">{label}</div>
      <div className=" text-[26px] text-[#1F4D3A] tracking-tight leading-none">{value}</div>
      {sub && <div className=" text-[11px] text-emerald-600 mt-2">{sub}</div>}
    </div>
  );
}

function LeadQualityBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-[13px]">
        <span className="text-[#3A4A42]">{label}</span>
        <span className=" text-[#6B7A72]">{count} · {pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#E8EFEB]/60 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function Avatar({ name, size = 36, gradient }: { name: string; size?: number; gradient?: string }) {
  return (
    <span
      className="rounded-full grid place-items-center text-white font-display font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, background: gradient ?? 'linear-gradient(135deg,#2A6A50,#C9A45E)' }}
    >
      {initials(name)}
    </span>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────

function Overview({ leads, sessions }: { leads: Lead[]; sessions: Session[] }) {
  const hot = leads.filter(l => l.rating === 'hot').length;
  const warm = leads.filter(l => l.rating === 'warm').length;
  const cold = leads.filter(l => l.rating !== 'hot' && l.rating !== 'warm').length;
  const today = leads.filter(l => {
    const d = new Date(l.created_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length;

  return (
    <div className="grid gap-6">
      {/* Lead capture CTA */}
      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(232,197,126,0.18), rgba(31,77,58,0.06))' }}
      >
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-[#E8C57E]/25 text-[#C9A45E] grid place-items-center shrink-0">
            <Icon name="scan" size={20} />
          </span>
          <div>
            <div className="font-display text-[15px] font-semibold text-[#163828]">Capture leads at your booth</div>
            <div className="text-[13px] text-[#3A4A42] mt-0.5">Scan an attendee&apos;s badge or Karta Card to save them instantly.</div>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8C57E] text-[#163828] text-[13.5px] font-semibold hover:bg-[#C9A45E] transition-colors whitespace-nowrap shrink-0">
          <Icon name="scan" size={15} />
          Scan a lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Leads captured" value={leads.length} sub={today > 0 ? `↑ ${today} today` : undefined} />
        <Stat label="Booth visits" value="—" />
        <Stat label="Resources opened" value="—" />
        <Stat label="Meetings booked" value="—" accent />
      </div>

      {/* Lead quality + Sessions */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Lead quality">
          {leads.length === 0 ? (
            <p className="text-[13px] text-[#6B7A72]">No leads captured yet.</p>
          ) : (
            <div className="grid gap-3">
              <LeadQualityBar label="Hot · ready to buy" count={hot} total={leads.length} color="#1F4D3A" />
              <LeadQualityBar label="Warm · interested" count={warm} total={leads.length} color="#2A6A50" />
              <LeadQualityBar label="Cold · browsing" count={cold} total={leads.length} color="#A8C2B5" />
            </div>
          )}
        </Panel>

        <Panel title="Your sessions">
          {sessions.length === 0 ? (
            <p className="text-[13px] text-[#6B7A72]">No sessions assigned yet.</p>
          ) : (
            <div className="grid gap-2.5">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center gap-3 bg-[#FAF6EE]/60 border border-[#E5E0D4] rounded-xl px-3.5 py-2.5">
                  <span className="w-8 h-8 rounded-lg bg-[#E8EFEB] text-[#1F4D3A] grid place-items-center shrink-0">
                    <Icon name="calendar" size={14} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[#0F1F18] truncate">{s.title}</div>
                    <div className=" text-[10.5px] text-[#6B7A72] mt-0.5">{formatSessionTime(s)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

// ── Tab: Leads ────────────────────────────────────────────────────────────────

function Leads({ leads }: { leads: Lead[] }) {
  const gradients = [
    'linear-gradient(135deg,#3E7E5E,#C9A45E)',
    'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  ];

  function exportCSV() {
    const rows = [['Name', 'Email', 'Rating', 'Note', 'Captured'].join(',')];
    leads.forEach(l => {
      rows.push([
        l.attendee_name ?? '', l.attendee_email ?? '',
        l.rating ?? '', l.note ?? '',
        new Date(l.created_at).toLocaleDateString(),
      ].map(v => `"${v}"`).join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Panel
      title={`Captured leads · ${leads.length}`}
      action={
        <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E0D4] text-[13px] text-[#3A4A42] hover:border-[#1F4D3A]/40 hover:text-[#1F4D3A] transition-colors">
          <Icon name="external" size={14} />
          Export CSV
        </button>
      }
      noPad
    >
      {leads.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13px] text-[#6B7A72]">No leads captured yet. Start scanning attendee badges at your booth.</div>
      ) : (
        <div className="divide-y divide-[#E5E0D4]/60">
          {leads.map((l, i) => {
            const style = ratingStyle(l.rating);
            const name = l.attendee_name ?? 'Unknown';
            return (
              <div key={l.id} className="flex items-center gap-3.5 px-5 py-3.5">
                <Avatar name={name} size={38} gradient={gradients[i % 2]} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium text-[#0F1F18] truncate">{name}</div>
                  <div className=" text-[11px] text-[#6B7A72] truncate">{l.attendee_email ?? ''}</div>
                </div>
                <span className={`inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border ${style.pill}`}>{style.label}</span>
                <button className="w-8 h-8 grid place-items-center rounded-lg text-[#6B7A72] hover:bg-[#E8EFEB] hover:text-[#1F4D3A] transition-colors shrink-0">
                  <Icon name="arrow" size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

// ── Tab: Booth Profile ────────────────────────────────────────────────────────

function BoothProfile({ sponsor }: { sponsor: Sponsor }) {
  const [form, setForm] = useState({
    company_name: sponsor.company_name,
    tagline: sponsor.tagline ?? '',
    description: sponsor.description ?? '',
    website_url: sponsor.website_url ?? '',
    booth_location: sponsor.booth_location ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/sponsors/${sponsor.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-5">
      <div className="grid gap-5 content-start">
        <Panel title="Booth profile">
          <div className="grid gap-4">
            <div>
              <label className=" text-[9.5px] tracking-[0.14em] uppercase text-[#6B7A72] mb-1.5 block">Company name</label>
              <input
                value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                className="w-full bg-white border border-[#E5E0D4] rounded-lg px-3 py-2.5 text-[13.5px] text-[#0F1F18] focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]/40"
              />
            </div>
            <div>
              <label className=" text-[9.5px] tracking-[0.14em] uppercase text-[#6B7A72] mb-1.5 block">Tagline</label>
              <input
                value={form.tagline}
                onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                className="w-full bg-white border border-[#E5E0D4] rounded-lg px-3 py-2.5 text-[13.5px] text-[#0F1F18] focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]/40"
              />
            </div>
            <div>
              <label className=" text-[9.5px] tracking-[0.14em] uppercase text-[#6B7A72] mb-1.5 block">About</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                className="w-full bg-white border border-[#E5E0D4] rounded-lg px-3 py-2.5 text-[13.5px] text-[#0F1F18] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className=" text-[9.5px] tracking-[0.14em] uppercase text-[#6B7A72] mb-1.5 block">Website</label>
                <input
                  value={form.website_url}
                  onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
                  className="w-full bg-white border border-[#E5E0D4] rounded-lg px-3 py-2.5 text-[13.5px] text-[#0F1F18] focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]/40"
                />
              </div>
              <div>
                <label className=" text-[9.5px] tracking-[0.14em] uppercase text-[#6B7A72] mb-1.5 block">Booth</label>
                <input
                  value={form.booth_location}
                  onChange={e => setForm(f => ({ ...f, booth_location: e.target.value }))}
                  className="w-full bg-white border border-[#E5E0D4] rounded-lg px-3 py-2.5 text-[13.5px] text-[#0F1F18] focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]/40"
                />
              </div>
            </div>
          </div>
          <div className="mt-5">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F4D3A] text-[#FAF6EE] text-[13.5px] font-medium hover:bg-[#163828] disabled:opacity-60 transition-colors"
            >
              <Icon name="check" size={15} />
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 content-start">
        <Panel title="Logo">
          <div className="aspect-[3/2] rounded-xl border border-dashed border-[#1F4D3A]/40 bg-[#FAF6EE]/50 grid place-items-center">
            {sponsor.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sponsor.logo_url} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
            ) : (
              <div className="text-center text-[#1F4D3A]">
                <Icon name="upload" size={20} />
                <div className="text-[11.5px] mt-1.5 font-medium">Upload logo</div>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Visibility">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] text-[#0F1F18] font-medium">Featured booth</div>
              <div className="text-[11.5px] text-[#6B7A72] mt-0.5 capitalize">{sponsor.tier} perk</div>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${sponsor.is_visible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-ink/5 text-[#3A4A42] border-[#E5E0D4]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full`} style={{ background: sponsor.is_visible ? '#2D7A4F' : '#6B7A72' }} />
              {sponsor.is_visible ? 'On' : 'Off'}
            </span>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ── Tab: Resources ────────────────────────────────────────────────────────────

interface Offering { title: string; type?: string; url?: string; opens?: number }

function Resources({ sponsor }: { sponsor: Sponsor }) {
  const offerings = Array.isArray(sponsor.offerings) ? (sponsor.offerings as Offering[]) : [];

  return (
    <Panel
      title="Booth resources"
      action={
        <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E0D4] text-[13px] text-[#3A4A42] hover:border-[#1F4D3A]/40 hover:text-[#1F4D3A] transition-colors">
          <Icon name="plus" size={14} />
          Add resource
        </button>
      }
      noPad
    >
      {offerings.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13px] text-[#6B7A72]">No resources added yet. Add PDFs, links, or case studies for attendees.</div>
      ) : (
        <div className="divide-y divide-[#E5E0D4]/60">
          {offerings.map((r, i) => (
            <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
              <span className="w-9 h-9 rounded-lg bg-[#E8EFEB] text-[#1F4D3A] grid place-items-center shrink-0">
                <Icon name="external" size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium text-[#0F1F18]">{r.title}</div>
                <div className=" text-[11px] text-[#6B7A72] mt-0.5">{r.type ?? 'Link'}</div>
              </div>
              {r.opens != null && (
                <span className=" text-[11px] text-[#6B7A72]">{r.opens} opens</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

// ── Tab: Team ─────────────────────────────────────────────────────────────────

interface TeamMember { name: string; role?: string }

function Team({ sponsor }: { sponsor: Sponsor }) {
  const members = Array.isArray(sponsor.team_members) ? (sponsor.team_members as TeamMember[]) : [];
  const gradients = [
    'linear-gradient(135deg,#1F4D3A,#2A6A50)',
    'linear-gradient(135deg,#3E7E5E,#C9A45E)',
    'linear-gradient(135deg,#163828,#3E7E5E)',
  ];

  return (
    <Panel
      title="Booth team"
      action={
        <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E0D4] text-[13px] text-[#3A4A42] hover:border-[#1F4D3A]/40 hover:text-[#1F4D3A] transition-colors">
          <Icon name="plus" size={14} />
          Invite
        </button>
      }
      noPad
    >
      {members.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13px] text-[#6B7A72]">No team members added yet.</div>
      ) : (
        <div className="divide-y divide-[#E5E0D4]/60">
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
              <Avatar name={m.name} size={38} gradient={gradients[i % 3]} />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium text-[#0F1F18]">{m.name}</div>
                {m.role && <div className=" text-[11px] text-[#6B7A72] mt-0.5">{m.role}</div>}
              </div>
              {i === 0 && (
                <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border bg-[#E8EFEB] text-[#1F4D3A] border-[#1F4D3A]/20">You</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const TABS = [
  ['overview', 'Overview'],
  ['leads', 'Leads'],
  ['booth', 'Booth profile'],
  ['resources', 'Resources'],
  ['team', 'Team'],
] as const;

type TabId = typeof TABS[number][0];

export function ExhibitorPortalClient({ sponsor, event, leads, sessions }: Props) {
  const [tab, setTab] = useState<TabId>('overview');
  const { pill, label } = tierColor(sponsor.tier);

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-[#FAF6EE]/85 backdrop-blur border-b border-[#E5E0D4]">
        <div className="mx-auto max-w-[1080px] px-5 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50 60%,#E8C57E)' }} />
            <div className="leading-none">
              <div className="font-display text-[15px] font-bold text-[#1F4D3A]">Karta</div>
              <div className=" text-[8.5px] tracking-[0.16em] uppercase text-[#6B7A72] mt-0.5">Exhibitor Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline  text-[11px] text-[#6B7A72]">{event.name}</span>
            <span
              className="w-8 h-8 rounded-full grid place-items-center text-white font-display font-semibold text-[11px] shrink-0"
              style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)' }}
            >
              {initials(sponsor.company_name)}
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0D1F17,#1F4D3A 60%,#235741)' }}>
        <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 100% at 90% 0%, rgba(232,197,126,0.26), transparent 55%)' }} />
        <div className="relative mx-auto max-w-[1080px] px-5 lg:px-8 py-8">
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border ${pill}`}>{label}</span>
            {sponsor.booth_location && (
              <span className=" text-[11px] text-white/70">Booth {sponsor.booth_location}</span>
            )}
          </div>
          <h1 className="font-display text-[28px] font-bold text-white tracking-[-0.02em]">{sponsor.company_name}</h1>
          <p className="text-white/75 text-[14px] mt-1.5">
            {sponsor.tagline ?? "Here's how your presence is performing."}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-10 bg-[#FAF6EE]/90 backdrop-blur border-b border-[#E5E0D4]">
        <div className="mx-auto max-w-[1080px] px-5 lg:px-8 flex gap-1 overflow-x-auto">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative px-3.5 py-3 text-[13.5px] font-medium whitespace-nowrap transition-colors ${tab === id ? 'text-[#1F4D3A]' : 'text-[#6B7A72] hover:text-[#3A4A42]'}`}
            >
              {label}
              {tab === id && <span className="absolute left-2.5 right-2.5 bottom-0 h-0.5 rounded-full bg-[#1F4D3A]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-[1080px] px-5 lg:px-8 py-7">
        {tab === 'overview' && <Overview leads={leads} sessions={sessions} />}
        {tab === 'leads' && <Leads leads={leads} />}
        {tab === 'booth' && <BoothProfile sponsor={sponsor} />}
        {tab === 'resources' && <Resources sponsor={sponsor} />}
        {tab === 'team' && <Team sponsor={sponsor} />}
      </main>
    </div>
  );
}
