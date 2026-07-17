'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, HeartHandshake, Mail, Phone, Copy, Check } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/dash';
import { StatusState } from '@/components/ui/status-state';

export interface AccessTag {
  tag: string;
  count: number;
}

export interface AccessAttendee {
  registration_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  accessibility: string[];
  note: string | null;
}

export interface AccessSummary {
  total_with_needs: number;
  by_tag: AccessTag[];
  attendees: AccessAttendee[];
}

interface Props {
  eventSlug: string;
  data: AccessSummary | null;
  loadError: 'auth' | 'generic' | null;
}

function attendeeToText(a: AccessAttendee): string {
  const lines: string[] = [];
  lines.push(a.name ?? 'Attendee');
  if (a.accessibility.length > 0) lines.push(`Needs: ${a.accessibility.join(', ')}`);
  if (a.note && a.note.trim()) lines.push(`Note: ${a.note.trim()}`);
  if (a.email) lines.push(`Email: ${a.email}`);
  if (a.phone) lines.push(`Phone: ${a.phone}`);
  return lines.join('\n');
}

export function AccessibilityClient({ eventSlug, data, loadError }: Props) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const hasNeeds = !!data && (data.total_with_needs > 0 || data.attendees.length > 0);

  async function copyAttendee(a: AccessAttendee) {
    try {
      await navigator.clipboard.writeText(attendeeToText(a));
      setCopiedId(a.registration_id);
      setTimeout(() => setCopiedId((prev) => (prev === a.registration_id ? null : prev)), 1800);
    } catch {
      /* clipboard blocked — the details stay visible on screen */
    }
  }

  return (
    <PageShell width="wide">

        <Link
          href={`/events/${eventSlug}/catering`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 transition hover:text-[#1F4D3A]"
          style={{ color: '#65736B' }}
        >
          <ArrowLeft size={15} strokeWidth={2} /> Back to catering
        </Link>

        <PageHeader
          title="Accessibility"
          subtitle="What attendees told you would help them take part. Prepare for these ahead of time, and reach out if you want to confirm any details."
        />

        {/* Private notice — this is personal data, handled with care */}
        <div className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6" style={{ background: '#E8EFEB', border: '1px solid rgba(31,77,58,0.16)' }}>
          <ShieldCheck size={16} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: '#1F4D3A' }} />
          <p className="text-[13px]" style={{ color: '#3A4A42', lineHeight: 1.5 }}>
            Private to your organizing team. Share only with the people preparing for the event, and only what they need to know.
          </p>
        </div>

        {loadError ? (
          <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
            <StatusState
              kind="error"
              reason={loadError === 'auth' ? 'permission' : 'network'}
              title={loadError === 'auth' ? 'You can’t manage this event' : 'Couldn’t load this summary'}
              message={loadError === 'auth'
                ? 'Only the event owner or its staff can see accessibility needs.'
                : 'We couldn’t reach the database to fetch the summary. Please try again.'}
              primaryAction={loadError === 'generic' ? { label: 'Try again', onClick: () => router.refresh() } : undefined}
            />
          </div>
        ) : !hasNeeds ? (
          <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
            <StatusState
              kind="empty"
              icon={HeartHandshake}
              title="No accessibility needs shared"
              message="No one has shared an accessibility need yet. When they do, it’ll show here so you can prepare — with the total, a breakdown, and how to reach them."
            />
          </div>
        ) : (
          <>
            {/* Total + by-tag */}
            <div className="bg-white rounded-2xl border p-5 mb-4" style={{ borderColor: '#E5E0D4' }}>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-display font-semibold text-[26px]" style={{ color: '#0F1F18' }}>{data!.total_with_needs}</span>
                <span className="text-[14px]" style={{ color: '#65736B' }}>
                  {data!.total_with_needs === 1 ? 'attendee shared a need' : 'attendees shared a need'}
                </span>
              </div>
              {data!.by_tag.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data!.by_tag.map((t) => (
                    <span
                      key={t.tag}
                      className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium"
                      style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#3A4A42' }}
                    >
                      {t.tag}
                      <span className="font-semibold" style={{ color: '#0F1F18' }}>{t.count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Per-attendee list */}
            <div className="space-y-3">
              {data!.attendees.map((a) => (
                <div key={a.registration_id} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E0D4' }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="text-[15px] font-semibold min-w-0 truncate" style={{ color: '#0F1F18' }}>
                      {a.name ?? 'Attendee'}
                    </div>
                    <button
                      onClick={() => copyAttendee(a)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition shrink-0"
                      style={{ border: '1px solid #E5E0D4', color: copiedId === a.registration_id ? '#2D7A4F' : '#3A4A42' }}
                    >
                      {copiedId === a.registration_id
                        ? <><Check size={13} strokeWidth={2.4} /> Copied</>
                        : <><Copy size={13} strokeWidth={2} /> Copy details</>}
                    </button>
                  </div>

                  {a.accessibility.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {a.accessibility.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full px-3 py-1.5 text-[12.5px] font-medium"
                          style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {a.note && a.note.trim() && (
                    <p className="text-[13.5px] mb-3 rounded-xl px-3.5 py-2.5" style={{ color: '#3A4A42', background: '#FAF6EE', border: '1px solid #E5E0D4', lineHeight: 1.5 }}>
                      {a.note.trim()}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {a.email && (
                      <a
                        href={`mailto:${a.email}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition hover:border-[#1F4D3A]"
                        style={{ border: '1px solid #E5E0D4', color: '#3A4A42' }}
                      >
                        <Mail size={13} strokeWidth={2} style={{ color: '#1F4D3A' }} /> {a.email}
                      </a>
                    )}
                    {a.phone && (
                      <a
                        href={`tel:${a.phone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition hover:border-[#1F4D3A]"
                        style={{ border: '1px solid #E5E0D4', color: '#3A4A42' }}
                      >
                        <Phone size={13} strokeWidth={2} style={{ color: '#1F4D3A' }} /> {a.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
    </PageShell>
  );
}
