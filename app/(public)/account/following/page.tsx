import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Consolidated (Wave 4): the canonical "Saved & following" surface now lives at
// /saved (renders SavedFollowingClient, backed by the same saved_events +
// organizer_follows data and linked from discovery/search/event pages). This
// legacy route redirects so any old links or bookmarks keep working.
export default function AccountFollowingRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  redirect(qs ? `/saved?${qs}` : '/saved');
}
