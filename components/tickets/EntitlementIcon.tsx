import { DoorOpen, Utensils, CalendarClock, ShoppingBag, Bus, KeyRound, Car, Award } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * The 8 entitlement types (mirrors the CHECK constraint in
 * 065_entitlements.sql: entry|meal|session|merch|transport|access|parking|certificate).
 * One icon + human label per type — reuse this everywhere an entitlement type
 * is shown so the glyph set never drifts.
 */
export type EntitlementType =
  | 'entry' | 'meal' | 'session' | 'merch'
  | 'transport' | 'access' | 'parking' | 'certificate';

interface TypeMeta {
  type: EntitlementType;
  label: string;
  icon: LucideIcon;
}

export const ENTITLEMENT_TYPES: TypeMeta[] = [
  { type: 'entry',       label: 'Entry',       icon: DoorOpen },
  { type: 'meal',        label: 'Meal',        icon: Utensils },
  { type: 'session',     label: 'Session',     icon: CalendarClock },
  { type: 'merch',       label: 'Merch',       icon: ShoppingBag },
  { type: 'transport',   label: 'Transport',   icon: Bus },
  { type: 'access',      label: 'Access',      icon: KeyRound },
  { type: 'parking',     label: 'Parking',     icon: Car },
  { type: 'certificate', label: 'Certificate', icon: Award },
];

const BY_TYPE: Record<EntitlementType, TypeMeta> = ENTITLEMENT_TYPES.reduce(
  (acc, m) => { acc[m.type] = m; return acc; },
  {} as Record<EntitlementType, TypeMeta>,
);

export function entitlementTypeLabel(type: EntitlementType): string {
  return BY_TYPE[type]?.label ?? type;
}

/** Renders the lucide glyph for a given entitlement type. */
export function EntitlementIcon({
  type,
  size = 16,
  strokeWidth = 1.9,
  className,
  style,
}: {
  type: EntitlementType;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Glyph = (BY_TYPE[type] ?? BY_TYPE.entry).icon;
  return <Glyph size={size} strokeWidth={strokeWidth} className={className} style={style} />;
}
