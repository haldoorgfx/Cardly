import type { EntitlementType } from '@/components/tickets/EntitlementIcon';

/**
 * Shared model for the G05 entitlement audit log. Pure types — no JSX — so the
 * server page and the filterable table client speak the same shape. Rows come
 * from the list_entitlement_audit RPC (065_entitlements.sql); performedByName is
 * resolved server-side from profiles.
 */

export interface AuditRow {
  id: string;
  redeemed_at: string;
  scanned_at: string | null;
  synced_at: string | null;
  action: string;   // redeemed | un_redeemed | granted | revoked | transferred | extended
  status: string;   // redeemed | already | not_entitled | outside_window | ok
  source: string | null;
  device_id: string | null;
  reason: string | null;
  performed_by: string | null;
  performedByName: string | null;
  registration_id: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  entitlement_id: string | null;
  entitlement_name: string | null;
  entitlement_type: EntitlementType | null;
}

/** A staff member who has performed at least one audited action. */
export interface StaffOption {
  id: string;
  name: string;
}

export interface AuditFilters {
  attendee: string;        // free-text name/email match, '' = none
  entitlementId: string;   // '' = all
  performedBy: string;     // '' = all
  action: string;          // '' = all
  status: string;          // result, '' = all
  from: string;            // datetime-local value, '' = none
  to: string;              // datetime-local value, '' = none
}

export const AUDIT_STATUSES: { value: string; label: string }[] = [
  { value: 'redeemed', label: 'Redeemed' },
  { value: 'ok', label: 'OK' },
  { value: 'already', label: 'Already redeemed' },
  { value: 'not_entitled', label: 'Not entitled' },
  { value: 'outside_window', label: 'Outside window' },
];

export function statusLabel(status: string): string {
  return AUDIT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

/** Colour token per result/status (existing brand tokens only). */
export function statusColors(status: string): { bg: string; color: string } {
  switch (status) {
    case 'redeemed':
    case 'ok':             return { bg: 'rgba(45,122,79,0.12)', color: '#2D7A4F' };
    case 'already':        return { bg: 'rgba(201,122,45,0.12)', color: '#C97A2D' };
    case 'not_entitled':
    case 'outside_window': return { bg: 'rgba(184,66,60,0.10)', color: '#B8423C' };
    default:               return { bg: '#F0EEE7', color: '#6B7A72' };
  }
}

export const AUDIT_ACTIONS: { value: string; label: string }[] = [
  { value: 'redeemed', label: 'Redeemed' },
  { value: 'un_redeemed', label: 'Un-redeemed' },
  { value: 'granted', label: 'Granted' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'extended', label: 'Extended' },
];

export function actionLabel(action: string): string {
  return AUDIT_ACTIONS.find((a) => a.value === action)?.label ?? action;
}

/** Colour token per action (existing brand tokens only). */
export function actionColors(action: string): { bg: string; color: string } {
  switch (action) {
    case 'redeemed':    return { bg: 'rgba(45,122,79,0.12)', color: '#2D7A4F' };
    case 'un_redeemed': return { bg: 'rgba(201,122,45,0.12)', color: '#C97A2D' };
    case 'granted':     return { bg: '#E8EFEB', color: '#1F4D3A' };
    case 'revoked':     return { bg: 'rgba(184,66,60,0.10)', color: '#B8423C' };
    case 'transferred': return { bg: 'rgba(58,107,140,0.10)', color: '#3A6B8C' };
    case 'extended':    return { bg: 'rgba(201,164,94,0.14)', color: '#C9A45E' };
    default:            return { bg: '#F0EEE7', color: '#6B7A72' };
  }
}
