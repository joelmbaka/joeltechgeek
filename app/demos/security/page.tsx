import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, ShieldCheck, MapPin, Camera,
  Siren, ClipboardCheck, Smartphone, Users, Radio, Route,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security Guard Operations Interactive Mobile Demo | JoelTechGeek Systems',
  description: 'Explore a fictional Kenya security guard mobile app with GPS-verified shifts, patrol checkpoints, sample camera evidence, SOS alerts, supervisor response and deployment reports.',
  alternates: { canonical: '/demos/security' },
  openGraph: {
    type: 'website',
    url: '/demos/security',
    title: 'Guard Operations | Security Firm Mobile App Demo',
    description: 'Three connected guard, supervisor and operations-manager workspaces for fictional Kenyan client sites.',
  },
};

const roles = [
  {
    name: 'Kevin · Security Guard',
    icon: MapPin,
    description: 'Verify a sample GPS check-in at Westlands, complete patrol checkpoints, add simulated camera evidence, report an incident, raise SOS and hand over the shift.',
  },
  {
    name: 'Beatrice · Site Supervisor',
    icon: Radio,
    description: 'Monitor guards and sites, acknowledge emergency alerts, record response actions, resolve incidents and inspect the digital occurrence book.',
  },
  {
    name: 'Grace · Operations Manager',
    icon: Users,
    description: 'Review site coverage and patrol performance, reassign an unstarted shift, inspect incidents and view a simple client proof-of-service report.',
  },
];

const capabilities = [
  {
    name: 'GPS-verified attendance',
    icon: MapPin,
    description: 'Demonstrate within-geofence, outside-geofence and low-accuracy location results, without requesting your device location.',
  },
  {
    name: 'Patrols and camera evidence',
    icon: Camera,
    description: 'Verify sequential checkpoints and attach fictional image placeholders to a patrol or incident. No actual camera access or upload.',
  },
  {
    name: 'Emergency response',
    icon: Siren,
    description: 'Raise an immediate simulated SOS without requiring a photo. The supervisor can acknowledge, document a response and resolve the alert.',
  },
  {
    name: 'Handover and reporting',
    icon: ClipboardCheck,
    description: 'Record handover notes, view missed checkpoints and outstanding incidents, check out and review a daily operational summary.',
  },
];

export default function SecurityDemoPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-2 hover:text-palm-green">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All demos
        </Link>
        <span aria-hidden>/</span><span>Security guard operations</span>
      </nav>

      <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">
            Private security · Interactive mobile concept
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Guard Operations
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Explore how a Kenyan security company could supervise guard deployment,
            verify attendance and patrols, document incidents, and coordinate emergency
            responses—all from one mobile app shared across three roles.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/demos/security/demo.html"
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
            No sign-in. Fictional data, stored in your browser until reset. GPS, camera and SOS are simulations only.
          </p>
        </header>

        <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
          <ShieldCheck className="h-9 w-9 text-palm-green" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">A prepared security company</h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
            Four fictional client sites across Westlands, Karen, Industrial Area and Kilimani
            are preloaded with assigned guards, shifts, patrol checkpoints, existing incidents
            and a relief guard available for a missed deployment.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            {['4 sites', '5 guard records', '3 roles', 'Shift & incident records'].map(text => (
              <span key={text} className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">{text}</span>
            ))}
          </div>
        </aside>
      </div>

      <section className="mt-16" aria-labelledby="security-roles">
        <h2 id="security-roles" className="text-2xl font-bold text-gray-900 dark:text-white">Three connected mobile roles</h2>
        <p className="mt-3 max-w-3xl leading-7 text-gray-600 dark:text-gray-300">
          Choose a user from the selector inside the phone. Workflows are freely navigable,
          with shared activity and role-specific actions.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {roles.map(({ name, description, icon: Icon }) => (
            <article key={name} className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/60">
              <Icon className="h-7 w-7 text-palm-green" aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{name}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14" aria-labelledby="security-features">
        <h2 id="security-features" className="text-2xl font-bold text-gray-900 dark:text-white">Connected workflows worth demonstrating</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {capabilities.map(({ name, description, icon: Icon }) => (
            <article key={name} className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
              <Icon className="h-7 w-7 text-palm-green" aria-hidden />
              <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{name}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Route className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Designed as a safe product concept</h2>
        </div>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-600 dark:text-gray-300">
          This demo is not a live guard-monitoring or emergency-response service.
          It never requests actual GPS coordinates or camera permissions, sends distress
          messages, stores real photos, or connects to a backend. Its fictional records
          illustrate potential workflows, not evidence of actual guards or client operations.
          A production app would require explicit monitoring notices, role authorization,
          protected evidence, offline support and reliable emergency escalation.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <a href="/demos/security/demo.html"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white hover:opacity-90">
          Open the mobile demo <ArrowRight className="h-5 w-5" aria-hidden />
        </a>
        <Link href="/demos" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All demos
        </Link>
      </div>
    <p className="mt-8 text-sm leading-7 text-gray-600 dark:text-gray-300">
      Looking to build something similar? This demo is a fictional concept; explore our <Link href="/services/react-native-app-development" className="font-semibold text-palm-green hover:underline">React Native mobile app development</Link> service for real project requirements.
    </p>
    </main>
  );
}
