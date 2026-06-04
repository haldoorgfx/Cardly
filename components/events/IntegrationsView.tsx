'use client';

import { Sparkles, Search, Plug, Settings, CreditCard, MessageSquare, Briefcase, BarChart2, Zap, Calendar, Video, Share2, Send, DollarSign } from 'lucide-react';

interface Props {
  eventId: string;
  eventName: string;
}

type Integration = {
  name: string;
  desc: string;
  icon: React.ReactNode;
  connected: boolean;
};

type Category = {
  label: string;
  apps: Integration[];
};

const ICON_SIZE = 20;
const SW = 1.8;

const CATEGORIES: Category[] = [
  {
    label: 'Payments',
    apps: [
      { name: 'Stripe',       desc: 'Cards, subscriptions & payouts',             icon: <CreditCard size={ICON_SIZE} strokeWidth={SW} />, connected: true  },
      { name: 'Flutterwave',  desc: 'Pan-African card & bank payments',           icon: <DollarSign size={ICON_SIZE} strokeWidth={SW} />, connected: true  },
      { name: 'Paystack',     desc: 'Payments across Nigeria & Ghana',            icon: <DollarSign size={ICON_SIZE} strokeWidth={SW} />, connected: false },
      { name: 'M-Pesa',       desc: 'Mobile money for East Africa',               icon: <CreditCard size={ICON_SIZE} strokeWidth={SW} />, connected: false },
    ],
  },
  {
    label: 'Communication',
    apps: [
      { name: 'Slack',        desc: 'Registration & sales alerts in Slack',       icon: <MessageSquare size={ICON_SIZE} strokeWidth={SW} />, connected: true  },
      { name: 'Twilio SMS',   desc: 'Text reminders & check-in codes',            icon: <Send size={ICON_SIZE} strokeWidth={SW} />,         connected: false },
      { name: 'Intercom',     desc: 'Live chat support on your pages',            icon: <MessageSquare size={ICON_SIZE} strokeWidth={SW} />, connected: false },
      { name: 'Mailchimp',    desc: 'Sync attendees to audiences',                icon: <Send size={ICON_SIZE} strokeWidth={SW} />,         connected: false },
    ],
  },
  {
    label: 'CRM & marketing',
    apps: [
      { name: 'HubSpot',          desc: 'Sync registrants as contacts',          icon: <Briefcase size={ICON_SIZE} strokeWidth={SW} />,  connected: false },
      { name: 'Salesforce',       desc: 'Push leads to your CRM',               icon: <Briefcase size={ICON_SIZE} strokeWidth={SW} />,  connected: false },
      { name: 'Google Analytics', desc: 'Track event-page traffic',              icon: <BarChart2 size={ICON_SIZE} strokeWidth={SW} />,  connected: true  },
      { name: 'Meta Pixel',       desc: 'Retarget visitors with ads',            icon: <Share2 size={ICON_SIZE} strokeWidth={SW} />,    connected: false },
    ],
  },
  {
    label: 'Productivity & automation',
    apps: [
      { name: 'Zapier',          desc: 'Automate 6,000+ apps',                   icon: <Zap size={ICON_SIZE} strokeWidth={SW} />,      connected: true  },
      { name: 'Google Calendar', desc: 'Add sessions to attendee calendars',     icon: <Calendar size={ICON_SIZE} strokeWidth={SW} />, connected: false },
      { name: 'Notion',          desc: "Export attendees & agenda to Notion",   icon: <Share2 size={ICON_SIZE} strokeWidth={SW} />,   connected: false },
      { name: 'Webhooks',        desc: 'Build your own with our API',            icon: <Plug size={ICON_SIZE} strokeWidth={SW} />,     connected: true  },
    ],
  },
  {
    label: 'Streaming',
    apps: [
      { name: 'Zoom',         desc: 'Run virtual sessions over Zoom',            icon: <Video size={ICON_SIZE} strokeWidth={SW} />, connected: false },
      { name: 'YouTube Live', desc: 'Stream the main stage publicly',            icon: <Video size={ICON_SIZE} strokeWidth={SW} />, connected: false },
    ],
  },
];

const connectedCount = CATEGORIES.reduce((acc, cat) => acc + cat.apps.filter(a => a.connected).length, 0);
const totalCount = CATEGORIES.reduce((acc, cat) => acc + cat.apps.length, 0);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function IntegrationsView(_props: Props) {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-semibold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Integrations
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>
            Connect Karta to your stack ·{' '}
            <span style={{ color: '#1F4D3A', fontWeight: 500 }}>{connectedCount} of {totalCount}</span> connected
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium border transition hover:border-[#1F4D3A] hover:text-[#1F4D3A]"
          style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
        >
          <Search size={13} strokeWidth={2} />
          Browse all
        </button>
      </div>

      {/* Promo banner */}
      <div
        className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-8"
        style={{ background: 'linear-gradient(135deg, rgba(232,197,126,0.16), rgba(31,77,58,0.06))', border: '1px solid rgba(232,197,126,0.3)' }}
      >
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'rgba(232,197,126,0.25)' }}
        >
          <Sparkles size={14} strokeWidth={2} style={{ color: '#C9A45E' }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: '#0F1F18' }}>Connect your account, don&apos;t rebuild.</p>
          <p className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>
            Plug in the tools you already use — payments, CRM, comms and automation — and Karta keeps them in sync.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-8">
        {CATEGORIES.map(cat => (
          <div key={cat.label}>
            <h2
              className="text-[11px] font-semibold mb-4"
              style={{ color: '#6B7A72', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {cat.label}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.apps.map(app => (
                <AppCard key={app.name} app={app} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppCard({ app }: { app: Integration }) {
  return (
    <div
      className="flex flex-col p-5 rounded-2xl transition-colors"
      style={{
        background: 'white',
        border: '1px solid #E5E0D4',
        cursor: 'pointer',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(31,77,58,0.4)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E0D4')}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#1F4D3A' }}
        >
          {app.icon}
        </div>
        <span
          className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-medium"
          style={app.connected
            ? { background: 'rgba(45,122,79,0.1)', color: '#2D7A4F' }
            : { background: '#F5F0E8', color: '#6B7A72' }
          }
        >
          {app.connected && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
          {app.connected ? 'Connected' : 'Not connected'}
        </span>
      </div>
      <p className="text-[14.5px] font-semibold font-display leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
        {app.name}
      </p>
      <p className="text-[12.5px] mt-1 flex-1" style={{ color: '#6B7A72', lineHeight: 1.5 }}>
        {app.desc}
      </p>
      <button
        className="mt-4 w-full h-8 rounded-lg text-[12.5px] font-medium transition flex items-center justify-center gap-1.5"
        style={app.connected
          ? { border: '1px solid #E5E0D4', color: '#6B7A72', background: 'white' }
          : { background: '#1F4D3A', color: 'white' }
        }
      >
        {app.connected
          ? <><Settings size={12} strokeWidth={2} /> Manage</>
          : <><Plug size={12} strokeWidth={2} /> Connect</>
        }
      </button>
    </div>
  );
}
