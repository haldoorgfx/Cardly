import type { EntitlementType } from '@/components/tickets/EntitlementIcon';

// Shape of one competing offline scan inside a conflict (from list_sync_conflicts).
export interface ConflictScanRow {
  redemption_id: string;
  device_id: string | null;
  scanned_at: string | null;  // device clock — when the attendee was actually scanned
  synced_at: string | null;   // server clock — when the row reached the server
  redeemed_by: string | null;
}

// One conflict = same slot (registration + entitlement + day), two devices, both offline.
export interface Conflict {
  registration_id: string;
  attendee_name: string | null;
  entitlement_id: string;
  entitlement_name: string;
  entitlement_type: EntitlementType;
  day_index: number | null;
  rows: ConflictScanRow[];
}

export type ResolveAction = 'keep_first' | 'keep_both' | 'manual';

// Mirror of resolve_conflict()'s jsonb return.
export interface ResolveResult {
  resolved: boolean;
  action: ResolveAction;
  kept_redemption_id: string | null;
  superseded_ids: string[];
}

export interface ResolveInput {
  registrationId: string;
  entitlementId: string;
  dayIndex: number | null;
  action: ResolveAction;
  keepRedemptionId?: string | null;
}

export type ResolveActionFn = (
  input: ResolveInput,
) => Promise<{ ok: true; result: ResolveResult } | { error: string }>;

// Stable identity for a conflict card (day may be null → 'x').
export function conflictKey(c: Conflict): string {
  return `${c.registration_id}::${c.entitlement_id}::${c.day_index ?? 'x'}`;
}
