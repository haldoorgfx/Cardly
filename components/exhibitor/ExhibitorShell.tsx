'use client';

import Link from 'next/link';

interface Props {
  token: string;
  companyName: string;
  tier: string | null;
  boothNumber: string | null;
  logoUrl?: string | null;
  eventName: string;
  eventSlug: string;
  activeTab: 'overview' | 'leads' | 'booth' | 'products' | 'meetings' | 'preview' | 'resources' | 'team';
  /** Derived workspace mode. An entry with a booth/products presents as an
   *  "Exhibitor"; a pure logo-tier partner presents as a "Sponsor". Defaults to
   *  'sponsor' so existing behaviour is unchanged when not supplied. */
  mode?: 'sponsor' | 'exhibitor';
  /** Additive: when the visitor is a logged-in sponsor for this event, show a
   *  small "Back to your dashboard" link. Absent/false for anonymous token
   *  visitors — the token experience is otherwise unchanged. */
  showDashboardLink?: boolean;
  /** When set (dashboard /sponsoring/[sponsorId] routes), tab links use this
   *  base path instead of the token URLs, and the standalone portal header is
   *  suppressed — the AppShell provides the chrome. Token portal unchanged. */
  hrefBase?: string;
  children: React.ReactNode;
}

const TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'leads',      label: 'Leads' },
  { id: 'meetings',   label: 'Meetings' },
  { id: 'booth',      label: 'Booth profile' },
  { id: 'products',   label: 'Products' },
  { id: 'preview',    label: 'Directory preview' },
  { id: 'resources',  label: 'Resources' },
  { id: 'team',       label: 'Team' },
] as const;

function tabHref(token: string, id: string) {
  return id === 'overview' ? `/exhibitor/${token}` : `/exhibitor/${token}/${id}`;
}

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  return (
    <span
      className="rounded-full grid place-items-center text-white font-display font-semibold shrink-0"
      style={{
        width: size, height: size,
        fontSize: size * 0.36,
        background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)',
      }}
    >
      {initials}
    </span>
  );
}

function tierTone(tier: string | null) {
  if (!tier) return 'bg-[rgba(232,197,126,0.2)] text-[#C9A45E] border-[rgba(232,197,126,0.4)]';
  const t = tier.toLowerCase();
  if (t === 'platinum') return 'bg-[rgba(232,197,126,0.2)] text-[#C9A45E] border-[rgba(232,197,126,0.4)]';
  if (t === 'gold')     return 'bg-[rgba(232,197,126,0.15)] text-[#C9A45E] border-[rgba(232,197,126,0.3)]';
  return 'bg-[rgba(255,255,255,0.1)] text-white border-[rgba(255,255,255,0.2)]';
}

export function ExhibitorShell({ token, companyName, tier, boothNumber, logoUrl, eventName, children, activeTab, showDashboardLink, hrefBase, mode = 'sponsor' }: Props) {
  const initials = companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const embedded = Boolean(hrefBase);
  const modeWord = mode === 'exhibitor' ? 'Exhibitor' : 'Sponsor';
  const href = (id: string) =>
    hrefBase ? (id === 'overview' ? hrefBase : `${hrefBase}/${id}`) : tabHref(token, id);

  return (
    <div className={embedded ? undefined : 'min-h-screen'} style={embedded ? undefined : { background: '#FAF6EE' }}>
      {/* Header — hidden in the dashboard, where AppShell is the chrome */}
      {!embedded && (
      <header className="sticky top-0 z-20 backdrop-blur border-b" style={{ background: 'rgba(250,246,238,0.85)', borderColor: '#E5E0D4' }}>
        <div className="mx-auto max-w-[1080px] px-5 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50 60%,#E8C57E)' }} />
            <div className="leading-none">
              <div className="font-display text-[15px] font-bold" style={{ color: '#1F4D3A' }}>Eventera</div>
              <div className=" text-[8.5px] tracking-[0.16em] uppercase mt-0.5" style={{ color: '#6B7A72' }}>{modeWord} Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {showDashboardLink && (
              <Link
                href="/sponsoring"
                className="inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-[#E8EFEB]"
                style={{ color: '#1F4D3A', borderColor: '#E5E0D4', background: '#FFFFFF' }}
              >
                <span aria-hidden>&larr;</span>
                <span className="hidden sm:inline">Back to your dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Link>
            )}
            <span className="hidden sm:inline  text-[11px]" style={{ color: '#6B7A72' }}>{eventName}</span>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={companyName} className="h-8 w-8 rounded-full object-cover border" style={{ borderColor: '#E5E0D4' }} />
            ) : (
              <Avatar initials={initials} size={32} />
            )}
          </div>
        </div>
      </header>
      )}

      {/* Hero */}
      <div className={`relative overflow-hidden${embedded ? ' rounded-2xl' : ''}`} style={{ background: 'linear-gradient(135deg,#0D1F17,#1F4D3A 60%,#235741)' }}>
        <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 100% at 90% 0%, rgba(232,197,126,0.26), transparent 55%)' }} />
        <div className="relative mx-auto max-w-[1080px] px-5 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {tier ? (
                  <span className={`inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border ${tierTone(tier)}`}>
                    {tier} {modeWord.toLowerCase()}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border bg-[rgba(255,255,255,0.1)] text-white border-[rgba(255,255,255,0.2)]">
                    {modeWord}
                  </span>
                )}
                {boothNumber && (
                  <span className=" text-[11px]" style={{ color: 'rgba(250,246,238,0.7)' }}>Booth {boothNumber}</span>
                )}
              </div>
              <h1 className="font-display text-[28px] font-bold tracking-[-0.02em]" style={{ color: '#FAF6EE' }}>{companyName}</h1>
              <p className="text-[14px] mt-1.5" style={{ color: 'rgba(250,246,238,0.75)' }}>
                Welcome back. Here&apos;s how your presence is performing.
              </p>
            </div>
            {/* Logo display in hero */}
            {logoUrl && (
              <div
                className="shrink-0 hidden sm:flex items-center justify-center rounded-2xl p-3"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={companyName} className="h-16 w-28 object-contain" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className={embedded ? 'border-b' : 'sticky top-14 z-10 backdrop-blur border-b'} style={{ background: embedded ? 'transparent' : 'rgba(250,246,238,0.9)', borderColor: '#E5E0D4' }}>
        <div className="mx-auto max-w-[1080px] px-5 lg:px-8 flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map(({ id, label }) => {
            const isActive = activeTab === id;
            return (
              <Link
                key={id}
                href={href(id)}
                className="relative px-3.5 py-3 text-[13.5px] font-medium whitespace-nowrap transition-colors"
                style={{ color: isActive ? '#1F4D3A' : '#6B7A72' }}
              >
                {label}
                {isActive && (
                  <span className="absolute left-2.5 right-2.5 bottom-0 h-0.5 rounded-full" style={{ background: '#1F4D3A' }} />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-[1080px] px-5 lg:px-8 py-7">
        {children}
      </main>
    </div>
  );
}
