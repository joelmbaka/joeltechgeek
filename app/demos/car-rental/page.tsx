import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CarFront, MapPin, WalletCards, CalendarClock, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Car Rental Fleet Management Interactive Demo | JoelTechGeek Systems',
  description: 'An owner-focused rental fleet demo with vehicle availability, rentals, payments, returns, simulated GPS route history, maintenance and finances.',
  alternates: { canonical: '/demos/car-rental' },
  openGraph: {
    type: 'website', url: '/demos/car-rental',
    title: 'Car Rental Fleet Management | Interactive Demo',
    description: 'Explore how an owner manages rental vehicles, GPS tracking, return dates, customer payments and vehicle profitability.',
  },
};

const features = [
  { Icon: CarFront, title: 'Fleet & rentals', text: 'Know which vehicles are rented, available or in maintenance. View renters and due dates from each vehicle.' },
  { Icon: MapPin, title: 'Vehicle GPS history', text: 'Explore a simulated 2D map and route replay from the vehicle detail page. No real tracker is connected.' },
  { Icon: WalletCards, title: 'Payments & profit', text: 'Record partial payments, rental returns, expenses and maintenance costs and inspect monthly operating results.' },
  { Icon: CalendarClock, title: 'Overdue alerts', text: 'See rental deadlines and simulated tracker alerts linked to the appropriate vehicle.' },
];

export default function CarRentalDemoPage(){
 return (
  <main className="site-container pb-20 pt-28">
   <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
    <Link href="/demos" className="inline-flex items-center gap-1 hover:text-palm-green"><ArrowLeft className="h-4 w-4" aria-hidden /> All demos</Link>
    <span aria-hidden="true">/</span><span>Car rental</span>
   </nav>
   <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
    <header>
     <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Fleet operations · Owner mobile app concept</p>
     <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">Car Rental &amp; Leasing Management</h1>
     <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
      Explore an owner-first rental fleet system: track vehicle availability, monitor active rentals, record payments and returns, inspect simulated GPS movement and manage operating costs.
     </p>
     <div className="mt-7 flex flex-wrap gap-3">
      <a href="/demos/car-rental/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
       <CarFront className="h-5 w-5" aria-hidden /> Launch interactive demo <ArrowRight className="h-4 w-4" aria-hidden />
      </a>
      <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:border-palm-green hover:text-palm-green dark:border-gray-700 dark:text-gray-200">Discuss a similar system</Link>
     </div>
     <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">One owner role · Fictional vehicles and customers · Simulated GPS and payments · Browser-local state that you can reset.</p>
    </header>
    <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
     <Wrench className="h-9 w-9 text-palm-green" aria-hidden />
     <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">Every vehicle, one place</h2>
     <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
      Open a rental vehicle to see who has it, its daily rate, due date and outstanding payment. Follow its GPS route, record maintenance or complete its return without switching to another app.
     </p>
     <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
      <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Fleet · Alerts · Finance · Customers</span>
      <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">24-hour rental days</span>
      <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Partial payments</span>
      <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">2D GPS replay</span>
     </div>
    </aside>
   </div>
   <section className="mt-16">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What the owner can do</h2>
    <div className="mt-6 grid gap-5 md:grid-cols-2">
     {features.map(({ Icon,title,text })=>(
      <article key={title} className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/60">
       <Icon className="h-7 w-7 text-palm-green" aria-hidden />
       <h3 className="mt-4 text-lg font-bold">{title}</h3>
       <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{text}</p>
      </article>
     ))}
    </div>
   </section>
  </main>
 );
}