import { z } from 'zod';
import type { EntitlementType } from '@/components/tickets/EntitlementIcon';

/**
 * Shared data model for multi-day setup (M01). Pure types + zod schema — no JSX —
 * so the server page, the list client and each day card speak the same shape.
 */

export interface EventDayLite {
  id: string;
  day_index: number;
  date: string | null; // 'YYYY-MM-DD' (date column) or null
  checkin_enabled: boolean;
  capacity: number | null;
  entitlementIds: string[];
}

export interface DayEntitlementLite {
  id: string;
  name: string;
  type: EntitlementType;
}

/** Payload a day card sends to the server action. */
export interface DayInput {
  date: string | null;
  checkin_enabled: boolean;
  capacity: number | null;
  entitlementIds: string[];
}

export const dayFormSchema = z.object({
  date: z.string(), // '' or 'YYYY-MM-DD'
  checkin_enabled: z.boolean(),
  capacity: z
    .string()
    .refine(
      (v) => v === '' || (/^\d+$/.test(v) && parseInt(v, 10) >= 1),
      'Enter a whole number of 1 or more, or leave blank for no cap',
    ),
  entitlementIds: z.array(z.string()),
});

export type DayFormValues = z.infer<typeof dayFormSchema>;

/** Long, human date label for a card header — Inter, never mono. */
export function dayDateLabel(date: string | null): string {
  if (!date) return 'No date set';
  // Parse as local calendar date (avoid TZ shift on a bare YYYY-MM-DD).
  const [y, m, d] = date.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return 'No date set';
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}
