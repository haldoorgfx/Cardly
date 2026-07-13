/**
 * Eventera mobile app store links.
 *
 * Fill these with the real store URLs once the app is published. Until then
 * they point at the app landing page (`/app`) so the badges never dead-end.
 * Set NEXT_PUBLIC_IOS_APP_URL / NEXT_PUBLIC_ANDROID_APP_URL in the env to
 * override without a code change.
 */
export const IOS_APP_URL =
  process.env.NEXT_PUBLIC_IOS_APP_URL ?? '/app';
export const ANDROID_APP_URL =
  process.env.NEXT_PUBLIC_ANDROID_APP_URL ?? '/app';

/** True once at least one real store link is configured. */
export const APP_PUBLISHED =
  Boolean(process.env.NEXT_PUBLIC_IOS_APP_URL || process.env.NEXT_PUBLIC_ANDROID_APP_URL);
