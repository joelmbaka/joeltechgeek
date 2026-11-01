import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, ClipboardCheck, ShoppingCart, PackageCheck, TrendingUp, CreditCard } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Interactive Software Demos | Joeltech Geek Systems',
  description: 'Explore browser-based fire safety and retail operations concepts from Joeltech Geek Systems. No login, backend, or real transactions.',
  alternates: { canonical: '/demos' },
  openGraph: { type: 'website', url: '/demos', title: 'Interactive Software Demos | Joeltech Geek Systems', description: 'Explore interactive fire safety and retail operations concepts with fictional records and simulated business workflows.' },
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
          Explore an interactive example of business software, with realistic fictional records and working sample workflows. These are concepts, not live customer deployments.
        </p>
      </header>
      <section aria-labelledby="available-demos" className="mt-12">
        <h2 id="available-demos" className="text-2xl font-bold text-gray-900 dark:text-white">Available demos</h2>
        <article className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col p-7 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-palm-green dark:bg-emerald-950/40"><ShieldCheck className="h-6 w-6" aria-hidden /></span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-palm-green">Fire safety · Concept</span>
              </div>
              <h3 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Fire Safety Ops</h3>
              <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Follow a service job from customer equipment registration through a technician inspection, manager approval, and sample certificate.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">No sign-in</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">Browser-local data</span>
                <span className="rounded-full border border-gray-200 px-3 py-1.5 dark:border-gray-700">3 simulated roles</span>
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
      </section>
      <section className="mt-14 rounded-3xl bg-gray-50 p-7 dark:bg-gray-900/60 sm:p-9">
        <h2 className="text-2xl font-bold">Need a solution for your own operations?</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">We can explore your specific workflows and design a production solution around them. The demo is just a starting point.</p>
        <Link href="/contact" className="mt-5 inline-flex items-center gap-2 font-semibold text-palm-green hover:underline">Discuss your project <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </section>
    </main>
  );
}
