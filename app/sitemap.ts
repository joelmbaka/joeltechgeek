import { SITE_URL } from '@/lib/site';
import type { MetadataRoute } from 'next';
import { publicProjects } from '@/config/projects';
import { services } from '@/config/services';

const WEBSITE_UPDATED_AT = new Date('2026-10-14');
const CAREERS_UPDATED_AT = new Date('2026-10-19');
const SALES_AGENTS_UPDATED_AT = new Date('2026-10-20');

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: WEBSITE_UPDATED_AT, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/services`, lastModified: WEBSITE_UPDATED_AT, changeFrequency: 'monthly', priority: 0.98 },
    { url: `${base}/work`, lastModified: WEBSITE_UPDATED_AT, changeFrequency: 'monthly', priority: 0.96 },
    { url: `${base}/about`, lastModified: WEBSITE_UPDATED_AT, changeFrequency: 'monthly', priority: 0.86 },
    { url: `${base}/founder`, lastModified: WEBSITE_UPDATED_AT, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/mentorship`, lastModified: WEBSITE_UPDATED_AT, changeFrequency: 'monthly', priority: 0.78 },
    { url: `${base}/careers`, lastModified: SALES_AGENTS_UPDATED_AT, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/industries`, lastModified: WEBSITE_UPDATED_AT, changeFrequency: 'monthly', priority: 0.76 },
    { url: `${base}/demos`, lastModified: new Date('2026-11-01'), changeFrequency: 'monthly', priority: 0.82 },
    { url: `${base}/demos/fire-safety`, lastModified: new Date('2026-11-01'), changeFrequency: 'monthly', priority: 0.78 },
    { url: `${base}/contact`, lastModified: CAREERS_UPDATED_AT, changeFrequency: 'monthly', priority: 0.88 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${base}/services/${service.slug}`,
    lastModified: WEBSITE_UPDATED_AT,
    changeFrequency: 'monthly',
    priority: service.slug === 'react-native-app-development' ? 0.95 : 0.88,
  }));

  const projectRoutes: MetadataRoute.Sitemap = publicProjects.map((project) => ({
    url: `${base}/${project.id}`,
    lastModified: new Date(project.updatedAt),
    changeFrequency: 'monthly',
    priority: project.engagement === 'Experiment' ? 0.65 : 0.9,
  }));

  const careerRoutes: MetadataRoute.Sitemap = ['engineers', 'internships', 'saas', 'agents'].map((slug) => ({
    url: base + '/careers/' + slug,
    lastModified: slug === 'agents' ? SALES_AGENTS_UPDATED_AT : CAREERS_UPDATED_AT,
    changeFrequency: 'monthly',
    priority: 0.72,
  }));

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...careerRoutes];
}
