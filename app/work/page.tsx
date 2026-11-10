import { SITE_URL } from '@/lib/site';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { publicProjects } from '@/config/projects';
import ProjectsCarousel from '@/components/ProjectsCarousel';
import CTA from '@/components/CTA';

export const metadata: Metadata = {
  title: 'Custom Software Development Portfolio | JoelTechGeek',
  description: 'Explore mobile apps and custom business systems developed across sales, logistics, construction, property management, education and healthcare.',
  alternates: { canonical: '/work' },
  openGraph: {
    type: 'website', url: '/work',
    title: 'Custom Software Development Work | JoelTechGeek',
    description: 'Real custom software projects and company-developed applications, with case studies and related interactive workflow demos.',
  },
};

const workflowAreas = [
  { title: 'Vehicle tracking & fleet visibility', demo: '/demos/vehicle-tracking', demoLabel: 'Vehicle tracking concept' },
  { title: 'Logistics, fleet & cargo dispatch', caseStudy: '/macsim', caseLabel: 'Macsim Cargo', demo: '/demos/logistics', demoLabel: 'Cargo dispatch concept' },
  { title: 'Car rental & fleet management', demo: '/demos/car-rental', demoLabel: 'Rental fleet management concept' },
  { title: 'Automotive parts & inventory', demo: '/demos/auto-parts', demoLabel: 'Automotive parts management concept' },
  { title: 'Garage & vehicle repair', demo: '/demos/garage', demoLabel: 'Garage operations concept' },
  { title: 'Construction & site operations', caseStudy: '/milliol', caseLabel: 'Milliol', demo: '/demos/construction', demoLabel: 'Construction workflow concept' },
  { title: 'Property management & rent collection', caseStudy: '/rentpayor', caseLabel: 'RentPayor', demo: '/demos/property', demoLabel: 'Property rental management concept' },
  { title: 'School fees & student finance', caseStudy: '/schoolpey', caseLabel: 'SchoolPey', demo: '/demos/education', demoLabel: 'School fee management concept' },
  { title: 'Healthcare administration & billing', caseStudy: '/clivique-hmis', caseLabel: 'CliviQue HMIS', demo: '/demos/healthcare', demoLabel: 'Hospital operations concept' },
];

export default function WorkPage() {
  const portfolioOrder = ['macsim', 'milliol', 'callsbound', 'rentpayor', 'schoolpey', 'clivique-hmis', 'journpad'];
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
    description: 'Custom software development portfolio showcasing real business systems, applications and client delivery.',
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
          Custom software development projects
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          Explore mobile applications and web platforms developed by Joeltech Geek Systems across sales operations, logistics, construction, property management, education, healthcare, and other industries. Each case study retains its actual project attribution.
        </p>
        <nav className="mt-7 flex flex-wrap gap-3 text-sm font-semibold" aria-label="Portfolio sections">
          <a href="#portfolio-projects" className="rounded-full border border-gray-300 px-4 py-2 text-palm-green hover:underline dark:border-gray-700">Projects</a>
          <a href="https://play.google.com/store/apps/developer?id=Joeltech+Geek+Systems" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-palm-green hover:underline dark:border-gray-700">
            Our apps on Google Play <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </nav>
      </header>

      <section id="portfolio-projects" className="mt-16 scroll-mt-24" aria-labelledby="portfolio-projects-title">
        <h2 id="portfolio-projects-title" className="text-3xl font-bold text-gray-900 dark:text-white">Selected projects</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
          Applications and business systems we&apos;ve developed. Explore each case study for details about the project and our contribution.
        </p>
        <div className="mt-8"><ProjectsCarousel projects={orderedProjects} /></div>
      </section>

      <section className="mt-16" aria-labelledby="work-by-workflow">
        <h2 id="work-by-workflow" className="text-3xl font-bold text-gray-900 dark:text-white">Explore related software workflows</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
          Browse examples of software workflows we can build. Case-study links show actual delivered work; interactive demos use fictional data and are not live client deployments.
        </p>
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {workflowAreas.map((area) => (
            <article key={area.demo} className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{area.title}</h3>
              <div className="mt-4 flex flex-col items-start gap-3 text-sm font-semibold">
                {area.caseStudy && (
                  <Link href={area.caseStudy} className="inline-flex items-center gap-2 text-palm-green hover:underline">
                    Real case study: {area.caseLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                )}
                <Link href={area.demo} className="inline-flex items-center gap-2 text-palm-green hover:underline">
                  Fictional demo: {area.demoLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-5 text-sm text-gray-600 dark:text-gray-300">
          Interested in how collections connect to invoices? See our <Link href="/services/payment-integrations" className="font-semibold text-palm-green hover:underline">M-Pesa API and reconciliation services</Link>.
        </p>
      </section>

      <section className="mt-16 rounded-3xl bg-gray-50 p-7 dark:bg-gray-900/60 sm:p-9">
        <h2 className="text-2xl font-bold">Need similar software for your organisation?</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600 dark:text-gray-300">
          We build custom mobile apps, business systems, web dashboards, backend services and integrations around your particular workflows.
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
