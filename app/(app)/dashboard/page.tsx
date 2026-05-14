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
      <div className="px-6 py-10 max-w-[900px]">
        <h1 className="text-2xl font-semibold text-neutral-900">Events</h1>
        <p className="text-[14px] text-neutral-500 mt-1">Create an event to get started.</p>

        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 bg-white flex flex-col items-center justify-center py-16 gap-4">
          <div className="h-10 w-10 rounded-lg bg-neutral-100 grid place-items-center text-neutral-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div className="text-center">
            <div className="text-[15px] font-semibold text-neutral-900">Create your first event</div>
            <p className="text-[13px] text-neutral-500 mt-1 max-w-[320px]">Upload a design, define zones, share a link.</p>
          </div>
          <Link
            href="/events/new"
            className="mt-1 h-8 px-4 bg-[#0F1F18] text-white text-[13px] font-medium rounded-md hover:bg-neutral-800 transition inline-flex items-center gap-1.5"
          >
            New event
          </Link>
        </div>
      </div>
    );
  }

  // ─── C2: Events list ───────────────────────────────────────────────────────
  return (
    <div className="px-6 py-6 max-w-[1200px] w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Events</h1>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            {activeCount} live · {totalDownloads.toLocaleString()} total downloads
          </p>
        </div>
        <div className="flex items-center gap-2">
          {atLimit ? (
            <Link
              href="/pricing"
              className="h-8 px-3 bg-neutral-100 hover:bg-neutral-200 text-[13px] font-medium rounded-md transition inline-flex items-center gap-1.5 text-neutral-700"
            >
              Upgrade plan
            </Link>
          ) : (
            <Link
              href="/events/new"
              className="h-8 px-3 bg-[#0F1F18] text-white text-[13px] font-medium rounded-md hover:bg-neutral-800 transition inline-flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New event
            </Link>
          )}
        </div>
      </div>

      {/* Plan limit warning */}
      {atLimit && (
        <div className="mb-4 flex items-center gap-2 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-md">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          You&apos;ve reached the {limit}-event limit on the Free plan.
          <Link href="/pricing" className="ml-auto font-medium underline">Upgrade</Link>
        </div>
      )}

      <DashboardContent events={allEvents} atLimit={atLimit} />
    </div>
  );
}
