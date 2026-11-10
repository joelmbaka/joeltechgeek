import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | CallsBound & JoelTechGeek Website',
  description: 'How Joeltech Geek Systems collects, uses, protects and handles personal information on its website and CallsBound Android app.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    type: 'website',
    url: '/privacy',
    title: 'Privacy Policy | CallsBound & JoelTechGeek Website',
    description: 'Privacy information for CallsBound and the Joeltech Geek Systems website.',
  },
};

const sections = [
  {
    id: 'information-we-collect',
    title: '1. Information we collect',
    paragraphs: [
      'Website enquiries: details you choose to send us, such as your name, email address, phone number, company and message.',
      'Sales agent applications: name, email, telephone/WhatsApp number, town or county, optional background and notes, consent and application source.',
      'CRM accounts: your registered agent name, email and, if provided, phone number. Google sign-in verifies your email identity and determines whether you have access; if provided by Google, your profile picture URL is saved and used to show your avatar in the CRM.',
      'CRM lead records: company and contact names, job roles, business phone numbers, email addresses, websites, locations, lead sources, outreach notes, call outcomes, next actions and follow-up dates. These may include information provided by agents or obtained from publicly available business sources.',
      'Technical information: authentication and session records, security and rate-limit information, and website traffic and performance information processed by our hosting and analytics services.',
    ],
  },
  {
    id: 'how-we-use-data',
    title: '2. Why we use information',
    paragraphs: [
      'We use this information to respond to enquiries, process sales agent applications, authenticate and authorize CRM users, organize business outreach, track follow-ups, improve service reliability and prevent abuse.',
      'We use business contact details for relevant business-to-business communications. If you do not want to be contacted, tell us and we will record or honour the opt-out as appropriate.',
      'We do not sell personal information or use CRM lead records to serve third-party advertising.',
    ],
  },
  {
    id: 'sign-in-and-app',
    title: '3. Google sign-in, mobile storage and notifications',
    paragraphs: [
      'The CallsBound Android app uses Google sign-in for approved agents. Google verifies identity; the CRM checks the registered email against its own access list. A separate fictional review workspace may be available to app reviewers.',
      'The Android app stores a refresh token in device-protected secure storage to keep you signed in. CRM leads and contact lists are fetched from the server rather than maintained as a separate local lead database.',
      'If you grant notification permission, the app can schedule local reminders for your follow-ups. Reminder messages are generic; opening a reminder fetches current lead information from the server. You can disable notifications in Android settings.',
      'The CRM does not require access to your device contacts, precise GPS location, microphone or photographs for its core functions.',
    ],
  },
  {
    id: 'providers',
    title: '4. Providers and data sharing',
    paragraphs: [
      'We use service providers to operate the site and CRM, including Google for identity verification, Vercel for website/API hosting and website analytics or performance measurement, Neon for hosted PostgreSQL storage, and email delivery services such as Resend for relevant service messages.',
      'These services may process limited information needed to provide their functions. We may also disclose information when required by applicable law or to protect the security of our services. Data may be processed outside Kenya, subject to applicable data protection requirements.',
      'Access to CRM records is restricted to authorized users and the records assigned to them. We do not publish individual agent workspaces or lead records on the public website.',
    ],
  },
  {
    id: 'cookies-and-security',
    title: '5. Cookies, security and protection',
    paragraphs: [
      'The web CRM uses authentication cookies to maintain signed-in sessions. The website also uses traffic and performance measurement tools. Your browser may provide standard connection information to our hosting services.',
      'We use HTTPS connections, access checks, restricted server-side database access and security controls for sessions and tokens. No online service can guarantee absolute security.',
    ],
  },
  {
    id: 'retention',
    title: '6. How long we retain information',
    paragraphs: [
      'We keep application, account, enquiry and CRM information for as long as it is reasonably needed to provide services, manage business relationships, fulfil legal obligations, prevent abuse or resolve disputes. Different records may have different retention periods.',
      'When information is no longer needed, we delete or anonymize it where appropriate. Some limited records may remain for legal compliance, security or to respect requests not to be contacted.',
    ],
  },
  {
    id: 'rights-and-deletion',
    title: '7. Your choices, rights and deletion requests',
    paragraphs: [
      'You may request access to, correction of, or deletion of personal information we hold about you, or object to certain uses of it, subject to applicable law. Business contacts can ask us to stop outreach or correct inaccurate contact details.',
      'For a CallsBound agent account, email us from your registered address with the subject "CRM account and data deletion". We will verify the request and explain any information that must be retained for legal or legitimate record-keeping reasons. Removing the app from your phone does not delete server-held records.',
      'To make a privacy request, write to mbakajoe26@gmail.com. You do not need to provide a password or Google authentication token. We may ask for reasonable information to verify that a request concerns your own data.',
    ],
  },
  {
    id: 'children',
    title: '8. Children',
    paragraphs: [
      'The website and CRM are designed for business and professional use, not for children. We do not knowingly invite children to register as CRM agents.',
    ],
  },
  {
    id: 'changes',
    title: '9. Changes to this policy',
    paragraphs: [
      'We may update this page when services, data practices or legal requirements change. The effective date shown above will be updated when material changes are published.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="site-container pb-20 pt-28">
      <article className="mx-auto max-w-3xl">
        <header className="border-b border-gray-200 pb-9 dark:border-gray-800">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-palm-green">Legal &amp; privacy</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Effective date: 7 November 2026</p>
          <p className="mt-6 text-base leading-8 text-gray-700 dark:text-gray-300">
            This policy describes how <strong className="text-gray-900 dark:text-white">Joeltech Geek Systems</strong>,
            a business based in Kenya and founded by Joel Mbaka, handles personal information in connection
            with the public website at joeltechgeek.com, the private web CRM and the
            <strong className="text-gray-900 dark:text-white"> CallsBound</strong> Android app.
          </p>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-400">
            It does not replace the separate privacy policies of unrelated apps or products shown in our portfolio.
          </p>
        </header>

        <nav aria-label="Privacy Policy contents" className="my-9 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40 sm:p-6">
          <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">On this page</p>
          <ul className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a className="text-palm-green hover:underline" href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
            <li><a className="text-palm-green hover:underline" href="#contact">10. Contact us</a></li>
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
            </section>
          ))}
          <section id="contact" className="scroll-mt-28 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50" aria-labelledby="privacy-contact-heading">
            <h2 id="privacy-contact-heading" className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">10. Contact us</h2>
            <p className="mt-4 text-base leading-8 text-gray-700 dark:text-gray-300">
              Privacy contact: Joeltech Geek Systems (Kenya). For questions, corrections, opt-outs and deletion requests,
              email <a className="font-semibold text-palm-green underline underline-offset-4" href="mailto:mbakajoe26@gmail.com?subject=Privacy%20request">mbakajoe26@gmail.com</a>.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
