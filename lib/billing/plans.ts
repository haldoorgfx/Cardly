export type Plan = 'free' | 'pro' | 'studio';

export interface PlanLimits {
  events: number | null;        // null = unlimited
  cardsPerMonth: number;
  variants: number | null;      // null = unlimited
  brandKits: number;
  watermark: boolean;
  teamSeats: number;
}

export const PLANS: Record<Plan, PlanLimits> = {
  free: {
    events: 1,
    cardsPerMonth: 50,
    variants: 1,
    brandKits: 0,
    watermark: true,
    teamSeats: 1,
  },
  pro: {
    events: null,
    cardsPerMonth: 500,
    variants: 5,
    brandKits: 1,
    watermark: false,
    teamSeats: 1,
  },
  studio: {
    events: null,
    cardsPerMonth: 5000,
    variants: null,
    brandKits: 5,
    watermark: false,
    teamSeats: 10,
  },
};

// Maps Stripe price IDs → plan names. Populated from env vars at startup.
export function getPlanFromPriceId(priceId: string): Plan | null {
  const map: Record<string, Plan> = {
    [process.env.STRIPE_PRICE_PRO_MONTHLY ?? '']:  'pro',
    [process.env.STRIPE_PRICE_PRO_ANNUAL ?? '']:   'pro',
    [process.env.STRIPE_PRICE_STUDIO_MONTHLY ?? '']: 'studio',
    [process.env.STRIPE_PRICE_STUDIO_ANNUAL ?? '']: 'studio',
  };
  return map[priceId] ?? null;
}
