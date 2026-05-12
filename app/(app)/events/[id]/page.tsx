import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CopyButton from '@/components/shared/CopyButton';
import type { Zone } from '@/types/database';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  const zones = (event.zones as unknown as Zone[]) ?? [];
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/c/${event.slug}`;
  const bgW = event.background_width ?? 1080;
  const bgH = event.background_height ?? 1350;

  return (
    <div className="px-8 py-8 max-w-[1200px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] font-mono text-[#0f0f1a]/40 mb-6">
        <Link href="/dashboard" className="hover:text-[#0f0f1a]">Events</Link>
        <span>/</span>
        <span className="text-[#0f0f1a]/70">{event.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden shadow-soft">
            <div className="p-6 border-b border-[#e5e5ea] flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="font-display font-bold text-[24px]">{event.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  {event.status === 'published' ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Draft
                    </span>
                  )}
                  <span className="text-[12px] font-mono text-[#0f0f1a]/40">{zones.length} zones defined</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/events/${id}/edit`}
                  className="inline-flex items-center gap-1.5 text-[13px] text-[#0f0f1a]/80 bg-white border border-[#e5e5ea] px-3 py-2 rounded-xl hover:bg-[#fafafa] transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit zones
                </Link>
                <Link
                  href={`/events/${id}/publish`}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-3 py-2 rounded-xl hover:opacity-95 transition"
                  style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
                >
                  {event.status === 'published' ? 'Share' : 'Publish'}
                </Link>
              </div>
            </div>

            {/* Preview with zone overlays */}
            {event.background_url && (
              <div className="relative overflow-hidden bg-[#0f0f1a]" style={{ aspectRatio: `${bgW}/${bgH}`, maxHeight: 480 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.background_url} alt={event.name} className="w-full h-full object-contain" />
                {zones.map(z => (
                  <div
                    key={z.id}
                    className="absolute border-2 border-[#6c63ff]/70"
                    style={{
                      left: `${(z.x / bgW) * 100}%`,
                      top: `${(z.y / bgH) * 100}%`,
                      width: `${(z.w / bgW) * 100}%`,
                      height: `${(z.h / bgH) * 100}%`,
                      borderRadius: z.type === 'photo' && z.shape === 'circle' ? '50%' : z.type === 'photo' && z.shape === 'rounded' ? '20%' : 4,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
              <div className="text-[12px] font-mono text-[#0f0f1a]/50">DOWNLOADS</div>
              <div className="mt-2 font-display font-bold text-[32px] leading-none">{event.download_count.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
              <div className="text-[12px] font-mono text-[#0f0f1a]/50">VIEWS</div>
              <div className="mt-2 font-display font-bold text-[32px] leading-none">{event.view_count.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Right: share + zones */}
        <div className="space-y-4">
          {event.status === 'published' ? (
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 shadow-soft">
              <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-3">SHARE LINK</div>
              <div className="flex items-center gap-2 bg-[#fafafa] rounded-xl border border-[#e5e5ea] px-3 py-2.5">
                <span className="text-[12px] font-mono text-[#0f0f1a]/70 flex-1 truncate">{shareUrl}</span>
                <CopyButton text={shareUrl} />
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Get your personalized card: ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 rounded-xl text-[13px] font-medium text-white"
                  style={{ background: '#25D366' }}
                >
                  WhatsApp
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get your personalized card: ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 rounded-xl text-[13px] font-medium text-white bg-black"
                >
                  X
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
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

          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
            <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-3">ZONES ({zones.length})</div>
            {zones.length === 0 ? (
              <div className="text-[13px] text-[#0f0f1a]/50 text-center py-4">
                No zones. <Link href={`/events/${id}/edit`} className="text-[#6c63ff] font-medium">Open editor →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {zones.map(z => (
                  <div key={z.id} className="flex items-center gap-2 text-[13px]">
                    <span className="h-6 w-6 rounded-md bg-[#fafafa] grid place-items-center text-[#6c63ff] shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        {z.type === 'photo' ? (
                          <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>
                        ) : (
                          <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                        )}
                      </svg>
                    </span>
                    <span className="flex-1 truncate">{z.label}</span>
                    {z.required && <span className="text-[10px] font-mono text-[#6c63ff] bg-[#6c63ff]/10 px-1.5 py-0.5 rounded">REQ</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
