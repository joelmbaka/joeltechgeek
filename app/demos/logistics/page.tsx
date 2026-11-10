import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, MonitorPlay, Truck, PackageCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cargo Dispatch Interactive Demo | Joeltech Geek Systems',
  description: 'Explore a mobile-style cargo dispatch system for posting and assigning loads, monitoring trip progress, documenting delivery, and viewing fictional truck telemetry.',
  alternates: { canonical: '/demos/logistics' },
  openGraph: {
    type: 'website',
    url: '/demos/logistics',
    title: 'Cargo Dispatch Interactive Concept | Joeltech Geek Systems',
    description: 'Explore a mobile-style cargo dispatch system for posting loads, accepting driver bookings, monitoring trip status, documenting delivery, and tracking simulated truck location and mileage.',
  },
};

const steps = [
  {
    "role": "Dispatcher",
    "description": "Post, edit, assign and delete open loads, set driver pay and inspect sample truck telemetry."
  },
  {
    "role": "Driver",
    "description": "See only assigned loads, update trip milestones and review completed trips."
  },
  {
    "role": "Delivery",
    "description": "Mark loads picked up, in transit and delivered, with visible placeholders for pickup photos and delivery notes."
  },
  {
    "role": "Dispatcher",
    "description": "Mark a container returned to port with an EIR placeholder, then record simulated driver payment."
  }
];

export default function DemoOverviewPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-1 hover:text-palm-green"><ArrowLeft className="h-4 w-4" aria-hidden /> All demos</Link>
        <span aria-hidden="true">/</span><span>Logistics & transport</span>
      </nav>
      <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Logistics & transport · Interactive workflow concept</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">Cargo Dispatch</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">Explore a mobile-style cargo dispatch system for posting loads, accepting driver bookings, monitoring trip status, documenting delivery, and tracking simulated truck location and mileage.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/demos/logistics/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
              <MonitorPlay className="h-5 w-5" aria-hidden /> Launch interactive demo <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:border-palm-green hover:text-palm-green dark:border-gray-700 dark:text-gray-200">Discuss a similar system</Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">No account or backend needed. Sample changes remain in your browser until reset.</p>
        </header>
        <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
          <Truck className="h-9 w-9 text-palm-green" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">See the operational handoffs</h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">Grace manages loads, driver assignments and payments. Kevin sees only his assigned loads, trip updates and completion history.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Industry workflow demo</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Simulated team roles</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Fictional records</span>
          </div>
        </aside>
      </div>
      <section aria-labelledby="walkthrough" className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white" id="walkthrough">Capabilities by team</h2>
        <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Switch staff perspectives to manage the same fictional business records through their regular workspaces.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step.role + index} className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/60">
              
              <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{step.role}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{step.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-12 rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
        <PackageCheck className="h-7 w-7 text-palm-green" aria-hidden />
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">What this demo does and doesn&apos;t do</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-600 dark:text-gray-300">This mobile-style demo shows fictional load dispatch, driver pay, sample 2D tracking, speed, fuel-level snapshots, and delivery document placeholders. No live GPS or real files are used.</p>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-600 dark:text-gray-300">
          The interactive workspace is deliberately minimal. It does not connect to production services, access customer data, send messages or process payments.
        </p>
      </section>
      <div className="mt-12 flex flex-wrap gap-4">
        <a href="/demos/logistics/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white hover:opacity-90">
          <MonitorPlay className="h-5 w-5" aria-hidden /> Open the demo <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
        <Link href="/demos" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden /> Back to demos</Link>
      </div>
    <p className="mt-8 text-sm leading-7 text-gray-600 dark:text-gray-300">
      Looking to build something similar? This demo is a fictional concept; explore our <Link href="/services/web-app-development" className="font-semibold text-palm-green hover:underline">custom operations dashboards</Link> service for real project requirements.
    </p>
    </main>
  );
}
