import { SITE_URL } from '@/lib/site';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import CTA from '@/components/CTA';

const base = SITE_URL;

export const metadata: Metadata = {
  title: 'Custom Software Development by Industry | JoelTechGeek',
  description:
    'Explore custom software development for logistics, automotive, construction, property management, education, healthcare and other industries.',
  alternates: { canonical: '/industries' },
  openGraph: {
    type: 'website',
    url: '/industries',
    title: 'Industry Experience | Joeltech Geek Systems',
    description: 'Real business software case studies and fictional demos across transport, automotive, construction, property, education and healthcare.',
  },
  twitter: { card: 'summary_large_image', title: 'Custom Software Development by Industry | JoelTechGeek', description: 'Custom business systems for transport, automotive, construction, property, education, healthcare and more.' },
};

const industryAreas = [
  {
    title: "Transport, Logistics & Fleet Operations",
    body: "Macsim Cargo demonstrates delivered software for cargo loads, driver assignments, fleet operations, trip activity, documents, financial workflows and administration.",
    href: "/macsim",
    proofLabel: "Real case study: Macsim Cargo",
    serviceHref: "/demos/vehicle-tracking",
    serviceLabel: "Fictional vehicle tracking demo",
  },
  {
    title: "Automotive & Vehicle Businesses",
    body: "Explore illustrative systems for self-drive rental fleets, automotive parts and inventory management, and garage repair operations. These are fictional interactive concepts, not claims of delivered client projects in all these niches.",
    href: "/demos/car-rental",
    proofLabel: "Fictional car rental demo",
    serviceHref: "/demos/auto-parts",
    serviceLabel: "Fictional automotive parts demo",
    extraDemoHref: "/demos/garage",
    extraDemoLabel: "Fictional garage management demo",
  },
  {
    title: "Construction & Project Operations",
    body: "Milliol Construction Manager is an Android application for site progress, work items, procurement, stock and financial reporting.",
    href: "/milliol",
    proofLabel: "Real case study: Milliol",
    serviceHref: "/demos/construction",
    serviceLabel: "Fictional construction demo",
  },
  {
    title: "Property & Real Estate Management",
    body: "RentPayor connects property operations with rent invoicing, M-Pesa collections, partial balances, receipts, leases, units, tenants and payment reconciliation.",
    href: "/rentpayor",
    proofLabel: "Real case study: RentPayor",
    serviceHref: "/demos/property",
    serviceLabel: "Fictional property demo",
  },
  {
    title: "Education & School Finance",
    body: "SchoolPey connects an Android parent experience with web school finance, fee schedules, student records, invoices, M-Pesa payments and reconciliation.",
    href: "/schoolpey",
    proofLabel: "Real case study: SchoolPey",
    serviceHref: "/demos/education",
    serviceLabel: "Fictional school demo",
  },
  {
    title: "Healthcare & Hospital Management",
    body: "CliviQue HMIS connects patient registration, clinical departments, inpatient and outpatient workflows, billing, facility operations and payment processing.",
    href: "/clivique-hmis",
    proofLabel: "Real case study: CliviQue HMIS",
    serviceHref: "/demos/healthcare",
    serviceLabel: "Fictional hospital demo",
  },
  {
    title: "Retail, Wholesale & Distribution",
    body: "Explore fictional point-of-sale, inventory and automotive parts workflows for businesses managing their own sales, stock and distribution.",
    href: "/demos/retail",
    proofLabel: "Fictional retail demo",
    serviceHref: "/demos/auto-parts",
    serviceLabel: "Fictional automotive parts demo",
  },
  {
    title: "Security & Field Operations",
    body: "Explore fictional guard attendance, site incidents, technician dispatch and customer reporting workflows. These demos illustrate possibilities, not verified client deliveries in these sectors.",
    href: "/demos/security",
    proofLabel: "Fictional security demo",
    serviceHref: "/demos/field-services",
    serviceLabel: "Fictional field services demo",
  },
  {
    title: "AI-Enabled Applications",
    body: "JournPad demonstrates mobile application delivery with voice capture, transcription, AI-assisted organization, reminders and playback.",
    href: "/journpad",
    proofLabel: "Real case study: JournPad",
    serviceHref: "/services/ai-api-integrations",
    serviceLabel: "AI integrations & automation",
  }
];

const openIndustries = ['Transport', 'Logistics', 'Automotive', 'Construction', 'Real estate', 'Education', 'Healthcare', 'Wholesale & distribution', 'Retail', 'Security', 'Field services', 'Finance', 'Banking', 'Insurance', 'Agriculture', 'Legal', 'Government', 'Professional services', 'B2B platforms', 'Consumer apps'];

export default function IndustriesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Custom software development by industry — Joeltech Geek Systems',
    url: `${base}/industries`,
    about: { '@id': `${base}/#organization` },
  };

  return (
    <main className="site-container pb-16 pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-palm-green">Industry experience</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">Custom software for businesses across industries.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
          From transport and vehicle operations to construction, healthcare, property and education, we build mobile apps, web platforms and business systems around how your organization operates. Our current focus includes fleet-related businesses, but we welcome custom software projects across sectors.
        </p>
        <Link href="/demos" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-palm-green px-5 py-2.5 text-sm font-semibold text-palm-green transition hover:bg-emerald-50 dark:hover:bg-emerald-950/30">Explore interactive software demos <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </header>

      <section className="mt-12 grid gap-5 md:grid-cols-2" aria-label="Industry software experience and examples">
        {industryAreas.map((item) => (
          <article key={item.title} className="rounded-3xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-900/70">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{item.body}</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
              <Link href={item.href} className="inline-flex items-center gap-2 text-palm-green hover:underline">{item.proofLabel} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              <Link href={item.serviceHref} className="inline-flex items-center gap-2 text-palm-green hover:underline">{item.serviceLabel} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              {'extraDemoHref' in item && item.extraDemoHref && (
                <Link href={item.extraDemoHref} className="inline-flex items-center gap-2 text-palm-green hover:underline">{item.extraDemoLabel} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-16 rounded-3xl border border-gray-200 bg-gray-50 p-7 dark:border-gray-800 dark:bg-gray-900/50 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Open industries</p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">We work across industries where software can make a meaningful difference.</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">These are examples of sectors we can discuss, not limits on the clients we serve. Real case studies and fictional interactive demos are labeled separately above.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {openIndustries.map((industry) => <span key={industry} className="rounded-full bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-300">{industry}</span>)}
        </div>
      </section>

      <CTA />
    </main>
  );
}
