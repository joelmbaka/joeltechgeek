export type ProjectType = 'SaaS' | 'Enterprise';

export interface ProjectScreenshots {
  web?: string[];
  app?: string[];
}

export interface ProjectStorePreview {
  src: string;
  platform: 'ios' | 'android' | 'web';
  crop?: 'details' | 'title';
}

export interface ProjectEnhancement {
  title: string;
  description: string;
  tech: string[];
  screenshots?: string[];
  url?: string;
  linkLabel?: string;
  note?: string;
}

export interface ProjectDemoVideo {
  src: string;
  poster: string;
  title: string;
  description: string;
  duration?: string;
  publishedAt?: string;
  captions?: string;
  mimeType?: 'video/mp4' | 'video/webm';
}

export interface Project {
  id: string;
  aliases?: string[];
  title: string;
  description: string;
  updatedAt: string;
  tech: string[];
  type: ProjectType;
  platforms?: string[];
  engagement?: 'Product' | 'Client project' | 'Experiment';
  /** Hidden items stay in the archive, but never appear in public pages, case-study routes, SEO or sitemaps. */
  visibility?: 'public' | 'hidden';
  url?: string;
  externalLinkLabel?: string;
  icon?: string;
  iconBackground?: string;
  storePreview?: ProjectStorePreview;
  screenshots?: ProjectScreenshots;
  /** Add verified, permission-safe walkthroughs as assets become available. No placeholder video URLs. */
  demoVideo?: ProjectDemoVideo;
  enhancements?: ProjectEnhancement[];
  appStore?: {
    url: string;
  };
  playStore?: {
    url: string;
  };
}

export const projects: Project[] = [
  {
    id: 'callsbound',
    title: 'CallsBound CRM',
    description:
      'Outbound sales CRM for managing leads, contacts, calls, WhatsApp and email outreach, activity history, priorities and follow-up reminders. CallsBound connects an Android prospecting app with a private web workspace and PostgreSQL-backed services for individual sales users.',
    updatedAt: '2026-11-10',
    tech: ['React Native', 'Expo', 'TypeScript', 'Next.js', 'PostgreSQL', 'Google OAuth', 'Neon', 'Android notifications'],
    type: 'Enterprise',
    platforms: ['Android', 'Web workspace'],
    engagement: 'Product',
    url: 'https://joeltechgeek.com/crm',
    externalLinkLabel: 'Open CallsBound web CRM (Google sign-in)',
    icon: '/images/projects/callsbound-icon.png',
    storePreview: {
      platform: 'android',
      src: '/store-previews/callsbound-google-play.png',
    },
    screenshots: {
      app: [
        '/project-screenshots/callsbound/mobile/01-dashboard.png',
        '/project-screenshots/callsbound/mobile/02-lead-details.png',
        '/project-screenshots/callsbound/mobile/03-record-update.png',
        '/project-screenshots/callsbound/mobile/04-notifications.png',
        '/project-screenshots/callsbound/mobile/05-add-lead.png',
      ],
    },
    playStore: {
      url: 'https://play.google.com/store/apps/details?id=com.joeltechgeek.app',
    },
  },
  {
    id: 'journpad',
    platforms: ['iOS', 'Android'],
    engagement: 'Product',
    title: 'JournPad: Voice Journal',
    description:
      'Voice-first journaling app that preserves the original recording, transcribes spoken entries, and uses AI to generate useful titles, summaries, and categories. Entries can be searched and revisited by date, linked to goals, supported by reminders and prompts, and protected with account, deletion, and optional biometric controls.',
    updatedAt: '2026-08-12',
    tech: [
      'Expo',
      'React Native',
      'TypeScript',
      'Google Cloud',
      'Python',
      'Docker',
      'AI APIs',
    ],
    type: 'SaaS',
    url: 'https://journpad.com',
    icon: 'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/journpad/icon.png',
    storePreview: {
      platform: 'ios',
      src: 'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/journpad/store/card-focused-v2.png',
    },
    screenshots: {
      app: [
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/journpad/app-screenshots/01_home_weekly_entries.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/journpad/app-screenshots/02_new_entry_goal_prompt.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/journpad/app-screenshots/03_entry_detail_playback_summary.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/journpad/app-screenshots/04_goals_list.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/journpad/app-screenshots/05_career_goal_detail.png',
      ],
    },
    enhancements: [
      {
        title: 'AI Blog Writing Agent',
        description:
          'Autonomous publishing pipeline that plans JournPad topics, drafts articles, repairs structure, improves titles and excerpts, polishes voice, quality-checks the final post, and publishes up to two articles per day.',
        tech: [
          'Python',
          'CrewAI',
          'FastAPI',
          'SQLAlchemy',
          'PostgreSQL',
          'Vercel Blob',
          'Pillow',
          'systemd',
        ],
        screenshots: [
          'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/journpad/enhancements/blog-writer/blog.png',
        ],
        url: 'https://journpad.com/blog',
        note: 'Code available upon request.',
      },
    ],
    appStore: {
      url: 'https://apps.apple.com/ke/app/journpad-ai-voice-journal/id6754232534',
    },
    playStore: {
      url: 'https://play.google.com/store/apps/details?id=com.joelmbaka.journal',
    },
  },
  {
    id: 'rentpayor',
    platforms: ['iOS', 'Android', 'Web dashboard'],
    engagement: 'Product',
    title: 'RentPayor',
    description:
      'Rent collection and reconciliation software for landlords and property managers. RentPayor connects iOS and Android apps with a web management dashboard for landlords and property managers. It handles properties, leases, rent invoicing, M-Pesa collections, partial payments, automatic reconciliation, receipts, credits and reporting.',
    updatedAt: '2026-08-12',
    tech: [
      'Expo',
      'React Native',
      'TypeScript',
      'Python',
      'FastAPI',
      'PostgreSQL',
      'Firebase Auth',
      'M-Pesa',
      'Expo Router',
      'Jest',
    ],
    type: 'Enterprise',
    url: 'https://rentpayor.com',
    icon: 'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/rentpayor/icon.png',
    storePreview: {
      platform: 'android',
      src: '/store-previews/rentpayor-google-play.png',
    },
    screenshots: {
      app: [
        '/project-screenshots/rentpayor/mobile/01-tenant-invoices.png',
        '/project-screenshots/rentpayor/mobile/02-owner-payments-mpesa.png',
        '/project-screenshots/rentpayor/mobile/03-owner-payment-detail-mpesa.png',
        '/project-screenshots/rentpayor/mobile/04-owner-rent-overview.png',
        '/project-screenshots/rentpayor/mobile/05-owner-properties.png',
      ],
    },
    enhancements: [
      {
        title: 'Property management web dashboard',
        description: 'Web management experience for properties, tenants, leases, invoices, payments, reporting and operational administration. Complements the iOS and Android applications.',
        tech: ['Next.js', 'React', 'TypeScript', 'FastAPI', 'PostgreSQL'],
        screenshots: ['/project-screenshots/rentpayor/web/homepage-dashboard-desktop.webp'],
        url: 'https://app.rentpayor.com',
        linkLabel: 'View live dashboard',
      },
    ],
    appStore: {
      url: 'https://apps.apple.com/ke/app/rentpayor/id6765710822',
    },
    playStore: {
      url: 'https://play.google.com/store/apps/details?id=com.joelmbaka.rentpayor',
    },
  },
  {
    id: 'schoolpey',
    title: 'SchoolPey',
    description: 'School-fee billing and collection software with an Android parent experience and web administration dashboards for schools. Manages students, guardians, term invoicing, M-Pesa payments, receipts, balances and reconciliation.',
    updatedAt: '2026-10-12',
    tech: ['React Native', 'Expo', 'TypeScript', 'Next.js', 'React', 'Python', 'FastAPI', 'PostgreSQL', 'Tuma', 'M-Pesa', 'Playwright'],
    type: 'SaaS',
    platforms: ['Android', 'Web dashboard'],
    engagement: 'Product',
    url: 'https://schoolpey.com',
    screenshots: {
      app: [
        '/project-screenshots/schoolpey/mobile/01-parent-dashboard.png',
        '/project-screenshots/schoolpey/mobile/02-invoices-balances.png',
        '/project-screenshots/schoolpey/mobile/03-mpesa-payment.png',
        '/project-screenshots/schoolpey/mobile/04-paid-invoice-history.png',
        '/project-screenshots/schoolpey/mobile/05-payment-receipt.png',
      ],
    },
    storePreview: {
      platform: 'android',
      src: '/store-previews/schoolpey-google-play.png',
    },
    playStore: {
      url: 'https://play.google.com/store/apps/details?id=com.joeltechgeeksystems.schoolpey',
    },
    enhancements: [
      {
        title: 'School administration dashboard',
        description: 'Web-based school operations for fee structures, students, term billing, M-Pesa collection, payment reconciliation, student finance and reporting.',
        tech: ['Next.js', 'React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Tuma', 'Playwright'],
        screenshots: [
          '/project-screenshots/schoolpey/web/01-financial-overview.png',
          '/project-screenshots/schoolpey/web/02-student-finance.png',
          '/project-screenshots/schoolpey/web/03-reconciliation.png',
        ],
        url: 'https://app.schoolpey.com',
        linkLabel: 'View live dashboard',
      },
    ],
  },
  {
    id: 'milliol',
    title: 'Milliol Construction Manager',
    url: 'https://milliolrealtors.com/',
    externalLinkLabel: 'Visit Milliol Realtors website',
    description: 'Android construction-operations application for project progress, work items, procurement, inventory and stock, financial tracking and operational reporting.',
    updatedAt: '2026-10-12',
    tech: ['React Native', 'Expo', 'TypeScript', 'Android'],
    type: 'Enterprise',
    platforms: ['Android'],
    engagement: 'Client project',
    storePreview: {
      platform: 'android',
      src: '/store-previews/milliol-google-play.png',
    },
    playStore: {
      url: 'https://play.google.com/store/apps/details?id=com.joelmbaka.milliol',
    },
    demoVideo: {
      src: '/videos/milliol-construction-manager-demo.mp4',
      poster: '/videos/milliol-construction-manager-demo.webp',
      title: 'See the construction workflow in action',
      description: 'A narrated walkthrough of Milliol Construction Manager, from project oversight and site coordination through material movement, purchasing, invoices and financial visibility.',
      duration: 'PT51S',
      publishedAt: '2026-10-14',
      mimeType: 'video/mp4',
    },
    screenshots: {
      app: [
        '/project-screenshots/milliol/mobile/01-manager-overview.png',
        '/project-screenshots/milliol/mobile/02-supervisor-work-items.png',
        '/project-screenshots/milliol/mobile/03-manager-review.png',
        '/project-screenshots/milliol/mobile/04-stockkeeper-inventory.png',
        '/project-screenshots/milliol/mobile/05-accountant-invoices.png',
        '/project-screenshots/milliol/mobile/06-manager-notifications.png',
      ],
    },
  },
  {
    id: 'macsim',
    platforms: ['Android', 'Web administration'],
    engagement: 'Client project',
    title: 'Macsim Cargo',
    description:
      'Cargo and logistics operations platform spanning mobile field workflows and back-office administration. Macsim handles loads, reservations, driver assignments, trip tracking, documents, notifications, fleet operations and finance, with a guarded M-Pesa/Daraja flow for funding a collection-account ledger and paying drivers in full or partial load installments.',
    updatedAt: '2026-07-31',
    tech: [
      'Expo',
      'React Native',
      'TypeScript',
      'Python',
      'FastAPI',
      'PostgreSQL',
      'Firebase Auth',
      'React Query',
      'M-Pesa Daraja',
    ],
    type: 'Enterprise',
    url: 'https://macsimcargo.com',
    icon: 'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/macsim/icon.png',
    storePreview: {
      platform: 'android',
      src: '/store-previews/macsim-google-play.png',
    },
    screenshots: {
      app: [
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/macsim/app-screenshots/01_admin_load_board.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/macsim/app-screenshots/02_active_trip_tracking.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/macsim/app-screenshots/03_assignment_detail.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/macsim/app-screenshots/04_driver_cargo_board.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/macsim/app-screenshots/05_driver_reservation_detail.png',
      ],
    },
    enhancements: [
      {
        title: 'Admin Dashboard',
        description:
          'Backoffice dashboard for cargo operations with load-board oversight, active and completed load counts, fleet and driver management, finance access, staff controls, locations, consignees, and quick operational actions.',
        tech: [
          'Next.js',
          'React',
          'TypeScript',
          'Tailwind CSS',
          'Python',
          'FastAPI',
          'PostgreSQL',
          'Firebase Auth',
          'Vercel Blob',
        ],
        screenshots: [
          'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/macsim/enhancements/admin-dashboard/dashboard.png',
        ],
        note: 'Code available upon request.',
      },
    ],
    playStore: {
      url: 'https://play.google.com/store/apps/details?id=com.joelmbaka.macsim',
    },
  },
  {
    id: 'ai-stylist',
    visibility: 'hidden', // Product development paused; retain data for a future relaunch.
    engagement: 'Experiment',
    title: 'AI Stylist',
    description:
      'Mobile wardrobe-management and outfit-recommendation product. Users create wardrobes, upload clothing photos for AI-assisted category, tag, and description analysis, and generate one-time, daily, or weekly outfit suggestions that can use precise local weather; recommendation history is stored locally in SQLite and designed to sync with the cloud.',
    updatedAt: '2026-05-20',
    tech: [
      'Expo',
      'React Native',
      'TypeScript',
      'Python',
      'FastAPI',
      'PostgreSQL',
      'SQLAlchemy',
      'Alembic',
      'SQLite',
      'Expo Location',
      'OAuth',
    ],
    type: 'SaaS',
    icon: 'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/ai-stylist/icon.png',
    iconBackground: '#2E1A47',
    storePreview: {
      platform: 'android',
      src: 'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/ai-stylist/store/card-focused-v2.png',
      crop: 'title',
    },
    screenshots: {
      app: [
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/ai-stylist/app-screenshots/01_home.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/ai-stylist/app-screenshots/02_wardrobe_items.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/ai-stylist/app-screenshots/03_burgundy_blouse_detail.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/ai-stylist/app-screenshots/04_olive_vest_detail.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/ai-stylist/app-screenshots/05_weekly_casual_outfit.png',
      ],
    },
  },
  {
    id: 'clivique-hmis',
    platforms: ['Web platform', 'Backend'],
    engagement: 'Product',
    aliases: ['taifa-hmis'],
    title: 'CliviQue HMIS',
    description:
      'Hospital management information system connecting patient registration, OPD, emergency, inpatient care, orders, referrals, theatre, billing, ambulance, mortuary, duty coverage, patient movement, documents, and facility operations. It includes facility-bound Tuma M-Pesa patient billing and reconciliation, alongside SaaS subscription billing infrastructure.',
    updatedAt: '2026-08-02',
    tech: [
      'Next.js',
      'TypeScript',
      'React',
      'TanStack Query',
      'Tailwind CSS',
      'Python',
      'FastAPI',
      'SQLAlchemy',
      'Alembic',
      'PostgreSQL',
      'Playwright',
      'Tuma',
    ],
    type: 'Enterprise',
    url: 'https://clivique.com',
    icon: 'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/clivique-hmis/frame-16.png',
    screenshots: {
      web: [
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/clivique-hmis/web/doctor-encounters.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/clivique-hmis/web/admin-facility.png',
        'https://cwfjswqaokrwlegr.public.blob.vercel-storage.com/clivique-hmis/web/billing-workspace.png',
      ],
    },
  },
];

/** The canonical source for all publicly visible case studies and recommendations. */
export const publicProjects = projects.filter((project) => project.visibility !== 'hidden');
