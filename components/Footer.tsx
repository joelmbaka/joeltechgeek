import Link from 'next/link';
import { Github, Linkedin, Mail, MessageCircle } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50/70 text-gray-600 dark:border-gray-800 dark:bg-gray-900/35 dark:text-gray-400">
      <div className="site-container py-10 sm:py-12">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="max-w-sm">
            <Link href="/" aria-label="Joeltech Geek Systems home" className="inline-flex items-center">
              <BrandLogo />
            </Link>
            <p className="mt-1 text-sm">Software for the US, Kenya & beyond.</p>
            <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">Founder-led custom software development for mobile apps, web platforms, business systems and integrations. We welcome projects across industries and deliver through remote collaboration.</p>
            <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">Founded by Joel Mbaka · Business registration BN-P7SEWW57</p>
          </div>

          <nav className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3" aria-label="Footer navigation">
            {[
              ['/services', 'Services'],
              ['/work', 'Portfolio'],
              ['/demos', 'Interactive demos'],
              ['/industries', 'Industries'],
              ['/about', 'About company'],
              ['/founder', 'Founder'],
              ['/mentorship', 'Mentorship'],
              ['/careers', 'Careers'],
              ['/contact', 'Contact'],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="flex min-h-10 items-center hover:text-palm-green">{label}</Link>
            ))}
          </nav>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:flex sm:flex-wrap sm:items-center sm:gap-4">
            <a href="mailto:mbakajoe26@gmail.com" className="inline-flex min-h-10 items-center gap-2 hover:text-palm-green"><Mail className="h-4 w-4" aria-hidden /> Email</a>
            <a href="https://wa.me/254717990442" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 hover:text-palm-green"><MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp</a>
            <a href="https://github.com/joelmbaka" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 hover:text-palm-green"><Github className="h-4 w-4" aria-hidden /> GitHub</a>
            <a href="https://linkedin.com/in/joelmbaka" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 hover:text-palm-green"><Linkedin className="h-4 w-4" aria-hidden /> LinkedIn</a>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-5 text-xs dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <Link href="/privacy" className="inline-flex min-h-11 items-center font-semibold hover:text-palm-green">
              Privacy Policy
            </Link>
            <Link href="/terms" className="inline-flex min-h-11 items-center font-semibold hover:text-palm-green">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
