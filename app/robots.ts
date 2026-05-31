import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/events/', '/settings/', '/analytics/', '/templates/', '/brand/', '/team/'],
      },
    ],
    sitemap: 'https://karta.cre8so.com/sitemap.xml',
  };
}
