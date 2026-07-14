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
        disallow: ['/api/', '/admin/', '/dashboard/', '/events/', '/settings/', '/analytics/', '/templates/', '/brand/', '/team/'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
