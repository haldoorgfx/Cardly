import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { manageableEvent } from '@/lib/rbac/canManageEvent';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

interface Params { params: Promise<{ id: string }> }

/** Placement keys the Promote screen offers. Anything else is rejected. */
const VALID_PLACEMENTS = ['homepage', 'city', 'category', 'search'] as const;
/** Durations the Promote screen offers. */
const VALID_DURATIONS = [3, 7, 14, 30];
/** Budget slider bounds on the Promote screen. */
const MIN_BUDGET = 5;
const MAX_BUDGET = 200;

// Promoted listings are sold end-to-end — organizer picks placements, sees a
// spend total, submits, admin approves — and NO discovery surface reads
// promoted_listings; verified zero references anywhere under app/(public) or
// components/discovery. The table also has no expiry column at all, only
// duration_days, so an approved listing would run forever if delivery shipped
// as-is. Abdalla's call, 2026-07-22: retire intake rather than half-build
// delivery. New submissions are refused here so a stale client or a direct
// API call can't create one either; existing rows are untouched and the admin
// review queue still works for whatever was already submitted.
const INTAKE_PAUSED = true;

export async function POST(req: NextRequest, { params }: Params) {
  if (!(await isPlatformFeatureEnabled('promote'))) return NextResponse.json({ error: 'Promote is currently unavailable.' }, { status: 404 });

  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (INTAKE_PAUSED) {
    return NextResponse.json(
      { error: 'Promoted listings are not accepting new submissions right now.' },
      { status: 503 },
    );
  }

  // This route writes with the service-role client, so RLS is not a backstop —
  // the ownership check IS the authorisation. Without it any signed-in account
  // could submit, and because `event_id` is UNIQUE the upsert OVERWRITES, the
  // promotion row of any event on the platform.
  const event = await manageableEvent(user.id, id);
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  let body: { daily_budget?: unknown; duration_days?: unknown; placements?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const daily_budget = Number(body.daily_budget);
  if (!Number.isFinite(daily_budget) || daily_budget < MIN_BUDGET || daily_budget > MAX_BUDGET) {
    return NextResponse.json(
      { error: `daily_budget must be between ${MIN_BUDGET} and ${MAX_BUDGET}` },
      { status: 400 }
    );
  }

  const duration_days = Number(body.duration_days);
  if (!VALID_DURATIONS.includes(duration_days)) {
    return NextResponse.json(
      { error: `duration_days must be one of: ${VALID_DURATIONS.join(', ')}` },
      { status: 400 }
    );
  }

  const rawPlacements = Array.isArray(body.placements) ? body.placements : [];
  const placements = rawPlacements.filter(
    (p): p is string => typeof p === 'string' && (VALID_PLACEMENTS as readonly string[]).includes(p)
  );
  if (placements.length === 0 || placements.length !== rawPlacements.length) {
    return NextResponse.json(
      { error: `placements must be a non-empty subset of: ${VALID_PLACEMENTS.join(', ')}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data, error } = await adminAny.from('promoted_listings').upsert(
    {
      event_id: id,
      // The EVENT's owner, not whoever submitted. A teammate submitting on the
      // owner's behalf must not reassign the row to themselves — `owner_id` is
      // what the owner RLS policy reads, so reassigning it would hand the
      // teammate the row and lock the owner out of their own campaign.
      owner_id: event.user_id,
      daily_budget,
      duration_days,
      placements,
      status: 'pending_review',
      submitted_at: new Date().toISOString(),
    },
    { onConflict: 'event_id' }
  ).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
