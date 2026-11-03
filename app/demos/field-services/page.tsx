import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarCheck, ClipboardCheck, CreditCard, FileText, MonitorPlay, RotateCcw, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Field Service & Maintenance Software Interactive Demo | Joeltech Geek Systems',
  description: 'Try a fictional field-service software concept for customer requests, dispatch, technician checklists, spare parts, manager review, sample invoices and simulated payments.',
  alternates: { canonical: '/demos/field-services' },
  openGraph: {
    type: 'website',
    url: '/demos/field-services',
    title: 'Field Service & Maintenance Demo | Joeltech Geek Systems',
    description: 'Explore a realistic fictional maintenance workflow from a service request to an approved sample invoice.',
  },
};

const steps = [
  { icon: CalendarCheck, title: 'Grace — Dispatcher', body: 'Create a service request for a customer asset and schedule an assigned technician visit.' },
  { icon: Wrench, title: 'Daniel — Technician', body: 'Start the job, record used spare parts, complete four service checks and submit a service report.' },
  { icon: ClipboardCheck, title: 'Nia — Service Manager', body: 'Review the checks and approve passing work, or return attention items to the technician for correction.' },
  { icon: CreditCard, title: 'Amina — Billing', body: 'Create a fictional labour-and-parts invoice, then record a sample Cash or M-Pesa payment.' },
];

export default function FieldServicesDemoPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-1 hover:text-palm-green">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All demos
        </Link>
        <span aria-hidden="true">/</span><span>Field services</span>
      </nav>
      <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Maintenance &amp; field operations · Interactive concept</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">Northstar Field Services</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            See how a maintenance service company could coordinate work orders, customer equipment, technicians, spare parts, review, invoicing, and field reporting through one connected workflow.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="/demos/field-services/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
              <MonitorPlay className="h-5 w-5" aria-hidden /> Launch interactive demo <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:border-palm-green hover:text-palm-green dark:border-gray-700 dark:text-gray-200">
              Discuss a similar system
            </Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">No sign-in or backend. All activity uses fictional browser-local sample data.</p>
        </header>
        <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
          <Wrench className="h-9 w-9 text-palm-green" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">From service call to invoice</h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">A technician&apos;s service report and parts usage become reviewable operational records. Only manager-approved work is eligible for sample billing.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Customer assets</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Scheduled visits</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Service checklists</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Sample invoices</span>
          </div>
        </aside>
      </div>

      <section className="mt-16" aria-labelledby="walkthrough">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white" id="walkthrough">Field service roles and capabilities</h2>
        <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">
          Dispatchers, technicians, service managers and billing staff work with the same fictional service records and stock balances.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <article key={step.title} className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/60">
              <step.icon className="h-7 w-7 text-palm-green" aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{step.body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <FileText className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Approve or return for rework</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">Try marking a checklist item as needing attention. The manager cannot approve until the technician resubmits a passing report.</p>
        </div>
        <div className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <RotateCcw className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Fictional, local, and resettable</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">No real messages, work visits, equipment approvals, tax invoices or payment requests are generated. All data stays in this browser and can be reset.</p>
        </div>
      </section>
      <div className="mt-12 flex flex-wrap gap-4">
        <a href="/demos/field-services/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white hover:opacity-90">
          <MonitorPlay className="h-5 w-5" aria-hidden /> Open the demo <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
        <Link href="/demos" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to demos
        </Link>
      </div>
    <p className="mt-8 text-sm leading-7 text-gray-600 dark:text-gray-300">
      Looking to build something similar? This demo is a fictional concept; explore our <Link href="/services/react-native-app-development" className="font-semibold text-palm-green hover:underline">mobile app development</Link> service for real project requirements.
    </p>
    </main>
  );
}
