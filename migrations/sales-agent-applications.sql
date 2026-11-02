-- Run once against the portfolio's DATABASE_URL before enabling the public form.
-- This is the portfolio database, not RentPayor's production database.
create extension if not exists pgcrypto;

create table if not exists public.sales_agent_applications (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(100) not null,
  phone varchar(32) not null,
  email varchar(254) not null unique,
  location varchar(100) not null,
  background varchar(80),
  note varchar(500),
  source varchar(40) not null default 'website',
  status varchar(24) not null default 'new' check (status in ('new', 'contacted', 'approved', 'declined')),
  consent_at timestamptz not null,
  notification_status varchar(24) not null default 'pending'
    check (notification_status in ('pending', 'sent', 'failed')),
  notification_provider_id varchar(255),
  notification_error text,
  applicant_notification_status varchar(24) not null default 'not_sent'
    check (applicant_notification_status in ('not_sent', 'pending', 'sent', 'failed')),
  applicant_notification_provider_id varchar(255),
  applicant_notification_error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_agent_applications_created
  on public.sales_agent_applications (created_at desc);
create index if not exists idx_sales_agent_applications_status
  on public.sales_agent_applications (status, created_at desc);
create index if not exists idx_sales_agent_applications_notification
  on public.sales_agent_applications (notification_status, created_at desc);

create index if not exists idx_sales_agent_applications_applicant_notification
  on public.sales_agent_applications (applicant_notification_status, created_at desc);

create table if not exists public.sales_agent_application_rate_limits (
  ip_fingerprint text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0
);

-- Both tables are accessed only from a server-side Next.js route using DATABASE_URL.
-- Do not expose a public REST/anonymous client write path.
alter table public.sales_agent_applications enable row level security;
alter table public.sales_agent_application_rate_limits enable row level security;
-- When using the Neon/postgres owner role, access is unaffected by RLS.
-- No anonymous/user-facing RLS policies are created.
