import { requirePermission } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { listPages } from '@/lib/cms/queries';
import { createAdminClient } from '@/lib/supabase/server';
import { PageShell, PageHeader } from '@/components/dash';
import { ContentAdminClient } from './ContentAdminClient';

export const metadata = { title: 'Content — Eventera Admin' };
export const dynamic = 'force-dynamic';

export default async function ContentAdminPage() {
  await requirePermission(CONTENT_EDIT);
  const pages = await listPages();

  // Block counts per page — the table used to always show "—" here.
  const supabase = await createAdminClient();
  const blockCounts: Record<string, number> = {};
  if (pages.length > 0) {
    const { data: blockRows } = await supabase
      .from('cms_blocks')
      .select('page_id')
      .in('page_id', pages.map(p => p.id));
    for (const row of (blockRows ?? []) as { page_id: string }[]) {
      blockCounts[row.page_id] = (blockCounts[row.page_id] ?? 0) + 1;
    }
  }

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Admin · Content"
        title="Content Pages"
        subtitle="CMS-managed marketing pages. Preview before publishing."
      />

      <ContentAdminClient initialPages={pages} blockCounts={blockCounts} />
    </PageShell>
  );
}
