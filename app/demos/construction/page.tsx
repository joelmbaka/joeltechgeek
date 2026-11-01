import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BarChart3, ClipboardCheck, HardHat, MonitorPlay, PackageCheck, RotateCcw, Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Construction Site Management Interactive Demo | Joeltech Geek Systems',
  description: 'Try a browser-only construction operations concept with site progress, material requests, manager approvals, store issues, partial goods receiving, site expenses and sample reports.',
  alternates: { canonical: '/demos/construction' },
  openGraph: {
    type: 'website',
    url: '/demos/construction',
    title: 'Construction Site Management Interactive Demo | Joeltech Geek Systems',
    description: 'Experience a fictional construction site workflow across four simulated roles.',
  },
};

const stages = [
  { icon: HardHat, name: 'Supervisor', description: 'Peter requests materials against a site task and later records its actual completion percentage.' },
  { icon: ClipboardCheck, name: 'Project Manager', description: 'Nia reviews the request, approves or rejects it, and creates supplier purchase orders.' },
  { icon: PackageCheck, name: 'Storekeeper', description: 'Asha issues only approved quantities, receives partial deliveries, and monitors inventory.' },
  { icon: BarChart3, name: 'Accountant', description: 'Samuel records fictional site expenses and views illustrative project cost and progress reports.' },
];

export default function ConstructionDemoPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/demos" className="inline-flex items-center gap-1 hover:text-palm-green"><ArrowLeft className="h-4 w-4" aria-hidden /> All demos</Link>
        <span aria-hidden="true">/</span><span>Construction</span>
      </nav>
      <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Construction &amp; site management · Interactive concept</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">SiteFlow Construction</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Explore how site teams can coordinate work progress, material approvals, store inventory, supplier deliveries, and expenses through a connected operations workspace.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="/demos/construction/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green">
              <MonitorPlay className="h-5 w-5" aria-hidden /> Launch interactive demo <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:border-palm-green hover:text-palm-green dark:border-gray-700 dark:text-gray-200">
              Discuss a similar system
            </Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">
            No account or backend required. All sample records remain in this browser; reset the workspace at any time.
          </p>
        </header>
        <aside className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-8">
          <HardHat className="h-9 w-9 text-palm-green" aria-hidden />
          <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">One connected construction workflow</h2>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
            Start with a supervisor&apos;s request. Approve it, issue stock, update activity progress, and see project costs respond immediately.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">4 simulated roles</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Request approvals</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Stock issue controls</span>
            <span className="rounded-full bg-white px-3 py-2 dark:bg-gray-900/70">Sample project reporting</span>
          </div>
        </aside>
      </div>

      <section aria-labelledby="steps-title" className="mt-16">
        <h2 id="steps-title" className="text-2xl font-bold text-gray-900 dark:text-white">Construction roles and capabilities</h2>
        <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">
          Use the role selector inside the demo to explore these different team perspectives and verify how each action affects project data.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage) => (
            <article key={stage.name} className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/60">
              <stage.icon className="h-7 w-7 text-palm-green" aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{stage.name}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{stage.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <Truck className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Partial supplier deliveries</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
            Receiving is quantity-aware. For an order of 30 cement bags, receive 12 first and 18 later; the system prevents receiving beyond the ordered amount.
          </p>
        </div>
        <div className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
          <RotateCcw className="h-7 w-7 text-palm-green" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Safe, fictional, and resettable</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
            The construction company, project, suppliers, budgets, stock, expenses, and people are fictional. Role switching is illustrative, not real authentication. No payments or messages are sent.
          </p>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-4">
        <a href="/demos/construction/demo.html" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-palm-green px-6 py-3 font-semibold text-white hover:opacity-90">
          <MonitorPlay className="h-5 w-5" aria-hidden /> Open the demo <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
        <Link href="/demos" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-palm-green hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to demos
        </Link>
      </div>
    </main>
  );
}
