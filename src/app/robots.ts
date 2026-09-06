import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
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
        ],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
