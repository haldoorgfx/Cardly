import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Consolidated: the canonical notifications center now lives at /notifications
// (inbox + preferences in one place). This route redirects so existing links
// and bookmarks to /account/notifications keep working.
export default function AccountNotificationsRedirect({
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
  redirect(qs ? `/notifications?${qs}` : '/notifications');
}
