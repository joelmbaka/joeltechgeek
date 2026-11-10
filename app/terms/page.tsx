import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | CallsBound & JoelTechGeek Website',
  description: 'Terms governing use of the Joeltech Geek Systems website, private web CRM and CallsBound Android app.',
  alternates: { canonical: '/terms' },
  openGraph: {
    type: 'website',
    url: '/terms',
    title: 'Terms of Service | CallsBound & JoelTechGeek Website',
    description: 'Terms for accessing the CallsBound app and the Joeltech Geek Systems website.',
  },
};

const sections = [
  {
    id: 'scope',
    title: '1. Who we are and what these terms cover',
    paragraphs: [
      'Joeltech Geek Systems is a business based in Kenya. These Terms of Service govern access to and use of our public website at joeltechgeek.com, our web-based CRM and the CallsBound Android app (together, the Services).',
      'The CRM helps authorized users manage business leads, contact records, outreach activities, next actions and follow-up reminders. Features may vary by account and platform.',
      'A separate written agreement or product-specific terms may apply to commissioned software development, other products shown in our portfolio or paid services. If a signed agreement conflicts with these terms, that agreement controls for the services it covers.',
    ],
  },
  {
    id: 'accounts',
    title: '2. Eligibility, accounts and access',
    paragraphs: [
      'The CRM is intended for people using it for legitimate business or professional purposes. You must be legally able to enter into these terms. Access may require an approved account and sign-in through a supported identity provider such as Google.',
      'You are responsible for using your own authorized account and keeping your device and sign-in credentials secure. Do not share access or attempt to access another user\'s workspace without permission.',
      'We may restrict, suspend or refuse access where reasonably necessary to protect users, investigate misuse, comply with legal obligations or maintain the security of the Services.',
    ],
  },
  {
    id: 'crm-records',
    title: '3. CRM records and business contacts',
    paragraphs: [
      'You are responsible for ensuring that information you enter into the CRM is accurate to the best of your knowledge, relevant to your business purposes and collected or used lawfully.',
      'When you store names, phone numbers, email addresses, outreach notes or other details about business contacts, you must respect applicable privacy, marketing and communications laws, including requests not to be contacted.',
      'You must have the necessary rights or permission to submit information to the Services. You retain any rights you have in your submitted information and authorize us to host, process and display it as necessary to operate the Services under our Privacy Policy.',
    ],
  },
  {
    id: 'acceptable-use',
    title: '4. Acceptable use',
    paragraphs: [
      'Do not use the Services for fraud, unlawful or harassing outreach, spam, impersonation, unauthorized surveillance, discriminatory conduct or any other unlawful purpose.',
      'Do not attempt to bypass account restrictions, interfere with service availability, probe security vulnerabilities without authorization, introduce malicious code or collect information from other accounts without permission.',
      'We may remove prohibited content or restrict access when reasonably required to address violations, security risks or legal obligations.',
    ],
  },
  {
    id: 'notifications',
    title: '5. Follow-ups, reminders and notifications',
    paragraphs: [
      'The CRM can show scheduled follow-ups and, when you permit notifications, schedule reminders on your device. Notification timing depends on device settings, permissions, operating-system scheduling, network access and other factors outside our control.',
      'Reminders are a convenience rather than a guaranteed alerting or emergency service. You remain responsible for reviewing your CRM tasks and meeting your own deadlines; do not rely on a notification as the sole record of an important commitment.',
      'You can control app notification permission through your device settings. Disabling notification permission does not delete your CRM records or scheduled follow-up details held by the service.',
    ],
  },
  {
    id: 'fees',
    title: '6. Availability, subscriptions and payments',
    paragraphs: [
      'Features may be offered without charge, during a trial or under a paid plan. We will explain any applicable price, billing frequency and material restrictions before you agree to a paid service. These terms do not by themselves enroll you in a paid subscription.',
      'If paid features or subscriptions are introduced, additional purchase, cancellation and refund information will be provided at the relevant point of purchase and will be subject to applicable law and store rules.',
      'We may change, improve, discontinue or temporarily interrupt features, including for maintenance, security or operational reasons. We will provide notice of material changes where reasonably practicable.',
    ],
  },
  {
    id: 'ownership',
    title: '7. Intellectual property',
    paragraphs: [
      'The Services, software, branding, design and other materials that we provide belong to Joeltech Geek Systems or the relevant rights holders, except for content you or others lawfully provide.',
      'We grant authorized users a limited, non-exclusive and revocable permission to use the Services for their intended business purposes while these terms are followed. This permission does not transfer ownership of our software, branding or underlying technology.',
      'Do not copy, sell, redistribute or reverse engineer protected parts of the Services except where expressly permitted by applicable law or by our written consent.',
    ],
  },
  {
    id: 'third-parties',
    title: '8. Third-party services and links',
    paragraphs: [
      'Our Services may integrate with or link to third parties such as Google for sign-in, app stores for distribution and hosting or infrastructure providers. Their own terms and privacy notices may apply when you use their services.',
      'Links to external websites are provided for convenience. We do not control third-party content, availability or practices.',
    ],
  },
  {
    id: 'disclaimers',
    title: '9. Service reliability and limitations',
    paragraphs: [
      'We aim to operate the Services with reasonable care, but internet-connected software can experience interruptions, errors or delays. We do not promise that the Services will always be uninterrupted, error-free or suitable for every particular business requirement.',
      'To the extent permitted by applicable law, we are not responsible for indirect or consequential losses arising from a service interruption, inaccurate user-entered records or missed device notifications. Nothing in these terms excludes liability or rights that cannot lawfully be excluded or limited.',
    ],
  },
  {
    id: 'closure',
    title: '10. Suspension, termination and data requests',
    paragraphs: [
      'You may stop using the Services at any time. Removing the app from a device does not automatically delete information held on our servers.',
      'For account closure or a request to access, correct or delete personal information, contact us using the details below. We may need to verify your identity and retain limited information where required by law, legitimate security needs or record-keeping obligations.',
      'We may suspend or end access for a material breach of these terms or when necessary for legal, security or operational reasons. Rights and obligations intended to survive termination remain in effect to the extent allowed by law.',
    ],
  },
  {
    id: 'privacy',
    title: '11. Privacy',
    paragraphs: [
      'Our Privacy Policy explains how we collect, use, share and protect personal information relating to the website and CRM. Please read it alongside these Terms of Service.',
    ],
  },
  {
    id: 'changes-law',
    title: '12. Changes to these terms and applicable law',
    paragraphs: [
      'We may update these terms as our Services or legal requirements change. The effective date will be revised when updates are published, and we will give additional notice of material changes where reasonably practicable.',
      'These terms are governed by the laws of Kenya, subject to any mandatory protections or rights that apply to you under relevant law. Nothing here prevents you from exercising rights that cannot lawfully be waived.',
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <article className="mx-auto max-w-3xl">
        <header className="border-b border-gray-200 pb-9 dark:border-gray-800">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Legal &amp; terms</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Effective date: 7 November 2026</p>
          <p className="mt-6 text-base leading-8 text-gray-700 dark:text-gray-300">
            These terms explain the responsibilities of <strong className="text-gray-900 dark:text-white">Joeltech Geek Systems</strong> and
            the people who access our website or use <strong className="text-gray-900 dark:text-white">CallsBound</strong> on web and Android.
          </p>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-400">
            By accessing or using the Services, you agree to these terms to the extent permitted by applicable law.
            Please also review our <Link href="/privacy" className="font-semibold text-palm-green underline underline-offset-4">Privacy Policy</Link>.
          </p>
        </header>

        <nav aria-label="Terms of Service contents" className="my-9 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40 sm:p-6">
          <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">On this page</p>
          <ul className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a className="text-palm-green hover:underline" href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
            <li><a className="text-palm-green hover:underline" href="#contact">13. Contact us</a></li>
          </ul>
        </nav>

        <div className="space-y-10">
          {sections.map((section) => (
            <section id={section.id} key={section.id} className="scroll-mt-28" aria-labelledby={section.id + '-heading'}>
              <h2 id={section.id + '-heading'} className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-base leading-8 text-gray-700 dark:text-gray-300">{paragraph}</p>
              ))}
              {section.id === 'privacy' ? (
                <p className="mt-4 text-base leading-8">
                  <Link href="/privacy" className="font-semibold text-palm-green underline underline-offset-4">
                    Read our Privacy Policy
                  </Link>
                </p>
              ) : null}
            </section>
          ))}
          <section id="contact" aria-labelledby="terms-contact-heading" className="scroll-mt-28 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
            <h2 id="terms-contact-heading" className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              13. Contact us
            </h2>
            <p className="mt-4 text-base leading-8 text-gray-700 dark:text-gray-300">
              For questions about these terms, account access or the Services, contact Joeltech Geek Systems (Kenya) at{' '}
              <a className="font-semibold text-palm-green underline underline-offset-4" href="mailto:mbakajoe26@gmail.com?subject=Terms%20of%20Service">
                mbakajoe26@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
