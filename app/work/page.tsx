import { SITE_URL } from '@/lib/site';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { publicProjects } from '@/config/projects';
import ProjectsCarousel from '@/components/ProjectsCarousel';
import CTA from '@/components/CTA';

export const metadata: Metadata = {
  title: 'Business Software Portfolio | Kenya & International Projects',
  description: 'Explore software products and client projects in property, school finance, healthcare, construction and logistics, with clear delivery context.',
  alternates: { canonical: '/work' },
  openGraph: {
    type: 'website', url: '/work',
    title: 'Business Software Products & Client Projects | JoelTechGeek',
    description: 'Company-developed commercial software and client delivery—clearly identified with technical case studies.',
  },
};

const workflowAreas = [
  { title: 'Property management and rent collection', caseStudy: '/rentpayor', caseLabel: 'RentPayor · Our product', demo: '/demos/property', demoLabel: 'Rental management concept' },
  { title: 'School fees and student finance', caseStudy: '/schoolpey', caseLabel: 'SchoolPey · Our product', demo: '/demos/education', demoLabel: 'School fee management concept' },
  { title: 'Construction and site operations', caseStudy: '/milliol', caseLabel: 'Milliol · Client project', demo: '/demos/construction', demoLabel: 'Construction workflow concept' },
  { title: 'Logistics, fleet and dispatch', caseStudy: '/macsim', caseLabel: 'Macsim Cargo · Client project', demo: '/demos/logistics', demoLabel: 'Cargo dispatch concept' },
  { title: 'Healthcare administration and billing', caseStudy: '/clivique-hmis', caseLabel: 'CliviQue HMIS · Our product', demo: '/demos/healthcare', demoLabel: 'Hospital operations concept' },
];

export default function WorkPage() {
  const owned = publicProjects.filter((project) => project.engagement === 'Product');
  const commissioned = publicProjects.filter((project) => project.engagement === 'Client project');
  const experiments = publicProjects.filter((project) => project.engagement === 'Experiment');
  const orderedProjects = [...owned, ...commissioned, ...experiments];
  const base = SITE_URL;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${base}/work#collection`,
    name: 'Software portfolio — Joeltech Geek Systems',
    url: `${base}/work`,
    description: 'In-house software products and client projects with distinct delivery and ownership context.',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: orderedProjects.map((project, index) => ({
        '@type': 'ListItem', position: index + 1, name: project.title, url: `${base}/${project.id}`,
      })),
    },
  };

  return (
    <main className="site-container pb-16 pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Our portfolio</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          Business software products and client projects
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          Joeltech Geek Systems develops commercial software products and takes on commissioned engineering projects. We separate the two below so you can see exactly what is an in-house product, what was built for a client, and any currently featured experiments.
        </p>
        <nav className="mt-7 flex flex-wrap gap-3 text-sm font-semibold" aria-label="Portfolio sections">
          <a href="#our-products" className="rounded-full border border-gray-300 px-4 py-2 text-palm-green hover:underline dark:border-gray-700">Our products</a>
          <a href="#client-projects" className="rounded-full border border-gray-300 px-4 py-2 text-palm-green hover:underline dark:border-gray-700">Client projects</a>
          {experiments.length > 0 && <a href="#experiments" className="rounded-full border border-gray-300 px-4 py-2 text-palm-green hover:underline dark:border-gray-700">Experiments</a>}
        </nav>
      </header>

      <section className="mt-16" aria-labelledby="work-by-workflow">
        <h2 id="work-by-workflow" className="text-3xl font-bold text-gray-900 dark:text-white">Explore our software by business challenge</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
          Start with a real product or client case study. Where available, you can also explore a separate fictional demo of a similar workflow.
        </p>
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {workflowAreas.map((area) => (
            <article key={area.caseStudy} className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{area.title}</h3>
              <div className="mt-4 flex flex-col items-start gap-3 text-sm font-semibold">
                <Link href={area.caseStudy} className="inline-flex items-center gap-2 text-palm-green hover:underline">
                  Case study: {area.caseLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link href={area.demo} className="inline-flex items-center gap-2 text-palm-green hover:underline">
                  Interactive concept: {area.demoLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-5 text-sm text-gray-600 dark:text-gray-300">
          Interested in how collections connect to invoices? See our <Link href="/services/payment-integrations" className="font-semibold text-palm-green hover:underline">M-Pesa API and reconciliation services</Link>.
        </p>
      </section>

      <section id="our-products" className="mt-16 scroll-mt-24" aria-labelledby="our-products-title">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-palm-green">01 · Products developed by our business</p>
        <h2 id="our-products-title" className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Our software products</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
          Applications and SaaS platforms developed for our own product roadmap and commercial activity. Some are founder-led or co-founded ventures; a listing here is not a claim of exclusive intellectual-property ownership.
        </p>
        <div className="mt-8"><ProjectsCarousel projects={owned} /></div>
      </section>

      <section id="client-projects" className="mt-20 scroll-mt-24" aria-labelledby="client-projects-title">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-palm-green">02 · Commissioned engineering</p>
        <h2 id="client-projects-title" className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Software built for clients</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
          Client-commissioned systems built to streamline operations and service delivery. These case studies show our technical contribution; client project attribution does not imply Joeltech Geek Systems owns the client&apos;s business or software.
        </p>
        <div className="mt-8"><ProjectsCarousel projects={commissioned} /></div>
      </section>

      {experiments.length > 0 && (
        <section id="experiments" className="mt-20 scroll-mt-24" aria-labelledby="experiments-title">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-palm-green">03 · Research & experimentation</p>
          <h2 id="experiments-title" className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Exploratory applications</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
            Engineering experiments that explore useful experiences or integrations, without implying commercial launch or active customer adoption.
          </p>
          <div className="mt-8"><ProjectsCarousel projects={experiments} /></div>
        </section>
      )}

      <section className="mt-16 rounded-3xl bg-gray-50 p-7 dark:bg-gray-900/60 sm:p-9">
        <h2 className="text-2xl font-bold">Need similar software for your organisation?</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600 dark:text-gray-300">
          We can discuss mobile apps, web dashboards, SaaS products, backend services, payments and integrations for your particular workflows.
        </p>
        <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold">
          <Link href="/services" className="inline-flex items-center gap-2 text-palm-green hover:underline">See development services <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          <Link href="/contact" className="inline-flex items-center gap-2 text-palm-green hover:underline">Discuss a similar system <ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </div>
      </section>
      <CTA />
    </main>
  );
}
