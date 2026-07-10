import type { Plan } from '@/lib/billing/plans';

export function hasERA(plan: Plan): boolean {
  return plan === 'pro' || plan === 'studio';
}

export function hasStudioERA(plan: Plan): boolean {
  return plan === 'studio';
}

export function assertERA(plan: Plan): void {
  if (!hasERA(plan)) throw new Error('ERA_UPGRADE_REQUIRED');
}

export function assertStudioERA(plan: Plan): void {
  if (!hasStudioERA(plan)) throw new Error('ERA_STUDIO_REQUIRED');
}
