import { requirePermission } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { listPages } from '@/lib/cms/queries';
import { PageShell, PageHeader } from '@/components/dash';
import { ContentAdminClient } from './ContentAdminClient';

export const metadata = { title: 'Content — Eventera Admin' };
export const dynamic = 'force-dynamic';

export default async function ContentAdminPage() {
  await requirePermission(CONTENT_EDIT);
  const pages = await listPages();

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Admin · Content"
        title="Content Pages"
        subtitle="CMS-managed marketing pages. Preview before publishing."
      />

      <ContentAdminClient initialPages={pages} />
    </PageShell>
  );
}
