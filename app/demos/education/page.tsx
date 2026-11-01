import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, GraduationCap, Receipt, Smartphone, Users, Wallet, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'School Fee Management Interactive Demo | JoelTechGeek Systems',
  description: 'Explore parent fees for three children in different grades, current and previous invoices, configured add-ons, simulated M-Pesa checkout, and live Finance updates.',
  alternates: { canonical: '/demos/education' },
  openGraph: {
    type: 'website',
    url: '/demos/education',
    title: 'School Fee Management | Interactive Parent & Finance Demo',
    description: 'Explore one existing fictional school, three children, invoices and simulated payments that update Finance immediately.',
  },
};

const roles = [
  {
    label: 'Parent · Mary',
    icon: Smartphone,
    tabs: 'Fees · Payments · Children',
    detail: 'Three children across Grade 2, Grade 5 and Grade 8. Explore their current and past invoices, inspect fee breakdowns and add-ons, and pay any open balance using a simulated M-Pesa checkout.',
  },
  {
    label: 'Finance · David',
    icon: Wallet,
    tabs: 'Overview · Invoices · Payments · Students',
    detail: 'Inspect school-wide invoiced totals, collections and balances, look up six enrolled students, see read-only grade fee plans and add-ons, and view immediately reconciled sample parent payments.',
  },
];

export default function SchoolFinanceDemoPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-2 hover:text-palm-green">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All demos
        </Link>
        <span aria-hidden>/</span>
        <span>School fee management</span>
      </nav>

      <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">
            School finance · Interactive mobile concept
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            School Fee Management
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            A parent with three children in one fictional school. Existing grade fees, optional add-ons,
            current and previous invoices, and a simulated payment that updates Finance immediately.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/demos/education/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90">
              <Smartphone className="h-5 w-5" aria-hidden /> Open mobile demo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:border-palm-green dark:border-gray-700 dark:text-gray-200">
              Discuss a similar system
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            No sign-in or setup. Parent and Finance share the same browser-local sample records.
          </p>
        </header>
        <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
          <GraduationCap className="h-9 w-9 text-palm-green" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">
            School and fees already configured
          </h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
            A fictional school has Grade 2, Grade 5 and Grade 8 fee structures,
            with lunch, transport and examination add-ons. The demo opens with six students
            and nine issued invoices, including partially paid and settled records.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            {['3 linked children', '6 students', '9 invoices', 'Preconfigured add-ons'].map(item => (
              <span key={item} className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">{item}</span>
            ))}
          </div>
        </aside>
      </div>

      <section className="mt-16" aria-labelledby="roles-title">
        <h2 id="roles-title" className="text-2xl font-bold text-gray-900 dark:text-white">Explore two connected perspectives</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
          Move freely between Parent and Finance. There are no school creation,
          fee-structure creation or administration screens.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {roles.map(({ label, icon: Icon, tabs, detail }) => (
            <article key={label} className="rounded-3xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-900/60">
              <Icon className="h-8 w-8 text-palm-green" aria-hidden />
              <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{label}</h3>
              <p className="mt-2 text-xs font-semibold text-palm-green">{tabs}</p>
              <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <Receipt className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Partial or full payment</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
            The sample Safaricom number is 0722000011 and the invoice balance is prefilled.
            Enter a smaller whole-shilling amount to leave an outstanding balance,
            or pay the balance to settle the invoice and view a sample receipt.
          </p>
        </article>
        <article className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <Users className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Shared financial records</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
            Every simulated payment creates a fictional reconciled ledger record
            and immediately updates the corresponding invoice and Finance dashboard.
            The example does not contact M-Pesa, send an STK prompt or move money.
          </p>
        </article>
      </section>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <a href="/demos/education/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90">
          Open the demo <ArrowRight className="h-5 w-5" aria-hidden />
        </a>
        <Link href="/demos" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All demos
        </Link>
      </div>
    </main>
  );
}
