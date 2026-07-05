'use client';

import { useState } from 'react';
import { IdCard, Share2, Sparkles, Palette, Plus, Printer, FileImage } from 'lucide-react';
import Link from 'next/link';

interface PrimaryVariant {
  id: string;
  backgroundUrl: string | null;
  backgroundWidth: number | null;
  backgroundHeight: number | null;
  zonesCount: number;
}

interface VariantSummary {
  id: string;
  position: number;
  name: string | null;
  backgroundUrl: string | null;
  zonesCount: number;
}

interface Props {
  eventId: string;
  eventName: string;
  eventSlug: string;
  eventStatus: string;
  totalCards: number;
  todayCards: number;
  sharedCards: number;
  primaryVariant: PrimaryVariant | null;
  allVariants: VariantSummary[];
}

const PAPER_SIZES = ['A4', 'A6', 'Letter', '4×6 in'] as const;
type PaperSize = typeof PAPER_SIZES[number];

// Share channel breakdown is not tracked yet — this section shows empty state until we add tracking

export function EventeraCardView({ eventName, eventSlug, eventStatus, totalCards, todayCards, sharedCards, primaryVariant, allVariants }: Props) {
  const [paperSize, setPaperSize] = useState<PaperSize>('A6');
  const hasDesign = !!primaryVariant?.backgroundUrl;
  const isPublished = eventStatus === 'published';
  // Attendee page only works when the event is published and has at least one variant with a design
  const attendeeReady = isPublished && allVariants.length > 0 && hasDesign;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Cards &amp; Badges
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>
            One design. Personalised cards for attendees, printed badges for the door.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href={`/events/${eventSlug}/edit`}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium border transition hover:border-[#1F4D3A] hover:text-[#1F4D3A]"
            style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
          >
            <Palette size={13} strokeWidth={2} />
            {hasDesign ? 'Edit design' : 'Upload design'}
          </Link>
          {attendeeReady ? (
            <Link
              href={`/c/${eventSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold transition hover:opacity-90"
              style={{ background: '#E8C57E', color: '#0F1F18' }}
            >
              <Sparkles size={13} strokeWidth={2} />
              Preview as attendee
            </Link>
          ) : (
            <Link
              href={`/events/${eventSlug}/publish`}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold transition hover:opacity-90"
              style={{ background: '#E8EFEB', color: '#1F4D3A' }}
              title={!hasDesign ? 'Upload a design first' : !isPublished ? 'Publish the event to share the attendee link' : 'Add a card design to enable the attendee page'}
            >
              <Sparkles size={13} strokeWidth={2} />
              {!hasDesign ? 'Design needed' : 'Publish to share'}
            </Link>
          )}
        </div>
      </div>

      {/* ── No design state ── */}
      {!hasDesign && (
        <div
          className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl mb-7"
          style={{ background: 'rgba(232,197,126,0.1)', border: '1px solid rgba(232,197,126,0.35)' }}
        >
          <div className="flex items-center gap-2.5">
            <FileImage size={15} strokeWidth={2} style={{ color: '#C9A45E', flexShrink: 0 }} />
            <span className="text-[13px]" style={{ color: '#3A4A42' }}>
              No card design uploaded yet. Upload your event design to generate personalised cards for every attendee.
            </span>
          </div>
          <Link
            href={`/events/${eventSlug}/edit`}
            className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12.5px] font-semibold transition hover:opacity-90"
            style={{ background: '#1F4D3A', color: 'white' }}
          >
            Upload design →
          </Link>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">

        {/* Left: design preview */}
        <div className="flex flex-col gap-4">
          {hasDesign ? (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7A72' }}>
                Card design
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  border: '1px solid #E5E0D4',
                  boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.1)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={primaryVariant!.backgroundUrl!}
                  alt={`${eventName} card design`}
                  className="w-full h-auto block"
                />
              </div>
              {primaryVariant!.zonesCount > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-[12px]" style={{ color: '#6B7A72' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#2D7A4F' }} />
                  {primaryVariant!.zonesCount} editable {primaryVariant!.zonesCount === 1 ? 'zone' : 'zones'} defined
                </div>
              )}
            </div>
          ) : (
            /* Empty state */
            <Link
              href={`/events/${eventSlug}/edit`}
              className="flex flex-col items-center justify-center rounded-2xl p-8 text-center transition hover:border-[#1F4D3A] group"
              style={{ border: '2px dashed #C9C3B1', background: '#FAFAF8', minHeight: 240 }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition group-hover:scale-105"
                style={{ background: '#E8EFEB' }}
              >
                <Palette size={20} strokeWidth={1.8} style={{ color: '#1F4D3A' }} />
              </div>
              <div className="font-medium text-[14px] mb-1" style={{ color: '#0F1F18' }}>Upload your design</div>
              <div className="text-[12px]" style={{ color: '#6B7A72' }}>
                PNG or JPG background, then add name, photo &amp; role zones
              </div>
            </Link>
          )}
        </div>

        {/* Right: stats + variants */}
        <div className="space-y-5">

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatCard
              label="Cards Generated"
              value={totalCards.toLocaleString()}
              sub={todayCards > 0 ? `↗ ${todayCards} today` : totalCards > 0 ? 'None today' : 'None yet'}
              icon={<IdCard size={15} strokeWidth={2} />}
            />
            <StatCard
              label="Personalised &amp; Downloaded"
              value={sharedCards.toLocaleString()}
              sub={totalCards > 0 && sharedCards > 0 ? `${Math.round((sharedCards / totalCards) * 100)}% of registrants` : 'Via registration flow'}
              icon={<Share2 size={15} strokeWidth={2} />}
              accent
            />
          </div>

          {/* Card variants from canvas editor */}
          <Panel title="Design variants" action={
            <Link
              href={`/events/${eventSlug}/edit`}
              className="inline-flex items-center gap-1 text-[12px] font-medium h-7 px-2.5 rounded-lg transition"
              style={{ color: '#1F4D3A', background: 'rgba(31,77,58,0.06)' }}
            >
              <Plus size={12} strokeWidth={2.5} />
              Add variant
            </Link>
          }>
            {allVariants.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[13px] mb-3" style={{ color: '#6B7A72' }}>
                  No variants yet. Create different card designs for Attendees, Speakers, VIPs, etc.
                </p>
                <Link
                  href={`/events/${eventSlug}/edit`}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium transition hover:opacity-80"
                  style={{ color: '#1F4D3A' }}
                >
                  <Plus size={13} strokeWidth={2} /> Create first variant
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2.5">
                {allVariants.map((v, i) => (
                  <Link
                    key={v.id}
                    href={`/events/${eventSlug}/edit`}
                    className="flex items-center gap-3 p-3.5 rounded-xl transition hover:border-[#1F4D3A]/30"
                    style={{
                      border: i === 0 ? '1px solid rgba(31,77,58,0.4)' : '1px solid #E5E0D4',
                      background: i === 0 ? 'rgba(31,77,58,0.04)' : 'white',
                    }}
                  >
                    {v.backgroundUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={v.backgroundUrl} alt="" className="h-10 w-8 rounded-md object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-8 rounded-md flex items-center justify-center shrink-0" style={{ background: 'rgba(31,77,58,0.08)' }}>
                        <IdCard size={14} strokeWidth={2} style={{ color: '#1F4D3A' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium" style={{ color: '#0F1F18' }}>{v.name ?? `Variant ${v.position + 1}`}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>
                        {v.zonesCount > 0 ? `${v.zonesCount} zone${v.zonesCount !== 1 ? 's' : ''}` : 'No zones yet'}
                      </div>
                    </div>
                    {i === 0 && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                        PRIMARY
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          {/* Where cards are shared — coming soon */}
          <Panel title="Share channel breakdown">
            <p className="text-[13px] py-4 text-center" style={{ color: '#6B7A72' }}>
              Channel analytics coming soon. Once attendees share their cards we&apos;ll show a breakdown here.
            </p>
          </Panel>
        </div>
      </div>

      {/* ── Print & Badges section ── */}
      <div className="mt-6 rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4', background: 'white' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div>
            <h3 className="text-[14px] font-semibold flex items-center gap-2" style={{ color: '#0F1F18' }}>
              <Printer size={15} strokeWidth={2} style={{ color: '#6B7A72' }} />
              Print badges
            </h3>
            <p className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
              Same design, printed for check-in. Includes name, ticket type, and QR code.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold cursor-not-allowed"
            style={{ background: '#F5F3EE', color: '#6B7A72', border: '1px solid #E5E0D4' }}
            title="Print badges — coming soon"
          >
            <Printer size={13} strokeWidth={2} />
            Coming soon
          </span>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-8 items-start">
          {/* Paper size */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7A72' }}>Paper size</div>
            <div className="grid grid-cols-2 gap-2">
              {PAPER_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => setPaperSize(size)}
                  className="py-2.5 px-3 rounded-xl text-[13px] font-medium transition text-center"
                  style={{
                    border: `1px solid ${paperSize === size ? '#1F4D3A' : '#E5E0D4'}`,
                    background: paperSize === size ? 'rgba(31,77,58,0.06)' : 'white',
                    color: paperSize === size ? '#1F4D3A' : '#3A4A42',
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          {/* Badge preview */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7A72' }}>Badge includes</div>
            <div className="space-y-2">
              {[
                { label: 'Attendee name', always: true },
                { label: 'Ticket type / role', always: true },
                { label: 'QR code for check-in', always: true },
                { label: 'Organisation', always: false },
                { label: 'Photo (if uploaded)', always: false },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-[13px]" style={{ color: '#3A4A42' }}>
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: item.always ? '#2D7A4F' : '#E8EFEB' }}
                  >
                    {item.always && (
                      <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {item.label}
                  {!item.always && <span className="text-[11px] ml-auto" style={{ color: '#6B7A72' }}>if provided</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Sub-components ── */

function StatCard({
  label, value, sub, icon, accent,
}: {
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
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium" style={{ color: '#6B7A72', letterSpacing: '0.03em' }}>{label}</span>
        <span style={{ color: accent ? '#1F4D3A' : '#6B7A72' }}>{icon}</span>
      </div>
      <p className="text-[26px] font-bold leading-none" style={{ color: accent ? '#1F4D3A' : '#0F1F18' }}>{value}</p>
      {sub && <p className="text-[12px] mt-1.5" style={{ color: '#6B7A72' }}>{sub}</p>}
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: '#0F1F18' }}>{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

