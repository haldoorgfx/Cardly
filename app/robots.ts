import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // Allow the public event-discovery routes that live under /events/*
        // (the bare /events feed has no trailing slash so it's already allowed).
        // Crawlers match most-specific first, so these win over the /events/
        // disallow while the organizer dashboard (/events/new, /events/[id]) stays blocked.
        allow: ['/', '/events/search', '/events/city/', '/events/cities', '/events/category/'],
        disallow: [
          '/api/', '/admin/', '/dashboard/', '/events/', '/settings/',
          '/analytics/', '/templates/', '/brand/', '/team/',
          // Signed-in-only surfaces — auth already gates them, but keep them out
          // of the crawl so login redirects never get indexed and crawl budget
          // goes to real public pages.
          '/my-tickets', '/my-cards', '/saved', '/home', '/onboarding',
          '/account/', '/speaking', '/sponsoring',
          // URL-secret surfaces: card links and the token-gated exhibitor
          // portal must never be indexed if one leaks into a crawl.
          '/c/', '/x/',
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://eventera.so'}/sitemap.xml`,
  };
}
