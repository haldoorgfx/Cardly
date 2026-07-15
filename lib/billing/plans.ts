export type Plan = 'free' | 'pro' | 'studio';

export interface PlanLimits {
  events: number | null;        // null = unlimited
  cardsPerMonth: number;
  variants: number | null;      // null = unlimited
  brandKits: number;
  watermark: boolean;
  teamSeats: number;
  // Lifetime cap on confirmed/checked-in registrations for a single event.
  // null = unlimited. Free is capped to 1 event anyway, so this is enforced
  // as a straight per-event count, not a rolling window. Pro's "500
  // registrations/month" (CLAUDE.md) is a monthly, cross-event figure with
  // no counter infra built yet — left null (unenforced) rather than
  // half-modeled as a lifetime-per-event cap it isn't.
  registrationsPerEvent: number | null;
}

export const PLANS: Record<Plan, PlanLimits> = {
  free: {
    events: 1,
    cardsPerMonth: 50,
    variants: 1,
    brandKits: 0,
    watermark: true,
    teamSeats: 1,
    registrationsPerEvent: 50,
  },
  pro: {
    events: null,
    cardsPerMonth: 500,
    variants: 5,
    brandKits: 1,
    watermark: false,
    teamSeats: 1,
    registrationsPerEvent: null,
  },
  studio: {
    events: null,
    cardsPerMonth: 5000,
    variants: null,
    brandKits: 5,
    watermark: false,
    teamSeats: 10,
    registrationsPerEvent: null,
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
