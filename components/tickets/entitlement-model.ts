import { z } from 'zod';
import type { EntitlementType } from './EntitlementIcon';

/**
 * Shared data model for the entitlements engine (G1). Pure types + zod schema +
 * helpers — no JSX — so the page (server), the list client and the slide-over
 * all speak the same shape without importing each other's components.
 */

export type RedemptionLimit = 'once' | 'once_per_day' | 'unlimited';

export interface TicketTypeLite {
  id: string;
  name: string;
}

export interface Entitlement {
  id: string;
  name: string;
  type: EntitlementType;
  quantity: number | null;
  valid_from: string | null;
  valid_until: string | null;
  redemption_limit: RedemptionLimit;
  ticketTypeIds: string[];
  redemptionCount: number;
}

export interface EntitlementInput {
  name: string;
  type: EntitlementType;
  quantity: number | null;
  valid_from: string | null;
  valid_until: string | null;
  redemption_limit: RedemptionLimit;
  ticketTypeIds: string[];
}

export const REDEMPTION_LIMITS: { value: RedemptionLimit; label: string; hint: string }[] = [
  { value: 'once', label: 'Once', hint: 'One scan, ever' },
  { value: 'once_per_day', label: 'Once per day', hint: 'One scan each day' },
  { value: 'unlimited', label: 'Unlimited', hint: 'No cap' },
];

export const entitlementFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120, 'Keep it under 120 characters'),
    type: z.enum(['entry', 'meal', 'session', 'merch', 'transport', 'access', 'parking', 'certificate']),
    quantity: z
      .string()
      .refine((v) => v === '' || (/^\d+$/.test(v) && parseInt(v, 10) >= 1), 'Enter a whole number of 1 or more, or leave blank for unlimited'),
    valid_from: z.string(),
    valid_until: z.string(),
    redemption_limit: z.enum(['once', 'once_per_day', 'unlimited']),
    ticketTypeIds: z.array(z.string()),
  })
  .refine((d) => !(d.valid_from && d.valid_until) || new Date(d.valid_from) < new Date(d.valid_until), {
    message: 'The start must be before the end',
    path: ['valid_until'],
  });

export type EntitlementFormValues = z.infer<typeof entitlementFormSchema>;

/** UTC ISO → datetime-local input value (browser local time). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
