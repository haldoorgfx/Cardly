import { redirect } from 'next/navigation';

// Discovery is unified on /events — keep /discover as a redirect so old links work.
export default function DiscoverPage() {
  redirect('/events');
}
