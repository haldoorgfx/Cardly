export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { requireAttendeeContext } from '@/lib/attendee/requireAttendeeContext';
import Link from 'next/link';
import {
  Ticket, IdCard, CalendarDays, MapPin, ArrowRight, Download,
  Network, MessageSquare, MessageCircle, HelpCircle, BarChart2, Trophy, Star,
} from 'lucide-react';

export const metadata = { title: 'Event overview' };

const TOOLS: { seg: string; label: string; desc: string; icon: React.ReactNode }[] = [
  { seg: 'agenda',      label: 'Agenda',      desc: 'Sessions you saved',    icon: <CalendarDays size={18} strokeWidth={1.8} /> },
  { seg: 'networking',  label: 'Networking',  desc: 'Meet other attendees',  icon: <Network size={18} strokeWidth={1.8} /> },
  { seg: 'messages',    label: 'Messages',    desc: 'Your conversations',    icon: <MessageSquare size={18} strokeWidth={1.8} /> },
  { seg: 'community',   label: 'Community',   desc: 'Event discussion',      icon: <MessageCircle size={18} strokeWidth={1.8} /> },
  { seg: 'q-and-a',     label: 'Q&A',         desc: 'Ask the speakers',      icon: <HelpCircle size={18} strokeWidth={1.8} /> },
  { seg: 'polls',       label: 'Polls',       desc: 'Vote in live polls',    icon: <BarChart2 size={18} strokeWidth={1.8} /> },
  { seg: 'leaderboard', label: 'Leaderboard', desc: 'Standings',             icon: <Trophy size={18} strokeWidth={1.8} /> },
  { seg: 'feedback',    label: 'Feedback',    desc: 'Rate the event',        icon: <Star size={18} strokeWidth={1.8} /> },
];

export default async function AttendingHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { registrationId, event, eventPageTitle } = await requireAttendeeContext(slug, `/attending/${slug}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const [{ data: reg }, { data: ep }] = await Promise.all([
    admin.from('registrations').select('attendee_name, status, qr_code_token, eventera_card_url, ticket_types(name)').eq('id', registrationId).single(),
    admin.from('event_pages').select('starts_at, venue_name, city, is_online').eq('event_id', event.id).maybeSingle(),
  ]);

  const tt = reg?.ticket_types;
  const ticketName = (Array.isArray(tt) ? tt[0]?.name : tt?.name) ?? 'Ticket';
  const status: string = reg?.status ?? 'confirmed';
  const qrToken: string | null = reg?.qr_code_token ?? null;
  const cardUrl: string | null = reg?.eventera_card_url ?? null;
  const when = ep?.starts_at ? new Date(ep.starts_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : null;
  const where = ep?.is_online ? 'Online event' : (ep?.venue_name || ep?.city || null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
          {eventPageTitle ?? event.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[13.5px]" style={{ color: '#3A4A42' }}>
          {when && <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} strokeWidth={1.8} /> {when}</span>}
          {where && <span className="inline-flex items-center gap-1.5"><MapPin size={14} strokeWidth={1.8} /> {where}</span>}
        </div>
      </div>

      {/* Ticket & Card */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border p-5 sm:p-6" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="grid place-items-center w-9 h-9 rounded-xl" style={{ background: '#E8EFEB', color: '#1F4D3A' }}><Ticket size={17} strokeWidth={1.8} /></span>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold" style={{ color: '#0F1F18' }}>Your ticket</div>
              <div className="text-[12px] truncate" style={{ color: '#3A4A42' }}>{ticketName}</div>
            </div>
            <span className="ml-auto text-[11px] font-medium px-2.5 py-1 rounded-full capitalize" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>{status.replace('_', ' ')}</span>
          </div>
          {qrToken ? (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/qr/${qrToken}`} alt="Entry QR" className="w-28 h-28 rounded-xl border shrink-0" style={{ borderColor: '#E5E0D4' }} />
              <div className="text-[13px]" style={{ color: '#3A4A42' }}>
                <div className="font-medium" style={{ color: '#0F1F18' }}>{reg?.attendee_name ?? 'You'}</div>
                <div className="mt-1 leading-[1.5]">Show this QR at the door to check in.</div>
              </div>
            </div>
          ) : (
            <div className="text-[13px]" style={{ color: '#3A4A42' }}>Your QR will appear once your registration is confirmed.</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border p-5 sm:p-6" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="grid place-items-center w-9 h-9 rounded-xl" style={{ background: '#E8EFEB', color: '#1F4D3A' }}><IdCard size={17} strokeWidth={1.8} /></span>
            <div className="text-[14px] font-semibold" style={{ color: '#0F1F18' }}>Your Eventera Card</div>
          </div>
          {cardUrl ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cardUrl} alt="Eventera Card" className="w-full rounded-xl border mb-3" style={{ borderColor: '#E5E0D4' }} />
              <a href={cardUrl} download className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium border bg-white" style={{ borderColor: '#E5E0D4', color: '#1F4D3A' }}><Download size={14} strokeWidth={1.8} /> Download card</a>
            </div>
          ) : (
            <div>
              <p className="text-[13px] mb-3 leading-[1.5]" style={{ color: '#3A4A42' }}>You haven&apos;t made your card for this event yet.</p>
              <Link href={`/c/${slug}`} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium text-white" style={{ background: '#1F4D3A' }}>Create your card <ArrowRight size={14} strokeWidth={2} /></Link>
            </div>
          )}
        </div>
      </div>

      {/* Event tools — 8-card grid */}
      <div>
        <div className="text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: '#3A4A42' }}>Your event tools</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TOOLS.map((t) => (
            <Link key={t.seg} href={`/attending/${slug}/${t.seg}`}
              className="bg-white rounded-2xl border p-4 transition-colors hover:border-[#1F4D3A]/40"
              style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <span className="grid place-items-center w-10 h-10 rounded-xl mb-3" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>{t.icon}</span>
              <div className="text-[13.5px] font-semibold" style={{ color: '#0F1F18' }}>{t.label}</div>
              <div className="text-[11.5px] mt-0.5" style={{ color: '#3A4A42' }}>{t.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
