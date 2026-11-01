import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Building2, FileText, ReceiptText,
  Smartphone, Users, WalletCards, ChartNoAxesCombined
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Rental Property Management Interactive Demo | JoelTechGeek Systems',
  description: 'Explore Property Manager and Tenant views with tenant rent filters, shared invoices, receipts, leases, payments, property expenses and owner positions.',
  alternates: { canonical: '/demos/property' },
  openGraph: {
    type: 'website',
    url: '/demos/property',
    title: 'Rental Management | Interactive Mobile Demo',
    description: 'Explore property rent collections and tenant balances inside one fictional mobile landlord workspace.',
  },
};

const areas = [
  {
    name: 'Rent',
    icon: ReceiptText,
    detail: 'Monthly collected, invoiced and outstanding rent, occupancy, and overdue or due invoices. Open an invoice to inspect its breakdown and record an external payment.',
  },
  {
    name: 'Leases',
    icon: FileText,
    detail: 'Existing tenant leases, unit rent and service charges, and related invoices. A vacant unit is available for a new lease and optional first invoice.',
  },
  {
    name: 'Tenants',
    icon: Users,
    detail: 'Tenant directory, assigned units, active lease details, invoice history and any carried-forward tenant credit.',
  },
  {
    name: 'Portfolio',
    icon: Building2,
    detail: 'Fictional properties, unit counts, occupancy, vacant units, and a standalone unit. Open properties and units freely.',
  },
];

export default function RentalManagementDemoPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-2 hover:text-palm-green">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All demos
        </Link>
        <span aria-hidden>/</span><span>Property &amp; rent management</span>
      </nav>

      <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">
            Rental operations · Interactive mobile concept
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Rental Management
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Explore fictional rent management through Property Manager and Tenant views,
            with tenant-filtered invoices, leases, receipts, and shared balances.
            Managers can also record payments, expenses and owner positions.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/demos/property/demo.html"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90">
              <Smartphone className="h-5 w-5" aria-hidden /> Open mobile demo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link href="/contact"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:border-palm-green dark:border-gray-700 dark:text-gray-200">
              Discuss a similar system
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            No account required. All data is fictional and stays in this browser until reset.
          </p>
        </header>
        <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
          <Building2 className="h-9 w-9 text-palm-green" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">
            A preloaded rental portfolio
          </h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
            Explore two fictional properties, six rentable units, five active leases,
            ten current and historical invoices, and existing sample payments.
            One vacant unit is ready for a new lease.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            {['2 properties', '6 units', '5 tenants', 'Past & current invoices'].map(text => (
              <span key={text} className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">{text}</span>
            ))}
          </div>
        </aside>
      </div>

      <section className="mt-16" aria-labelledby="areas-title">
        <h2 id="areas-title" className="text-2xl font-bold text-gray-900 dark:text-white">
          Explore the mobile workspace
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
          Switch inside the phone between Property Manager and Tenant. Managers use Rent, Leases, Tenants and Portfolio; tenants use My rent, Payments and My lease. There is no separate Finance role or forced walkthrough.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {areas.map(({ name, icon: Icon, detail }) => (
            <article key={name} className="rounded-3xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-900/60">
              <Icon className="h-7 w-7 text-palm-green" aria-hidden />
              <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{name}</h3>
              <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-300">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <WalletCards className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Payments &amp; receipts</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
            Record rent already received by bank, cash or external M-Pesa, with partial payments,
            updated invoice balances, a fictional receipt and carried-forward tenant credit for overpayments.
          </p>
        </article>
        <article className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <ChartNoAxesCombined className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Expenses &amp; accounting</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
            View payment history, record fictional property expenses and inspect
            a simplified owner position. This concept does not include live collection gateways,
            communications, accounting journals or tax filings.
          </p>
        </article>
      </section>
      <div className="mt-12 flex flex-wrap items-center gap-4">
        <a href="/demos/property/demo.html"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90">
          Open the demo <ArrowRight className="h-5 w-5" aria-hidden />
        </a>
        <Link href="/demos"
          className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All demos
        </Link>
      </div>
    </main>
  );
}
