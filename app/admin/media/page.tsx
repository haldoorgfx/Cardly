import { requirePermission } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { listMedia } from '@/lib/cms/queries';
import { PageShell, PageHeader } from '@/components/dash';
import { MediaLibraryClient } from './MediaLibraryClient';

export const metadata = { title: 'Media Library — Eventera Admin' };
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
    <PageShell width="wide">
      <PageHeader
        eyebrow="Admin · Content"
        title="Media Library"
        subtitle="Upload images for CMS blocks. Supports JPEG, PNG, WebP, GIF, and SVG up to 10 MB."
      />

      <MediaLibraryClient
        initialItems={items}
        total={total}
        page={page}
        totalPages={totalPages}
        defaultSearch={search ?? ''}
      />
    </PageShell>
  );
}
