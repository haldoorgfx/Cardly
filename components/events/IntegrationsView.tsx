'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Search, Plug, Settings, CreditCard, MessageSquare, Briefcase, BarChart2, Zap, Calendar, Video, Share2, Send, DollarSign } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/dash';

interface Props {
  eventId: string;
  eventName: string;
}

type IntegrationStatus = 'builtin' | 'coming_soon';

type Integration = {
  name: string;
  desc: string;
  icon: React.ReactNode;
  status: IntegrationStatus;
  configureHref?: string;
};

type Category = {
  label: string;
  apps: Integration[];
};

const ICON_SIZE = 20;
const SW = 1.8;

function buildCategories(eventId: string): Category[] {
  return [
    {
      label: 'Payments',
      apps: [
        { name: 'Stripe',       desc: 'Cards, subscriptions & payouts',             icon: <CreditCard size={ICON_SIZE} strokeWidth={SW} />, status: 'builtin',     configureHref: `/events/${eventId}/event-page` },
        { name: 'Flutterwave',  desc: 'Pan-African card & bank payments',           icon: <DollarSign size={ICON_SIZE} strokeWidth={SW} />, status: 'builtin',     configureHref: `/events/${eventId}/event-page` },
        { name: 'Paystack',     desc: 'Payments across Nigeria & Ghana',            icon: <DollarSign size={ICON_SIZE} strokeWidth={SW} />, status: 'coming_soon'  },
        { name: 'M-Pesa',       desc: 'Mobile money for East Africa',               icon: <CreditCard size={ICON_SIZE} strokeWidth={SW} />, status: 'coming_soon'  },
      ],
    },
    {
      label: 'Communication',
      apps: [
        { name: 'Slack',        desc: 'Registration & sales alerts in Slack',       icon: <MessageSquare size={ICON_SIZE} strokeWidth={SW} />, status: 'coming_soon' },
        { name: 'Twilio SMS',   desc: 'Text reminders & check-in codes',            icon: <Send size={ICON_SIZE} strokeWidth={SW} />,         status: 'coming_soon' },
        { name: 'Intercom',     desc: 'Live chat support on your pages',            icon: <MessageSquare size={ICON_SIZE} strokeWidth={SW} />, status: 'coming_soon' },
        { name: 'Mailchimp',    desc: 'Sync attendees to audiences',                icon: <Send size={ICON_SIZE} strokeWidth={SW} />,         status: 'coming_soon' },
      ],
    },
    {
      label: 'CRM & marketing',
      apps: [
        { name: 'HubSpot',          desc: 'Sync registrants as contacts',          icon: <Briefcase size={ICON_SIZE} strokeWidth={SW} />,  status: 'coming_soon' },
        { name: 'Salesforce',       desc: 'Push leads to your CRM',               icon: <Briefcase size={ICON_SIZE} strokeWidth={SW} />,  status: 'coming_soon' },
        { name: 'Google Analytics', desc: 'Track event-page traffic',              icon: <BarChart2 size={ICON_SIZE} strokeWidth={SW} />,  status: 'coming_soon' },
        { name: 'Meta Pixel',       desc: 'Retarget visitors with ads',            icon: <Share2 size={ICON_SIZE} strokeWidth={SW} />,     status: 'coming_soon' },
      ],
    },
    {
      label: 'Productivity & automation',
      apps: [
        { name: 'Zapier',          desc: 'Automate 6,000+ apps',                   icon: <Zap size={ICON_SIZE} strokeWidth={SW} />,      status: 'coming_soon' },
        { name: 'Google Calendar', desc: 'Add sessions to attendee calendars',     icon: <Calendar size={ICON_SIZE} strokeWidth={SW} />, status: 'coming_soon' },
        { name: 'Notion',          desc: "Export attendees & agenda to Notion",   icon: <Share2 size={ICON_SIZE} strokeWidth={SW} />,   status: 'coming_soon' },
        { name: 'Webhooks',        desc: 'Build your own with our API',            icon: <Plug size={ICON_SIZE} strokeWidth={SW} />,     status: 'builtin',    configureHref: `/events/${eventId}/webhooks` },
      ],
    },
    {
      label: 'Streaming',
      apps: [
        { name: 'Zoom',         desc: 'Run virtual sessions over Zoom',            icon: <Video size={ICON_SIZE} strokeWidth={SW} />, status: 'coming_soon' },
        { name: 'YouTube Live', desc: 'Stream the main stage publicly',            icon: <Video size={ICON_SIZE} strokeWidth={SW} />, status: 'coming_soon' },
      ],
    },
  ];
}

// Counts computed from a dummy categories call (eventId doesn't affect counts)
const _dummyCats = buildCategories('');
const builtinCount = _dummyCats.reduce((acc, cat) => acc + cat.apps.filter(a => a.status === 'builtin').length, 0);
const totalCount = _dummyCats.reduce((acc, cat) => acc + cat.apps.length, 0);

export function IntegrationsView({ eventId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const CATEGORIES = buildCategories(eventId);

  const q = query.trim().toLowerCase();
  const filteredCategories = q
    ? CATEGORIES
        .map(cat => ({ ...cat, apps: cat.apps.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)) }))
        .filter(cat => cat.apps.length > 0)
    : CATEGORIES;

  return (
    <PageShell width="wide">

      {/* Header */}
      <PageHeader
        title="Integrations"
        subtitle={
          <>
            Connect Eventera to your stack ·{' '}
            <span style={{ color: '#0F1F18', fontWeight: 500 }}>{builtinCount} of {totalCount}</span> built-in
          </>
        }
        actions={
          <div className="relative sm:w-[240px] shrink-0">
            <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#65736B' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search integrations"
              aria-label="Search integrations"
              className="w-full h-9 pl-9 pr-3 rounded-lg text-[13px] outline-none transition"
              style={{ border: '1px solid #E5E0D4', background: 'white', color: '#0F1F18' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#1F4D3A')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E5E0D4')}
            />
          </div>
        }
      />

      {/* Promo banner */}
      <div
        className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-8"
        style={{ background: 'rgba(232,197,126,0.12)', border: '1px solid rgba(232,197,126,0.3)' }}
      >
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'rgba(232,197,126,0.25)' }}
        >
          <Sparkles size={14} strokeWidth={2} style={{ color: '#C9A45E' }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: '#0F1F18' }}>Connect your account, don&apos;t rebuild.</p>
          <p className="text-[12.5px] mt-0.5" style={{ color: '#65736B' }}>
            Plug in the tools you already use — payments, CRM, comms and automation — and Eventera keeps them in sync.
          </p>
        </div>
      </div>

      {/* No results */}
      {filteredCategories.length === 0 && (
        <div className="rounded-2xl border border-dashed py-14 px-6 text-center" style={{ borderColor: '#E5E0D4' }}>
          <p className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>No integrations match &ldquo;{query}&rdquo;</p>
          <p className="text-[13px] mt-1" style={{ color: '#65736B' }}>Try a different name — like Stripe, Slack, or Zapier.</p>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-8">
        {filteredCategories.map(cat => (
          <div key={cat.label}>
            <h2
              className="text-[12.5px] font-semibold mb-4"
              style={{ color: '#65736B', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {cat.label}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.apps.map(app => (
                <AppCard key={app.name} app={app} onConfigure={app.configureHref ? () => router.push(app.configureHref!) : undefined} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function AppCard({ app, onConfigure }: { app: Integration; onConfigure?: () => void }) {
  const isBuiltin = app.status === 'builtin';
  return (
    <div
      className="flex flex-col p-5 rounded-2xl transition-colors"
      style={{
        background: 'white',
        border: '1px solid #E5E0D4',
        cursor: isBuiltin ? 'pointer' : 'default',
      }}
      onClick={isBuiltin ? onConfigure : undefined}
      onMouseEnter={isBuiltin ? (e => (e.currentTarget.style.borderColor = 'rgba(31,77,58,0.4)')) : undefined}
      onMouseLeave={isBuiltin ? (e => (e.currentTarget.style.borderColor = '#E5E0D4')) : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#3A4A42' }}
        >
          {app.icon}
        </div>
        <span
          className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[12.5px] font-medium"
          style={app.status === 'builtin'
            ? { background: 'rgba(45,122,79,0.1)', color: '#2D7A4F' }
            : { background: '#F5F0E8', color: '#9BA8A1' }
          }
        >
          {app.status === 'builtin' && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
          {app.status === 'builtin' ? 'Built-in' : 'Coming soon'}
        </span>
      </div>
      <p className="text-[14.5px] font-semibold font-display leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
        {app.name}
      </p>
      <p className="text-[12.5px] mt-1 flex-1" style={{ color: '#65736B', lineHeight: 1.5 }}>
        {app.desc}
      </p>
      {isBuiltin ? (
        <button
          onClick={e => { e.stopPropagation(); onConfigure?.(); }}
          className="mt-4 w-full h-8 rounded-lg text-[12.5px] font-medium transition flex items-center justify-center gap-1.5"
          style={{ border: '1px solid #E5E0D4', color: '#1F4D3A', background: 'rgba(31,77,58,0.06)' }}
        >
          <Settings size={12} strokeWidth={2} /> Configure
        </button>
      ) : (
        <div
          className="mt-4 w-full h-8 rounded-lg text-[12.5px] font-medium flex items-center justify-center gap-1.5"
          style={{ border: '1px dashed #E5E0D4', color: '#9BA8A1', background: 'transparent' }}
        >
          Coming soon
        </div>
      )}
    </div>
  );
}
