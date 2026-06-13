import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requirePermission } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { getPageById } from '@/lib/cms/queries';
import { BlockRenderer } from '@/components/cms/blocks';
import { ArrowLeft, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ContentPreviewPage({ params }: { params: { id: string } }) {
  await requirePermission(CONTENT_EDIT);
  const page = await getPageById(params.id);
  if (!page) notFound();

  return (
    <div>
      {/* Preview toolbar */}
      <div className="sticky top-0 z-50 bg-[#0F1F18] text-[#FAF6EE] border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-4 px-4 h-12">
          <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-[12px] text-white/60 hover:text-white/90 transition-colors">
            <ArrowLeft size={13} /> All pages
          </Link>
          <div className="h-4 w-px bg-white/15" />
          <div className=" text-[11px] text-white/40 uppercase tracking-[0.14em]">
            Preview
          </div>
          <div className="font-display font-semibold text-[14px] text-white">
            {page.title}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className={` text-[10px] tracking-[0.14em] uppercase px-2 py-1 rounded-full ${
              page.status === 'published'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {page.status}
            </span>
            <Link
              href={`/${page.slug === 'home' ? '' : page.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-[12px] text-white/80 hover:text-white transition-colors"
            >
              <Globe size={11} /> Live site
            </Link>
          </div>
        </div>
      </div>

      {/* Rendered blocks */}
      <div className="bg-[#FAF6EE] min-h-screen">
        {page.blocks.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-[14px] text-[#6B7A72]">No blocks on this page yet.</p>
          </div>
        ) : (
          page.blocks
            .sort((a, b) => a.position - b.position)
            .map((block) => <BlockRenderer key={block.id} block={block} />)
        )}
      </div>
    </div>
  );
}
