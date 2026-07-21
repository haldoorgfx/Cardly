export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import AbstractSubmissionClient from '@/components/abstracts/AbstractSubmissionClient';

interface Props { params: { slug: string } }

export default async function CFPPage({ params }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event, eventPageTitle } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cfp } = await (admin as any)
    .from('call_for_papers')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_open', true)
    .single();

  // A passed deadline closed nothing. The page kept rendering the full
  // three-step form under a pill reading "Deadline: 3 March" with the countdown
  // silently clamped to 0 days, and the API accepted whatever it sent. Treat an
  // expired deadline exactly like a closed CFP — the same screen, so late
  // arrivals are told plainly instead of submitting into a void.
  const deadlinePassed = !!cfp?.deadline_at && new Date(cfp.deadline_at).getTime() < Date.now();

  if (!cfp || deadlinePassed) {
    return (
      <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
        <div className="max-w-[680px] mx-auto px-4 sm:px-10 py-16 text-center">
          <h1 className="font-display font-normal text-[32px] mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.025em' }}>
            Call for papers is closed
          </h1>
          <p className="text-[15px]" style={{ color: '#65736B' }}>
            {deadlinePassed
              ? `The deadline for ${event.name} has passed and submissions are no longer being accepted.`
              : `Abstract submissions are not currently open for ${event.name}.`}
          </p>
        </div>
      </div>
    );
  }

  const deadline = cfp.deadline_at
    ? new Date(cfp.deadline_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : 'TBD';

  const daysLeft = cfp.deadline_at
    ? Math.max(0, Math.ceil((new Date(cfp.deadline_at).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>

      <div className="max-w-[680px] mx-auto px-4 sm:px-10 py-10 pb-24">
        <h1 className="font-display font-normal text-[32px]" style={{ color: '#0F1F18', letterSpacing: '-0.025em' }}>
          Submit your abstract
        </h1>
        <p className="text-[15px] mt-1 mb-2" style={{ color: '#65736B' }}>{eventPageTitle}</p>

        {/* Deadline pill */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] mt-3 mb-8"
          style={{ background: 'white', border: '1px solid #E5E0D4' }}
        >
          <b className=" font-medium" style={{ color: '#0F1F18' }}>Deadline: {deadline}</b>
          {daysLeft > 0 && (
            <span style={{ color: '#65736B' }}>· {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</span>
          )}
        </div>

        {/* max_words and categories are the organiser's own CFP settings. The
            form used to hard-code "400 words" and a fixed five-category list,
            so configuring either in call_for_papers changed nothing a
            submitter could see. */}
        <AbstractSubmissionClient
          eventSlug={params.slug}
          eventName={event.name}
          deadline={deadline}
          daysLeft={daysLeft}
          maxWords={typeof cfp.max_words === 'number' && cfp.max_words > 0 ? cfp.max_words : 400}
          categories={Array.isArray(cfp.categories) && cfp.categories.length > 0 ? cfp.categories : null}
        />
      </div>
    </div>
  );
}
