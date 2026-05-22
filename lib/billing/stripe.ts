import Stripe from 'stripe';

// Lazily initialized — avoids throwing during `next build` when env vars
// are not present in the build environment (they're injected at runtime).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return _stripe;
}

/** @deprecated Use `getStripe()` — kept for backwards compat during migration */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    // Skip Symbol properties (toStringTag, toPrimitive, etc.) to avoid
    // triggering the env var check during Next.js build-time module evaluation.
    if (typeof prop === 'symbol') return undefined;
    // During build-time static analysis, webpack may access properties like
    // 'then' (thenable check) before env vars are available. Guard gracefully.
    try {
      return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
    } catch {
      return undefined;
    }
  },
});
