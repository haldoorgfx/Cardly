import { withSentryConfig } from '@sentry/nextjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inline webpack plugin — copies pdfkit's AFM font-metric files into
// .next/server/chunks/data/ during the server build.  At runtime the bundled
// pdfkit code resolves __dirname to that same chunks/ directory, so the files
// are found correctly.  No extra npm package needed.
class CopyPdfkitAfmData {
  apply(compiler) {
    compiler.hooks.done.tapAsync('CopyPdfkitAfmData', (stats, callback) => {
      try {
        const srcDir  = path.join(__dirname, 'node_modules/pdfkit/js/data');
        const destDir = path.join(__dirname, '.next/server/chunks/data');
        if (fs.existsSync(srcDir)) {
          fs.mkdirSync(destDir, { recursive: true });
          let copied = 0;
          for (const file of fs.readdirSync(srcDir)) {
            fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
            copied++;
          }
          if (copied > 0) {
            console.log(`[CopyPdfkitAfmData] copied ${copied} files → .next/server/chunks/data/`);
          }
        }
      } catch (e) {
        console.warn('[CopyPdfkitAfmData] warning:', e.message);
      }
      callback();
    });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/render': ['./public/fonts/**/*'],
      // pdfkit AFM font-metric files are copied to .next/server/chunks/data/
      // by the CopyPdfkitAfmData webpack plugin above (that's the __dirname
      // path pdfkit resolves at runtime in the bundled chunk).
      '/api/events/[id]/roster/pdf':  ['./.next/server/chunks/data/**/*'],
      '/api/events/[id]/revenue/pdf': ['./.next/server/chunks/data/**/*'],
      '/api/events/[id]/agenda/pdf':  ['./.next/server/chunks/data/**/*'],
    },
  },

  webpack(config, { isServer }) {
    if (isServer) {
      config.plugins.push(new CopyPdfkitAfmData());
    }
    return config;
  },

  async redirects() {
    return [
      { source: '/brand-kit', destination: '/brand', permanent: true },
    ];
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
