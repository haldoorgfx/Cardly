'use client';

import { Bell, BarChart2, ExternalLink, Clock, Plus, CheckCircle2 } from 'lucide-react';

interface Props {
  eventId: string;
  eventName: string;
  registrantCount: number;
}

type Campaign = {
  subject: string;
  type: 'Confirmation' | 'Reminder' | 'Update';
  auto: boolean;
  recipients: string | null;
  openRate: string | null;
  status: 'Automated' | 'Sent' | 'Scheduled';
  scheduledAt?: string;
};

const SAMPLE_CAMPAIGNS: Campaign[] = [
  {
    subject: "You're in! Here's everything you need",
    type: 'Confirmation', auto: true,
    recipients: null, openRate: null,
    status: 'Automated',
  },
  {
    subject: 'Your event is in 3 days 🎉',
    type: 'Reminder', auto: false,
    recipients: null, openRate: null,
    status: 'Scheduled',
    scheduledAt: '3 days before',
  },
];

export function CommunicationsView({ registrantCount }: Props) {
  const hasCampaigns = true;

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-semibold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Communications
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>
            Email your attendees and send updates
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-[13px] font-semibold transition hover:opacity-90"
          style={{ background: '#1F4D3A' }}
        >
          <Plus size={14} strokeWidth={2.5} />
          New email
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <CommStat label="Emails sent" value={registrantCount > 0 ? registrantCount.toString() : '—'} icon={<Bell size={15} strokeWidth={2} />} />
        <CommStat label="Avg. open rate" value="—" sub="no data yet" icon={<BarChart2 size={15} strokeWidth={2} />} />
        <CommStat label="Click rate" value="—" icon={<ExternalLink size={15} strokeWidth={2} />} />
        <CommStat label="Scheduled" value={hasCampaigns ? '1' : '0'} icon={<Clock size={15} strokeWidth={2} />} accent />
      </div>

      {/* Campaigns panel */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4', background: 'white' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <h2 className="text-[13px] font-semibold" style={{ color: '#0F1F18' }}>Campaigns</h2>
          <button
            className="inline-flex items-center gap-1 text-[12px] font-medium h-7 px-2.5 rounded-lg transition"
            style={{ color: '#1F4D3A', background: 'rgba(31,77,58,0.06)' }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Compose
          </button>
        </div>

        {/* Table head */}
        <div
          className="grid px-5 py-2.5"
          style={{
            gridTemplateColumns: '1fr 120px 100px 90px 130px',
            borderBottom: '1px solid #E5E0D4',
            background: '#FAFAF8',
          }}
        >
          {['Subject', 'Type', 'Recipients', 'Open rate', 'Status'].map(h => (
            <span key={h} className="text-[11px] font-medium" style={{ color: '#6B7A72', letterSpacing: '0.03em' }}>{h}</span>
          ))}
        </div>

        {SAMPLE_CAMPAIGNS.map((c, i) => (
          <div
            key={i}
            className="grid items-center px-5 py-3.5"
            style={{
              gridTemplateColumns: '1fr 120px 100px 90px 130px',
              borderBottom: i < SAMPLE_CAMPAIGNS.length - 1 ? '1px solid #F5F0E8' : 'none',
            }}
          >
            {/* Subject */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(31,77,58,0.08)' }}
              >
                <Bell size={13} strokeWidth={2} style={{ color: '#1F4D3A' }} />
              </div>
              <span className="text-[13px] truncate" style={{ color: '#0F1F18' }}>{c.subject}</span>
            </div>

            {/* Type */}
            <div>
              <span
                className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium"
                style={c.auto
                  ? { background: 'rgba(232,197,126,0.2)', color: '#9A7A3A' }
                  : { background: '#F5F0E8', color: '#6B7A72' }
                }
              >
                {c.type}
              </span>
            </div>

            {/* Recipients */}
            <span className="text-[12.5px] font-mono" style={{ color: '#6B7A72' }}>
              {c.recipients ?? (registrantCount > 0 ? `${registrantCount}` : '—')}
            </span>

            {/* Open rate */}
            <span className="text-[12.5px] font-mono" style={{ color: '#6B7A72' }}>
              {c.openRate ?? '—'}
            </span>

            {/* Status */}
            <div>
              <StatusPill status={c.status} scheduledAt={c.scheduledAt} />
            </div>
          </div>
        ))}

        {/* Empty hint */}
        {registrantCount === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-[13px]" style={{ color: '#6B7A72' }}>
              No registrants yet. Campaigns will go to attendees once they register.
            </p>
          </div>
        )}
      </div>

      {/* Info note */}
      <div
        className="flex items-start gap-2.5 mt-4 px-4 py-3 rounded-xl text-[12.5px]"
        style={{ background: '#F5F7F5', border: '1px solid #E5E0D4' }}
      >
        <CheckCircle2 size={14} strokeWidth={2} style={{ color: '#1F4D3A', flexShrink: 0, marginTop: 1 }} />
        <span style={{ color: '#3A4A42' }}>
          Confirmation and reminder emails are sent automatically to all registrants.
          Use <strong>Compose</strong> to send a custom update to your attendees.
        </span>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function CommStat({ label, value, sub, icon, accent }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: accent ? 'rgba(31,77,58,0.06)' : 'white',
        border: accent ? '1px solid rgba(31,77,58,0.2)' : '1px solid #E5E0D4',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium" style={{ color: '#6B7A72' }}>{label}</span>
        <span style={{ color: accent ? '#1F4D3A' : '#6B7A72' }}>{icon}</span>
      </div>
      <p className="text-[22px] font-bold" style={{ color: accent ? '#1F4D3A' : '#0F1F18' }}>{value}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>{sub}</p>}
    </div>
  );
}

function StatusPill({ status, scheduledAt }: { status: Campaign['status']; scheduledAt?: string }) {
  const styles: Record<Campaign['status'], { bg: string; color: string }> = {
    Automated: { bg: 'rgba(31,77,58,0.08)', color: '#1F4D3A' },
    Sent:      { bg: 'rgba(45,122,79,0.1)', color: '#2D7A4F' },
    Scheduled: { bg: 'rgba(201,122,45,0.1)', color: '#C97A2D' },
  };
  const s = styles[status];
  return (
    <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-medium" style={{ background: s.bg, color: s.color }}>
      {status}
      {scheduledAt && <span className="opacity-70">· {scheduledAt}</span>}
    </span>
  );
}
