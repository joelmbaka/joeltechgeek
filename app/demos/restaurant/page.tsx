import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Smartphone, MapPin, Store, ShoppingBag, CreditCard, Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Restaurant Ordering & Delivery Interactive Demo | JoelTechGeek Systems',
  description: 'Explore a fictional restaurant ordering workflow: browse the menu, pin a delivery location, estimate a sample fee, simulate M-Pesa checkout, and manage orders by branch.',
  alternates: { canonical: '/demos/restaurant' },
  openGraph: {
    type: 'website',
    url: '/demos/restaurant',
    title: 'Restaurant Ordering & Delivery | Interactive Software Demo',
    description: 'A browser-only restaurant ordering concept with two connected roles, illustrative delivery fees and simulated payment.',
  },
};

const roles = [
  {
    title: 'Customer',
    Icon: Smartphone,
    description: 'Select a branch, browse available pizzas and meals, add items to a basket, pin an illustrative delivery location, and place a simulated M-Pesa order. Follow its status as staff progress it.',
    tabs: 'Menu · Basket · Orders',
  },
  {
    title: 'Restaurant Operations',
    Icon: Store,
    description: 'See incoming orders across fictional branches, move them through preparation and dispatch to delivery, and toggle item availability. Customer ordering immediately reflects the same demo data.',
    tabs: 'Orders · Menu',
  },
];

export default function RestaurantDemoPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-1 hover:text-palm-green"><ArrowLeft className="h-4 w-4" aria-hidden /> All demos</Link>
        <span aria-hidden="true">/</span><span>Restaurant ordering &amp; delivery</span>
      </nav>
      <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Food service · Interactive ordering concept</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">Restaurant Ordering &amp; Delivery</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Experience a direct-ordering flow from a customer&apos;s basket to a restaurant&apos;s operations dashboard, with location pinning, an automatically estimated sample delivery fee, and order tracking.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/demos/restaurant/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
              <Smartphone className="h-5 w-5" aria-hidden /> Launch interactive demo <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:border-palm-green hover:text-palm-green dark:border-gray-700 dark:text-gray-200">Discuss a similar system</Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">No account needed. Fictional customer and operations roles share only browser-local records; reset any time.</p>
        </header>
        <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
          <MapPin className="h-9 w-9 text-palm-green" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">Pin, calculate, order</h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
            Tap a location on the illustrated Nairobi area map. The demo picks the nearest example branch, estimates straight-line distance, and calculates a fictional delivery fee. Compare branches before a sample checkout.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            {['Interactive sample location pin', 'Distance-based fee', '2 connected roles', 'No live payments'].map(x => (
              <span key={x} className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">{x}</span>
            ))}
          </div>
        </aside>
      </div>
      <section className="mt-16" aria-labelledby="roles-title">
        <h2 id="roles-title" className="text-2xl font-bold text-gray-900 dark:text-white">Explore two connected perspectives</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
          Switch roles freely. This is a working sample workflow, not a guided slide deck or a live restaurant system.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {roles.map(({ title, Icon, description, tabs }) => (
            <article key={title} className="rounded-3xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-900/60">
              <Icon className="h-8 w-8 text-palm-green" aria-hidden />
              <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-xs font-semibold text-palm-green">{tabs}</p>
              <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-12 grid gap-5 md:grid-cols-3">
        <article className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <ShoppingBag className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Basket &amp; availability</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">Add dishes, change quantities, and see updated totals. Operations can mark a dish sold out, preventing new orders for it.</p>
        </article>
        <article className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <CreditCard className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Sample M-Pesa checkout</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">The sample payment adds an order to the same browser-local operations queue. No phone prompt, real charge or text message is triggered.</p>
        </article>
        <article className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <Truck className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Order status handoff</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">Restaurant staff move the order from received through preparation and dispatch to delivery. Customer status updates instantly in the demo.</p>
        </article>
      </section>
      <section className="mt-12 rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Concept boundaries</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-600 dark:text-gray-300">
          SliceLane is a fictional brand. All menu prices, branches, orders and locations are illustrative. The map is drawn locally, not a live mapping service; fees use approximate straight-line distance, not road distance or a carrier quotation. No GPS, delivery dispatch, customer messages, database or M-Pesa gateway is connected.
        </p>
      </section>
      <div className="mt-12 flex flex-wrap items-center gap-4">
        <a href="/demos/restaurant/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white hover:opacity-90"><Smartphone className="h-5 w-5" aria-hidden /> Open the demo <ArrowRight className="h-4 w-4" aria-hidden /></a>
        <Link href="/demos" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden /> All demos</Link>
      </div>
    </main>
  );
}