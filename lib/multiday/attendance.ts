// Pure aggregation for the M03 attendance-by-day grid. No I/O — the server page
// fetches the raw days, attendees, ticket-links, hold ledger and day-scoped
// redemptions and hands them here. The "who holds what" rule REUSES
// computeHolders from lib/entitlements/redemptionStats so it never drifts from
// the 065_entitlements.sql `_entitlement_held` logic.
//
//   checked-in    — net redemption (redeemed&redeemed − un_redeemed) on that
//                   day_index for an entitlement that applies that day.
//   not-entitled  — holds NO entitlement that applies that day.
//   absent        — entitled that day, but no redemption on it.
//
// NOTE: never iterate a Set/Map with `for…of` / spread / `new Set(set)` here —
// this repo's tsconfig has no downlevelIteration. Use `.forEach` / `Array.from`.

import { computeHolders, type TteRow, type RegRow, type HoldLedgerRow } from '@/lib/entitlements/redemptionStats';

export type CellState = 'checked-in' | 'absent' | 'not-entitled';

export interface DayDef {
  id: string;
  day_index: number;
  date: string | null;
  capacity: number | null;
  entitlementIds: string[];
}

export interface AttendeeDef {
  id: string; // registration id
  name: string;
  ticketName: string | null;
}

export interface DayRedemptionRow {
  registration_id: string | null;
  entitlement_id: string;
  action: string; // redeemed | un_redeemed
  status: string; // redeemed | already | ...
  day_index: number | null;
}

export interface DaySummary {
  day_index: number;
  checkedIn: number;
  entitled: number;
  capacity: number | null;
}

export interface AttendanceGrid {
  /** key `${registrationId}::${dayIndex}` → cell state */
  cells: Record<string, CellState>;
  perDay: DaySummary[];
}

export function computeAttendanceGrid(
  days: DayDef[],
  attendees: AttendeeDef[],
  tte: TteRow[],
  regs: RegRow[],
  holdLedger: HoldLedgerRow[],
  redemptions: DayRedemptionRow[],
): AttendanceGrid {
  // Every entitlement referenced by any day (deduped via array, never new Set(set)).
  const allEntIds = Array.from(new Set(days.flatMap((d) => d.entitlementIds)));
  const holderMap = computeHolders(allEntIds, tte, regs, holdLedger);

  // Net redemptions keyed by `${regId}::${dayIndex}::${entId}`.
  const netRedeem = new Map<string, number>();
  for (const r of redemptions) {
    if (!r.registration_id || r.day_index == null) continue;
    const key = `${r.registration_id}::${r.day_index}::${r.entitlement_id}`;
    if (r.action === 'redeemed' && r.status === 'redeemed') {
      netRedeem.set(key, (netRedeem.get(key) ?? 0) + 1);
    } else if (r.action === 'un_redeemed') {
      netRedeem.set(key, (netRedeem.get(key) ?? 0) - 1);
    }
  }

  const cells: Record<string, CellState> = {};
  const perDay: DaySummary[] = days.map((d) => {
    let checkedIn = 0;
    let entitled = 0;
    for (const a of attendees) {
      const isEntitled = d.entitlementIds.some((eid) => holderMap.get(eid)?.has(a.id) ?? false);

      let isCheckedIn = false;
      for (const eid of d.entitlementIds) {
        if ((netRedeem.get(`${a.id}::${d.day_index}::${eid}`) ?? 0) > 0) { isCheckedIn = true; break; }
      }

      const state: CellState = isCheckedIn ? 'checked-in' : isEntitled ? 'absent' : 'not-entitled';
      cells[`${a.id}::${d.day_index}`] = state;

      // Denominator counts anyone entitled OR already checked in (a revoked-after
      // -scan edge case still shows in the checked-in tally), so checkedIn ≤ entitled.
      if (isEntitled || isCheckedIn) entitled++;
      if (isCheckedIn) checkedIn++;
    }
    return { day_index: d.day_index, checkedIn, entitled, capacity: d.capacity };
  });

  return { cells, perDay };
}
