import type { EntitlementType } from '@/components/tickets/EntitlementIcon';
import type { RedemptionLimit } from '@/components/tickets/entitlement-model';

/**
 * Shared model for the per-attendee entitlement management surface (G02–G04).
 * Pure types + the server-action function shapes — no JSX — so the server page
 * and every client sub-component speak the same shape.
 */

export type EntitlementState = 'held' | 'redeemed' | 'expired';

/** One entitlement resolved for a single attendee, with its live state. */
export interface AttendeeEntitlement {
  id: string;
  name: string;
  type: EntitlementType;
  redemption_limit: RedemptionLimit;
  valid_from: string | null;
  valid_until: string | null;
  held: boolean;
  state: EntitlementState;
  /** Most recent successful (non-superseded) redemption, if any. */
  redeemedAt: string | null;
  redeemedByName: string | null;
  deviceId: string | null;
  /** The redemption row id to reverse on un-redeem (null when nothing to undo). */
  latestRedemptionId: string | null;
  /** Held AND not yet redeemed → eligible to transfer. */
  transferable: boolean;
}

export interface AttendeeHeader {
  registrationId: string;
  name: string;
  email: string | null;
  ticketName: string | null;
  status: string;
}

/** A candidate transfer target (another attendee of the same event). */
export interface TransferTarget {
  registrationId: string;
  name: string;
  email: string | null;
  ticketName: string | null;
}

// ── Server-action result + function shapes ──────────────────────────────────

export type ActionResult = { ok: true } | { error: string };

export type TransferResult =
  | { ok: true; toName: string; notified: number }
  | { blocked: 'already_redeemed' }
  | { error: string };

export interface AttendeeActions {
  revoke: (entitlementId: string, reason: string) => Promise<ActionResult>;
  unredeem: (redemptionId: string, reason: string) => Promise<ActionResult>;
  grant: (entitlementId: string) => Promise<ActionResult>;
  extend: (entitlementId: string, validUntilIso: string) => Promise<ActionResult>;
  transfer: (entitlementId: string, toRegistrationId: string) => Promise<TransferResult>;
  searchTargets: (query: string) => Promise<TransferTarget[]>;
  lookupByEmail: (email: string) => Promise<{ found: true; target: TransferTarget } | { found: false }>;
}
