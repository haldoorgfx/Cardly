/**
 * Shared with client components.
 *
 * Deliberately its own module: lib/webhooks/index.ts is server-only (it builds
 * a service-role Supabase client), so a client component importing the
 * threshold from there would drag the admin client into the browser bundle.
 * Keeping the number in one place stops the UI copy — "switched off after N
 * failed deliveries" — from drifting away from the value the dispatcher
 * actually acts on.
 */
export const AUTO_DISABLE_AFTER = 15;
