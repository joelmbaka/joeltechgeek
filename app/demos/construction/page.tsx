import type { Metadata } from 'next';
import Link from 'next/link';
import {
 ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, FileText,
 HardHat, MonitorSmartphone, Package, ReceiptText, Truck
} from 'lucide-react';

export const metadata: Metadata = {
 title: 'Construction Site Management Demo | JoelTechGeek Systems',
 description: 'Explore a fictional construction mobile workspace with Project Manager, Supervisor, Stockkeeper and Accountant roles, work approvals, material requests, purchasing, stock, supplier payables and site reports.',
 alternates: { canonical: '/demos/construction' },
 openGraph: {
  type: 'website',
  url: '/demos/construction',
  title: 'SiteFlow Construction | Interactive Mobile Demo',
  description: 'Explore realistic site operations across four connected fictional project roles.',
 },
};

const roles = [
 {
  icon: ClipboardCheck,
  name: 'Project Manager',
  summary: 'Reviews work, measured progress, material requests, purchase orders and reports. Monitors the project and supplier balances.',
  areas: 'Home · Review · Finance',
 },
 {
  icon: HardHat,
  name: 'Supervisor',
  summary: 'Creates site work items, submits progress updates and prepares site reports for approval.',
  areas: 'Work · Reports',
 },
 {
  icon: Package,
  name: 'Stockkeeper',
  summary: 'Requests materials, issues authorized quantities, receives deliveries and records stock returns.',
  areas: 'To do · Stock · History',
 },
 {
  icon: ReceiptText,
  name: 'Accountant',
  summary: 'Creates purchase orders for approved shortages, sends approved orders, reviews payables and records supplier payments.',
  areas: 'To do · Invoices · Payments',
 },
];

export default function ConstructionDemoPage() {
 return (
  <main className="site-container pb-20 pt-28">
   <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
    <Link href="/demos" className="inline-flex items-center gap-2 hover:text-palm-green">
     <ArrowLeft className="h-4 w-4" aria-hidden /> All demos
    </Link>
    <span aria-hidden>/</span><span>Construction</span>
   </nav>
   <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
    <div>
     <p className="text-xs font-bold uppercase tracking-[0.15em] text-palm-green">
      Construction &amp; site operations · Interactive concept
     </p>
     <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
      SiteFlow Construction
     </h1>
     <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
      A realistic construction team workspace where work, site approvals, material procurement,
      stock movements and supplier payments share one fictional project.
     </p>
     <div className="mt-7 flex flex-wrap gap-3">
      <a href="/demos/construction/demo.html"
       className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white hover:opacity-90">
       <MonitorSmartphone className="h-5 w-5" aria-hidden /> Open mobile demo
       <ArrowRight className="h-4 w-4" aria-hidden />
      </a>
      <Link href="/contact"
       className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:border-palm-green dark:border-gray-700 dark:text-gray-200">
       Discuss a similar system
      </Link>
     </div>
     <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
      No sign-in required. Switch between four simulated roles; updates remain in your browser.
     </p>
    </div>
    <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
     <Truck className="h-9 w-9 text-palm-green" aria-hidden />
     <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">
      One project, shared operational records
     </h2>
     <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
      Each role has its own navigation and allowed actions. A submitted work item,
      approved material request, received delivery or recorded payment appears
      in the corresponding team&apos;s workspace.
     </p>
     <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
      {['4 simulated roles', 'Realistic approval boundaries', 'Sample evidence', 'Local-only data'].map(item => (
       <span key={item} className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">{item}</span>
      ))}
     </div>
    </aside>
   </div>

   <section className="mt-16" aria-labelledby="roles-title">
    <h2 id="roles-title" className="text-2xl font-bold text-gray-900 dark:text-white">
     Explore the four project roles
    </h2>
    <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300">
     Open any area in the mobile demo and navigate freely. The users share
     the same example project, not four disconnected mockups.
    </p>
    <div className="mt-6 grid gap-5 md:grid-cols-2">
     {roles.map(({ icon: Icon, name, summary, areas }) => (
      <article key={name} className="rounded-3xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-900/60">
       <Icon className="h-7 w-7 text-palm-green" aria-hidden />
       <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{name}</h3>
       <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-300">{summary}</p>
       <p className="mt-4 text-xs font-semibold text-palm-green">{areas}</p>
      </article>
     ))}
    </div>
   </section>

   <section className="mt-12 grid gap-5 md:grid-cols-2">
    <div className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
     <CheckCircle2 className="h-7 w-7 text-palm-green" aria-hidden />
     <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Real handoffs, simplified</h2>
     <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
      Work and progress require approval. A material shortage can become a purchase order,
      then a partial delivery, stock issue and supplier payable. Roles cannot bypass approval.
     </p>
    </div>
    <div className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
     <FileText className="h-7 w-7 text-palm-green" aria-hidden />
     <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Fictional and resettable</h2>
     <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
      The company, people, site, materials and financial records are fictional.
      Site photos are placeholders, and no real purchase orders, emails or payments are sent.
     </p>
    </div>
   </section>
   <div className="mt-12 flex flex-wrap gap-4">
    <a href="/demos/construction/demo.html"
     className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white hover:opacity-90">
     Open the demo <ArrowRight className="h-5 w-5" aria-hidden />
    </a>
    <Link href="/demos" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline">
     <ArrowLeft className="h-4 w-4" aria-hidden /> All demos
    </Link>
   </div>
  <p className="mt-8 text-sm leading-7 text-gray-600 dark:text-gray-300">
    Looking to build something similar? This demo is a fictional concept; explore our <Link href="/services/web-app-development" className="font-semibold text-palm-green hover:underline">custom business management systems</Link> service for real project requirements.
  </p>
  </main>
 );
}
