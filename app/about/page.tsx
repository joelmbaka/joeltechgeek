import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, Code2, Globe2 } from 'lucide-react';
import CTA from '@/components/CTA';

export const metadata: Metadata = {
  title: 'About Joeltech Geek Systems | Founder-led Engineering',
  description: 'Meet Joeltech Geek Systems, a founder-led custom software development agency registered in Kenya and serving businesses internationally.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    url: '/about',
    title: 'About Joeltech Geek Systems | Founder-led Engineering',
    description: 'Joeltech Geek Systems is a founder-led custom software development agency building mobile apps, web platforms and business systems for businesses across industries.',
  },
};

const values = [
  { title: 'Ownership over handoffs', description: 'One accountable engineering lead connecting business goals, product decisions and working software.', icon: Code2 },
  { title: 'Engineering with purpose', description: 'Systems designed for the actual people, transactions and decisions behind business operations.', icon: Building2 },
  { title: 'Talent through mentorship', description: 'Sharing practical software engineering knowledge and making room for emerging developers to grow.', icon: BookOpen },
  { title: 'Local roots, international reach', description: 'Registered in Kenya and open to engagements with US, Kenyan and international teams through remote collaboration.', icon: Globe2 },
];

export default function AboutPage() {
  return (
    <main className="site-container pb-16 pt-28">
      <header className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Our story</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">A founder-led software development agency.</h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">Joeltech Geek Systems is a founder-led custom software development agency and a Kenya-registered business. We design and deliver mobile applications, web platforms, business management systems and integrations for clients across industries, alongside selected products of our own.</p>
        <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">We welcome project enquiries from businesses in the US, Kenya and other markets and collaborate remotely across time zones. Our core mobile framework is React Native/Expo; our web and backend specialization is Next.js, React, Python/FastAPI and PostgreSQL. Engineering work is founder-led, with collaboration scoped for each engagement.</p>
      </header>

      <section className="mt-16 grid items-center gap-10 rounded-3xl border border-gray-200 bg-gray-50 p-7 dark:border-gray-800 dark:bg-gray-900/60 sm:p-10 lg:grid-cols-[280px_1fr]">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-2xl"><Image src="/images/joel.webp" alt="Joel Mbaka, founder of Joeltech Geek Systems" fill sizes="(max-width:1024px) 85vw,280px" className="object-cover" /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Meet the founder</p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Joel Mbaka</h2>
          <p className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">Founder · Senior Software Engineer · Technology Entrepreneur · Developer Mentor</p>
          <p className="mt-6 text-base leading-8 text-gray-600 dark:text-gray-300">Joel combines product leadership with hands-on engineering across React Native, Next.js, Python/FastAPI and PostgreSQL. His work includes rent and school-fee platforms, healthcare workflows, construction software, logistics systems and AI-powered mobile applications.</p>
          <p className="mt-4 text-base leading-8 text-gray-600 dark:text-gray-300">A graduate in Information Technology from JKUAT, he leads architecture and delivery, remains open to appropriate senior engineering roles, and supports upcoming developers through real-world engineering mentorship.</p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
            <a href="https://linkedin.com/in/joelmbaka" target="_blank" rel="noopener noreferrer" className="text-palm-green hover:underline">LinkedIn ↗</a>
            <a href="https://github.com/joelmbaka" target="_blank" rel="noopener noreferrer" className="text-palm-green hover:underline">GitHub ↗</a>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">What guides us</p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Locally rooted. Built for global teams.</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {values.map(({title,description,icon:Icon}) => (
            <div key={title} className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
              <Icon className="h-7 w-7 text-palm-green" aria-hidden />
              <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-3xl bg-gray-50 p-7 dark:bg-gray-900/60 sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Business identity</p>
        <h2 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Registered in Kenya. Available internationally.</h2>
        <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">Joeltech Geek Systems is registered under Kenya&apos;s Registration of Business Names Act (registration BN-P7SEWW57). The business is owned and led by Joel Mbaka and operates with a remote-first delivery approach.</p>
        <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold">
          <Link href="/work" className="inline-flex items-center gap-2 text-palm-green hover:underline">Explore our software work <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          <Link href="/founder" className="inline-flex items-center gap-2 text-palm-green hover:underline">Founder profile <ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </div>
      </section>
      <div className="mt-7 flex flex-wrap gap-5 text-sm font-semibold">
        <Link href="/mentorship" className="text-palm-green hover:underline">Developer mentorship</Link>
        <Link href="/careers" className="text-palm-green hover:underline">Careers and internships</Link>
        <Link href="/services" className="text-palm-green hover:underline">Software development services</Link>
      </div>
      <CTA />
    </main>
  );
}
