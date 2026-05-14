import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DashboardContent from './DashboardContent';

const PLAN_LIMITS: Record<string, number> = { free: 1, pro: 10, studio: Infinity };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: events }, { data: profile }] = await Promise.all([
    admin.from('events').select('*, event_variants(id, background_url, zones, position)').eq('user_id', user.id).order('updated_at', { ascending: false }),
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

  // ─── C1: Empty state ───────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="min-h-full flex flex-col">
        {/* Page header */}
        <div className="relative overflow-hidden px-6 pt-8 pb-8 border-b border-neutral-100 bg-white">
          {/* Subtle dot grid */}
          <div className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              backgroundImage: 'radial-gradient(rgba(15,31,24,0.06) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 120% at 0% 50%, rgba(31,77,58,0.04) 0%, transparent 70%)',
            }} />
          <div className="relative">
            <h1 className="text-xl font-semibold text-neutral-900">Events</h1>
            <p className="text-[13px] text-neutral-500 mt-0.5">Create your first event to get started.</p>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-[440px] w-full text-center">
            {/* Decorative rings */}
            <div className="relative h-24 w-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border border-neutral-200 border-dashed animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-3 rounded-full border border-neutral-100 border-dashed animate-[spin_15s_linear_infinite_reverse]" />
              <div className="absolute inset-6 rounded-full bg-[#F5F5F5] border border-neutral-200 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
            </div>

            <h2 className="text-[18px] font-semibold text-neutral-900">Create your first event</h2>
            <p className="text-[14px] text-neutral-500 mt-2 leading-relaxed max-w-[300px] mx-auto">
              Upload a design, define editable zones, and share a personalized link with attendees.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/events/new"
                className="h-9 px-5 bg-[#0F1F18] text-white text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition inline-flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New event
              </Link>
              <Link
                href="/templates"
                className="h-9 px-5 border border-neutral-200 text-[13px] font-medium rounded-lg hover:bg-neutral-50 transition inline-flex items-center text-neutral-700"
              >
                Browse templates
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── C2: Events list ───────────────────────────────────────────────────────
  return (
    <div className="min-h-full flex flex-col">
      {/* Page header with subtle gradient */}
      <div className="relative overflow-hidden px-6 pt-8 pb-6 border-b border-neutral-100 bg-white shrink-0">
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage: 'radial-gradient(rgba(15,31,24,0.06) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
        {/* Green mesh blob — left */}
        <div className="absolute pointer-events-none"
          style={{
            top: '-50%', left: '-5%',
            width: '300px', height: '300px',
            background: 'radial-gradient(ellipse, rgba(31,77,58,0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Events</h1>
            <p className="text-[13px] text-neutral-500 mt-0.5">
              {activeCount > 0 ? (
                <>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                    {activeCount} live
                  </span>
                  {totalDownloads > 0 && ` · ${totalDownloads.toLocaleString()} total downloads`}
                </>
              ) : (
                'No events published yet'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {atLimit ? (
              <Link
                href="/pricing"
                className="h-8 px-3 bg-neutral-100 hover:bg-neutral-200 text-[13px] font-medium rounded-lg transition inline-flex items-center gap-1.5 text-neutral-700"
              >
                Upgrade plan
              </Link>
            ) : (
              <Link
                href="/events/new"
                className="h-8 px-3 bg-[#0F1F18] text-white text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition inline-flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New event
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Plan limit warning */}
      {atLimit && (
        <div className="mx-6 mt-4 flex items-center gap-2 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-lg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          You&apos;ve reached the {limit}-event limit on the Free plan.
          <Link href="/pricing" className="ml-auto font-medium underline">Upgrade →</Link>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        <DashboardContent events={allEvents} atLimit={atLimit} />
      </div>
    </div>
  );
}
