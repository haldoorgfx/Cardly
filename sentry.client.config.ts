import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10 % of sessions for performance (bumped automatically on errors)
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Ignore known unactionable browser/OS-level errors
  ignoreErrors: [
    // Browser extension noise
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    // Android Chrome: camera intent fails (permission denied / camera busy)
    // Not our code — thrown by the Android OS when file/camera input is triggered
    'setPhotoOptions failed',
    // Safari private browsing storage quota
    'QuotaExceededError',
    // Network interruptions (user closed tab, lost connection)
    'NetworkError when attempting to fetch resource',
    'Failed to fetch',
    'Load failed',
  ],
});
