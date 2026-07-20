export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { QrCode, Ticket as TicketIcon, ArrowRight } from 'lucide-react';
import { resolveAttendeeWorkspace } from '@/lib/attendee/eventWorkspace';

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ reg?: string }> }

/**
 * Workspace home. Answers the two questions someone actually opens this for —
 * "am I in?" and "where do I go next?" — rather than restating the event
 * programme, which lives on the public event page.
 */
export default async function AttendingOverviewPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { reg } = await searchParams;
  const ws = await resolveAttendeeWorkspace({ slug, reg });

  const admin = createAdminClient();
  const { data: registration } = await admin
    .from('registrations')
    .select('attendee_name, status, qr_code_token, ticket_types(name)')
    .eq('id', ws.registrationId)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ticketName = (registration as any)?.ticket_types?.name as string | undefined;
  const checkedIn = registration?.status === 'checked_in';

  return (
    <div className="max-w-[620px]">
      <div
        className="rounded-2xl p-5 sm:p-6"
        style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#E8EFEB' }}
          >
            <TicketIcon size={18} style={{ color: '#1F4D3A' }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display font-semibold text-[16px]" style={{ color: '#0F1F18' }}>
              {checkedIn ? "You're checked in" : "You're registered"}
            </div>
            <div className="text-[13.5px] mt-0.5" style={{ color: '#65736B' }}>
              {registration?.attendee_name}
              {ticketName ? ` · ${ticketName}` : ''}
            </div>
          </div>
        </div>

        {!checkedIn && registration?.qr_code_token && (
          <Link
            href={`/my-tickets`}
            className="mt-5 w-full h-11 rounded-xl flex items-center justify-center gap-2 text-[14px] font-semibold transition hover:opacity-90"
            style={{ background: '#1F4D3A', color: '#FFFFFF', textDecoration: 'none' }}
          >
            <QrCode size={16} />
            Show my QR at the door
          </Link>
        )}
      </div>

      <p className="text-[13.5px] mt-5" style={{ color: '#65736B' }}>
        Everything you can do at this event is in the tabs above. The full
        programme — speakers, schedule and sponsors — lives on the{' '}
        <Link href={`/e/${slug}`} className="font-medium underline" style={{ color: '#1F4D3A' }}>
          event page <ArrowRight size={12} className="inline" />
        </Link>
      </p>
    </div>
  );
}
