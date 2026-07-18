import { redirect } from 'next/navigation';

// Webhooks are account-wide, not per-event (WebhooksView reads /api/webhooks
// with no event scoping). They live under Settings → Developer; this per-event
// route was redundant and self-described as "account-wide", so it now
// consolidates there. Kept as a redirect so any existing links resolve.
export default function WebhooksPage() {
  redirect('/settings/developer');
}
