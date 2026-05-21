import { notFound } from 'next/navigation';
import { getPageBySlug } from '@/lib/cms/queries';
import { BlockRenderer } from '@/components/cms/blocks';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // adminMode=true bypasses RLS; status check below enforces published-only
  const page = await getPageBySlug('home', true);
  if (!page || page.status !== 'published') notFound();

  return (
    <>
      {page.blocks
        .sort((a, b) => a.position - b.position)
        .map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
    </>
  );
}
