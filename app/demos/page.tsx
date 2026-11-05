import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, ClipboardCheck, ShoppingCart, PackageCheck, TrendingUp, CreditCard, HardHat, Boxes, ClipboardList, Wrench, CalendarCheck, FileCheck2, Truck, GraduationCap, Receipt, Building2, WalletCards, HeartPulse, ClipboardPlus, Pizza, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Interactive Software Demos | Joeltech Geek Systems',
  description: 'Explore eleven interactive business software concepts, including vehicle tracking and security operations with a property-owner portal, field services, logistics, school finance, rent management, healthcare, fire safety, construction and retail.',
  alternates: { canonical: '/demos' },
  openGraph: { type: 'website', url: '/demos', title: 'Interactive Software Demos | Joeltech Geek Systems', description: 'Explore eleven industry software concepts with fictional data and interactive business workflows.' },
};

export default function DemosPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-9 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-palm-green">Home</Link> <span aria-hidden="true">/</span> Interactive demos
      </nav>
      <header className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Interactive software demos</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">Don&apos;t just imagine it. Explore how it could work.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
          Explore interactive examples of business software, with realistic fictional records and working sample workflows. These are concepts, not live customer deployments.
        </p>
      </header>
      <section aria-labelledby="available-demos" className="mt-12">
        <h2 id="available-demos" className="text-2xl font-bold text-gray-900 dark:text-white">Available demos</h2>
        <article className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col p-7 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-palm-green dark:bg-emerald-950/40"><MapPin className="h-6 w-6" aria-hidden /></span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Vehicle security · Mobile app concept</span>
              </div>
              <h3 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Vehicle Tracking &amp; Security</h3>
              <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Follow fictional vehicles on an illustrated map, replay trips, simulate tracker signal loss and geofence alerts, and handle customer requests from a connected monitoring desk.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Vehicle Owner / Monitoring Desk</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Simulated GPS &amp; alerts</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">No live tracking</span>
              </div>
              <Link href="/demos/vehicle-tracking" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
                Explore vehicle tracking demo <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <div className="flex min-h-72 flex-col justify-center bg-gradient-to-br from-[#0A2836] via-[#164454] to-[#047857] p-7 text-white sm:p-10">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-4">
                  <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-300" aria-hidden /><span className="font-semibold">Waypoint · Tracking overview</span></div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">Fictional concept</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4"><MapPin className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Track &amp; replay</p><p className="mt-1 text-xs text-white/70">Trip history and freshness</p></div>
                  <div className="rounded-xl bg-white/10 p-4"><ShieldCheck className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Alerts &amp; support</p><p className="mt-1 text-xs text-white/70">Connected monitoring desk</p></div>
                </div>
                <p className="mt-5 text-xs leading-6 text-white/80">No tracker devices, APIs, notifications or real vehicle security commands are connected.</p>
              </div>
            </div>
          </div>
        </article>

        <article className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col p-7 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-palm-green dark:bg-emerald-950/40"><Pizza className="h-6 w-6" aria-hidden /></span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Restaurant &amp; delivery · Interactive concept</span>
              </div>
              <h3 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Restaurant Ordering &amp; Delivery</h3>
              <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Choose a pizza size, pin your delivery location for a sample distance-based fee, simulate M-Pesa checkout, then switch to Operations and mark the en-route order delivered.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Customer / Operations</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Illustrative delivery map</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">No real payments</span>
              </div>
              <Link href="/demos/restaurant" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
                Explore restaurant demo <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <div className="flex min-h-72 flex-col justify-center bg-gradient-to-br from-[#0A2836] via-[#164454] to-[#047857] p-7 text-white sm:p-10">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-4">
                  <div className="flex items-center gap-2"><Pizza className="h-5 w-5 text-emerald-300" aria-hidden /><span className="font-semibold">Direct ordering flow</span></div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">Fictional concept</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4"><MapPin className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Pin &amp; fee</p><p className="mt-1 text-xs text-white/70">Illustrative branch routing</p></div>
                  <div className="rounded-xl bg-white/10 p-4"><ShoppingCart className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Order &amp; track</p><p className="mt-1 text-xs text-white/70">Simulated M-Pesa checkout</p></div>
                </div>
                <p className="mt-5 text-xs leading-6 text-white/80">Customer and restaurant views share browser-local menu availability and order status.</p>
              </div>
            </div>
          </div>
        </article>

        <article className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col p-7 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-palm-green dark:bg-emerald-950/40"><ShieldCheck className="h-6 w-6" aria-hidden /></span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Fire safety · Concept</span>
              </div>
              <h3 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Fire Safety Ops</h3>
              <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Follow a service job from customer equipment registration through Kevin&apos;s inspection, Grace&apos;s approval, and a sample certificate.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">No sign-in</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Browser-local data</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">2 simulated roles</span>
              </div>
              <Link href="/demos/fire-safety" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
                Explore fire safety demo <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <div className="flex min-h-72 flex-col justify-center bg-gradient-to-br from-[#0A2836] via-[#164454] to-[#047857] p-7 text-white sm:p-10">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-4">
                  <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden /><span className="font-semibold">Service overview</span></div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">Illustrative preview</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4"><ClipboardCheck className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Service jobs</p><p className="mt-1 text-xs text-white/70">Schedule and assign</p></div>
                  <div className="rounded-xl bg-white/10 p-4"><ShieldCheck className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Inspections</p><p className="mt-1 text-xs text-white/70">Review and approve</p></div>
                </div>
                <p className="mt-5 text-xs leading-6 text-white/80">The actual demo includes customers, equipment, mobile technician screens, and sample reports.</p>
              </div>
            </div>
          </div>
        </article>


        <article className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col p-7 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-palm-green dark:bg-emerald-950/40">
                  <ShieldCheck className="h-6 w-6" aria-hidden />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Private security · Client service concept</span>
              </div>
              <h3 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Security Operations &amp; Client Visibility</h3>
              <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">
                Explore connected shift schedules, attendance confirmations, property-owner updates,
                client-raised concerns and security company responses.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">2 connected roles</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">3 sample client sites</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Client portal & rosters</span>
              </div>
              <Link href="/demos/security" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
                Explore security demo <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <div className="flex min-h-72 flex-col justify-center bg-gradient-to-br from-[#0A2836] via-[#164454] to-[#047857] p-7 text-white sm:p-10">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-4">
                  <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden /><span className="font-semibold">Security company & client service</span></div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">Concept preview</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4"><ShieldCheck className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Shifts & attendance</p><p className="mt-1 text-xs text-white/70">Coverage & confirmation</p></div>
                  <div className="rounded-xl bg-white/10 p-4"><ClipboardCheck className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Client issues</p><p className="mt-1 text-xs text-white/70">Reports & resolution</p></div>
                </div>
                <p className="mt-5 text-xs leading-6 text-white/80">Fictional security sites, guards and client records—no live monitoring.</p>
              </div>
            </div>
          </div>
        </article>

        <article className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col p-7 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-palm-green dark:bg-emerald-950/40"><ShoppingCart className="h-6 w-6" aria-hidden /></span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Retail &amp; wholesale · Concept</span>
              </div>
              <h3 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">GreenBasket Retail</h3>
              <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Manage products and suppliers, receive stock, process a sample checkout, and watch receipts and reports update in a connected point-of-sale workflow.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Owner / cashier / stockkeeper</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Simulated payments</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">No sign-in</span>
              </div>
              <Link href="/demos/retail" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
                Explore retail demo <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <div className="flex min-h-72 flex-col justify-center bg-gradient-to-br from-[#0A2836] via-[#164454] to-[#047857] p-7 text-white sm:p-10">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-4">
                  <div className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-emerald-300" aria-hidden /><span className="font-semibold">Retail workspace</span></div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">Concept preview</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4"><PackageCheck className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Inventory</p><p className="mt-1 text-xs text-white/70">Receive &amp; track stock</p></div>
                  <div className="rounded-xl bg-white/10 p-4"><CreditCard className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Point of sale</p><p className="mt-1 text-xs text-white/70">Checkout &amp; receipts</p></div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-emerald-100"><TrendingUp className="h-4 w-4" aria-hidden /> Reports respond to every sample transaction</div>
              </div>
            </div>
          </div>
        </article>

        <article className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col p-7 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-palm-green dark:bg-emerald-950/40"><HardHat className="h-6 w-6" aria-hidden /></span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Construction &amp; site operations · Concept</span>
              </div>
              <h3 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">SiteFlow Construction</h3>
              <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Explore a realistic site workflow: Supervisor work and progress approvals, Stockkeeper requests and receiving, Accountant purchase orders and supplier payments, and Project Manager reviews.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">4 simulated roles</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Material approvals</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">No sign-in</span>
              </div>
              <Link href="/demos/construction" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
                Explore construction demo <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <div className="flex min-h-72 flex-col justify-center bg-gradient-to-br from-[#0A2836] via-[#164454] to-[#047857] p-7 text-white sm:p-10">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-4">
                  <div className="flex items-center gap-2"><HardHat className="h-5 w-5 text-emerald-300" aria-hidden /><span className="font-semibold">Site project workspace</span></div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">Illustrative preview</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4"><ClipboardList className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Site tasks</p><p className="mt-1 text-xs text-white/70">Work progress &amp; updates</p></div>
                  <div className="rounded-xl bg-white/10 p-4"><Boxes className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Project materials</p><p className="mt-1 text-xs text-white/70">Requests, issues &amp; receipts</p></div>
                </div>
                <p className="mt-4 text-xs leading-6 text-white/80">Approved stock issues and site expenses update the same project budget overview.</p>
              </div>
            </div>
          </div>
        </article>

        <article className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col p-7 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-palm-green dark:bg-emerald-950/40"><Wrench className="h-6 w-6" aria-hidden /></span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Field services &amp; maintenance · Concept</span>
              </div>
              <h3 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Northstar Field Services</h3>
              <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Track a maintenance request through technician assignment, on-site checks, spare-parts usage, manager approval, and a simulated customer invoice.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">4 simulated roles</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Work orders &amp; approvals</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">No sign-in</span>
              </div>
              <Link href="/demos/field-services" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
                Explore field service demo <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <div className="flex min-h-72 flex-col justify-center bg-gradient-to-br from-[#0A2836] via-[#164454] to-[#047857] p-7 text-white sm:p-10">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-4">
                  <div className="flex items-center gap-2"><Wrench className="h-5 w-5 text-emerald-300" aria-hidden /><span className="font-semibold">Maintenance workspace</span></div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">Concept preview</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4"><CalendarCheck className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Dispatch &amp; visits</p><p className="mt-1 text-xs text-white/70">Schedule a technician</p></div>
                  <div className="rounded-xl bg-white/10 p-4"><FileCheck2 className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Service reports</p><p className="mt-1 text-xs text-white/70">Checklists &amp; review</p></div>
                </div>
                <p className="mt-5 text-xs leading-6 text-white/80">A reviewed service visit can flow into an illustrative invoice and payment record.</p>
              </div>
            </div>
          </div>
        </article>

        <article className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col p-7 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-palm-green dark:bg-emerald-950/40"><Truck className="h-6 w-6" aria-hidden /></span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Logistics & transport · Concept</span>
              </div>
              <h3 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Cargo Dispatch</h3>
              <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Post a cargo load, let a driver request it, approve dispatch, then record delivery references and close the trip.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Interactive workflow</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Browser-local data</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">No sign-in</span>
              </div>
              <Link href="/demos/logistics" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
                Explore logistics demo <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <div className="flex min-h-72 flex-col justify-center bg-gradient-to-br from-[#0A2836] via-[#164454] to-[#047857] p-7 text-white sm:p-10">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-4">
                  <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-emerald-300" aria-hidden /><span className="font-semibold">Cargo Dispatch workflow</span></div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">Concept preview</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4"><Truck className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Load board & driver bookings</p></div>
                  <div className="rounded-xl bg-white/10 p-4"><PackageCheck className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Dispatch & proof of delivery</p></div>
                </div>
                <p className="mt-5 text-xs leading-6 text-white/80">Interactive workflow with fictional records and no backend connection.</p>
              </div>
            </div>
          </div>
        </article>


        <article className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col p-7 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-palm-green dark:bg-emerald-950/40"><GraduationCap className="h-6 w-6" aria-hidden /></span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">School fee management · Concept</span>
              </div>
              <h3 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">School Fee Management</h3>
              <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Explore three children across Grades 2, 5 and 8, existing term invoices and add-ons, and a simulated parent M-Pesa checkout that immediately updates school Finance.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Interactive workflow</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Browser-local data</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">No sign-in</span>
              </div>
              <Link href="/demos/education" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
                Explore school finance demo <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <div className="flex min-h-72 flex-col justify-center bg-gradient-to-br from-[#0A2836] via-[#164454] to-[#047857] p-7 text-white sm:p-10">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-4">
                  <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-emerald-300" aria-hidden /><span className="font-semibold">Parent & Finance · School Fee Management</span></div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">Concept preview</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4"><GraduationCap className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Term fees & parent payments</p></div>
                  <div className="rounded-xl bg-white/10 p-4"><Receipt className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Reconciliation & receipts</p></div>
                </div>
                <p className="mt-5 text-xs leading-6 text-white/80">Interactive workflow with fictional records and no backend connection.</p>
              </div>
            </div>
          </div>
        </article>


        <article className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col p-7 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-palm-green dark:bg-emerald-950/40"><Building2 className="h-6 w-6" aria-hidden /></span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Property & rent management · Concept</span>
              </div>
              <h3 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Rental Management</h3>
              <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Explore Property Manager and Tenant mobile views, with tenant-filtered invoices, rent receipts, leases, collections, expenses and owner positions.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Interactive workflow</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Browser-local data</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">No sign-in</span>
              </div>
              <Link href="/demos/property" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
                Explore property demo <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <div className="flex min-h-72 flex-col justify-center bg-gradient-to-br from-[#0A2836] via-[#164454] to-[#047857] p-7 text-white sm:p-10">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-4">
                  <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-emerald-300" aria-hidden /><span className="font-semibold">Rental Management workflow</span></div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">Concept preview</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4"><Building2 className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Lease-linked rent invoicing</p></div>
                  <div className="rounded-xl bg-white/10 p-4"><WalletCards className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Collections & owner statements</p></div>
                </div>
                <p className="mt-5 text-xs leading-6 text-white/80">Interactive workflow with fictional records and no backend connection.</p>
              </div>
            </div>
          </div>
        </article>


        <article className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col p-7 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-palm-green dark:bg-emerald-950/40"><HeartPulse className="h-6 w-6" aria-hidden /></span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Hospital &amp; clinic operations · HMIS web app</span>
              </div>
              <h3 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Hospital Operations</h3>
              <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Explore a responsive HMIS with preloaded cash and insured patients, six staff roles, OPD encounters, triage, diagnostics, pharmacy, billing, and read-only inpatient beds.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Interactive workflow</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Browser-local data</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">No sign-in</span>
              </div>
              <Link href="/demos/healthcare" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
                Explore healthcare demo <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <div className="flex min-h-72 flex-col justify-center bg-gradient-to-br from-[#0A2836] via-[#164454] to-[#047857] p-7 text-white sm:p-10">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-4">
                  <div className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-emerald-300" aria-hidden /><span className="font-semibold">Hospital Operations HMIS</span></div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">Concept preview</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4"><HeartPulse className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">OPD, lab, pharmacy & billing</p></div>
                  <div className="rounded-xl bg-white/10 p-4"><ClipboardPlus className="h-5 w-5 text-emerald-200" aria-hidden /><p className="mt-3 text-sm font-semibold">Service billing & completion</p></div>
                </div>
                <p className="mt-5 text-xs leading-6 text-white/80">Interactive workflow with fictional records and no backend connection.</p>
              </div>
            </div>
          </div>
        </article>
      </section>
      <section className="mt-14 rounded-3xl bg-gray-50 p-7 dark:bg-gray-900/60 sm:p-9">
        <h2 className="text-2xl font-bold">Need a solution for your own operations?</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">We can explore your specific workflows and design a production solution around them. The demo is just a starting point.</p>
        <Link href="/contact" className="mt-5 inline-flex items-center gap-2 font-semibold text-palm-green hover:underline">Discuss your project <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </section>
    </main>
  );
}
