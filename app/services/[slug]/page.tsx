import { SITE_URL } from '@/lib/site';
import { findService, services } from '@/config/services';
import { projects } from '@/config/projects';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import CTA from '@/components/CTA';

interface PageProps { params: Promise<{ slug: string }>; }

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) return { title: 'Service not found' };
  return {
    title: service.searchTitle,
    description: service.description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: service.searchTitle,
      description: service.description,
      type: 'website',
      url: `/services/${service.slug}`,
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) return notFound();
  const evidence = service.proofIds
    .map((id) => projects.find((project) => project.id === id))
    .filter((project): project is (typeof projects)[number] => Boolean(project));
  const base = SITE_URL;
  const canonical = `${base}/services/${service.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${canonical}#service`,
        name: service.title,
        description: service.description,
        provider: { '@id': `${base}/#organization` },
        areaServed: ['United States', 'Kenya', 'Worldwide'],
        serviceType: service.title,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${base}/services` },
          { '@type': 'ListItem', position: 3, name: service.title, item: canonical },
        ],
      },
    ],
  };

  return (
    <main className="site-container pb-16 pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/services" className="inline-flex items-center gap-2 text-sm font-medium text-palm-green hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All services
      </Link>
      <header className="mt-8 max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">{service.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">{service.title}</h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">{service.summary}</p>
        <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">{service.description}</p>
        <Link href="/contact" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90">
          {service.ctaLabel ?? 'Discuss this service'} <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </Link>
      </header>

      <section className="mt-16 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <h2 className="text-2xl font-bold">Problems we help solve</h2>
          <ul className="mt-6 space-y-4">
            {service.problems.map((problem) => <li key={problem} className="flex gap-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-palm-green" aria-hidden />{problem}
            </li>)}
          </ul>
        </div>
        <div className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <h2 className="text-2xl font-bold">What an engagement can include</h2>
          <ul className="mt-6 space-y-4">
            {service.deliverables.map((item) => <li key={item} className="flex gap-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-palm-green" aria-hidden />{item}
            </li>)}
          </ul>
        </div>
      </section>

      <section className="mt-16 rounded-3xl bg-gray-50 p-7 dark:bg-gray-900/50 sm:p-9">
        <h2 className="text-2xl font-bold">How we approach delivery</h2>
        <ol className="mt-7 grid gap-5 md:grid-cols-3">
          {service.approach.map((step, index) => (
            <li key={step} className="rounded-2xl bg-white p-6 dark:bg-gray-950/70">
              <span className="text-sm font-bold text-palm-green">0{index + 1}</span>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {service.buyerExamples && (
        <section className="mt-16" aria-labelledby="business-examples-title">
          <h2 id="business-examples-title" className="text-3xl font-bold text-gray-900 dark:text-white">Business workflows this service can support</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">Illustrative project scopes, tailored to your requirements and existing systems.</p>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {service.buyerExamples.map((example) => (
              <article key={example.title} className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{example.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{example.detail}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-16">
        <h2 className="text-3xl font-bold">Real work behind this capability</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
          These products and client systems illustrate relevant engineering work. Each case study identifies the delivery context and supported platforms.
        </p>
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {evidence.map((project) => (
            <article key={project.id} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/60">
              <p className="text-xs font-semibold uppercase tracking-widest text-palm-green">{project.engagement === 'Client project' ? 'Client work' : project.engagement === 'Experiment' ? 'Experiment' : 'Our products'}</p>
              <h3 className="mt-3 text-xl font-semibold">{project.title}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{project.description}</p>
              <Link href={`/${project.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-palm-green hover:underline">
                Read case study <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {service.relatedDemos && (
        <section className="mt-16 rounded-3xl bg-gray-50 p-7 dark:bg-gray-900/50 sm:p-9">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Try related interactive concepts</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600 dark:text-gray-300">
            These are fictional browser-based demonstrations of business workflows, not commissioned client deployments.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
            {service.relatedDemos.map((demo) => (
              <Link key={demo.href} href={demo.href} className="inline-flex items-center gap-2 text-palm-green hover:underline">
                {demo.label} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      )}
      {service.relatedServices && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Related development services</h2>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
            {service.relatedServices.map((related) => (
              <Link key={related.href} href={related.href} className="inline-flex items-center gap-2 text-palm-green hover:underline">
                {related.label} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      )}
      <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/work" className="font-semibold text-palm-green hover:underline">Browse the complete portfolio</Link>
      </div>
      <CTA />
    </main>
  );
}
