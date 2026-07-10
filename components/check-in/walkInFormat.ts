/** Shared money formatter for the door / walk-in flow. Renders in Inter — no mono. */
export function fmtPrice(price: number, currency: string): string {
  if (price === 0) return 'Free';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
}
