/**
 * Cookie/analytics consent — client-side. A single localStorage flag drives
 * whether tracking (PostHog + Crisp) is allowed to initialize. Components listen
 * for the `CONSENT_EVENT` to react when the visitor makes a choice.
 */
export const CONSENT_KEY = 'eventera_cookie_consent';
export const CONSENT_EVENT = 'eventera-consent-change';

export type ConsentValue = 'accepted' | 'rejected';

export function getConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(CONSENT_KEY);
  return v === 'accepted' || v === 'rejected' ? v : null;
}

export function setConsent(value: ConsentValue): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

/** True only when the visitor has explicitly accepted analytics/tracking. */
export function analyticsAllowed(): boolean {
  return getConsent() === 'accepted';
}
