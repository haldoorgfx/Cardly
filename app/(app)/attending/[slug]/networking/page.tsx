import { redirect } from 'next/navigation';

// Consolidated into the canonical /e/[slug]/* attendee tools (networking = the
// people directory).
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/e/${slug}/people`);
}
