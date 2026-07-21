'use client';

import { LayoutGrid } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/dash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Campaign = any;

interface Props {
  eventId: string;
  eventName: string;
  eventSlug: string;
  campaign: Campaign | null;
}

/**
 * Promoted listings — intake paused. Abdalla's call, 2026-07-22.
 *
 * The feature sold end-to-end (organizer picks placements, sees a spend
 * total, submits, admin approves) and no discovery surface ever read
 * `promoted_listings` — verified zero references anywhere under
 * app/(public) or components/discovery. The table also has no expiry
 * column, only duration_days, so an approved listing would run forever if
 * delivery shipped as-is. Rather than half-build delivery, the API
 * (app/api/events/[id]/promote/route.ts) now refuses new submissions with
 * a 503, and this page stops offering the interactive builder — a budget
 * slider and a placement picker for something that cannot go anywhere is
 * worse than no page at all.
 *
 * Anyone who already has a campaign row still sees its real status, because
 * that's informational rather than a new promise, and the admin review
 * queue is untouched — it can still process whatever was already submitted.
 */
export function PromotedListingClient({ eventName, campaign }: Props) {
  const status: string | null = campaign?.status ?? null;
  const isRejected = status === 'rejected';
  const isPending = status === 'pending_review';

  return (
    <PageShell width="wide">
      <PageHeader title="Promote listing" subtitle={eventName} />

      {status && (
        <div
          className="rounded-2xl p-4 mb-6"
          style={{
            background: isRejected ? '#FFFFFF' : '#E8EFEB',
            border: `1px solid ${isRejected ? '#E5E0D4' : '#C9E0D4'}`,
          }}
        >
          <div className="font-semibold text-[14px] mb-1" style={{ color: isRejected ? '#B8423C' : '#0F1F18' }}>
            {isPending && 'Submitted — awaiting review'}
            {isRejected && 'Not approved'}
            {!isPending && !isRejected && 'Approved'}
          </div>
          <p className="text-[12.5px]" style={{ color: '#3A4A42' }}>
            You submitted a promotion request for this event. You have not been
            charged, and won&apos;t be — new submissions and edits are paused
            while we build real placement delivery, so this request stays as
            you left it.
          </p>
        </div>
      )}

      <div className="rounded-2xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
        <div
          className="w-12 h-12 rounded-xl grid place-items-center mx-auto mb-4"
          style={{ background: '#E8EFEB' }}
        >
          <LayoutGrid size={20} style={{ color: '#1F4D3A' }} />
        </div>
        <h2 className="font-display font-semibold text-[17px] mb-2" style={{ color: '#0F1F18' }}>
          Promoted listings aren&apos;t open for new campaigns right now
        </h2>
        <p className="text-[13.5px] max-w-[440px] mx-auto" style={{ color: '#3A4A42', lineHeight: 1.6 }}>
          We paused new submissions while we build the placement delivery that
          makes this actually show your event to more people. Nothing is
          charged for a paused feature — check back, or reach out if you&apos;d
          like to be told when it&apos;s back.
        </p>
      </div>
    </PageShell>
  );
}
