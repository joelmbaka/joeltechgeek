import { SITE_URL } from '@/lib/site';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import CTA from '@/components/CTA';

const base = SITE_URL;

export const metadata: Metadata = {
  title: 'Industry Experience | Joeltech Geek Systems',
  description:
    'Explore software case studies across property management, school finance, construction, healthcare, logistics and voice AI at Joeltech Geek Systems.',
  alternates: { canonical: '/industries' },
  openGraph: {
    type: 'website',
    url: '/industries',
    title: 'Industry Experience | Joeltech Geek Systems',
    description: 'Domain experience backed by production case studies, plus an industry-agnostic approach to web and mobile product engineering.',
  },
  twitter: { card: 'summary_large_image', title: 'Industry Experience | Joeltech Geek Systems', description: 'FinTech, PropTech, healthcare, logistics, SaaS, and industry-agnostic product engineering.' },
};

const proven = [
  {
    title: 'FinTech, PropTech & accounting workflows',
    body: 'RentPayor combines property operations with financial and accounting state: rent invoices, M-Pesa collection, automatic invoice reconciliation, partial balances, tenant credits, receipts, leases, units, tenants, and payment history.',
    href: '/rentpayor',
    serviceHref: '/services/payment-integrations',
    serviceLabel: 'M-Pesa and reconciliation services',
  },
  {
    title: 'Education & school-fee platforms',
    body: 'SchoolPey combines Android parent access and web school administration with term fee schedules, student and guardian records, invoicing, M-Pesa collection, receipts and reconciliation.',
    href: '/schoolpey',
    serviceHref: '/services/web-app-development',
    serviceLabel: 'Business systems development',
  },
  {
    title: 'Construction & project operations',
    body: 'Milliol Construction Manager is an Android-only solution for site progress, work items, procurement, stock and financial reporting.',
    href: '/milliol',
    serviceHref: '/services/web-app-development',
    serviceLabel: 'Custom operations software',
  },
  {
    title: 'Healthcare & HMIS',
    body: 'CliviQue HMIS connects patient registration, clinical departments, inpatient/outpatient workflows, billing, facility operations, permissions, and facility-bound M-Pesa patient payments.',
    href: '/clivique-hmis',
    serviceHref: '/services/web-app-development',
    serviceLabel: 'Web apps and dashboards',
  },
  {
    title: 'Logistics, transport & operational finance',
    body: 'Macsim Cargo covers loads, reservations, drivers, fleet, trip operations, documents, administration, finance, Daraja collection funding, and guarded B2C driver payouts.',
    href: '/macsim',
    serviceHref: '/services/web-app-development',
    serviceLabel: 'Custom business systems',
  },
  {
    title: 'Voice, consumer SaaS & applied AI',
    body: 'JournPad is a voice-first journaling product spanning audio capture, transcription, AI-assisted organization, goals, reminders, playback, subscriptions, and production mobile release.',
    href: '/journpad',
    serviceHref: '/services/react-native-app-development',
    serviceLabel: 'Mobile app development',
  },
];

const openIndustries = ['Construction', 'Finance', 'Banking', 'Insurance', 'Trade & commerce', 'Healthcare', 'Education', 'Legal', 'Government', 'Agriculture', 'Real estate', 'Property management', 'Transport', 'Logistics', 'Retail', 'Professional services', 'B2B SaaS', 'Consumer apps'];

export default function IndustriesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Industry experience — Joeltech Geek Systems',
    url: `${base}/industries`,
    about: { '@id': `${base}/#organization` },
  };

  return (
    <main className="site-container pb-16 pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-palm-green">Industry experience</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">Software built around how your industry actually works.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
          Our published work spans property and finance, education, construction, healthcare, logistics and consumer AI. We remain industry-agnostic: if your business needs mobile or web interfaces, APIs, databases, payments, automation or operations software, we can begin with your specific workflows.
        </p>
        <Link href="/demos" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-palm-green px-5 py-2.5 text-sm font-semibold text-palm-green transition hover:bg-emerald-50 dark:hover:bg-emerald-950/30">Explore interactive software demos <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </header>

      <section className="mt-12 grid gap-5 md:grid-cols-2" aria-label="Proven domain experience">
        {proven.map((item) => (
          <article key={item.title} className="rounded-3xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{item.body}</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
              <Link href={item.href} className="inline-flex items-center gap-2 text-palm-green hover:underline">See case study <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              <Link href={item.serviceHref} className="inline-flex items-center gap-2 text-palm-green hover:underline">{item.serviceLabel} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-16 rounded-3xl border border-gray-200 bg-gray-50 p-7 dark:border-gray-800 dark:bg-gray-900/50 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Open industries</p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">We work across industries where software can make a meaningful difference.</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">Examples include the sectors below. This list indicates sectors we can discuss, not claims of completed work in every industry. The case studies above document actual experience.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {openIndustries.map((industry) => <span key={industry} className="rounded-full bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-300">{industry}</span>)}
        </div>
      </section>

      <CTA />
    </main>
  );
}
