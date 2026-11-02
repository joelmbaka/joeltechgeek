import type { Metadata } from 'next';
import { CrmClient } from './CrmClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Sales Agent CRM | JoelTechGeek Systems',
  description: 'Private workspace for registered JoelTechGeek sales agents.',
  robots: { index: false, follow: false, nocache: true },
};

export default function CrmPage() {
  return <CrmClient />;
}
