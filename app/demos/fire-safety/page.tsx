import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, MonitorPlay, RotateCcw, ShieldCheck, Smartphone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Fire Safety Operations Interactive Demo | Joeltech Geek Systems',
  description: 'Try a browser-only fire safety service management concept: customers, equipment, jobs, technician inspections, Grace's operations review, sample certificates and reminders.',
  alternates: { canonical: '/demos/fire-safety' },
  openGraph: { type: 'website', url: '/demos/fire-safety', title: 'Fire Safety Operations Demo | Joeltech Geek Systems', description: 'Explore a fictional interactive fire safety servicing concept without signing in.' },
};

export default function FireSafetyDemoPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-1 hover:text-palm-green"><ArrowLeft className="h-4 w-4" aria-hidden /> All demos</Link>
        <span aria-hidden="true">/</span><span>Fire safety</span>
      </nav>
      <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Interactive software concept</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">Fire Safety Ops</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">Explore a fire safety servicing workflow, from customer equipment and scheduled jobs to technician inspections, Grace's approval, sample certificates, and maintenance reminders.</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="/demos/fire-safety/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
              <MonitorPlay className="h-5 w-5" aria-hidden /> Launch interactive demo <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:border-palm-green hover:text-palm-green dark:border-gray-700 dark:text-gray-200">Discuss a similar system</Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">No account needed. Changes stay in your browser. Use “Reset sample” to start again.</p>
        </header>
        <aside aria-label="Demo summary" className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
          <ShieldCheck className="h-9 w-9 text-palm-green" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">See the full workflow</h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">Switch between two team roles, explore sample records, and see the results of passing or failed inspections.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Service jobs</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Mobile inspections</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Operations approval</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Sample PDF print</span>
          </div>
        </aside>
      </div>
      <section aria-labelledby="walkthrough-title" className="mt-16">
        <h2 id="walkthrough-title" className="text-2xl font-bold">Roles and service capabilities</h2>
        <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Use the role switcher at the top of the demo to switch between views.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/60">
            <BriefcaseBusiness className="h-7 w-7 text-palm-green" aria-hidden />
            <h3 className="mt-4 text-lg font-bold">Grace — Operations</h3>
            <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">Manage customers and equipment, assign service jobs, review technician inspections, approve passing reports, and preview maintenance reminders.</p>
          </article>
          <article className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/60">
            <Smartphone className="h-7 w-7 text-palm-green" aria-hidden />
            <h3 className="mt-4 text-lg font-bold">Kevin — Technician</h3>
            <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">Open an assigned job, complete five sample checks, and submit an inspection for review.</p>
          </article>
        </div>
      </section>
      <section className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <RotateCcw className="h-7 w-7 text-palm-green" aria-hidden /><h2 className="mt-4 text-xl font-bold">Also try the failure path</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">Reset the sample, submit a failed check with an explanation, and switch back to Grace for review. A failed inspection cannot produce a passing certificate.</p>
        </div>
        <div className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <ShieldCheck className="h-7 w-7 text-palm-green" aria-hidden /><h2 className="mt-4 text-xl font-bold">Independent concept, not a compliance system</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">All customers, equipment, inspections, and documents are fictional. Sample certificates are watermarked and not valid for compliance. No real messages are sent.</p>
        </div>
      </section>
      <div className="mt-12 flex flex-wrap gap-4">
        <a href="/demos/fire-safety/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white hover:opacity-90"><MonitorPlay className="h-5 w-5" aria-hidden /> Open the demo <ArrowRight className="h-4 w-4" aria-hidden /></a>
        <Link href="/demos" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden /> Back to demos</Link>
      </div>
    </main>
  );
}
