'use client';

import Link from 'next/link';
import { SITE_URL } from '@/lib/site';
import Hero from '@/components/Hero';
import CTA from '@/components/CTA';
import { publicProjects } from '@/config/projects';
import ProjectsCarousel from '@/components/ProjectsCarousel';
import SlideIn from '@/components/SlideIn';
import { ArrowRight, Braces, Database, GraduationCap, MonitorSmartphone, Rocket, ShieldCheck } from 'lucide-react';

const serviceCards = [
  { title: 'Mobile applications', description: 'Android and iOS apps that help customers, staff and field teams manage everyday tasks and payments.', href: '/services/react-native-app-development', icon: MonitorSmartphone },
  { title: 'Web platforms & dashboards', description: 'Custom dashboards and online systems for managing records, daily operations and reporting.', href: '/services/web-app-development', icon: Braces },
  { title: 'Backend systems & integrations', description: 'Secure systems connecting your business data, M-Pesa payments, customer accounts and existing tools.', href: '/services/fastapi-backend-development', icon: Database },
  { title: 'End-to-end delivery', description: 'From understanding your needs through development, testing, launch and ongoing improvements.', href: '/services/saas-product-development', icon: Rocket },
];

const delivery = [
  { title: 'Understand the problem', description: 'Start with business goals, user journeys, constraints and a clear implementation scope.' },
  { title: 'Build the right system', description: 'Design complete workflows—from interfaces and APIs to data, access controls and integrations.' },
  { title: 'Launch with confidence', description: 'Test the critical paths, deploy carefully and improve based on real-world feedback.' },
];

export default function Home() {
  const portfolioOrder = ['macsim', 'milliol', 'rentpayor', 'schoolpey', 'clivique-hmis', 'journpad'];
  const featuredProjects = [
    ...portfolioOrder.map((id) => publicProjects.find((project) => project.id === id))
      .filter((project): project is (typeof publicProjects)[number] => Boolean(project)),
    ...publicProjects.filter((project) => !portfolioOrder.includes(project.id)),
  ];
  const base = SITE_URL;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${base}/#organization`,
        name: 'Joeltech Geek Systems',
        url: base,
        logo: `${base}/brand/bridgeframe-512.png`,
        image: `${base}/brand/bridgeframe-512.png`,
        description: 'Kenya-registered, founder-led software development business available for US, Kenyan and international projects through remote delivery.',
        founder: { '@id': `${base}/#person` },
        areaServed: ['United States', 'Kenya', 'Worldwide'],
        address: { '@type': 'PostalAddress', addressCountry: 'KE' },
        knowsAbout: ['Custom software development', 'Mobile applications', 'SaaS', 'Web dashboards', 'FastAPI', 'PostgreSQL', 'Payment integrations'],
      },
      {
        '@type': 'Person',
        '@id': `${base}/#person`,
        name: 'Joel Mbaka',
        url: `${base}/founder`,
        jobTitle: 'Founder and Senior Full-Stack Software Engineer',
        worksFor: { '@id': `${base}/#organization` },
        sameAs: ['https://github.com/joelmbaka', 'https://linkedin.com/in/joelmbaka'],
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        name: 'Joeltech Geek Systems',
        url: base,
        publisher: { '@id': `${base}/#organization` },
      },
      {
        '@type': 'WebPage',
        '@id': `${base}/#webpage`,
        url: `${base}/`,
        name: 'Joeltech Geek Systems | Custom Software Development',
        isPartOf: { '@id': `${base}/#website` },
        about: { '@id': `${base}/#organization` },
      },
    ],
  };

  return (
      <main className="w-full min-w-0 pb-12 pt-16">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="relative isolate overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white dark:from-emerald-950/25 dark:via-gray-950 dark:to-gray-950">
          <div className="pointer-events-none absolute -right-24 top-20 h-96 w-96 rounded-full bg-ocean-blue/5 blur-3xl dark:bg-ocean-blue/10" aria-hidden="true" />
          <div className="site-container relative pb-12 pt-10 sm:pt-16 lg:pt-20">
            <SlideIn><Hero /></SlideIn>
            <section className="mt-14 grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40 sm:grid-cols-3 sm:p-7">
          {[
            { label: 'Serving', value: 'US · Kenya · Worldwide' },
            { label: 'Delivery', value: 'Remote across time zones' },
            { label: 'Focused on', value: 'Real business outcomes' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl px-3 py-3 sm:border-l sm:border-palm-green sm:pl-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-palm-green">{item.label}</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{item.value}</p>
            </div>
          ))}
            </section>
          </div>
        </div>

        <section id="services" className="scroll-mt-24 bg-gray-50/80 py-16 dark:bg-gray-900/25 sm:py-20">
          <div className="site-container">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">How we help</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Your business challenge. Our engineering focus.</h2>
            <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">We create software people actually use—from the first idea and architecture through deployment and ongoing improvements.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {serviceCards.map(({ title, description, href, icon: Icon }) => (
              <Link key={title} href={href} className="group min-w-0 rounded-3xl border border-gray-200 bg-white p-6 lg:p-7 shadow-sm transition hover:-translate-y-1 hover:border-palm-green dark:border-gray-800 dark:bg-gray-900/60">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-palm-green dark:bg-emerald-950/30"><Icon className="h-5 w-5" aria-hidden /></div>
                <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-palm-green">See services <ArrowRight className="h-4 w-4" aria-hidden /></span>
              </Link>
            ))}
          </div>
          <nav aria-label="Specialized software services" className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <span className="font-medium text-gray-600 dark:text-gray-300">Specialized services:</span>
            <Link href="/services/payment-integrations" className="inline-flex min-h-11 items-center gap-2 font-semibold text-palm-green hover:underline">
              M-Pesa payments &amp; reconciliation <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/services/ai-api-integrations" className="inline-flex min-h-11 items-center gap-2 font-semibold text-palm-green hover:underline">
              AI API integrations <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </nav>
          </div>
        </section>

        <section id="work" className="scroll-mt-24 bg-white py-16 dark:bg-gray-950 sm:py-20">
          <div className="site-container">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Our portfolio</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">We build software that runs businesses.</h2>
            <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">
              Explore mobile applications and web platforms we've developed across logistics, construction, property management, education, healthcare, and more.
            </p>
          </div>
          <ProjectsCarousel projects={featuredProjects} />
          <Link href="/work" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-palm-green hover:underline">
            View full portfolio and case studies <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          </div>
        </section>

        <section className="bg-gradient-to-b from-gray-50/70 to-white py-16 dark:from-gray-900/30 dark:to-gray-950 sm:py-20">
          <div className="site-container">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Our approach</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">From challenge to shipped software.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {delivery.map((step, index) => (
              <div key={step.title} className="rounded-3xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-900/60">
                <span className="text-sm font-bold text-palm-green">0{index + 1}</span>
                <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
          </div>
        </section>

        <section className="bg-emerald-50/50 py-16 dark:bg-emerald-950/10 sm:py-20">
          <div className="site-container">
          <div className="grid gap-8 overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 p-7 dark:border-gray-800 dark:bg-gray-900/60 sm:p-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">The founder</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Leadership rooted in building.</h2>
            <p className="mt-5 text-base leading-8 text-gray-600 dark:text-gray-300">Joeltech Geek Systems is founded and led by Joel Mbaka, a software engineer and technology entrepreneur. He takes direct responsibility for product architecture, software delivery and turning challenging operational problems into useful systems.</p>
            <p className="mt-4 text-base leading-8 text-gray-600 dark:text-gray-300">Beyond building products, Joel mentors emerging software developers and believes the next generation of technical talent grows through practical experience and thoughtful guidance.</p>
            <Link href="/founder" className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-palm-green hover:underline">Meet the founder <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <div className="flex flex-col justify-between gap-5 rounded-2xl bg-white p-7 dark:bg-gray-950/70">
            <GraduationCap className="h-10 w-10 text-palm-green" aria-hidden />
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Build your future with us.</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">Explore paid engineering collaborations, software development internships, mentorship and SaaS sales opportunities. Terms depend on the actual role and agreement.</p>
              <Link href="/careers" className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-palm-green hover:underline">Explore careers <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
          </div>
          </div>
          </div>
        </section>

        <div className="site-container">
        <div className="mt-10 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><ShieldCheck className="h-4 w-4 text-palm-green" aria-hidden /> Kenya-registered business · US &amp; Kenya enquiries · Remote collaboration worldwide</div>
        <CTA />
        </div>
      </main>
  );
}
