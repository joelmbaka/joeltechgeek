import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ClipboardList, Wrench, PackageCheck, Receipt, BadgeCheck, CarFront } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Garage Management System Interactive Demo | JoelTechGeek Systems',
  description: 'Explore a fictional web-based garage management workflow for repair tickets, inspections, parts requirements, inventory issues, customer approval, invoicing and payments.',
  alternates: { canonical: '/demos/garage' },
  openGraph: {
    type: 'website',
    url: '/demos/garage',
    title: 'Garage Management System | Interactive Software Demo',
    description: 'A browser-only garage operations concept with tickets, inventory, service records and sample finance.',
  },
};

const features = [
  {
    title: 'Repair tickets & approvals',
    Icon: ClipboardList,
    description: 'Open a ticket, record diagnosis, prepare an estimate, capture a decision and manage repairs or early release.',
  },
  {
    title: 'Requirements vs. actual stock issues',
    Icon: PackageCheck,
    description: 'Give customers an informational parts list. Select items for a ticket cart, confirm physical issues and record unused returns separately.',
  },
  {
    title: 'Billing & workshop reports',
    Icon: Receipt,
    description: 'Record custom services, issue parts and payment receipts, review collections and estimate gross contribution before operating costs.',
  },
];

export default function GarageDemoPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-1 hover:text-palm-green"><ArrowLeft className="h-4 w-4" aria-hidden /> All demos</Link>
        <span aria-hidden="true">/</span><span>Garage management</span>
      </nav>

      <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Automotive service · Desktop web concept</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">Garage Management System</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Follow a vehicle from reception to diagnosis, repair authorization, parts issue, billing and release.
            See how a garage can manage workshop jobs and stock without confusing requested parts with items actually sold.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/demos/garage/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
              <Wrench className="h-5 w-5" aria-hidden /> Launch interactive demo <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:border-palm-green hover:text-palm-green dark:border-gray-700 dark:text-gray-200">
              Discuss a similar system
            </Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">
            No account required. This desktop-oriented browser demo uses fictional records and saves your changes locally until you reset them.
          </p>
        </header>
        <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
          <CarFront className="h-9 w-9 text-palm-green" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">One ticket, complete history</h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
            Every job brings together the customer, vehicle, diagnosis, authorization, services, inventory consumption and payments.
            Explore sample tickets at different stages or open a new one.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            {['Single front desk', 'Stock issue & returns', 'Printable documents', 'Browser-local data'].map(label => (
              <span key={label} className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">{label}</span>
            ))}
          </div>
        </aside>
      </div>

      <section className="mt-16" aria-labelledby="garage-features">
        <h2 id="garage-features" className="text-2xl font-bold text-gray-900 dark:text-white">Explore the workshop workflow</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
          Use the six web navigation sections: Dashboard, Tickets, Appointments, Customers &amp; Vehicles, Inventory and Reports.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {features.map(({ title, Icon, description }) => (
            <article key={title} className="rounded-3xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-900/60">
              <Icon className="h-8 w-8 text-palm-green" aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
        <div className="flex items-center gap-3"><BadgeCheck className="h-7 w-7 text-palm-green" aria-hidden /><h2 className="text-xl font-bold text-gray-900 dark:text-white">What this demo does and does not do</h2></div>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-600 dark:text-gray-300">
          Summit Auto Service is a fictional Nairobi workshop. All vehicles, customer records, prices, approvals, messages and payments are illustrative.
          Requirements documents do not reserve stock; only confirmed issues deduct quantity. WhatsApp sharing prepares a message but never sends it automatically.
          There is no database, real payment gateway, customer notification delivery, technician scheduling or supplier integration.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <a href="/demos/garage/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white hover:opacity-90">
          <Wrench className="h-5 w-5" aria-hidden /> Open garage workspace <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
        <Link href="/demos" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All demos
        </Link>
      </div>
    </main>
  );
}
