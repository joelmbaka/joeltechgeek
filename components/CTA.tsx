import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';

export default function CTA() {
  return (
    <section id="contact" className="mt-20 px-0 sm:mt-24">
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-sandy-beach/70 to-ocean-blue/10 p-7 dark:border-gray-800 dark:from-gray-900 dark:to-ocean-blue/20 sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Let&apos;s build something that lasts</p>
        <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Need custom software for your business?</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-gray-700 dark:text-gray-300">
          Tell us what your team needs to improve, build or connect. Discuss a custom mobile app, web platform or business system directly with the engineer responsible for delivery.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-sunset-yellow px-6 py-3 font-semibold text-black hover:bg-sunset-yellow-dark">
            <Mail className="h-4 w-4" aria-hidden /> Discuss your project
          </Link>
          <Link href="/services" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-gray-300 px-6 py-3 font-semibold text-gray-900 hover:border-palm-green dark:border-gray-700 dark:text-white">
            Explore services <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
