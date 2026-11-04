import type { Metadata } from 'next';
import { CrmClient } from './CrmClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Personal CRM | JoelTechGeek Systems',
  description: 'Private sales CRM for individuals. Sign in with Google to track leads and follow-ups.',
  robots: { index: false, follow: false, nocache: true },
};

export default function CrmPage() {
  return <CrmClient />;
}
