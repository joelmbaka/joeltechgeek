import { Project } from '@/config/projects';
import { projectContext } from '@/config/project-context';
import { services } from '@/config/services';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';

// Legacy expertise topics point to the current canonical service routes.
// Multiple topics may share one service; link it only once per case study.
const expertiseToService: Record<string, string> = {
  'react-native-mobile-engineering': 'react-native-app-development',
  'mobile-app-release-ci-cd': 'react-native-app-development',
  'nextjs-web-engineering': 'web-app-development',
  'technical-seo-search-growth': 'web-app-development',
  'fastapi-postgresql-backends': 'fastapi-backend-development',
  'api-engineering-integrations': 'fastapi-backend-development',
  'databases-data-modeling': 'fastapi-backend-development',
  'authentication-application-security': 'fastapi-backend-development',
  'automated-testing-quality-engineering': 'services',
  'payments-fintech-saas': 'payment-integrations',
  'voice-ai-llm-engineering': 'ai-api-integrations',
};

export default function StoreReviews({ project }: { project: Project }) {
  const { url, appStore, playStore } = project;
  const context = projectContext[project.id];
  const linkCount = [url, appStore, playStore].filter(Boolean).length;
  const serviceSlugs = [...new Set(
    (context?.expertiseSlugs ?? [])
      .map((slug) => expertiseToService[slug])
      .filter((slug): slug is string => Boolean(slug)),
  )];
  const relatedServices = serviceSlugs.flatMap((slug) => {
    if (slug === 'services') {
      return [{ slug, title: 'All software development services', href: '/services' }];
    }
    const service = services.find((service) => service.slug === slug);
    return service ? [{ slug, title: service.title, href: `/services/${service.slug}` }] : [];
  });

  return (
    <>
      {context && (
        <section className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Domain & technical context</p>
          {context.roleLabel && (
            <p className="mt-3 text-base font-semibold text-gray-900 dark:text-white">Role: {context.roleLabel}</p>
          )}
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Industry / domain</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {context.domains.map((domain) => (
                <Link key={domain} href="/industries" className="rounded-full bg-white px-3 py-1.5 text-xs text-gray-700 shadow-sm transition hover:text-palm-green dark:bg-gray-800 dark:text-gray-300">
                  {domain}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Expertise demonstrated</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {relatedServices.map((service) => (
                <Link key={service.slug} href={service.href} className="inline-flex min-h-11 items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 transition hover:border-palm-green hover:text-palm-green dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                  {service.title}
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {linkCount > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-center text-xl font-semibold">Live product & release links</h2>
          <p className="mx-auto mb-5 max-w-xl text-center text-sm leading-6 text-gray-600 dark:text-gray-400">
            Public product and store links are shown as release evidence. Ratings and review counts are intentionally not displayed unless they are verified from the stores.
            {project.id === 'callsbound' && (
              <span className="mt-2 block">The live web CRM requires Google sign-in. User accounts and lead data are private.</span>
            )}
          </p>
          <div
            className={`mx-auto grid w-full max-w-3xl grid-cols-1 gap-3 ${
              linkCount === 2 ? 'sm:grid-cols-2' : linkCount >= 3 ? 'sm:grid-cols-3' : 'sm:max-w-sm'
            }`}
          >
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/60 px-5 py-4 text-center text-sm font-semibold text-gray-800 backdrop-blur transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-100">
                {project.externalLinkLabel || (project.engagement === 'Client project' ? 'Visit client website' : 'Visit product website')}
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              </a>
            )}
            {appStore && (
              <a href={appStore.url} target="_blank" rel="noopener noreferrer" className="flex min-h-16 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/60 px-5 py-4 text-center backdrop-blur transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60">
                <Image src="/images/app-store.png" alt={`View ${project.title} on the App Store`} width={160} height={40} className="h-10 w-auto max-w-full" loading="lazy" />
              </a>
            )}
            {playStore && (
              <a href={playStore.url} target="_blank" rel="noopener noreferrer" className="flex min-h-16 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/60 px-5 py-4 text-center backdrop-blur transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60">
                <Image src="/images/play-store.png" alt={`View ${project.title} on Google Play`} width={160} height={40} className="h-10 w-auto max-w-full" loading="lazy" />
              </a>
            )}
          </div>
        </section>
      )}
    </>
  );
}
