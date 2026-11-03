import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BellRing, CircleAlert, MapPinned, MonitorCheck, Route, ShieldCheck, Smartphone, WifiOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Vehicle Tracking & Security Interactive Demo | JoelTechGeek Systems',
  description: 'Explore a fictional mobile GPS tracking concept with vehicle locations, route playback, geofence alerts, stale-position warnings and a connected monitoring desk.',
  alternates: { canonical: '/demos/vehicle-tracking' },
  openGraph: {
    type: 'website',
    url: '/demos/vehicle-tracking',
    title: 'Vehicle Tracking & Security | Interactive Software Demo',
    description: 'A browser-only vehicle tracking concept with two connected roles, simulated location data and customer support scenarios.',
  },
};

const roles = [
  {
    name: 'Vehicle Owner',
    Icon: Smartphone,
    description: 'Choose from three fictional vehicles, inspect an illustrated live-location screen, play a route, simulate anti-theft alerts, geofence exits and signal loss, and raise a sample support request.',
    areas: 'Track · Trips · Alerts · Help',
  },
  {
    name: 'Monitoring Desk',
    Icon: MonitorCheck,
    description: 'See the same connected and offline vehicles, inspect stale position warnings, acknowledge alerts and progress customer issues through a support queue.',
    areas: 'Fleet · Alerts · Requests',
  },
];

export default function VehicleTrackingDemoPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-1 hover:text-palm-green"><ArrowLeft className="h-4 w-4" aria-hidden /> All demos</Link>
        <span aria-hidden="true">/</span><span>Vehicle tracking &amp; security</span>
      </nav>
      <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Vehicle security · Interactive mobile concept</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">Vehicle Tracking &amp; Security</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            See what a transparent, responsive vehicle-tracking experience could look like. Follow a fictional vehicle on an illustrated map, replay its route, test a connectivity failure, and see how a monitoring desk responds.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/demos/vehicle-tracking/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
              <Smartphone className="h-5 w-5" aria-hidden /> Launch interactive demo <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:border-palm-green hover:text-palm-green dark:border-gray-700 dark:text-gray-200">Discuss a similar system</Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">
            No sign-in, no actual vehicles, and no real tracking service. Waypoint is a fictional concept with browser-local sample data.
          </p>
        </header>
        <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
          <ShieldCheck className="h-9 w-9 text-palm-green" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">Trust starts with clarity</h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
            A tracker that last reported 45 minutes ago should not be displayed as a current vehicle location. The sample experience keeps the last known point while clearly communicating that the present location is unknown.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            {['3 fictional vehicles', 'Route playback', 'Offline warnings', 'Two connected perspectives'].map(label => (
              <span key={label} className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">{label}</span>
            ))}
          </div>
        </aside>
      </div>
      <section className="mt-16" aria-labelledby="roles-title">
        <h2 id="roles-title" className="text-2xl font-bold text-gray-900 dark:text-white">Explore two connected perspectives</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">Switch roles in the app. Vehicle events and support requests immediately appear in the corresponding monitoring view.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {roles.map(({ name, Icon, description, areas }) => (
            <article key={name} className="rounded-3xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-900/60">
              <Icon className="h-8 w-8 text-palm-green" aria-hidden />
              <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{name}</h3>
              <p className="mt-2 text-xs font-semibold text-palm-green">{areas}</p>
              <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-12 grid gap-5 md:grid-cols-3">
        <article className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <MapPinned className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Locations &amp; playback</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">Inspect sample vehicle status and play through a predefined journey with changing sample positions, timestamps and speed readings.</p>
        </article>
        <article className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <BellRing className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Anti-theft &amp; security alerts</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">Preview unexpected ignition, disturbance/towing, device tampering, suspected interference and geofence exits in the owner alert feed and monitoring desk. All events are simulated.</p>
        </article>
        <article className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <WifiOff className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Connection failures</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">Watch a tracker lose signal without misrepresenting an old position as live. Raise a request and follow its simulated resolution.</p>
        </article>
      </section>
      <section className="mt-12 rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
        <div className="flex items-center gap-3"><CircleAlert className="h-7 w-7 text-palm-green" aria-hidden /><h2 className="text-xl font-bold text-gray-900 dark:text-white">Concept boundaries</h2></div>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-600 dark:text-gray-300">
          Waypoint is independent fictional software, not a Nebsam product or integration. All locations, GPS signals, routes, timestamps, anti-theft and connectivity alerts, and support records are simulated in your browser. Security events require compatible vehicle hardware and sensor integrations in any real deployment. The map is an illustration, not a live or geographically accurate mapping service. There is no vehicle immobilization, external API, remote command, payment, push alert, emergency response or actual location collection. A production system would require verified hardware and backend integrations, authorization, telemetry monitoring, and safety testing.
        </p>
      </section>
      <div className="mt-12 flex flex-wrap items-center gap-4">
        <a href="/demos/vehicle-tracking/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white hover:opacity-90"><Route className="h-5 w-5" aria-hidden /> Open the demo <ArrowRight className="h-4 w-4" aria-hidden /></a>
        <Link href="/demos" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden /> All demos</Link>
      </div>
    <p className="mt-8 text-sm leading-7 text-gray-600 dark:text-gray-300">
      Looking to build something similar? This demo is a fictional concept; explore our <Link href="/services/fastapi-backend-development" className="font-semibold text-palm-green hover:underline">backend API development</Link> service for real project requirements.
    </p>
    </main>
  );
}
