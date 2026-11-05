import type { Metadata } from 'next';
import SecurityExperience from '../SecurityExperience';

export const metadata: Metadata = {
  title: 'Security Operations & Client Portal Interactive Demo | JoelTechGeek',
  description: 'Interactive mobile-first security service demo with guard rosters, shift attendance, client issues, supervisor confirmations and site reporting.',
  robots: { index: false, follow: false },
};

export default function SecurityExperiencePage() {
  return <SecurityExperience />;
}
