import Link from 'next/link';
import { requirePermission } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { listPages } from '@/lib/cms/queries';
import { Eye, FileText, Globe, Pencil } from 'lucide-react';

export const metadata = { title: 'Content — Eventera Admin' };
export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  return status === 'published' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
      <Globe size={9} strokeWidth={2.5} /> Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
      <FileText size={9} strokeWidth={2.5} /> Draft
    </span>
  );
}

export default async function ContentAdminPage() {
  await requirePermission(CONTENT_EDIT);
  const pages = await listPages();

  return (
    <div className="p-6 lg:p-10 max-w-[1000px]">
      <div className="mb-8">
        <div className=" text-[10px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">
          Admin · Content
        </div>
        <h1 className="font-display font-bold text-[28px] text-[#0F1F18] tracking-tight">
          Content Pages
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          CMS-managed marketing pages. Preview before publishing.
        </p>
      </div>

      {pages.length === 0 ? (
        <div className="border-2 border-dashed border-[#E5E0D4] rounded-2xl p-16 text-center">
          <FileText size={36} className="mx-auto text-[#C9C3B1] mb-3" />
          <p className="text-[14px] text-[#6B7A72]">
            No pages seeded yet. Run the seed script to populate the CMS.
          </p>
          <code className="mt-4 block text-[12px] bg-[#FAF6EE] border border-[#E5E0D4] rounded-lg px-4 py-2 text-[#3A4A42] max-w-sm mx-auto">
            pnpm tsx scripts/seed-cms-pages.ts
          </code>
        </div>
      ) : (
        <div className="border border-[#E5E0D4] rounded-2xl overflow-hidden bg-white">
          <div className="grid grid-cols-[1fr_auto_auto_auto] px-5 py-3 bg-[#FAF6EE] border-b border-[#E5E0D4]">
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#6B7A72]">Page</span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#6B7A72] text-right">Blocks</span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#6B7A72] text-right px-6">Status</span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#6B7A72] text-right">Actions</span>
          </div>
          {pages.map((page) => (
            <div key={page.id} className="grid grid-cols-[1fr_auto_auto_auto] px-5 py-4 border-b border-[#E5E0D4] last:border-b-0 hover:bg-[#FAF6EE] transition-colors items-center">
              <div className="min-w-0">
                <div className="font-medium text-[14px] text-[#0F1F18]">{page.title}</div>
                <div className=" text-[11px] text-[#6B7A72] mt-0.5">/{page.slug}</div>
              </div>
              <div className="text-[13px] text-[#6B7A72] text-right px-6">
                —
              </div>
              <div className="px-6">
                <StatusBadge status={page.status} />
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/content/${page.id}/edit`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#1F4D3A] text-white text-[12px] hover:bg-[#163828] transition-colors"
                >
                  <Pencil size={12} /> Edit
                </Link>
                <Link
                  href={`/admin/content/${page.id}/preview`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E0D4] text-[12px] text-[#3A4A42] hover:bg-[#FAF6EE] transition-colors"
                >
                  <Eye size={12} /> Preview
                </Link>
                <Link
                  href={`/${page.slug === 'home' ? '' : page.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E0D4] text-[12px] text-[#3A4A42] hover:bg-[#FAF6EE] transition-colors"
                >
                  <Globe size={12} /> Live
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
