import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import EventCard from './EventCard';

const PLAN_LIMITS: Record<string, number> = { free: 1, pro: 10, studio: Infinity };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: events }, { data: profile }] = await Promise.all([
    admin.from('events').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    admin.from('profiles').select('plan').eq('id', user.id).single(),
  ]);

  const allEvents = events ?? [];
  const isEmpty = allEvents.length === 0;
  const plan = profile?.plan ?? 'free';
  const limit = PLAN_LIMITS[plan] ?? 1;
  const nonArchivedCount = allEvents.filter(e => e.status !== 'archived').length;
  const atLimit = limit !== Infinity && nonArchivedCount >= limit;

  const activeCount = allEvents.filter(e => e.status === 'published').length;
  const totalDownloads = allEvents.reduce((s, e) => s + e.download_count, 0);
  const totalViews = allEvents.reduce((s, e) => s + e.view_count, 0);

  if (isEmpty) {
    return (
      <div className="px-8 pt-8 pb-16">
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 flex items-center gap-6 relative overflow-hidden mb-10">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(closest-side,#6c63ff,transparent)' }} />
          <div className="h-14 w-14 rounded-2xl grid place-items-center text-white shrink-0" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 relative">
            <div className="font-display font-bold text-[20px]">Welcome to Cardly 👋</div>
            <div className="text-[14px] text-[#0f0f1a]/60 mt-0.5">You&apos;re all set. Let&apos;s create your first event card.</div>
          </div>
        </div>

        <div className="max-w-[920px] mx-auto">
          <Link href="/events/new" className="block group">
            <div
              className="relative rounded-3xl border-2 border-dashed border-[#6c63ff]/30 hover:border-[#6c63ff] transition px-10 py-16 text-center overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(135deg, rgba(108,99,255,0.04), rgba(248,164,216,0.04))' }}
            >
              <div className="absolute top-8 left-12 h-16 w-16 rounded-2xl opacity-60 -rotate-12 group-hover:rotate-0 transition-transform" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }} />
              <div className="absolute top-12 right-16 h-12 w-12 rounded-full opacity-70" style={{ background: 'linear-gradient(135deg,#ffd28a,#f8a4d8)' }} />
              <div className="absolute bottom-10 left-20 h-10 w-10 rounded-full border-2 border-[#6c63ff]/40" />
              <div className="absolute bottom-12 right-24 h-14 w-14 rounded-xl opacity-50 rotate-12 group-hover:rotate-0 transition-transform" style={{ background: 'linear-gradient(135deg,#1f8a5b,#7be0c0)' }} />
              <div className="relative">
                <div className="inline-flex h-16 w-16 rounded-2xl grid place-items-center text-white mb-5 group-hover:scale-110 transition" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)', boxShadow: '0 12px 30px rgba(108,99,255,0.35)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <h2 className="font-display font-bold text-[36px] leading-tight">Create your first event</h2>
                <p className="text-[15px] text-[#0f0f1a]/60 mt-2 max-w-[440px] mx-auto">Upload your design, mark the editable zones, share the link. Attendees personalize their own card.</p>
                <div className="mt-7 inline-flex items-center gap-2 h-12 px-7 rounded-full text-white font-display font-semibold text-[15px]" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)', boxShadow: '0 8px 24px rgba(108,99,255,0.35)' }}>
                  Upload a design
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45">GET STARTED</div>
                <h3 className="font-display font-bold text-[22px] mt-1">How it works in 60 seconds</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { n: '01', title: 'Upload your design', desc: 'Drop your PNG or JPG. Anything you\'d post on Instagram works.', color: 'bg-[#6c63ff]/10 text-[#6c63ff]', icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>' },
                { n: '02', title: 'Mark the zones', desc: 'Drag rectangles where the attendee\'s name and photo should go.', color: 'bg-[#f8a4d8]/20 text-[#f8a4d8]', icon: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="4"/>' },
                { n: '03', title: 'Share the link', desc: 'Send the public URL anywhere — WhatsApp, email, QR on stage.', color: 'bg-emerald-100 text-emerald-600', icon: '<path d="M10 13a5 5 0 0 0 7 0l4-4a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-4 4a5 5 0 0 0 7 7l1-1"/>' },
              ].map(step => (
                <div key={step.n} className="bg-white rounded-2xl border border-[#e5e5ea] p-5 shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[11px] font-mono text-[#0f0f1a]/45">{step.n}</div>
                    <div className={`h-8 w-8 rounded-lg grid place-items-center ${step.color}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" dangerouslySetInnerHTML={{ __html: step.icon }} />
                    </div>
                  </div>
                  <div className="font-display font-bold text-[16px]">{step.title}</div>
                  <p className="text-[13px] text-[#0f0f1a]/60 mt-1.5 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // C2 — Events list
  return (
    <div className="px-8 py-8 max-w-[1400px]">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono text-[#0f0f1a]/40">
            <span>WORKSPACE</span><span>/</span><span className="text-[#0f0f1a]/70">Events</span>
          </div>
          <h1 className="mt-2 font-display font-bold text-[34px] leading-tight">Events</h1>
          <p className="text-[#0f0f1a]/60 mt-1 text-[14.5px]">Every share moment your team is shipping right now.</p>
        </div>
        <div className="flex items-center gap-2">
          {atLimit ? (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white px-4 py-2.5 rounded-xl hover:opacity-95 transition shadow-soft"
              style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
            >
              Upgrade to add more
            </Link>
          ) : (
            <Link
              href="/events/new"
              className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white px-4 py-2.5 rounded-xl hover:opacity-95 transition shadow-soft"
              style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New event
            </Link>
          )}
        </div>
      </div>

      {/* Plan limit banner */}
      {atLimit && (
        <div className="mt-6 flex items-center justify-between gap-4 bg-[#6c63ff]/8 border border-[#6c63ff]/20 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-lg grad-bg grid place-items-center text-white shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6z" /></svg>
            </span>
            <div>
              <div className="text-[13.5px] font-semibold text-[#0f0f1a]">You&apos;ve hit the free plan limit ({limit} event)</div>
              <div className="text-[12.5px] text-[#0f0f1a]/60 mt-0.5">Upgrade to Pro to run up to 10 events — and remove the watermark.</div>
            </div>
          </div>
          <Link href="/pricing" className="shrink-0 text-[13px] font-semibold text-white px-4 py-2 rounded-xl grad-bg hover:opacity-95 transition whitespace-nowrap">
            See plans &rarr;
          </Link>
        </div>
      )}

      {/* Stats bar */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white border border-[#e5e5ea] p-5">
          <div className="text-[12px] font-mono tracking-wide text-[#0f0f1a]/50">ACTIVE EVENTS</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display font-bold text-[32px] leading-none">{activeCount}</span>
            <span className="text-[12px] text-[#0f0f1a]/40">of {allEvents.length}</span>
          </div>
          <div className="mt-3 h-1 rounded-full bg-[#fafafa] overflow-hidden">
            <div className="h-full" style={{ width: `${allEvents.length ? (activeCount / allEvents.length) * 100 : 0}%`, background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }} />
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#e5e5ea] p-5">
          <div className="text-[12px] font-mono tracking-wide text-[#0f0f1a]/50">TOTAL DOWNLOADS</div>
          <div className="mt-3 font-display font-bold text-[32px] leading-none">{totalDownloads.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl bg-white border border-[#e5e5ea] p-5">
          <div className="text-[12px] font-mono tracking-wide text-[#0f0f1a]/50">UNIQUE VIEWS</div>
          <div className="mt-3 font-display font-bold text-[32px] leading-none">{totalViews.toLocaleString()}</div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {allEvents.map(event => (
          <EventCard key={event.id} event={event} />
        ))}

        {/* New event tile */}
        {atLimit ? (
          <Link href="/pricing" className="group rounded-2xl border-2 border-dashed border-[#6c63ff]/20 hover:border-[#6c63ff]/50 transition flex flex-col items-center justify-center gap-3 p-10 text-center" style={{ minHeight: 240 }}>
            <div className="h-12 w-12 rounded-xl border-2 border-dashed border-[#6c63ff]/30 grid place-items-center text-[#6c63ff]/50 group-hover:text-[#6c63ff] transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6z" /></svg>
            </div>
            <div className="font-display font-semibold text-[14px] text-[#6c63ff]/60 group-hover:text-[#6c63ff] transition">Upgrade to add more</div>
          </Link>
        ) : (
          <Link href="/events/new" className="group rounded-2xl border-2 border-dashed border-[#e5e5ea] hover:border-[#6c63ff]/40 transition flex flex-col items-center justify-center gap-3 p-10 text-center" style={{ minHeight: 240 }}>
            <div className="h-12 w-12 rounded-xl border-2 border-dashed border-[#e5e5ea] group-hover:border-[#6c63ff]/40 grid place-items-center text-[#0f0f1a]/30 group-hover:text-[#6c63ff] transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            </div>
            <div className="font-display font-semibold text-[14px] text-[#0f0f1a]/50 group-hover:text-[#6c63ff] transition">New event</div>
          </Link>
        )}
      </div>
    </div>
  );
}
