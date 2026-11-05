import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, BellRing, Building2, CalendarCheck2, ClipboardList,
  Clock3, FileText, MessageSquareMore, ShieldCheck, Smartphone
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security Operations & Client Portal Software Demo | JoelTechGeek Systems',
  description: 'Explore a mobile-first security management concept for duty rosters, staff attendance, site coverage, property owner reports and incident resolution.' ,
  alternates: { canonical: '/demos/security' },
  openGraph: {
    type: 'website',
    url: '/demos/security',
    title: 'Security Operations & Client Visibility | Interactive Demo',
    description: 'Two connected views for the security manager and property owner. Schedules, attendance, reports, and client issues.',
  },
};

const views = [
  {
    name: 'Property owner · Alex', Icon: Building2,
    heading: 'A clear daily record of your security service.',
    details: 'Choose any date to see the duty roster, attendance, site activities and linked evidence. Follow open and resolved issues, and read published daily, weekly or monthly reports.',
  },
  {
    name: 'Security manager · Grace', Icon: ClipboardList,
    heading: 'Coverage, clients and responses in one workspace.',
    details: 'Manage client properties, staff assignments, overnight shifts, site visits, attendance updates, issue resolutions and published service reports.',
  },
];

const capabilities = [
  { title: 'Duty schedules', desc: 'Browse any date, view overlapping night shifts and see who covered each post.', Icon: CalendarCheck2 },
  { title: 'Attendance clarity', desc: 'Separate scheduled, office-reported and supervisor-confirmed presence.', Icon: Clock3 },
  { title: 'Client issue tracking', desc: 'Allow property owners to raise concerns and follow the response to resolution.', Icon: MessageSquareMore },
  { title: 'Reports & updates', desc: 'Publish dated daily, weekly and monthly reports to the relevant client.', Icon: FileText },
];

export default function SecurityDemoPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-1 hover:text-palm-green"><ArrowLeft className="h-4 w-4" /> All demos</Link>
        <span aria-hidden="true">/</span><span>Security operations and client visibility</span>
      </nav>
      <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Private security · Connected service demo</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">Every property covered. Every client informed.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Manage guard deployments, shift schedules, attendance and client concerns in one system—and give property owners a clear view of the service they receive.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/demos/security/experience" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90">
              <Smartphone className="h-5 w-5" /> Launch interactive demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:border-palm-green dark:border-gray-700 dark:text-gray-200">
              Discuss a similar system
            </Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Fictional Kenyan sites, sample staff, and browser-local records. No real attendance tracking, messages or live emergency response.
          </p>
        </header>
        <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
          <ShieldCheck className="h-9 w-9 text-palm-green" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Security as a visible service</h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
            The property owner can see who is assigned, whether arrival was confirmed, which reports were published, and how a concern is being handled. The security firm keeps control of staff scheduling and responses.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white p-3 dark:bg-gray-900/70"><Clock3 className="mb-2 h-5 w-5 text-palm-green" /> Shifts & attendance</div>
            <div className="rounded-xl bg-white p-3 dark:bg-gray-900/70"><BellRing className="mb-2 h-5 w-5 text-palm-green" /> Client visibility</div>
            <div className="rounded-xl bg-white p-3 dark:bg-gray-900/70"><MessageSquareMore className="mb-2 h-5 w-5 text-palm-green" /> Site concerns</div>
            <div className="rounded-xl bg-white p-3 dark:bg-gray-900/70"><FileText className="mb-2 h-5 w-5 text-palm-green" /> Service reports</div>
          </div>
        </aside>
      </div>

      <section className="mt-16" aria-labelledby="views-title">
        <h2 id="views-title" className="text-2xl font-bold text-gray-900 dark:text-white">Two connected perspectives</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">Switch between the property owner and security manager. A roster change, site visit, issue update or report appears in the relevant client history.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {views.map(({ name, Icon, heading, details }) => (
            <article key={name} className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/60">
              <Icon className="h-8 w-8 text-palm-green" />
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-palm-green">{name}</p>
              <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{heading}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{details}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14" aria-labelledby="capabilities-title">
        <h2 id="capabilities-title" className="text-2xl font-bold text-gray-900 dark:text-white">What this platform helps you manage</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {capabilities.map(({ title, desc, Icon }) => <div key={title} className="rounded-3xl border border-gray-200 p-6 dark:border-gray-800">
            <Icon className="h-7 w-7 text-palm-green" />
            <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-300">{desc}</p>
          </div>)}
        </div>
      </section>

      <section className="mt-14 grid gap-6 rounded-3xl bg-gray-50 p-7 dark:bg-gray-900/70 sm:p-9 lg:grid-cols-[auto_1fr]">
        <Clock3 className="h-9 w-9 text-palm-green" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Multiple ways to confirm attendance.</h2>
          <p className="mt-3 leading-8 text-gray-600 dark:text-gray-300">
            Site staff can use guard check-ins where available, while office teams record telephone-reported arrivals and supervisors confirm attendance. The client sees how attendance was recorded. SMS, offline and guard-app integrations remain production options—not live features of this demo.
          </p>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <Link href="/demos/security/experience" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90">
          Try the two-role demo <ArrowRight className="h-5 w-5" />
        </Link>
        <Link href="/demos" className="inline-flex min-h-12 items-center gap-2 font-semibold text-palm-green hover:underline"><ArrowLeft className="h-4 w-4" /> All demos</Link>
      </div>
    </main>
  );
}
