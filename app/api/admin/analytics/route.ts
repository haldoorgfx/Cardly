import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { USER_VIEW } from '@/lib/auth/permissions';
import { getPlatformStats, getUserGrowth, getCardGrowth, getPlanDistribution } from '@/lib/admin/queries';

// GET /api/admin/analytics — platform aggregate stats
export async function GET(request: Request) {
  const result = await getAuthorizedUser(USER_VIEW);
  if ('error' in result) return result.error;

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(7, parseInt(url.searchParams.get('days') ?? '30', 10)));

  const [stats, userGrowth, cardGrowth, planDist] = await Promise.all([
    getPlatformStats(),
    getUserGrowth(days),
    getCardGrowth(days),
    getPlanDistribution(),
  ]);

  return NextResponse.json({ stats, userGrowth, cardGrowth, planDist, days });
}
