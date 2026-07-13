import { requirePermission } from '@/lib/auth/guards';
import { TEMPLATE_MANAGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { PageShell, PageHeader } from '@/components/dash';
import { TemplatesAdminClient } from './TemplatesAdminClient';

export const metadata = { title: 'Templates — Eventera Admin' };
export const dynamic = 'force-dynamic';

export default async function TemplatesAdminPage() {
  await requirePermission(TEMPLATE_MANAGE);

  const adminClient = createAdminClient();
  const { data: templates } = await adminClient
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Admin · Templates"
        title="Template Management"
        subtitle="Create and manage platform templates. Published templates appear in the user template picker per their minimum plan."
      />

      <TemplatesAdminClient initialTemplates={templates ?? []} />
    </PageShell>
  );
}
