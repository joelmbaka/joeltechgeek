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
  const portfolioOrder = ['macsim', 'milliol', 'rentpayor', 'schoolpey', 'clivique-hmis', 'journpad'];
  const orderedProjects = [
    ...portfolioOrder.map((id) => publicProjects.find((project) => project.id === id))
      .filter((project): project is (typeof publicProjects)[number] => Boolean(project)),
    ...publicProjects.filter((project) => !portfolioOrder.includes(project.id)),
  ];
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
          Explore mobile applications and web platforms developed by Joeltech Geek Systems across logistics, construction, property management, education, healthcare, and other industries. Each case study retains its actual project attribution.
        </p>
        <nav className="mt-7 flex flex-wrap gap-3 text-sm font-semibold" aria-label="Portfolio sections">
          <a href="#portfolio-projects" className="rounded-full border border-gray-300 px-4 py-2 text-palm-green hover:underline dark:border-gray-700">Projects</a>
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

      <section id="portfolio-projects" className="mt-16 scroll-mt-24" aria-labelledby="portfolio-projects-title">
        <h2 id="portfolio-projects-title" className="text-3xl font-bold text-gray-900 dark:text-white">Our projects</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
          Applications and business systems we&apos;ve developed. Explore each case study for details about the project and our contribution.
        </p>
        <div className="mt-8"><ProjectsCarousel projects={orderedProjects} /></div>
      </section>

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
