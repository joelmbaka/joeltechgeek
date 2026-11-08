import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Globe2, MonitorSmartphone, Users } from 'lucide-react';
import { services } from '@/config/services';
import { SITE_URL } from '@/lib/site';
import CTA from '@/components/CTA';

export const metadata: Metadata = {
  title: 'Custom Software Development in Kenya | JoelTechGeek',
  description: 'Custom mobile apps, web platforms and business management systems for Kenyan and international businesses, with remote delivery for US teams too.',
  alternates: { canonical: '/services' },
  openGraph: { title: 'Custom Software Development in Kenya | JoelTechGeek', description: 'Custom mobile apps, web platforms, business systems and payment integrations for teams in Kenya and beyond.', url: '/services' },
};

const businessWorkflows = [
  { title: 'Transport and dispatch operations', description: 'Loads, drivers, reservations, fleet activity and operational finance.', href: '/macsim', proof: 'Macsim Cargo · Client project' },
  { title: 'Construction project operations', description: 'Site progress, procurement, materials, stock and financial reporting.', href: '/milliol', proof: 'Milliol · Client project' },
  { title: 'Rent collection and reconciliation', description: 'Invoices, tenant balances, receipts and payment matching in property operations.', href: '/rentpayor', proof: 'RentPayor · Company-developed product' },
  { title: 'School fee administration', description: 'Student fee structures, term invoices, parent payments and financial records.', href: '/schoolpey', proof: 'SchoolPey · Company-developed product' },
  { title: 'Healthcare operations and billing', description: 'Patient encounters, facility workflows, service billing and financial records.', href: '/clivique-hmis', proof: 'CliviQue HMIS · Company-developed product' },
];

const serviceCardCopy: Record<string, { title: string; summary: string }> = {
  'react-native-app-development': {
    title: 'Mobile App Development',
    summary: 'Android and iOS apps for customers, staff and field teams, including sign-in, payments and practical day-to-day workflows.',
  },
  'web-app-development': {
    title: 'Web Applications & Business Systems',
    summary: 'Custom dashboards and management systems for records, approvals, inventory, reporting and everyday operations.',
  },
  'fastapi-backend-development': {
    title: 'Backend Systems & Integrations',
    summary: 'Secure systems that connect business data, customer accounts, payments and the tools your team already uses.',
  },
  'saas-product-development': {
    title: 'Complete Software Product Development',
    summary: 'Plan, build, test, launch and improve a complete software product tailored to the people who will use it.',
  },
  'payment-integrations': {
    title: 'M-Pesa Payments & Reconciliation',
    summary: 'Connect payments with invoices, receipts, balances and transaction records so your team can track collections.',
  },
  'ai-api-integrations': {
    title: 'AI Integrations & Workflow Automation',
    summary: 'Add useful features such as transcription, summarization and reviewed automation using existing AI services.',
  },
};

export default function ServicesPage() {
  const base = SITE_URL;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Software development services — Joeltech Geek Systems',
    url: `${base}/services`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: services.map((service, index) => ({
        '@type': 'ListItem', position: index + 1, name: service.title, url: `${base}/services/${service.slug}`,
      })),
    },
  };

  return (
    <main className="site-container pb-16 pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">What clients hire us to build</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">Custom software development for Kenyan and international businesses</h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          Joeltech Geek Systems builds custom mobile apps, web platforms and business management systems for teams in Kenya, the US and beyond. Whether your business needs invoicing, M-Pesa reconciliation, inventory, field operations or management reporting, we connect useful interfaces to dependable backend workflows.
        </p>
        <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">
          Every project starts with the way your business works. We consider your existing tools, staff roles and day-to-day processes before agreeing on the right solution. You can explore our technical specializations on the individual service pages.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-5 text-sm font-semibold">
          <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 text-white transition hover:opacity-90">
            Discuss your software project <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/work" className="inline-flex items-center gap-2 text-palm-green hover:underline">
            Explore our work <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </header>

      <section className="mt-14 grid gap-5 md:grid-cols-2" aria-label="Software development services">
        {services.map((service) => (
          <article key={service.slug} className="flex flex-col rounded-3xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-900/60">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-palm-green">{service.eyebrow}</p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{serviceCardCopy[service.slug]?.title ?? service.title}</h2>
            <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">{serviceCardCopy[service.slug]?.summary ?? service.summary}</p>
            <Link href={`/services/${service.slug}`} className="mt-auto inline-flex min-h-11 items-center gap-2 pt-5 text-sm font-semibold text-palm-green hover:underline">
              How we deliver this service <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </article>
        ))}
      </section>

      <section className="mt-16" aria-labelledby="business-workflows-title">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-palm-green">Practical business outcomes</p>
          <h2 id="business-workflows-title" className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Business systems grounded in real workflows</h2>
          <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">
            These examples show real software we have developed across different industries, including client commissions and our own products. Each case study explains the project context.
          </p>
        </div>
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {businessWorkflows.map((workflow) => (
            <article key={workflow.href} className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{workflow.title}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{workflow.description}</p>
              <Link href={workflow.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-palm-green hover:underline">
                {workflow.proof} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-5 text-sm text-gray-600 dark:text-gray-300">
          Evaluating a new workflow? <Link href="/demos" className="font-semibold text-palm-green hover:underline">Explore interactive software concepts</Link> using fictional data.
        </p>
      </section>

      <section className="mt-16 grid gap-5 lg:grid-cols-3" aria-label="How we work">
        <article className="rounded-2xl bg-gray-50 p-6 dark:bg-gray-900/60">
          <MonitorSmartphone className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold">From requirement to release</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">We can take on complete products or a defined module: discovery, design decisions, implementation, testing and production handover.</p>
        </article>
        <article className="rounded-2xl bg-gray-50 p-6 dark:bg-gray-900/60">
          <Globe2 className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold">Serving US &amp; Kenyan teams remotely</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">We collaborate remotely across time zones. Scope, communication, pricing and delivery arrangements are agreed for each engagement.</p>
        </article>
        <article className="rounded-2xl bg-gray-50 p-6 dark:bg-gray-900/60">
          <Users className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold">Engineering collaboration</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">Need technical leadership or extra engineering capacity? Discuss founder-led project delivery or remote developer collaboration, subject to skills, availability and agreement. No staffing or relocation placement is guaranteed.</p>
        </article>
      </section>

      <section className="mt-16 rounded-3xl border border-gray-200 p-7 dark:border-gray-800 sm:p-9">
        <h2 className="text-2xl font-bold">See actual software, not just a capabilities list.</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
          Explore the real workflows, platforms, engineering responsibilities and business problems behind the custom systems and applications we&apos;ve built.
        </p>
        <Link href="/work" className="mt-5 inline-flex items-center gap-2 font-semibold text-palm-green hover:underline">
          Explore our work <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
      <CTA />
    </main>
  );
}
