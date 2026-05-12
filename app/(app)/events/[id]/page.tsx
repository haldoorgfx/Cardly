import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CopyButton from '@/components/shared/CopyButton';
import EventDetailActions from './EventDetailActions';
import type { Zone } from '@/types/database';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const GRADIENT_POOL = [
  'linear-gradient(135deg,#ffd28a,#f8a4d8)',
  'linear-gradient(135deg,#7be0c0,#6c63ff)',
  'linear-gradient(135deg,#f8a4d8,#6c63ff)',
  'linear-gradient(135deg,#1f8a5b,#ffd28a)',
  'linear-gradient(135deg,#6c63ff,#f8a4d8)',
];

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: recentCards }] = await Promise.all([
    admin.from('events').select('*').eq('id', id).eq('user_id', user.id).single(),
    admin.from('generated_cards').select('id, attendee_name, attendee_data, created_at').eq('event_id', id).order('created_at', { ascending: false }).limit(8),
  ]);

  if (!event) redirect('/dashboard');

  const zones = (event.zones as unknown as Zone[]) ?? [];
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/c/${event.slug}`;
  const bgW = event.background_width ?? 1080;
  const bgH = event.background_height ?? 1350;
  const activity = recentCards ?? [];

  const conversionPct = event.view_count > 0
    ? Math.round((event.download_count / event.view_count) * 100)
    : 0;

  return (
    <div className="px-8 py-8 max-w-[1200px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] font-mono text-[#0f0f1a]/40 mb-6">
        <Link href="/dashboard" className="hover:text-[#0f0f1a]">Events</Link>
        <span>/</span>
        <span className="text-[#0f0f1a]/70 truncate max-w-[240px]">{event.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: preview + stats + activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview card */}
          <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden shadow-soft">
            <div className="p-6 border-b border-[#e5e5ea] flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="font-display font-bold text-[24px]">{event.name}</h1>
                <div className="flex items-center gap-3 mt-1.5">
                  {event.status === 'published' ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                    </span>
                  ) : event.status === 'archived' ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#0f0f1a]/50 bg-[#fafafa] px-2 py-1 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0f0f1a]/30" /> Archived
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Draft
                    </span>
                  )}
                  <span className="text-[12px] font-mono text-[#0f0f1a]/40">{zones.length} zones</span>
                  <span className="text-[12px] font-mono text-[#0f0f1a]/40">/{event.slug}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <EventDetailActions eventId={id} eventName={event.name} status={event.status} />
                <Link
                  href={`/events/${id}/edit`}
                  className="inline-flex items-center gap-1.5 text-[13px] text-[#0f0f1a]/80 bg-white border border-[#e5e5ea] px-3 py-2 rounded-xl hover:bg-[#fafafa] transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit zones
                </Link>
                <Link
                  href={`/events/${id}/publish`}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-3 py-2 rounded-xl hover:opacity-95 transition"
                  style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
                >
                  {event.status === 'published' ? 'Share →' : 'Publish →'}
                </Link>
              </div>
            </div>

            {event.background_url && (
              <div className="relative overflow-hidden bg-[#0f0f1a]" style={{ aspectRatio: `${bgW}/${bgH}`, maxHeight: 460 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.background_url} alt={event.name} className="w-full h-full object-contain" />
                {zones.map(z => (
                  <div
                    key={z.id}
                    className="absolute"
                    style={{
                      left: `${(z.x / bgW) * 100}%`,
                      top: `${(z.y / bgH) * 100}%`,
                      width: `${(z.w / bgW) * 100}%`,
                      height: `${(z.h / bgH) * 100}%`,
                      outline: '1.5px dashed rgba(108,99,255,0.85)',
                      borderRadius: z.type === 'photo' && z.shape === 'circle' ? '50%' : z.type === 'photo' && z.shape === 'rounded' ? '20%' : 4,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 shadow-soft">
              <div className="text-[11px] font-mono text-[#0f0f1a]/50">PAGE VIEWS</div>
              <div className="mt-2 font-display font-bold text-[32px] leading-none">{event.view_count.toLocaleString()}</div>
              <div className="mt-2 h-1 rounded-full bg-[#fafafa] overflow-hidden">
                <div className="h-full" style={{ width: '60%', background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }} />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 shadow-soft">
              <div className="text-[11px] font-mono text-[#0f0f1a]/50">DOWNLOADS</div>
              <div className="mt-2 font-display font-bold text-[32px] leading-none">{event.download_count.toLocaleString()}</div>
              <svg className="mt-2 w-full" height="24" viewBox="0 0 160 24" preserveAspectRatio="none" fill="none">
                <path d="M0,20 L20,16 L40,18 L60,10 L80,14 L100,6 L120,9 L140,3 L160,5" stroke="#6c63ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 shadow-soft">
              <div className="text-[11px] font-mono text-[#0f0f1a]/50">CONVERSION</div>
              <div className="mt-2 font-display font-bold text-[32px] leading-none">{conversionPct}%</div>
              <div className="mt-2 text-[11px] text-[#0f0f1a]/40">views → downloads</div>
            </div>
          </div>

          {/* Activity feed */}
          <div className="bg-white rounded-2xl border border-[#e5e5ea] shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
              <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45">RECENT ACTIVITY</div>
              {activity.length > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activity.length} recent
                </span>
              )}
            </div>
            {activity.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="text-[13px] text-[#0f0f1a]/40">No cards generated yet.</div>
                {event.status === 'published' ? (
                  <div className="mt-1 text-[12.5px] text-[#0f0f1a]/40">Share the link to start seeing activity here.</div>
                ) : (
                  <Link href={`/events/${id}/publish`} className="mt-3 inline-block text-[13px] text-[#6c63ff] font-medium hover:underline">
                    Publish to start →
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#fafafa]">
                {activity.map((card, i) => {
                  const attendeeData = (card.attendee_data ?? {}) as Record<string, string>;
                  const location = Object.values(attendeeData).find(v => v?.includes(',')) ?? null;
                  return (
                    <div key={card.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafafa] transition">
                      <div
                        className="h-9 w-9 rounded-full grid place-items-center text-white text-[12px] font-bold shrink-0"
                        style={{ background: GRADIENT_POOL[i % GRADIENT_POOL.length] }}
                      >
                        {getInitials(card.attendee_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium truncate">{card.attendee_name ?? 'Anonymous'}</div>
                        {location && <div className="text-[11.5px] text-[#0f0f1a]/45 truncate">{location}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-[#0f0f1a]/35">{timeAgo(card.created_at)}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6c63ff] bg-[#6c63ff]/8 px-1.5 py-0.5 rounded-md">
                          card
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: share + zones + info */}
        <div className="space-y-4">
          {/* Share link */}
          {event.status === 'published' ? (
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 shadow-soft">
              <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-3">SHARE LINK</div>
              <div className="flex items-center gap-2 bg-[#fafafa] rounded-xl border border-[#e5e5ea] px-3 py-2.5 mb-3">
                <span className="text-[12px] font-mono text-[#0f0f1a]/70 flex-1 truncate">{shareUrl}</span>
                <CopyButton text={shareUrl} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Get your personalized card: ${shareUrl}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="py-2 rounded-xl text-[12px] font-medium text-white text-center"
                  style={{ background: '#25D366' }}
                >
                  WhatsApp
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get your personalized card: ${shareUrl}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="py-2 rounded-xl text-[12px] font-medium text-white text-center bg-black"
                >
                  X
                </a>
                <a
                  href={shareUrl}
                  target="_blank" rel="noopener noreferrer"
                  className="py-2 rounded-xl text-[12px] font-medium text-center border border-[#e5e5ea] hover:bg-[#fafafa] transition"
                >
                  Preview ↗
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 shadow-soft">
              <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-3">READY TO SHARE?</div>
              <p className="text-[13px] text-[#0f0f1a]/60 mb-4">Publish to get a shareable link for attendees.</p>
              <Link
                href={`/events/${id}/publish`}
                className="w-full py-2.5 rounded-xl text-[13.5px] font-semibold text-white text-center block hover:opacity-95"
                style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
              >
                Publish & share →
              </Link>
            </div>
          )}

          {/* Zones */}
          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45">ZONES ({zones.length})</div>
              <Link href={`/events/${id}/edit`} className="text-[11px] text-[#6c63ff] hover:underline">Edit →</Link>
            </div>
            {zones.length === 0 ? (
              <div className="text-[13px] text-[#0f0f1a]/50 text-center py-4">
                No zones. <Link href={`/events/${id}/edit`} className="text-[#6c63ff] font-medium">Open editor →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {zones.map(z => (
                  <div key={z.id} className="flex items-center gap-2.5 text-[13px]">
                    <span className="h-6 w-6 rounded-md bg-[#fafafa] grid place-items-center text-[#6c63ff] shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        {z.type === 'photo' ? (
                          <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>
                        ) : (
                          <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
                        )}
                      </svg>
                    </span>
                    <span className="flex-1 truncate">{z.label}</span>
                    {z.required && <span className="text-[10px] font-mono text-[#6c63ff] bg-[#6c63ff]/10 px-1.5 py-0.5 rounded">REQ</span>}
                    <span className="text-[10px] font-mono text-[#0f0f1a]/30">{z.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 shadow-soft">
            <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-3">EVENT INFO</div>
            <div className="space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-[#0f0f1a]/55">Status</span>
                <span className={`font-medium ${event.status === 'published' ? 'text-emerald-600' : event.status === 'archived' ? 'text-[#0f0f1a]/40' : 'text-amber-600'}`}>
                  {event.status === 'published' ? 'Live' : event.status === 'archived' ? 'Archived' : 'Draft'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#0f0f1a]/55">Slug</span>
                <span className="font-mono text-[12px] text-[#0f0f1a]/70">/{event.slug}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#0f0f1a]/55">Format</span>
                <span className="font-mono text-[12px]">{(event.background_width ?? 1080)} × {(event.background_height ?? 1350)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#0f0f1a]/55">Created</span>
                <span className="text-[12px] text-[#0f0f1a]/55">{new Date(event.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Link to full analytics */}
          <Link href="/analytics" className="flex items-center gap-3 bg-white rounded-2xl border border-[#e5e5ea] p-4 shadow-soft hover:bg-[#fafafa] transition group">
            <div className="h-9 w-9 rounded-xl grid place-items-center text-white shrink-0" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 5-5"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium">View full analytics</div>
              <div className="text-[11.5px] text-[#0f0f1a]/45">All events · charts · funnel</div>
            </div>
            <svg className="text-[#0f0f1a]/30 group-hover:text-[#6c63ff] transition" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
