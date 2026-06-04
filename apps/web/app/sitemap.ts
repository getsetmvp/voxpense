import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-06-04');
  return [
    { url: `${site.url}/`, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${site.url}/privacy`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${site.url}/terms`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${site.url}/account-deletion`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
