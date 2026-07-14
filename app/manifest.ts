import type { MetadataRoute } from 'next';

// Web app manifest — enables add-to-homescreen / installable PWA basics.
// Next.js serves this at /manifest.webmanifest and links it automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Eventera — The complete event platform',
    short_name: 'Eventera',
    description:
      'Registration, tickets, agenda, check-in, networking — and a personalized Eventera Card for every attendee.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF6EE',
    theme_color: '#1F4D3A',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
