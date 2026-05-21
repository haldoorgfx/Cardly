import { notFound } from 'next/navigation';
import { getPageBySlug } from '@/lib/cms/queries';
import { BlockRenderer } from '@/components/cms/blocks';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const page = await getPageBySlug('home');
  if (!page) notFound();

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
