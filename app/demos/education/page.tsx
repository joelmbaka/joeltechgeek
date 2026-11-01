import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, MonitorPlay, GraduationCap, Receipt } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SchoolPey Interactive Demo | Joeltech Geek Systems',
  description: 'Explore how SchoolPey connects term invoicing, guardian payments, partial allocations, student credit, and receipts.',
  alternates: { canonical: '/demos/education' },
  openGraph: {
    type: 'website',
    url: '/demos/education',
    title: 'SchoolPey Interactive Concept | Joeltech Geek Systems',
    description: 'Explore how SchoolPey connects term invoicing, guardian payments, partial allocations, student credit, and receipts.',
  },
};

const steps = [
  {
    "role": "School Admin",
    "description": "Issue an invoice from a fictional tuition, activity and transport fee structure."
  },
  {
    "role": "Parent",
    "description": "Submit a simulated M-Pesa or bank payment against the student account."
  },
  {
    "role": "Finance Officer",
    "description": "Reconcile the pending payment to fees and preserve any overpayment as credit."
  },
  {
    "role": "Parent & Finance",
    "description": "Repeat with another amount to inspect partial payments, credits and receipts."
  }
];

export default function DemoOverviewPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-1 hover:text-palm-green"><ArrowLeft className="h-4 w-4" aria-hidden /> All demos</Link>
        <span aria-hidden="true">/</span><span>School fee management</span>
      </nav>
      <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">School fee management · Existing product concept</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">SchoolPey</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">Explore how SchoolPey connects term invoicing, guardian payments, partial allocations, student credit, and receipts.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/demos/education/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
              <MonitorPlay className="h-5 w-5" aria-hidden /> Launch interactive demo <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:border-palm-green hover:text-palm-green dark:border-gray-700 dark:text-gray-200">Discuss a similar system</Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">No account or backend needed. Sample changes remain in your browser until reset.</p>
        </header>
        <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
          <GraduationCap className="h-9 w-9 text-palm-green" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">See the operational handoffs</h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">Generate a school-term invoice, record simulated parent payments, reconcile balances, and preserve overpayment credit.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Real product inspiration</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Simulated team roles</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Fictional records</span>
          </div>
        </aside>
      </div>
      <section aria-labelledby="walkthrough" className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white" id="walkthrough">A guided workflow in four steps</h2>
        <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Switch staff perspectives inside the demo to complete the operations in order.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step.role + index} className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/60">
              <span className="text-sm font-extrabold text-palm-green">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{step.role}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{step.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-12 rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
        <Receipt className="h-7 w-7 text-palm-green" aria-hidden />
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">What this demo does and doesn&apos;t do</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-600 dark:text-gray-300">SchoolPey focuses on fee finance. This concept intentionally excludes exams, attendance and general school ERP modules.</p>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-600 dark:text-gray-300">
          The interactive workspace is deliberately minimal. It does not connect to production services, access customer data, send messages or process payments.
        </p>
      </section>
      <div className="mt-12 flex flex-wrap gap-4">
        <a href="/demos/education/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white hover:opacity-90">
          <MonitorPlay className="h-5 w-5" aria-hidden /> Open the demo <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
        <Link href="/demos" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden /> Back to demos</Link>
      </div>
    </main>
  );
}
