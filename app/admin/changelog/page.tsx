import { requirePermission } from '@/lib/auth/guards';
import { CHANGELOG_EDIT } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { ChangelogAdminClient } from './ChangelogAdminClient';
import { PageShell, PageHeader } from '@/components/dash';
import type { ChangelogEntry } from '@/components/admin/ChangelogForm';

export const metadata = { title: 'Changelog — Eventera Admin' };
export const dynamic = 'force-dynamic';

export default async function ChangelogAdminPage() {
  await requirePermission(CHANGELOG_EDIT);

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('changelog_entries')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Admin · Changelog"
        title="Changelog"
        subtitle={<>Manage entries that appear on the public <code className=" text-[12px]">/whats-new</code> page.</>}
      />

      <ChangelogAdminClient initialEntries={(data ?? []) as ChangelogEntry[]} />
    </PageShell>
  );
}
