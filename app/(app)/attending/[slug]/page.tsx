import { redirect } from 'next/navigation';

// The in-app /attending/[slug]/* tools were an orphaned duplicate of the
// canonical, feature-gated public attendee tools under /e/[slug]/*. These
// pages now redirect so any stray links keep working and there's a single
// implementation (no more drift where /attending skipped the enabled-section gate).
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/e/${slug}`);
}
