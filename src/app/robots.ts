import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

const PRIVATE_PATHS = [
  '/products/account',
  '/products/account/',
  '/products/account/cohorts',
  '/api/products/downloads',
  '/login',
  '/login/',
  '/api/auth',
  '/cohorts/*/apply',
  '/cohorts/*/checkout',
  '/admin',
];

// AI search crawlers named explicitly so an "allow" is on record for each;
// the wildcard rule already covers them, this removes any ambiguity.
export const AI_SEARCH_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      ...AI_SEARCH_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
