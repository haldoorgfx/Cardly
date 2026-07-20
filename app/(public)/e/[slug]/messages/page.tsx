import { redirect } from 'next/navigation';

// Moved into the dashboard. This page is about YOU — your registration, your
// messages, the room only ticket-holders can enter — not about the event, so
// it belongs in the app shell rather than under the marketing nav.
//
// The route stays as a redirect rather than being deleted: links to it are
// already sitting in inboxes and shared messages. Every query param is
// forwarded, including the `?reg=` guest token, so a recipient lands exactly
// where they expected.
export default function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === 'string') qs.set(k, v);
  }
  const suffix = qs.toString();
  redirect(`/attending/${params.slug}/messages${suffix ? `?${suffix}` : ''}`);
}
