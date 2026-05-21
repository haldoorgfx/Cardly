import { requirePermission } from '@/lib/auth/guards';
import { USER_VIEW } from '@/lib/auth/permissions';
import { getPlatformStats, getUserGrowth, getCardGrowth, getPlanDistribution } from '@/lib/admin/queries';
import { AnalyticsClient } from './AnalyticsClient';

export const metadata = { title: 'Analytics — Karta Admin' };
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
    <div className="p-6 lg:p-10 max-w-[1100px]">
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">
          Admin · Analytics
        </div>
        <h1 className="font-display font-bold text-[28px] text-[#0F1F18] tracking-tight">
          Platform Analytics
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          Live aggregate stats. Numbers reflect the current state of the database.
        </p>
      </div>

      <AnalyticsClient
        stats={stats}
        userGrowth={userGrowth}
        cardGrowth={cardGrowth}
        planDist={planDist}
      />
    </div>
  );
}
