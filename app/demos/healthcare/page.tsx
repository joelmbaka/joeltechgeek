import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, MonitorPlay, HeartPulse, ClipboardPlus,
  UsersRound, Stethoscope, TestTube2, Pill, WalletCards, BedDouble
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hospital Management System (HMIS) Interactive Demo | JoelTechGeek Systems',
  description: 'Explore a fictional responsive HMIS with preloaded patients, OPD triage, consultation, laboratory, imaging, pharmacy, cash and insurance billing, and a read-only inpatient overview.',
  alternates: { canonical: '/demos/healthcare' },
  openGraph: {
    type: 'website',
    url: '/demos/healthcare',
    title: 'Hospital Operations | Interactive HMIS Web Demo',
    description: 'Six staff perspectives share fictional OPD encounters, clinical requests, results, pharmacy and billing in one responsive web application.',
  },
};

const teams = [
  {
    name: 'Reception',
    person: 'Grace',
    icon: UsersRound,
    details: 'Find an existing patient, start an OPD visit and check fictional insurance eligibility.',
  },
  {
    name: 'Nursing',
    person: 'Beatrice',
    icon: HeartPulse,
    details: 'Work through triage queues, record sample vital signs and hand encounters to doctors.',
  },
  {
    name: 'Doctor',
    person: 'Dr. Kamau',
    icon: Stethoscope,
    details: 'Document consultations, request tests or prescriptions, review updates and complete cleared OPD visits.',
  },
  {
    name: 'Diagnostics',
    person: 'James',
    icon: TestTube2,
    details: 'Use separate Laboratory and Imaging worklists to enter fictional results and complete orders.',
  },
  {
    name: 'Pharmacy',
    person: 'Mercy',
    icon: Pill,
    details: 'Review sample prescriptions, record dispensing and update the shared encounter.',
  },
  {
    name: 'Billing',
    person: 'David',
    icon: WalletCards,
    details: 'View service charges, simulated insurance coverage, cash and sample mobile-money payments, and clearance.',
  },
];

export default function HealthcareDemoPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-2 hover:text-palm-green">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All demos
        </Link>
        <span aria-hidden>/</span>
        <span>Hospital &amp; clinic operations</span>
      </nav>

      <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">
            Healthcare operations · Interactive web HMIS
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Hospital Operations
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Explore a fictional hospital management information system with one shared patient record:
            reception, OPD triage, doctor consultation, lab and imaging requests,
            pharmacy, and cash or insured billing. Switch between six staff accounts
            and navigate freely, without a step-by-step tour.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/demos/healthcare/demo.html"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green"
            >
              <MonitorPlay className="h-5 w-5" aria-hidden />
              Open HMIS web demo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:border-palm-green dark:border-gray-700 dark:text-gray-200"
            >
              Discuss a similar system
            </Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Optimized for desktop, tablet, and phone · No login or server required · Changes persist only in this browser.
          </p>
        </header>

        <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
          <ClipboardPlus className="h-9 w-9 text-palm-green" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">
            Start with realistic sample data
          </h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
            Nine fictional patients are already registered, with both cash and
            insured accounts. Seven OPD encounters are at different stages,
            and two inpatients are visible in a read-only ward census.
            Reception starts new visits for existing patients rather than registering people.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            {['9 patients', '7 OPD visits', '2 inpatients', '6 team roles'].map(item => (
              <span key={item} className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">{item}</span>
            ))}
          </div>
        </aside>
      </div>

      <section className="mt-16" aria-labelledby="teams-title">
        <h2 id="teams-title" className="text-2xl font-bold text-gray-900 dark:text-white">
          Six connected staff workspaces
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
          Select any staff member from the user dropdown. Each gets department worklists and
          authorized actions, while every change appears in the same encounter.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map(({ name, person, icon: Icon, details }) => (
            <article key={name} className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/60">
              <Icon className="h-7 w-7 text-palm-green" aria-hidden />
              <p className="mt-4 text-xs font-semibold text-palm-green">{person}</p>
              <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{name}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{details}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <HeartPulse className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Shared OPD encounter</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
            Open a fictional patient record to see triage, consultation notes, orders,
            sample results, prescriptions, financial status and a departmental activity timeline.
            Discharge becomes available after required handoffs and clearance are complete.
          </p>
        </article>
        <article className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <BedDouble className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Inpatient visibility, without extra complexity</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
            Two sample admitted patients show their assigned ward and bed.
            The interactive scope remains OPD; admissions, bed transfers and ward rounds are not implemented.
          </p>
        </article>
      </section>

      <section className="mt-12 rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">A safe, fictional product concept</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-600 dark:text-gray-300">
          This is a browser-local industry demonstration, not an operational medical record.
          It contains only invented patients, sample vitals, illustrative notes, non-clinical test results
          and fictional charges. It does not provide medical advice, use real patient data,
          verify insurance with a provider, send prescriptions, contact payment gateways, or transfer money.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-4">
        <a href="/demos/healthcare/demo.html"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white hover:opacity-90">
          Open the web demo <ArrowRight className="h-5 w-5" aria-hidden />
        </a>
        <Link href="/demos"
          className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All demos
        </Link>
      </div>
    </main>
  );
}
