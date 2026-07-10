// Pure aggregation for the E09 redemption dashboard. No I/O — the server page
// fetches the raw ledger + registration rows and hands them here so the "holders"
// and "net active redemptions" math mirrors the 065_entitlements.sql RPCs exactly.
//
//   holders          = registrations that currently HOLD the entitlement:
//                      base (ticket_type inclusion → 1) + ledger grants
//                      - revokes - transfers-away, per registration, > 0.
//   redeemed (net)   = ledger rows action='redeemed' AND status='redeemed'
//                      minus rows action='un_redeemed'.
//   last             = most recent successful redemption (attendee + time).

import type { EntitlementType } from '@/components/tickets/EntitlementIcon';

export type RedemptionLimit = 'once' | 'once_per_day' | 'unlimited';

export interface EntitlementDef {
  id: string;
  name: string;
  type: EntitlementType;
  quantity: number | null;
  redemption_limit: RedemptionLimit;
}
export interface TteRow {
  entitlement_id: string;
  ticket_type_id: string | null;
}
export interface RegRow {
  id: string;
  ticket_type_id: string | null;
}
export interface HoldLedgerRow {
  entitlement_id: string;
  registration_id: string | null;
  action: string; // granted | revoked | transferred
}
export interface RedemptionLedgerRow {
  entitlement_id: string;
  registration_id: string | null;
  action: string; // redeemed | un_redeemed
  status: string; // redeemed | already | ...
  redeemed_at: string;
  attendee_name: string | null;
}

export interface RedemptionStatRow {
  id: string;
  name: string;
  type: EntitlementType;
  quantity: number | null;
  redemptionLimit: RedemptionLimit;
  holders: number;
  redeemed: number;
  last: { name: string; at: string } | null;
}

export function computeRedemptionStats(
  entitlements: EntitlementDef[],
  tte: TteRow[],
  regs: RegRow[],
  holdLedger: HoldLedgerRow[],
  redemptionLedger: RedemptionLedgerRow[],
): RedemptionStatRow[] {
  // entitlement_id -> ticket_type_ids that include it
  const includedByEnt = new Map<string, Set<string>>();
  for (const t of tte) {
    if (!t.ticket_type_id) continue;
    let s = includedByEnt.get(t.entitlement_id);
    if (!s) { s = new Set(); includedByEnt.set(t.entitlement_id, s); }
    s.add(t.ticket_type_id);
  }

  // ticket_type_id -> registration ids
  const regsByTicket = new Map<string, string[]>();
  for (const r of regs) {
    if (!r.ticket_type_id) continue;
    let a = regsByTicket.get(r.ticket_type_id);
    if (!a) { a = []; regsByTicket.set(r.ticket_type_id, a); }
    a.push(r.id);
  }

  // ledger hold adjustments: net per `${entitlement}::${registration}`
  const holdNet = new Map<string, number>();
  const ledgerRegsByEnt = new Map<string, Set<string>>();
  for (const l of holdLedger) {
    if (!l.registration_id) continue;
    const key = `${l.entitlement_id}::${l.registration_id}`;
    const delta = l.action === 'granted' ? 1 : -1; // revoked / transferred remove the hold
    holdNet.set(key, (holdNet.get(key) ?? 0) + delta);
    let s = ledgerRegsByEnt.get(l.entitlement_id);
    if (!s) { s = new Set(); ledgerRegsByEnt.set(l.entitlement_id, s); }
    s.add(l.registration_id);
  }

  // net redemptions + last successful redemption per entitlement.
  // redemptionLedger MUST be sorted redeemed_at DESC so the first 'redeemed' seen
  // per entitlement is the most recent.
  const netRedeemed = new Map<string, number>();
  const lastByEnt = new Map<string, { name: string; at: string }>();
  for (const r of redemptionLedger) {
    if (r.action === 'redeemed' && r.status === 'redeemed') {
      netRedeemed.set(r.entitlement_id, (netRedeemed.get(r.entitlement_id) ?? 0) + 1);
      if (!lastByEnt.has(r.entitlement_id)) {
        lastByEnt.set(r.entitlement_id, { name: r.attendee_name ?? 'Attendee', at: r.redeemed_at });
      }
    } else if (r.action === 'un_redeemed') {
      netRedeemed.set(r.entitlement_id, (netRedeemed.get(r.entitlement_id) ?? 0) - 1);
    }
  }

  return entitlements.map((e) => {
    const included = includedByEnt.get(e.id) ?? new Set<string>();
    const baseHolders = new Set<string>();
    for (const tt of included) {
      for (const rid of regsByTicket.get(tt) ?? []) baseHolders.add(rid);
    }
    // union of base holders + any registration touched by the hold ledger
    const candidates = new Set<string>(baseHolders);
    for (const rid of ledgerRegsByEnt.get(e.id) ?? []) candidates.add(rid);

    let holders = 0;
    for (const rid of candidates) {
      const base = baseHolders.has(rid) ? 1 : 0;
      const net = holdNet.get(`${e.id}::${rid}`) ?? 0;
      if (base + net > 0) holders++;
    }

    return {
      id: e.id,
      name: e.name,
      type: e.type,
      quantity: e.quantity,
      redemptionLimit: e.redemption_limit,
      holders,
      redeemed: Math.max(0, netRedeemed.get(e.id) ?? 0),
      last: lastByEnt.get(e.id) ?? null,
    };
  });
}
