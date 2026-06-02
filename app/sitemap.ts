import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://karta.cre8so.com';
  return [
    // ── Core marketing ──────────────────────────────────────────────
    { url: base,                   lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/pricing`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/use-cases`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/about`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },

    // ── Secondary marketing ─────────────────────────────────────────
    { url: `${base}/blog`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${base}/partners`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${base}/whats-new`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.5 },

    // ── Auth ────────────────────────────────────────────────────────
    { url: `${base}/signup`,       lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${base}/login`,        lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },

    // ── Legal ───────────────────────────────────────────────────────
    { url: `${base}/terms`,        lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/privacy`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ];
}
