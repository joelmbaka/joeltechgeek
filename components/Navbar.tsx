'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, Linkedin, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';

const primaryLinks = [
  ['/services', 'Services'],
  ['/work', 'Portfolio'],
  ['/demos', 'Demos'],
  ['/about', 'About'],
  ['/mentorship', 'Mentorship'],
  ['/careers', 'Careers'],
] as const;

export function Navbar() {
  const pathname = usePathname();
  const isContactPage = pathname === '/contact' || pathname === '/contact/';
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl dark:border-gray-800/70 dark:bg-gray-950/90">
      <div className="site-container flex h-16 items-center justify-between gap-4">
        <Link href="/" onClick={closeMobile} className="inline-flex shrink-0 items-center" aria-label="Joeltech Geek Systems home">
          <BrandLogo />
        </Link>

        <nav className="hidden items-center gap-4 text-sm text-gray-600 dark:text-gray-300 lg:flex" aria-label="Primary navigation">
          {primaryLinks.map(([href, label]) => (
            <Link key={href} href={href} className="transition hover:text-palm-green">{label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {!isContactPage && (
            <Link href="/contact" className="hidden min-h-11 items-center rounded-full bg-palm-green px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm-green sm:inline-flex">
              Start a project
            </Link>
          )}
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-palm-green/50 dark:text-gray-200 dark:hover:bg-gray-900 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-navigation" className="border-t border-gray-200/70 bg-white px-4 pb-5 pt-3 shadow-lg dark:border-gray-800/70 dark:bg-gray-950 lg:hidden" aria-label="Mobile navigation">
          <div className="site-container grid gap-1">
            {[...primaryLinks, ['/industries', 'Industries'] as const, ...(!isContactPage ? [['/contact', 'Start a project'] as const] : [])].map(([href, label]) => (
              <Link key={href} href={href} onClick={closeMobile} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-gray-800 transition hover:bg-gray-100 hover:text-palm-green dark:text-gray-200 dark:hover:bg-gray-900">
                {label}
              </Link>
            ))}

            <div className="mt-2 flex gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
              <a href="https://github.com/joelmbaka" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-300">
                <Github className="h-4 w-4" aria-hidden /> GitHub
              </a>
              <a href="https://linkedin.com/in/joelmbaka" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-300">
                <Linkedin className="h-4 w-4" aria-hidden /> LinkedIn
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
