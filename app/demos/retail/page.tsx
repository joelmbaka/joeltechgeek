import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BarChart3, CreditCard, MonitorPlay, PackageCheck, RotateCcw, ShoppingCart, Warehouse } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Interactive Retail & POS Software Demo | Joeltech Geek Systems',
  description: 'Explore a fictional retail and wholesale system: product inventory, supplier purchasing, stock receipts, checkout, sample M-Pesa or cash payments, receipts, and reporting.',
  alternates: { canonical: '/demos/retail' },
  openGraph: {
    type: 'website',
    url: '/demos/retail',
    title: 'Retail & POS Software Interactive Demo | Joeltech Geek Systems',
    description: 'A browser-only retail operations concept with connected purchasing, POS, inventory, receipts and analytics.',
  },
};

const stages = [
  { icon: Warehouse, label: 'Purchasing', text: 'Draft an order from a fictional supplier. Receiving it increases available stock; drafting alone does not.' },
  { icon: PackageCheck, label: 'Inventory', text: 'Review the new quantity, low-stock alerts, weighted-average cost, and movement history.' },
  { icon: ShoppingCart, label: 'Checkout', text: 'Switch to the cashier, add products to a cart, and complete a simulated cash or M-Pesa sale.' },
  { icon: BarChart3, label: 'Reporting', text: 'Open a printable sample receipt, then see how revenue, estimated gross profit and stock levels have changed.' },
];

export default function RetailDemoPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-1 hover:text-palm-green">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All demos
        </Link>
        <span aria-hidden="true">/</span><span>Retail &amp; wholesale</span>
      </nav>

      <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Interactive retail operations concept</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">GreenBasket Retail</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Explore how retail stock, procurement, point-of-sale checkout, receipts, and reporting can operate together in one software system.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="/demos/retail/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
              <MonitorPlay className="h-5 w-5" aria-hidden /> Launch interactive demo <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:border-palm-green hover:text-palm-green dark:border-gray-700 dark:text-gray-200">Discuss a similar system</Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">No login or real payment needed. Browser-local data can be reset at any time.</p>
        </header>

        <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8" aria-label="Retail demo capabilities">
          <ShoppingCart className="h-9 w-9 text-palm-green" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">From stock to sale</h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
            See one connected end-to-end workflow using an entirely fictional general store. Change inventory or record a sale and the other screens update.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">3 simulated roles</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Suppliers &amp; purchasing</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Cash / mock M-Pesa</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Printable sample receipts</span>
          </div>
        </aside>
      </div>

      <section aria-labelledby="retail-workflow" className="mt-16">
        <h2 id="retail-workflow" className="text-2xl font-bold text-gray-900 dark:text-white">Retail operations you can explore</h2>
        <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">Run purchasing, inventory, checkout and reporting operations in the same fictional store. Each role works with shared records.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage) => (
            <article key={stage.label} className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/60">
              <stage.icon className="h-7 w-7 text-palm-green" aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{stage.label}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{stage.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <CreditCard className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Payments are simulated</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">No live M-Pesa integration, card processing, messaging, real cash balance, or backend is connected. Sample receipts are not evidence of payment.</p>
        </div>
        <div className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <RotateCcw className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Explore freely and reset</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">Fictional products, suppliers and sales are stored only in your current browser. Switching roles is illustrative, not authentication. Reset restores the original sample store.</p>
        </div>
      </section>
      <div className="mt-12 flex flex-wrap gap-4">
        <a href="/demos/retail/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white hover:opacity-90">
          <MonitorPlay className="h-5 w-5" aria-hidden /> Open the demo <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
        <Link href="/demos" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden /> Back to demos</Link>
      </div>
    </main>
  );
}
