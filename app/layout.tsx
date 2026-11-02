import { SITE_URL } from '@/lib/site';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { SiteChrome } from '../components/SiteChrome';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteTitle = 'Joeltech Geek Systems | Custom Software Development';
const siteDescription =
  'Founder-led mobile apps, web platforms and SaaS engineering for businesses in the US, Kenya and beyond. React Native, Next.js, FastAPI and PostgreSQL.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: siteTitle,
  description: siteDescription,
  applicationName: 'Joeltech Geek Systems',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/brand/bridgeframe-180.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  authors: [{ name: 'Joel Mbaka', url: 'https://linkedin.com/in/joelmbaka' }],
  creator: 'Joeltech Geek Systems',
  publisher: 'Joeltech Geek Systems',
  category: 'technology',
  keywords: [
    'Joeltech Geek Systems',
    'software development company in Kenya',
    'custom software development Nairobi',
    'remote software development for US startups',
    'US and Kenya software development services',
    'React Native development',
    'Next.js web app development',
    'FastAPI backend development',
    'SaaS product engineering',
    'M-Pesa payment integration',
    'AI API integration',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Joeltech Geek Systems',
    title: siteTitle,
    description: siteDescription,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SiteChrome>{children}</SiteChrome>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
