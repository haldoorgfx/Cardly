import { requirePermission } from '@/lib/auth/guards';
import { USER_VIEW } from '@/lib/auth/permissions';
import { getPlatformStats, getUserGrowth, getCardGrowth, getPlanDistribution } from '@/lib/admin/queries';
import { PageShell, PageHeader } from '@/components/dash';
import { AnalyticsClient } from './AnalyticsClient';

export const metadata = { title: 'Analytics — Eventera Admin' };
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  await requirePermission(USER_VIEW);

  const [stats, userGrowth, cardGrowth, planDist] = await Promise.all([
    getPlatformStats(),
    getUserGrowth(30),
    getCardGrowth(30),
    getPlanDistribution(),
  ]);

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Admin · Analytics"
        title="Platform Analytics"
        subtitle="Live aggregate stats. Numbers reflect the current state of the database."
      />

      <AnalyticsClient
        stats={stats}
        userGrowth={userGrowth}
        cardGrowth={cardGrowth}
        planDist={planDist}
      />
    </PageShell>
  );
}
