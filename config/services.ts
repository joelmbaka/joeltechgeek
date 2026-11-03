export type ServiceArea = {
  slug: string;
  eyebrow: string;
  title: string;
  searchTitle: string;
  description: string;
  summary: string;
  problems: string[];
  deliverables: string[];
  approach: string[];
  proofIds: string[];
  buyerExamples?: Array<{ title: string; detail: string }>;
  relatedDemos?: Array<{ label: string; href: string }>;
  relatedServices?: Array<{ label: string; href: string }>;
  ctaLabel?: string;
};

export const services: ServiceArea[] = [
  {
    slug: 'react-native-app-development',
    eyebrow: 'Mobile applications',
    title: 'React Native app development for Android and iOS',
    searchTitle: 'React Native App Development in Kenya | JoelTechGeek',
    description: 'React Native and Expo apps for Android and iOS, built for Kenyan, US and international teams with APIs, payments, notifications and release support.',
    summary: 'Build customer-facing mobile apps, staff tools and field workflows with React Native and Expo. A shared Android and iOS codebase can integrate authentication, payments, notifications and dependable backend services.',
    problems: [
      'Customers or field teams need a dependable mobile workflow instead of spreadsheets and disconnected messages.',
      'An existing app needs better navigation, API integration, payment handling or production stability.',
      'A founder needs to launch a cross-platform product and maintain one coherent codebase.',
    ],
    deliverables: [
      'React Native / Expo application design and implementation',
      'Android and iOS release engineering where supported by the project',
      'Authentication, offline-aware states, device capabilities and notifications',
      'API integration, testing, analytics and post-launch improvement',
    ],
    approach: [
      'Map the real user journeys and mobile device constraints first.',
      'Build with React Native, Expo and TypeScript; connect to tested backend contracts.',
      'Validate critical journeys and release for the agreed platforms.',
    ],
    buyerExamples: [
      { title: 'Customer-facing applications', detail: 'Accounts, balances, payment journeys and timely updates for the people using your services.' },
      { title: 'Staff and field-service tools', detail: 'Assigned work, progress updates and permissions for teams operating away from a desk.' },
      { title: 'Reliable connected workflows', detail: 'Authentication, notifications, API-backed records and platform-specific release checks.' },
    ],
    relatedDemos: [
      { label: 'Security guard operations concept', href: '/demos/security' },
      { label: 'Field service workflow concept', href: '/demos/field-services' },
    ],
    relatedServices: [
      { label: 'Web apps and dashboards', href: '/services/web-app-development' },
      { label: 'M-Pesa payment integrations', href: '/services/payment-integrations' },
    ],
    ctaLabel: 'Plan a mobile app',
    proofIds: ['rentpayor', 'journpad', 'schoolpey', 'macsim', 'milliol'],
  },
  {
    slug: 'web-app-development',
    eyebrow: 'Web platforms',
    title: 'Custom business management systems and web apps',
    searchTitle: 'Custom Business Systems & Web Apps Kenya | JoelTechGeek',
    description: 'Custom web apps, dashboards and business management systems for Kenyan, US and international teams, built with Next.js, React and secure APIs.',
    summary: 'Replace fragmented spreadsheets and disconnected records with a custom business management system. We build role-aware web dashboards, operational workflows, search and reporting around your team’s actual processes.',
    problems: [
      'Managers cannot reliably see financial, operational or customer activity in one place.',
      'The business has outgrown spreadsheet-based administration.',
      'A SaaS product needs authenticated workspaces and role-aware dashboards.',
    ],
    deliverables: [
      'Next.js and React dashboards, portals and administrative tools',
      'Responsive workflows, search, filters, reporting and permissions',
      'Backend integrations, validation, accessibility and testing',
      'Search-ready public-facing routes where the product needs them',
    ],
    approach: [
      'Define user roles, core tasks and data visibility before building screens.',
      'Implement interfaces alongside APIs and transaction-level business rules.',
      'Test real workflows in the browser at desktop and mobile widths.',
    ],
    buyerExamples: [
      { title: 'Operational dashboards', detail: 'Role-aware workspaces to manage records, tasks, approvals, search, filters and reporting.' },
      { title: 'Invoices and financial workflows', detail: 'Billing, receipts, payment status and reconciliation connected to your business records.' },
      { title: 'Inventory and service delivery', detail: 'Procurement, stock movement and workflow tracking for field, construction, transport or healthcare operations.' },
    ],
    relatedDemos: [
      { label: 'Construction management concept', href: '/demos/construction' },
      { label: 'Logistics dispatch concept', href: '/demos/logistics' },
      { label: 'Rental operations concept', href: '/demos/property' },
    ],
    relatedServices: [
      { label: 'Backend APIs and databases', href: '/services/fastapi-backend-development' },
      { label: 'Mobile applications', href: '/services/react-native-app-development' },
      { label: 'Payments and reconciliation', href: '/services/payment-integrations' },
    ],
    ctaLabel: 'Discuss a business system',
    proofIds: ['rentpayor', 'schoolpey', 'clivique-hmis', 'macsim'],
  },
  {
    slug: 'fastapi-backend-development',
    eyebrow: 'Backend engineering',
    title: 'Python, FastAPI and PostgreSQL backend development',
    searchTitle: 'FastAPI & PostgreSQL Development | Joeltech Geek Systems',
    description: 'Python FastAPI backend development, PostgreSQL data modeling, REST APIs, secure authorization, SQLAlchemy, Alembic migrations and production business workflows.',
    summary: 'Backend correctness matters when software manages invoices, patients, inventory or transactions. We build APIs and data models around enforceable business rules, clear authorization and reliable state changes.',
    problems: [
      'An application needs secure and maintainable backend APIs.',
      'Payment, billing and operational records need trustworthy state transitions.',
      'A growing product needs a clearer relational model and migrations.',
    ],
    deliverables: [
      'FastAPI and REST API design, implementation and documentation',
      'PostgreSQL, SQLAlchemy and Alembic database engineering',
      'Authentication, role-based access and tenant or facility isolation',
      'Webhooks, background workflows, idempotency and automated backend tests',
    ],
    approach: [
      'Model the business entities, authorization boundaries and failure cases.',
      'Implement explicit schemas, migrations, API contracts and tests.',
      'Validate transaction and callback behavior before production release.',
    ],
    proofIds: ['rentpayor', 'clivique-hmis', 'schoolpey', 'macsim'],
  },
  {
    slug: 'saas-product-development',
    eyebrow: 'Product engineering',
    title: 'SaaS and end-to-end product development',
    searchTitle: 'SaaS Product Development | Joeltech Geek Systems',
    description: 'From product requirements to production SaaS: mobile apps, web dashboards, backend APIs, tenancy, subscriptions, billing, testing and release.',
    summary: 'We develop complete products, including customer experiences and the internal operational systems that help teams run them. Our own products are practical evidence of this end-to-end approach.',
    problems: [
      'A founder has a product concept but needs a production-minded implementation.',
      'An MVP needs invoicing, permissions, reporting or subscription workflows to become commercially useful.',
      'A business wants a maintainable product rather than disconnected applications.',
    ],
    deliverables: [
      'Discovery, scope and technical architecture',
      'Web/mobile interfaces and backend/data engineering',
      'Account roles, billing, subscription and operational workflows',
      'Testing, launch support and iterative improvement',
    ],
    approach: [
      'Define the smallest complete customer workflow and success criteria.',
      'Build the user experience and its business-state foundation together.',
      'Launch with measured quality checks and iterate based on feedback.',
    ],
    proofIds: ['rentpayor', 'schoolpey', 'clivique-hmis', 'journpad'],
  },
  {
    slug: 'payment-integrations',
    eyebrow: 'Financial workflows',
    title: 'M-Pesa API integration, payments and reconciliation',
    searchTitle: 'M-Pesa API Integration & Reconciliation | JoelTechGeek',
    description: 'M-Pesa API integrations for invoices, callbacks, receipts, partial payments and reconciliation in custom Kenyan business software.',
    summary: 'A successful STK Push is only the beginning. A dependable M-Pesa integration should verify the provider response, match payments to invoices, update balances safely and leave a clear audit trail.',
    problems: [
      'Payments arrive without a reliable connection to an invoice or customer.',
      'Partial payments and credits are difficult to account for.',
      'Duplicate or delayed callbacks create inconsistent financial records.',
    ],
    deliverables: [
      'Payment API integration including M-Pesa and supported providers',
      'Invoice-linked payment initiation, confirmation and receipts',
      'Reconciliation, balances, credits and duplicate-callback protection',
      'Permission-aware finance reports and operational testing',
    ],
    approach: [
      'Map financial states, provider results and reconciliation rules first.',
      'Implement validated callback and idempotency controls.',
      'Test successful, delayed, duplicate, partial and failed payment paths.',
    ],
    buyerExamples: [
      { title: 'Payment initiation and verification', detail: 'Start a supported payment flow and validate the resulting provider callback before changing payment status.' },
      { title: 'Invoice matching and partial balances', detail: 'Associate payments with the correct invoice, record partial payments and handle credits under agreed business rules.' },
      { title: 'Reconciliation and auditability', detail: 'Use idempotency and duplicate-callback protection to keep receipts, balances and transaction history consistent.' },
    ],
    relatedDemos: [
      { label: 'Rental payment workflow concept', href: '/demos/property' },
      { label: 'School fees workflow concept', href: '/demos/education' },
    ],
    relatedServices: [
      { label: 'Custom business systems', href: '/services/web-app-development' },
      { label: 'FastAPI backends and webhooks', href: '/services/fastapi-backend-development' },
    ],
    ctaLabel: 'Discuss a payment workflow',
    proofIds: ['rentpayor', 'schoolpey', 'clivique-hmis', 'macsim'],
  },
  {
    slug: 'ai-api-integrations',
    eyebrow: 'Applied AI',
    title: 'AI API integration and workflow automation',
    searchTitle: 'AI API & LLM Application Integration | Joeltech Geek Systems',
    description: 'Integrate existing AI, speech-to-text, image-understanding and LLM APIs into practical mobile and web products. Application engineering, not model training.',
    summary: 'We apply existing AI models through APIs to solve specific product problems. This includes transcription, document or image understanding, structured responses and human-reviewed automation—not building or training foundation models.',
    problems: [
      'Users need to turn voice or unstructured input into useful product records.',
      'Manual categorization, summarization or review slows down workflows.',
      'An AI proof of concept needs proper authentication, validation and product behavior.',
    ],
    deliverables: [
      'LLM and speech-to-text service integrations',
      'Structured outputs with application-level validation and review',
      'Voice, audio and image-aware user experiences',
      'Monitoring of quality, cost, latency and fallback behavior',
    ],
    approach: [
      'Start with the user task and decide whether AI genuinely improves it.',
      'Connect existing model APIs through clear, testable backend contracts.',
      'Keep sensitive data, failure modes and human review in scope.',
    ],
    proofIds: ['journpad', 'rentpayor'],
  },
];

export const findService = (slug: string) => services.find((service) => service.slug === slug);
