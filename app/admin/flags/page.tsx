export const dynamic = 'force-dynamic';

import { requireAdmin } from '@/lib/auth/guards';
import { getAllFlags } from '@/lib/flags';
import { PageShell, PageHeader } from '@/components/dash';
import { FlagsAdminClient } from './FlagsAdminClient';

export default async function FlagsAdminPage() {
  await requireAdmin();
  const flags = await getAllFlags();
  const enabled = flags.filter((f) => f.enabled).length;
  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Admin · Feature Flags"
        title="Feature flags"
        subtitle={`${enabled} of ${flags.length} flags enabled globally.`}
      />
      <FlagsAdminClient initialFlags={flags} />
    </PageShell>
  );
}
