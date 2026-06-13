import { requirePermission } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { listMedia } from '@/lib/cms/queries';
import { MediaLibraryClient } from './MediaLibraryClient';

export const metadata = { title: 'Media Library — Karta Admin' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 48;

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requirePermission(CONTENT_EDIT);

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;
  const search = searchParams.q?.trim() || undefined;

  const { items, total } = await listMedia({ limit: PAGE_SIZE, offset, search });
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 lg:p-10 max-w-[1200px]">
      <div className="mb-8">
        <div className=" text-[10px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">
          Admin · Content
        </div>
        <h1 className="font-display font-bold text-[28px] text-[#0F1F18] tracking-tight">
          Media Library
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          Upload images for CMS blocks. Supports JPEG, PNG, WebP, GIF, and SVG up to 10 MB.
        </p>
      </div>

      <MediaLibraryClient
        initialItems={items}
        total={total}
        page={page}
        totalPages={totalPages}
        defaultSearch={search ?? ''}
      />
    </div>
  );
}
