import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Consolidated (dashboard unification): the canonical profile editor lives at
// /settings inside the unified dashboard — the same ProfileSettings component,
// one source of truth for profile fields. This legacy route redirects so any
// old links or bookmarks keep working.
export default function AccountProfileRedirect() {
  redirect('/settings');
}
