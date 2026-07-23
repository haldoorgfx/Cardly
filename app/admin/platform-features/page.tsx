export const dynamic = 'force-dynamic';

import { requirePermission } from '@/lib/auth/guards';
import { PLATFORM_FEATURES_MANAGE } from '@/lib/auth/permissions';
import { getAllPlatformFeatureFlags } from '@/lib/features/platform';
import { PageShell, PageHeader } from '@/components/dash';
import { PlatformFeaturesClient } from './PlatformFeaturesClient';

export default async function PlatformFeaturesAdminPage() {
  await requirePermission(PLATFORM_FEATURES_MANAGE);
  const flags = await getAllPlatformFeatureFlags();
  const enabled = flags.filter((f) => f.enabled).length;
  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Admin · Platform Features"
        title="Platform features"
        subtitle={`${enabled} of ${flags.length} features enabled platform-wide. Turning one off blocks it for every event immediately, regardless of what any organizer has configured.`}
      />
      <PlatformFeaturesClient initialFlags={flags} />
    </PageShell>
  );
}
