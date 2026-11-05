import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import SecurityExperience from '../SecurityExperience';

export const metadata: Metadata = {
  title: 'Security Operations & Client Portal Interactive Demo | JoelTechGeek',
  description: 'Interactive security service demo showing guard rosters, attendance confirmation, shift handovers, client issues and site reporting with no guard smartphone required.',
  robots: { index: false, follow: false },
};

export default function SecurityExperiencePage() {
  return (
    <>
      <div className="border-b border-emerald-900 bg-[#0E332F] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/demos/security" className="inline-flex items-center gap-2 font-semibold text-emerald-100 hover:text-white"><ArrowLeft className="h-4 w-4" /> About this solution</Link>
          <Link href="/contact" className="inline-flex items-center gap-2 font-semibold text-emerald-100 hover:text-white">Discuss a similar system <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
      <SecurityExperience />
    </>
  );
}
