'use client';

import { Lock } from 'lucide-react';
import { useContext, createContext } from 'react';

// Re-exported from AppShell — PlanGate reads it from context.
// The actual context is provided by AppShell; this file just defines
// the consumer API so child components can call openUpgrade without
// prop-drilling.

export type PlanTier = 'free' | 'pro' | 'studio';

const PLAN_LEVEL: Record<PlanTier, number> = { free: 0, pro: 1, studio: 2 };

export function planMeets(userPlan: string, minPlan: PlanTier): boolean {
  return (PLAN_LEVEL[userPlan as PlanTier] ?? 0) >= PLAN_LEVEL[minPlan];
}

// Minimal context shape — AppShell provides the full PlanContext;
// we import it there. This type is used by pages that import PlanGate.
type UpgradeFeature = {
  id: string;
  label: string;
  minPlan: 'pro' | 'studio';
};

export const UpgradeContext = createContext<{
  plan: string;
  openUpgrade: (f: UpgradeFeature) => void;
}>({ plan: 'free', openUpgrade: () => {} });

export function useUpgrade() {
  return useContext(UpgradeContext);
}

interface PlanGateProps {
  requires: 'pro' | 'studio';
  feature: UpgradeFeature;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps any block with a lock overlay when the user's plan is below `requires`.
 * Clicking the overlay opens the upgrade slide-over.
 * Real enforcement is server-side; this is cosmetic gating only.
 */
export function PlanGate({ requires, feature, children, className }: PlanGateProps) {
  const { plan, openUpgrade } = useUpgrade();
  const locked = !planMeets(plan, requires);

  if (!locked) return <>{children}</>;

  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="pointer-events-none select-none opacity-40">{children}</div>
      <button
        onClick={() => openUpgrade(feature)}
        className="absolute inset-0 w-full flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer group"
        style={{ background: 'rgba(250,246,238,0.75)', backdropFilter: 'blur(3px)' }}
        aria-label={`Upgrade to ${requires} to unlock ${feature.label}`}
      >
        <span className="inline-flex items-center gap-1.5 bg-accent/20 text-accent-dark border border-accent/40 text-[10px] font-mono tracking-[0.12em] uppercase px-2.5 py-1.5 rounded-full group-hover:bg-accent/30 transition-colors">
          <Lock size={10} strokeWidth={2.5} />
          {requires === 'pro' ? 'Pro' : 'Studio'}
        </span>
      </button>
    </div>
  );
}
