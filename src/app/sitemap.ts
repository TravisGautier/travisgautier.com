import type { MetadataRoute } from 'next';
import { getAllEpisodes } from '@/lib/content/episodes';
import { getAllCases } from '@/lib/content/cases';
import { getAllJobs } from '@/lib/build-log/jobs';
import { getAllProducts } from '@/lib/content/products';
import { getAllCohorts } from '@/lib/content/cohorts';
import { site } from '@/lib/site';

const BASE_URL = site.url;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [episodes, cases, jobs, products, cohorts] = await Promise.all([
    getAllEpisodes(),
    getAllCases(),
    getAllJobs(),
    getAllProducts(),
    getAllCohorts(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/episodes`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/cases`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/products`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/about`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/build-log`, changeFrequency: 'daily', priority: 0.7 },
    {
      url: `${BASE_URL}/build-log/status`,
      changeFrequency: 'daily',
      priority: 0.6,
    },
    { url: `${BASE_URL}/cohorts`, changeFrequency: 'weekly', priority: 0.7 },
  ];

  const episodeRoutes: MetadataRoute.Sitemap = episodes.map((ep) => ({
    url: `${BASE_URL}/episodes/${ep.slug}`,
    ...(ep.meta.publishedAt
      ? { lastModified: new Date(ep.meta.publishedAt) }
      : {}),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const caseRoutes: MetadataRoute.Sitemap = cases.map((c) => ({
    url: `${BASE_URL}/cases/${c.slug}`,
    ...(c.meta.shippedAt
      ? { lastModified: new Date(c.meta.shippedAt) }
      : {}),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const buildLogJobRoutes: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${BASE_URL}/build-log/jobs/${job.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const buildLogPhaseRoutes: MetadataRoute.Sitemap = jobs.flatMap((job) =>
    job.phases.map((phase) => ({
      url: `${BASE_URL}/build-log/jobs/${job.slug}/${phase.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  );

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: new Date(p.meta.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const cohortRoutes: MetadataRoute.Sitemap = cohorts.map((c) => ({
    url: `${BASE_URL}/cohorts/${c.meta.slug}`,
    ...(c.meta.publishedAt
      ? { lastModified: new Date(c.meta.publishedAt) }
      : {}),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...episodeRoutes,
    ...caseRoutes,
    ...productRoutes,
    ...buildLogJobRoutes,
    ...buildLogPhaseRoutes,
    ...cohortRoutes,
  ];
}
