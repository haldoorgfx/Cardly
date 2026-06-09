import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/render': ['./public/fonts/**/*'],
      // Include pdfkit's runtime data files (AFM font metrics) so the
      // serverless function can read them via __dirname at runtime.
      '/api/events/[id]/roster/pdf':  ['./node_modules/pdfkit/js/data/**/*'],
      '/api/events/[id]/revenue/pdf': ['./node_modules/pdfkit/js/data/**/*'],
      '/api/events/[id]/agenda/pdf':  ['./node_modules/pdfkit/js/data/**/*'],
    },
  },

  webpack(config, { isServer }) {
    if (isServer) {
      // pdfkit uses dynamic require() calls to load AFM font data files at
      // runtime using __dirname. If webpack bundles it, those require() paths
      // break. Mark it as an external so Node resolves it from node_modules
      // at runtime — outputFileTracingIncludes above ensures the files travel
      // with the serverless function.
      const existing = Array.isArray(config.externals)
        ? config.externals
        : config.externals
          ? [config.externals]
          : [];
      config.externals = [...existing, 'pdfkit'];
    }
    return config;
  },

  // ── Security headers ──────────────────────────────────────────────────────
  // Applied to every response. Blocks clickjacking, MIME sniffing, XSS, etc.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Block this page being embedded in an iframe on another domain
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Prevent browsers guessing MIME types (enables XSS via crafted files)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Enable browser's built-in XSS filter
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Don't send full URL as referrer to third-party sites
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Lock down browser features we don't use
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // Force HTTPS for 2 years (only applies once on HTTPS — safe on Vercel)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      // Supabase storage (event backgrounds, speaker photos, etc.)
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      // Allow any https image (organiser-supplied speaker photos, sponsor logos, etc.)
      // We validate/sanitize URLs before saving so this is safe.
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress Sentry build output unless SENTRY_DSN is set
  silent: !process.env.SENTRY_DSN,
  // Upload source maps only when auth token is present (CI/CD)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Don't block the build if Sentry upload fails
  errorHandler(err) {
    console.warn('[sentry] source map upload failed:', err.message);
  },
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
